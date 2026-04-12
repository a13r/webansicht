const ExcelJS = require('exceljs');
const moment = require('moment-timezone');
const BSON = require('bson');
const tar = require('tar');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const uploadDir = './uploads';
const upload = require('multer')({ dest: uploadDir });
const {states, priorities, types} = require('../web/shared/strings');

function jwtMiddleware(app) {
    return async (req, res, next) => {
        try {
            const token = req.body.accessToken || req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Not authenticated' });
            await app.service('authentication').verifyAccessToken(token);
            next();
        } catch (e) {
            res.status(401).json({ message: 'Not authenticated' });
        }
    };
}

module.exports = function() {
    const app = this;
    const jwt = jwtMiddleware(app);
    // needs Authorization header or accessToken in body
    app.post('/export.xlsx', jwt, sendExcel);
    app.post('/transports.xlsx', jwt, sendTransports);
    app.post('/export.tar', jwt, sendBackup);
    app.post('/import.tar', jwt, upload.single('import'), restoreDatabase);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    async function sendExcel(req, res) {
        const entries = await app.service('journal').find({ paginate: false });
        const rows = journalEntriesToRows(entries);
        const buffer = await jsonToXlsx(rows);
        res.writeHead(200, [
            ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            ['Content-Disposition', `attachment; filename=Protokoll_${dateTime()}.xlsx`]
        ]);
        res.end(buffer);
    }

    async function sendTransports(req, res) {
        const entries = await app.service('transports').find({ paginate: false });
        const rows = transportsToRows(entries);
        const buffer = await jsonToXlsx(rows);
        res.writeHead(200, [
            ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            ['Content-Disposition', `attachment; filename=Transporte_${dateTime()}.xlsx`]
        ]);
        res.end(buffer);
    }

    async function sendBackup(req, res) {
        let tmpDir;
        try {
            const db = app.get('mongooseClient').connection.db;
            const dbName = db.databaseName;
            tmpDir = fs.mkdtempSync(path.join(uploadDir, 'backup-'));
            const dbDir = path.join(tmpDir, dbName);
            fs.mkdirSync(dbDir);

            const collections = await db.listCollections().toArray();
            for (const collInfo of collections) {
                if (collInfo.name.startsWith('system.')) continue;
                const collDir = path.join(dbDir, collInfo.name);
                fs.mkdirSync(collDir);
                const cursor = db.collection(collInfo.name).find();
                for await (const doc of cursor) {
                    const bsonData = BSON.serialize(doc);
                    fs.writeFileSync(path.join(collDir, `${doc._id}.bson`), bsonData);
                }
            }

            res.writeHead(200, {
                'Content-Type': 'application/x-tar',
                'Content-Disposition': `attachment; filename=webansicht_${dateTime()}.tar`
            });

            await pipeline(
                tar.create({ cwd: tmpDir }, [dbName]),
                res
            );
        } catch (error) {
            console.error('Backup failed:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: error.message });
            }
        } finally {
            if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }

    async function restoreDatabase(req, res) {
        let extractDir;
        try {
            const db = app.get('mongooseClient').connection.db;
            extractDir = fs.mkdtempSync(path.join(uploadDir, 'restore-'));

            await tar.extract({
                file: req.file.path,
                cwd: extractDir
            });

            // Find the database directory (first subdirectory in the extracted TAR)
            const entries = fs.readdirSync(extractDir);
            const dbDirName = entries.find(e =>
                fs.statSync(path.join(extractDir, e)).isDirectory()
            );
            if (!dbDirName) {
                return res.status(400).json({ message: 'Invalid backup: no database directory found' });
            }

            const dbDir = path.join(extractDir, dbDirName);
            const collectionDirs = fs.readdirSync(dbDir).filter(e =>
                fs.statSync(path.join(dbDir, e)).isDirectory()
            );

            // Drop all existing collections except users
            const existingCollections = await db.listCollections().toArray();
            for (const collInfo of existingCollections) {
                if (collInfo.name.startsWith('system.') || collInfo.name === 'users') continue;
                await db.collection(collInfo.name).drop();
            }

            // Restore collections from backup
            for (const collName of collectionDirs) {
                const collDir = path.join(dbDir, collName);
                const files = fs.readdirSync(collDir).filter(f => f.endsWith('.bson'));
                if (files.length === 0) continue;

                const docs = files.map(f => {
                    const data = fs.readFileSync(path.join(collDir, f));
                    return BSON.deserialize(data);
                });

                if (collName === 'users') {
                    // Merge: only insert users that don't already exist
                    const usersCollection = db.collection('users');
                    for (const doc of docs) {
                        const exists = await usersCollection.findOne({ _id: doc._id });
                        if (!exists) {
                            await usersCollection.insertOne(doc);
                        }
                    }
                } else {
                    // Bulk insert in batches of 1000
                    const collection = db.collection(collName);
                    for (let i = 0; i < docs.length; i += 1000) {
                        await collection.insertMany(docs.slice(i, i + 1000));
                    }
                }
            }

            res.status(200).end();
            app.service('notifications').create({type: 'reloadClient'});
        } catch (error) {
            console.error('Restore failed:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: error.message });
            }
        } finally {
            if (extractDir) fs.rmSync(extractDir, { recursive: true, force: true });
            if (req.file) fs.unlink(req.file.path, e => { if (e) console.error(e); });
        }
    }
};

async function jsonToXlsx(rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    if (rows.length > 0) {
        ws.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
        rows.forEach(row => ws.addRow(row));
    }
    return wb.xlsx.writeBuffer();
}

function dateTime() {
    return moment().format('YYYY-MM-DD_HH-mm-ss');
}

function journalEntriesToRows(entries) {
    return entries.map((entry, index) => {
        let m = moment(entry.createdAt).tz('Europe/Vienna');
        return {
            'LNr.': index + 1,
            'Datum': m.toDate(),
            'Uhrzeit': m.format('HH:mm'),
            'Eintrag': entry.text,
            'Melder': entry.reporter,
            'Meldeweg': entry.reportedVia,
            'Eingang/Ausgang': entry.direction,
            'Prioritaet': entry.priority,
            'Status': entry.state,
            'Erledigungsvermerk': entry.comment,
            'Kurzzeichen': entry.user.initials
        };
    });
}

function transportsToRows(entries) {
    return entries.map((t, index) => {
        const createdAt = moment(t.createdAt).tz('Europe/Vienna');
        return ({
            'LNr.': index + 1,
            'Datum': createdAt.toDate(),
            'Uhrzeit': createdAt.format('HH:mm'),
            'Status': states[t.state],
            'Anfordernde Stelle': t.requester,
            'Dringlichkeit': priorities[t.priority],
            'Transportart': types[t.type] + (t.hasCompany ? ' + Bgl.' : ''),
            'Verdachtsdiagnose': t.diagnose,
            'Ziel': `${t.destination.hospital} ${t.destination.station}`,
            'Ressource': t.resource ? `${t.resource.type} ${t.resource.callSign}` : ''
        });
    });
}
