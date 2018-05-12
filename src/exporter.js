const auth = require('feathers-authentication');
const X = require('xlsx');
const moment = require('moment-timezone');

module.exports = function() {
    const app = this;
    // needs Authorization header or accessToken in body
    app.post('/export.xlsx', auth.express.authenticate('jwt'), (req, res) => {
        return app.service('journal').find()
            .then(entries => {
                const wb = X.utils.book_new();
                X.utils.book_append_sheet(wb, X.utils.json_to_sheet(journalEntriesToRows(entries)));
                const wbbuf = X.write(wb, {type: 'base64'});
                const now = moment().format('YYYY-MM-DD_HH-mm-ss');
                res.writeHead(200, [
                    ['Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
                    ['Content-Disposition', `attachment; filename=Protokoll_${now}.xlsx`]
                ]);
                res.end(new Buffer(wbbuf, 'base64'));
            });
    });
};

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
