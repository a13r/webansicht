import React from 'react';
import {inject, observer} from 'mobx-react';
import {NavDropdown} from 'react-bootstrap';
import restrictToRoles from "~/components/restrictToRoles";
import moment from "~/moment";

export const TodoDropdown = restrictToRoles(['dispo'])(inject('todos')(observer(({todos}) =>
    <NavDropdown id="todos" title={<span><i className="fa fa-list"/> Todos</span>}>
        {todos.list.map(todo =>
            <NavDropdown.Item onClick={todos.edit(todo)} key={todo._id}>
                {todo.description} {todo.dueDate && <small>(fällig {moment(todo.dueDate).format('HH:mm')})</small>}
            </NavDropdown.Item>)}
        {todos.list.length > 0 && <NavDropdown.Divider/>}
        <NavDropdown.Item onClick={todos.create}><i className="fa fa-plus"/> neu</NavDropdown.Item>
    </NavDropdown>)));
