import * as React from "react";
import authenticate from "../components/authenticate";
import ChangePasswordForm from "../components/ChangePasswordForm";
import CreateUserForm from "../components/CreateUserForm";

export default authenticate(() =>
    <div className="row">
        <div className="col-md-3">
            <CreateUserForm/>
        </div>
        <div className="col-md-3 col-md-offset-6">
            <ChangePasswordForm/>
        </div>
    </div>
);
