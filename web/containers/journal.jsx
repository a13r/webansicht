import React from "react";
import JournalList from "../components/JournalList";
import ExportButton from "../components/ExportButton";
import restrictToRoles from "../components/restrictToRoles";

export default restrictToRoles(['dispo'])(() =>
    <>
        <JournalList/>
        <ExportButton path="/export.xlsx"/>
    </>);
