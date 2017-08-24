import {observer} from 'mobx-react';
import React from 'react';

export const SortToggle = observer(({store}) => {
    const props = {
        className: `print-hidden fa fa-sort-${store.sortOrder === 1 ? 'asc' : 'desc'}`,
        onClick: () => store.toggleSortOrder(),
        style: {
            cursor: 'pointer'
        }
    };
    return <i {...props}/>;
});
