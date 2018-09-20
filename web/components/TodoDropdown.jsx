import React from 'react';
import {inject, observer} from 'mobx-react';
import {NavDropdown, MenuItem} from 'react-bootstrap';
import restrictToRoles from "~/components/restrictToRoles";
import moment from "moment";

export const TodoDropdown = restrictToRoles(['dispo'])(inject('todos')(observer(({todos}) =>
    <NavDropdown id="todos" title={<span><i className="fa fa-list"/> Todos</span>}>
        {todos.list.map(todo =>
            <MenuItem onClick={todos.edit(todo)} key={todo._id}>
                {todo.description} {todo.dueDate && <small>(fällig {moment(todo.dueDate).format('HH:mm')})</small>}
            </MenuItem>)}
        {todos.list.length > 0 && <MenuItem divider/>}
        <MenuItem onClick={todos.create}><i className="fa fa-plus"/> neu</MenuItem>
    </NavDropdown>)));
