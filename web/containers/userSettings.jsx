import * as React from "react";
import authenticate from "../components/authenticate";
import ChangePasswordForm from "../components/ChangePasswordForm";

export default authenticate(() =>
    <div className="row">
        <div className="col-md-3 col-md-offset-9">
            <ChangePasswordForm/>
        </div>
    </div>
);
