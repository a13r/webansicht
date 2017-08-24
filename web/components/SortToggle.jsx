import {observer} from 'mobx-react';
import React from 'react';

export const SortToggle = observer(({store}) => {
    const props = {
        className: `print-hidden glyphicon glyphicon-arrow-${store.sortOrder === 1 ? 'down' : 'up'}`,
        onClick: () => store.toggleSortOrder(),
        style: {
            cursor: 'pointer'
        }
    };
    return <i {...props}/>;
});
