import React from "react";
import restrictToRoles from "~/components/restrictToRoles";
import StationList from "~/components/StationList";
import StationCreateButton from "~/components/StationCreateButton";

export default restrictToRoles(['dispo', 'station'])(() =>
    <div>
        <StationCreateButton/>
        <StationList/>
    </div>);
