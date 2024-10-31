import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { getCookie } from "../../src/utils/cookieUtils";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import * as XLSX from "xlsx";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

const Informe = () => {
  const [rubroTotales, setRubroTotales] = useState({});
  const [filteredRubros, setFilteredRubros] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterYear, setFilterYear] = useState("");
  const [filterRubro, setFilterRubro] = useState("");
  const [filterSubrubro, setFilterSubrubro] = useState("");
  const [filterCuenta, setFilterCuenta] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const csrftoken = getCookie("csrftoken");
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/InformeDetalladoPresupuesto/`, {
        method: "GET",
        headers: {
          "X-CSRFToken": csrftoken,
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      const totales = {};

      data.forEach((presupuesto) => {
        const year = new Date(presupuesto.fecha).getFullYear();
        const rubroIndex = presupuesto.rubro;
        const subrubroIndex = presupuesto.subrubro;
        const valor = parseFloat(presupuesto.presupuestomes);
        const updatedRubros = presupuesto.updatedRubros || [];

        if (rubroIndex >= 0 && rubroIndex < updatedRubros.length) {
          const rubroNombre =
            updatedRubros[rubroIndex]?.nombre || "Rubro no encontrado";

          if (!totales[year]) totales[year] = {};
          if (!totales[year][rubroNombre]) {
            totales[year][rubroNombre] = {
              totalRubro: 0,
              subrubros: {},
            };
          }
          totales[year][rubroNombre].totalRubro += valor;

          const subrubros = updatedRubros[rubroIndex].subrubros || [];
          if (subrubroIndex >= 0 && subrubroIndex < subrubros.length) {
            const subrubroNombre =
              subrubros[subrubroIndex]?.nombre || "Subrubro no encontrado";
            const subrubroCodigo = subrubros[subrubroIndex]?.codigo || "";

            if (!totales[year][rubroNombre].subrubros[subrubroCodigo]) {
              totales[year][rubroNombre].subrubros[subrubroCodigo] = {
                nombre: subrubroNombre,
                totalSubrubro: 0,
                cuentas: {},
              };
            }
            totales[year][rubroNombre].subrubros[
              subrubroCodigo
            ].totalSubrubro += valor;

            const { codigo, nombre, regional } = presupuesto.cuenta || {};

            if (codigo) {
              if (
                !totales[year][rubroNombre].subrubros[subrubroCodigo].cuentas[
                  codigo
                ]
              ) {
                totales[year][rubroNombre].subrubros[subrubroCodigo].cuentas[
                  codigo
                ] = {
                  nombre,
                  regional,
                  totalCuenta: 0,
                };
              }
              totales[year][rubroNombre].subrubros[subrubroCodigo].cuentas[
                codigo
              ].totalCuenta += valor;
            }
          }
        }
      });

      setRubroTotales(totales);
      setFilteredRubros(totales);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filteredData = { ...rubroTotales };

    if (filterYear) {
      filteredData = {
        [filterYear]: rubroTotales[filterYear] || {},
      };
    }

    if (filterRubro) {
      for (const year in filteredData) {
        if (filteredData[year]) {
          filteredData[year] = {
            [filterRubro]: filteredData[year][filterRubro] || {},
          };
        }
      }
    }

    if (filterSubrubro) {
      for (const year in filteredData) {
        if (filteredData[year]) {
          for (const rubro in filteredData[year]) {
            const subrubroData = filteredData[year][rubro]?.subrubros || {};
            filteredData[year][rubro].subrubros = Object.fromEntries(
              Object.entries(subrubroData).filter(
                ([subrubroCodigo, subrubro]) =>
                  `${subrubroCodigo} ${subrubro.nombre}` === filterSubrubro
              )
            );
          }
        }
      }
    }

    if (filterCuenta) {
      for (const year in filteredData) {
        if (filteredData[year]) {
          for (const rubro in filteredData[year]) {
            const subrubrosData = filteredData[year][rubro]?.subrubros || {};
            for (const subrubro in subrubrosData) {
              const cuentasData = subrubrosData[subrubro]?.cuentas || {};
              subrubrosData[subrubro].cuentas = Object.fromEntries(
                Object.entries(cuentasData).filter(([codigo, cuenta]) => {
                  // Check if either the cuenta nombre or codigo includes the filter value
                  const cuentaNombre = cuenta?.nombre || "";
                  return (
                    cuentaNombre.includes(filterCuenta) ||
                    codigo.includes(filterCuenta)
                  );
                })
              );

              // If no cuentas are found for the filtered subrubro, remove the subrubro
              if (Object.keys(subrubrosData[subrubro].cuentas).length === 0) {
                delete subrubrosData[subrubro];
              }
            }
          }
        }
      }
    }

    setFilteredRubros(filteredData);
  }, [filterYear, filterRubro, filterSubrubro, filterCuenta, rubroTotales]);

  const saveTotalsToBackend = async (totals, type) => {
    try {
      const csrftoken = getCookie("csrftoken");
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      for (const [year, totalsByKey] of Object.entries(totals)) {
        for (const [key, total] of Object.entries(totalsByKey)) {
          let centroCostos = "";
          let rubro = "";
          let subrubro = "";
          let proyectado = 0;
          let ejecutado = null;

          // Assign values based on type
          if (type === "rubro") {
            rubro = key;
            proyectado = total; // Assuming total is a number
          } else if (type === "subrubro") {
            subrubro = key;
            rubro = total.rubro; // Ensure 'total' has 'rubro'
            proyectado = total.total;
          } else if (type === "cuenta") {
            centroCostos = key;
            subrubro = total.subrubro; // Ensure 'total' has 'subrubro'
            rubro = total.rubro; // Ensure 'total' has 'rubro'
            proyectado = total.total;
            ejecutado = total.ejecutado || null; // Default to null if not present
          }

          const fecha = new Date(Number(year) + 1, 0, 1)
            .toISOString()
            .split("T")[0];

          const response = await fetch(`${API_URL}/save-presupuesto-total/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": csrftoken,
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              CentroCostos: centroCostos,
              rubro: rubro,
              subrubro: subrubro,
              fecha: fecha,
              proyectado: proyectado,
              ejecutado: ejecutado,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to save total");
          }
        }
      }
    } catch (error) {
      console.error("Error saving totals:", error);
    }
  };

  const handleSave = () => {
    // Llama a la función de guardar aquí
    saveTotalsToBackend(filteredRubros, "rubro"); // Ajusta el tipo según lo que necesites guardar
  };

  const exportToExcel = (year, rubros) => {
    const wb = XLSX.utils.book_new(); // Crea un nuevo libro de trabajo (workbook)
    const data = [];

    // Encabezados de la tabla
    data.push([
      "Año",
      "Rubro",
      "Subrubro",
      "Centro de costos",
      "Proyectado",
      "Ejecutado",
    ]);

    // Añadir datos de cada rubro, subrubro y cuenta
    Object.entries(rubros).forEach(([rubro, { totalRubro, subrubros }]) => {
      Object.entries(subrubros).forEach(([subrubroCodigo, subrubroData]) => {
        Object.entries(subrubroData.cuentas).forEach(([codigo, cuenta]) => {
          data.push([
            year,
            rubro.trim(),
            `${subrubroCodigo.trim()} ${subrubroData.nombre.trim()}`,
            `${codigo.trim()} ${cuenta.nombre.trim()} ${cuenta.regional.trim()}`,
            cuenta.totalCuenta,
          ]);
        });
      });
    });

    // Crear hoja de trabajo única con todos los rubros agrupados
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, `Informe_${year}`); // Añadir una sola hoja al libro

    // Generar archivo Excel por año
    XLSX.writeFile(wb, `Informe_${year}.xlsx`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <Sidebar />

      <div style={{ display: "flex", width: "100%", flexDirection: "column" }}>
        <>
          <Typography variant="h6">Presupuestos Consolidado</Typography>

          {/* Filters */}
          <div style={{ display: "flex", marginBottom: "20px" }}>
            <TextField
              select
              label="Filter by Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ marginRight: "10px" }}
            >
              <MenuItem value="">All Years</MenuItem>
              {Object.keys(rubroTotales).map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Filter by Rubro"
              value={filterRubro}
              onChange={(e) => setFilterRubro(e.target.value)}
              style={{ marginRight: "10px" }}
            >
              <MenuItem value="">All Rubros</MenuItem>
              {Object.keys(rubroTotales)
                .flatMap((year) => Object.keys(rubroTotales[year] || {}))
                .map((rubro, index) => (
                  <MenuItem key={index} value={rubro}>
                    {rubro}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              select
              label="Filter by Subrubro"
              value={filterSubrubro}
              onChange={(e) => setFilterSubrubro(e.target.value)}
              style={{ marginRight: "10px" }}
            >
              <MenuItem value="">All Subrubros</MenuItem>
              {Object.entries(rubroTotales).flatMap(([year, rubros]) =>
                Object.entries(rubros).flatMap(([rubro, rubroData]) =>
                  Object.entries(rubroData.subrubros || {}).map(
                    ([subrubroCodigo, subrubroData]) => (
                      <MenuItem
                        key={`${subrubroCodigo}-${rubro}`}
                        value={`${subrubroCodigo} ${subrubroData.nombre}`}
                      >
                        {`${subrubroCodigo} ${subrubroData.nombre}`}
                      </MenuItem>
                    )
                  )
                )
              )}
            </TextField>
            <TextField
              label="Filter by Cuenta"
              value={filterCuenta}
              onChange={(e) => setFilterCuenta(e.target.value)}
              style={{ marginRight: "10px" }}
            />
          </div>

          {/* Data display */}
          {Object.entries(filteredRubros).map(([year, rubros]) => (
            <Accordion key={year}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Typography variant="h6">Año: {year}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => exportToExcel(year, rubros)}
                    style={{
                      marginBottom: "10px",
                   marginRight: "30px",
                 
                    }}
                  >
                    <FileDownloadIcon />
                  </Button>
                </div>
              </AccordionSummary>

              {Object.entries(rubros).map(
                ([rubro, { totalRubro, subrubros }]) => (
                  <AccordionDetails key={rubro}>
                    <Typography variant="h6">
                      {rubro} - Total: {totalRubro}
                    </Typography>

                    {Object.entries(subrubros || {}).map(
                      ([subrubroCodigo, subrubroData]) => (
                        <div
                          key={subrubroCodigo}
                          style={{ marginLeft: "20px" }}
                        >
                          <Typography variant="h6">
                            {subrubroCodigo} {subrubroData?.nombre} - Total:{" "}
                            {subrubroData?.totalSubrubro}
                          </Typography>
                          <TableContainer
                            component={Paper}
                            style={{ marginLeft: "40px" }}
                          >
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Cuenta</TableCell>
                                  <TableCell>Nombre</TableCell>
                                  <TableCell>Regional</TableCell>
                                  <TableCell>Total Cuenta</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(
                                  subrubroData?.cuentas || {}
                                ).map(([codigo, cuenta]) => (
                                  <TableRow key={codigo}>
                                    <TableCell>{codigo}</TableCell>
                                    <TableCell>{cuenta?.nombre}</TableCell>
                                    <TableCell>{cuenta?.regional}</TableCell>
                                    <TableCell>{cuenta?.totalCuenta}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </div>
                      )
                    )}
                  </AccordionDetails>
                )
              )}
            </Accordion>
          ))}
        </>
      </div>
    </div>
  );
};

export default Informe;
