const auth = require('@feathersjs/authentication');
const X = require('xlsx');
const moment = require('moment-timezone');
const backup = require('mongodb-backup');
const restore = require('mongodb-restore');
const fs = require('fs');
const uploadDir = './uploads';
const upload = require('multer')({ dest: uploadDir });
const {states, priorities, types} = require('../web/shared/strings');

module.exports = function() {
    const app = this;
    // needs Authorization header or accessToken in body
    app.post('/export.xlsx', auth.express.authenticate('jwt'), sendExcel);
    app.post('/transports.xlsx', auth.express.authenticate('jwt'), sendTransports);
    app.post('/export.tar', auth.express.authenticate('jwt'), sendBackup);
    app.post('/import.tar', auth.express.authenticate('jwt'), upload.single('import'), restoreDatabase);

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    function sendExcel(req, res) {
        return app.service('journal').find()
            .then(entries => {
                const wb = X.utils.book_new();
                X.utils.book_append_sheet(wb, X.utils.json_to_sheet(journalEntriesToRows(entries)));
                const wbbuf = X.write(wb, {type: 'base64'});
                res.writeHead(200, [
                    ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    ['Content-Disposition', `attachment; filename=Protokoll_${dateTime()}.xlsx`]
                ]);
                res.end(new Buffer(wbbuf, 'base64'));
            });
    }

    function sendTransports(req, res) {
        return app.service('transports').find()
            .then(entries => {
                const wb = X.utils.book_new();
                X.utils.book_append_sheet(wb, X.utils.json_to_sheet(transportsToRows(entries)));
                const wbbuf = X.write(wb, {type: 'base64'});
                res.writeHead(200, [
                    ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    ['Content-Disposition', `attachment; filename=Transporte_${dateTime()}.xlsx`]
                ]);
                res.end(new Buffer(wbbuf, 'base64'));
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
