const X = require('xlsx');
const moment = require('moment-timezone');
const backup = require('mongodb-backup');
const restore = require('mongodb-restore');
const fs = require('fs');
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

    function sendExcel(req, res) {
        return app.service('journal').find({ paginate: false })
            .then(entries => {
                const wb = X.utils.book_new();
                X.utils.book_append_sheet(wb, X.utils.json_to_sheet(journalEntriesToRows(entries)));
                const wbbuf = X.write(wb, {type: 'base64'});
                res.writeHead(200, [
                    ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    ['Content-Disposition', `attachment; filename=Protokoll_${dateTime()}.xlsx`]
                ]);
                res.end(Buffer.from(wbbuf, 'base64'));
            });
    }

    function sendTransports(req, res) {
        return app.service('transports').find({ paginate: false })
            .then(entries => {
                const wb = X.utils.book_new();
                X.utils.book_append_sheet(wb, X.utils.json_to_sheet(transportsToRows(entries)));
                const wbbuf = X.write(wb, {type: 'base64'});
                res.writeHead(200, [
                    ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    ['Content-Disposition', `attachment; filename=Transporte_${dateTime()}.xlsx`]
                ]);
                res.end(Buffer.from(wbbuf, 'base64'));
            })
    }

    function sendBackup(req, res) {
        console.log(this);
        res.writeHead(200, {
            'Content-Type': 'application/x-tar',
            'Content-Disposition': `attachment; filename=webansicht_${dateTime()}.tar`
        });

        backup({
            uri: app.get('mongodb'),
            stream: res
        });
    }

    function restoreDatabase(req, res) {
        restore({
            uri: app.get('mongodb'),
            root: req.file.destination,
            tar: req.file.filename,
            drop: true,
            callback(error) {
                fs.unlink(req.file.path, e => { if (e) console.error(e); });
                if (error) {
                    res.status(500).send(error);
                } else {
                    res.status(200).end();
                    app.service('notifications').create({type: 'reloadClient'});
                }
            }
        });
    }
};

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
