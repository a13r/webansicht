class States {
    1 = {
        rowStyle: {
            backgroundColor: '#C1FFC1'
        },
        name: 'Einsatzbereit'
    };
    2 = {
        rowStyle: {
            backgroundColor: '#FFD697'
        },
        name: 'zum Berufungsort'
    };
    3 = {
        rowStyle: {
            backgroundColor: '#FFAD5B'
        },
        name: 'am Berufungsort'
    };
    4 = {
        rowStyle: {
            backgroundColor: '#FFD9FF'
        },
        name: 'zum Zielort'
    };
    5 = {
        rowStyle: {
            backgroundColor: '#D6A5E2'
        },
        name: 'am Zielort'
    };
    6 = {
        rowStyle: {
            backgroundColor: '#C1FFC1',
            color: '#FF0000'
        },
        name: 'Frei Funk'
    };
    7 = {
        rowStyle: {
            backgroundColor: '#FFFFFF',
            color: '#FF0000'
        },
        name: 'Bereitschaft'
    };
    8 = {
        rowStyle: {
            backgroundColor: '#C1FFC1',
            color: '#FF0000'
        },
        name: 'Standort halten'
    };
    0 = {
        rowStyle: {
            backgroundColor: '#FFFFFF',
            color: '#000000'
        },
        name: 'Außer Dienst'
    };
    10 = {
        rowStyle: {
            backgroundColor: '#FFFF95',
            color: '#000000',
        },
        name: 'Alarmiert'
    };

    get(number) {
        const state = this[parseInt(number)];
        return state || {rowStyle: {}, name: 'unbekannt'};
    }
}

export default new States();
