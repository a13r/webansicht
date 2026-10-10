const ExcelJS = require('exceljs');
const moment = require('moment-timezone');
const { BSON } = require('mongoose').mongo;
const tar = require('tar');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const uploadDir = './uploads';
const upload = require('multer')({ dest: uploadDir });
const stringsPromise = import('../web/shared/strings.js');

function jwtMiddleware(app, roles = []) {
    return async (req, res, next) => {
        let user;
        try {
            const token = req.body?.accessToken || req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ message: 'Not authenticated' });
            ({ user } = await app.service('authentication').authenticate({ strategy: 'jwt', accessToken: token }, {}, 'jwt'));
        } catch (e) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (roles.length && !roles.some(role => user?.roles?.includes(role))) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

module.exports = function() {
    const app = this;
    const jwt = jwtMiddleware(app);
    const jwtAdmin = jwtMiddleware(app, ['admin']);
    // needs Authorization header or accessToken in body
    app.post('/export.xlsx', jwt, sendExcel);
    app.post('/transports.xlsx', jwt, sendTransports);
    app.post('/export.tar', jwtAdmin, sendBackup);
    app.post('/import.tar', jwtAdmin, upload.single('import'), restoreDatabase);

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
        const rows = await transportsToRows(entries);
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
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const db = app.get('mongooseClient').connection.db;
        let extractDir;
        const staged = new Map(); // collection name -> temporary collection name
        try {
            // 1. Read and decode the whole backup before touching the database
            let backup;
            try {
                extractDir = fs.mkdtempSync(path.join(uploadDir, 'restore-'));
                backup = await readBackup(req.file.path, extractDir);
            } catch (error) {
                return res.status(400).json({ message: `Invalid backup: ${error.message}` });
            }

            // 2. Write the backup into temporary collections. If anything fails here,
            //    the temporary collections are dropped and the live data is untouched.
            const suffix = `__restore_${Date.now()}`;
            for (const [name, docs] of backup) {
                if (name === 'users') continue;
                staged.set(name, name + suffix);
                const collection = db.collection(name + suffix);
                // Bulk insert in batches of 1000
                for (let i = 0; i < docs.length; i += 1000) {
                    await collection.insertMany(docs.slice(i, i + 1000));
                }
            }

            // 3. Swap the restored collections in, then drop the ones the backup doesn't have
            for (const [name, tmpName] of staged) {
                await db.collection(tmpName).rename(name, { dropTarget: true });
                staged.delete(name);
            }
            const existingCollections = await db.listCollections().toArray();
            for (const { name } of existingCollections) {
                if (name.startsWith('system.') || name === 'users' || backup.has(name)) continue;
                await db.collection(name).drop();
            }

            // 4. Merge users: only insert users that don't already exist
            if (backup.has('users')) {
                await mergeUsers(db.collection('users'), backup.get('users'));
            }

            res.status(200).end();
            // Give the client that started the import time to show its success message before every client reloads
            setTimeout(() => app.service('notifications').create({type: 'reloadClient'}), 2000).unref();
        } catch (error) {
            console.error('Restore failed:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: error.message });
            }
        } finally {
            for (const tmpName of staged.values()) {
                await db.collection(tmpName).drop().catch(e => console.error(e));
            }
            if (extractDir) fs.rmSync(extractDir, { recursive: true, force: true });
            fs.unlink(req.file.path, e => { if (e) console.error(e); });
        }
    }
};

// Extracts a backup archive and returns a Map of collection name -> documents.
// Throws if the archive or any document in it can't be read.
async function readBackup(file, extractDir) {
    await tar.extract({ file, cwd: extractDir });

    // Find the database directory (first subdirectory in the extracted TAR)
    const dbDirName = fs.readdirSync(extractDir).find(e =>
        fs.statSync(path.join(extractDir, e)).isDirectory()
    );
    if (!dbDirName) {
        throw new Error('no database directory found');
    }

    const dbDir = path.join(extractDir, dbDirName);
    const backup = new Map();
    for (const name of fs.readdirSync(dbDir)) {
        const collDir = path.join(dbDir, name);
        if (!fs.statSync(collDir).isDirectory()) continue;
        const docs = fs.readdirSync(collDir)
            .filter(f => f.endsWith('.bson'))
            .map(f => {
                try {
                    return BSON.deserialize(fs.readFileSync(path.join(collDir, f)));
                } catch (error) {
                    throw new Error(`${name}/${f}: ${error.message}`);
                }
            });
        if (docs.length > 0) backup.set(name, docs);
    }
    return backup;
}

async function mergeUsers(usersCollection, docs) {
    for (const doc of docs) {
        if (await usersCollection.findOne({ _id: doc._id })) continue;
        try {
            await usersCollection.insertOne(doc);
        } catch (error) {
            // E.g. a different existing user already has this username or initials; keep the existing one
            if (error.code !== 11000) throw error;
            console.warn(`Restore: skipped user ${doc.username}: ${error.message}`);
        }
    }
}

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

async function transportsToRows(entries) {
    const {states, priorities, types} = await stringsPromise;
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
