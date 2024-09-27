import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import React, { useEffect, useState } from 'react';

const ReportTable = ({
    updatedpresupuestos
}) => {

    return (
        <Accordion sx={{ width: "100%" }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                aria-controls="panel1-content"
                id="panel1-header"
                sx={{
                    background: "rgb(253, 128, 2)",
                    color: "white",
                    borderRadius: '6px 6px 0px 0px'
                }}>
                <Typography> Constructora </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {updatedpresupuestos.map((rubro) => (
                            <React.Fragment key={rubro.id}>
                                {rubro.subrubros.map((subrubro) => (
                                    <tr key={subrubro.id}>
                                        <td>{`${subrubro.codigo}  ${subrubro.nombre}`}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </AccordionDetails>
        </Accordion>
    );
};

export default ReportTable;