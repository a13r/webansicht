import React from "react";
import restrictToRoles from "~/components/restrictToRoles";
import StationList from "~/components/StationList";
import StationAdminRow from "~/components/StationAdminRow";

export default restrictToRoles(['admin', 'dispo', 'station'])(() =>
    <div>
        <StationAdminRow/>
        <StationList/>
    </div>);
