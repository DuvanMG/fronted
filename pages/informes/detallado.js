import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { getCookie } from "../../src/utils/cookieUtils";
import { useRouter } from "next/router";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const Informe = () => {
  const [presupuestos, setPresupuestos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [subrubros, setSubRubros] = useState([]);
  const [rubroTotales, setRubroTotales] = useState({});
  const [SubRubroTotales, setSubRubroTotales] = useState({});
  const [itemTotales, setItemTotales] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [selectedUEN, setSelectedUEN] = useState("");
  const [selectedZona, setSelectedZona] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRubro, setSelectedRubro] = useState("");
  const [selectedSubrubro, setSelectedSubrubro] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const [subrubrosEnUso, setSubrubrosEnUso] = useState([]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Maneja cambios en el selector de UEN
  const handleUENChange = (event) => {
    setSelectedUEN(event.target.value);
  };

  // Maneja cambios en el selector de Zona
  const handleZonaChange = (event) => {
    setSelectedZona(event.target.value);
  };

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  const router = useRouter();

  const handleAccordionChange = (uen) => () => {
    setExpanded((prev) => ({
      ...prev,
      [uen]: !prev[uen],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("token");
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const presupuestosResponse = await fetch(
          `${API_URL}/InformeDetalladoPresupuesto/`,
          {
            method: "GET",
            headers: {
              "X-CSRFToken": csrftoken,
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!presupuestosResponse.ok)
          throw new Error(`HTTP error! Status: ${presupuestosResponse.status}`);
        const presupuestosData = await presupuestosResponse.json();

        if (presupuestosData.length === 0) {
          setError("No existe información.");
          return;
        }

        if (
          !presupuestosData[0].updatedRubros ||
          presupuestosData[0].updatedRubros.length === 0
        ) {
          console.error("updatedRubros is missing or undefined.");
          setRubros([]);
        } else {
          const rubros = presupuestosData[0].updatedRubros || [];
          setRubros(rubros);

          rubros.forEach((rubro) => {
            const subrubros = rubro.subrubros || [];
            setSubRubros(subrubros);
          });
        }

        const totalPorRubro = {};
        const totalPorSubRubro = {};
        const totalPorCuenta = {};

        presupuestosData.forEach((presupuesto) => {
          const rubroIndex = presupuesto.rubro;
          const subrubroIndex = presupuesto.subrubro;
          const valor = parseFloat(presupuesto.presupuestomes);
          const updatedRubros = presupuesto.updatedRubros || [];

          let rubroNombre = "";
          if (rubroIndex >= 0 && rubroIndex < updatedRubros.length) {
            rubroNombre = updatedRubros[rubroIndex]?.nombre || "Rubro no encontrado";
            const rubro = updatedRubros[rubroIndex];
            const subrubros = rubro.subrubros || [];

            let subrubroNombre = "";
            let subrubroCodigo = "";
            if (subrubroIndex >= 0 && subrubroIndex < subrubros.length) {
              subrubroNombre = subrubros[subrubroIndex]?.nombre || "Subrubro no encontrado";
              subrubroCodigo = subrubros[subrubroIndex]?.codigo || "";

              if (!totalPorSubRubro[subrubroCodigo]) {
                totalPorSubRubro[subrubroCodigo] = {
                  codigo: subrubroCodigo,
                  nombre: subrubroNombre,
                  total: 0,
                };
              }
              totalPorSubRubro[subrubroCodigo].total += valor;
            }
          }

          if (!totalPorRubro[rubroNombre]) {
            totalPorRubro[rubroNombre] = 0;
          }
          totalPorRubro[rubroNombre] += valor;

          const { codigo, nombre, regional } = presupuesto.cuenta;

          if (!totalPorCuenta[codigo]) {
            totalPorCuenta[codigo] = {
              codigo,
              nombre,
              regional,
              total: 0,
            };
          }

          totalPorCuenta[codigo].total += valor;
        });

        setRubroTotales(totalPorRubro);
        setSubRubroTotales(totalPorSubRubro);
        setItemTotales(totalPorCuenta);

        const groupedData = presupuestosData.reduce((acc, presupuesto) => {
          const { uen, cuenta } = presupuesto;
          const zona = cuenta.regional;
          const { presupuestomes, meses } = presupuesto;
          if (!acc[uen.nombre]) {
            acc[uen.nombre] = {
              zonas: {},
              totalPresupuesto: 0,
              mensualTotales: Array(12).fill(0),
            };
          }

          if (!acc[uen.nombre].zonas[zona]) {
            acc[uen.nombre].zonas[zona] = {
              items: [],
              totalZonaPresupuesto: 0,
            };
          }

          acc[uen.nombre].zonas[zona].items.push(presupuesto);
          acc[uen.nombre].zonas[zona].totalZonaPresupuesto += parseFloat(
            presupuesto.presupuestomes || 0
          );

          acc[uen.nombre].totalPresupuesto += parseFloat(
            presupuesto.presupuestomes || 0
          );
          acc[uen.nombre].mensualTotales[meses] += parseFloat(
            presupuestomes || 0
          );

          return acc;
        }, {});

        setPresupuestos(groupedData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (!userId) {
      fetchData();
    }
  }, [userId]);

  function filterData(data, selectedUEN, selectedZona, selectedRubro, selectedSubrubro) {
    return Object.entries(data)
      .map(([uen, data]) => {
        if (selectedUEN && uen !== selectedUEN) {
          return null;
        }
  
        const filteredZones = Object.entries(data.zonas)
          .map(([zona, zonaData]) => {
            if (selectedZona && zona !== selectedZona) {
              return null;
            }
  
            const filteredItems = zonaData.items.filter((item) => {
              const rubroMatch = selectedRubro === "" || item.rubro === selectedRubro;
              const subrubroMatch = selectedSubrubro === "" || item.subrubro === selectedSubrubro;
              return rubroMatch && subrubroMatch;
            });
  
            const totalZonaPresupuesto = filteredItems.reduce(
              (acc, item) => acc + parseFloat(item.presupuestomes || 0),
              0
            );
  
            return {
              zona,
              totalZonaPresupuesto,
              items: filteredItems,
            };
          })
          .filter((zonaData) => zonaData !== null && zonaData.items.length > 0);
  
        const totalPresupuesto = filteredZones.reduce(
          (acc, zone) => acc + zone.totalZonaPresupuesto,
          0
        );
  
        if (filteredZones.length > 0) {
          return {
            uen,
            totalPresupuesto,
            zonas: Object.fromEntries(
              filteredZones.map(({ zona, totalZonaPresupuesto, items }) => [
                zona,
                { totalZonaPresupuesto, items },
              ])
            ),
          };
        }
        return null;
      })
      .filter((item) => item !== null);
  }
  
  useEffect(() => {
    const filteredData = filterData(
      presupuestos,
      selectedUEN,
      selectedZona,
      selectedRubro,
      selectedSubrubro
    );
    setFilteredData(filteredData);
  }, [presupuestos, selectedUEN, selectedZona, selectedRubro, selectedSubrubro]);
  
  const rubrosEnUso = useMemo(() => {
    const rubrosSet = new Set();
    const subrubrosSet = new Set();
  
    filteredData.forEach(({ zonas }) => {
      Object.values(zonas).forEach(({ items }) => {
        items.forEach((item) => {
          const rubroIndex = item.rubro;  // Aquí está usando el índice del rubro
          if (rubros[rubroIndex]) {
            rubrosSet.add(rubroIndex); // Agregar el índice del rubro al set
            
            const subrubroIndex = item.subrubro;  // Aquí también es el índice del subrubro
            if (rubros[rubroIndex].subrubros[subrubroIndex]) {
              subrubrosSet.add(subrubroIndex); // Agregar el índice del subrubro al set
            }
          }
        });
      });
    });
  
    return {
      rubros: Array.from(rubrosSet),
      subrubros: Array.from(subrubrosSet),
    };
  }, [filteredData, rubros]);  

  // Opciones de UEN y Zona
  const uenOptions = Object.keys(presupuestos);
  const zonaOptions = Array.from(
    new Set(
      Object.values(presupuestos).flatMap((data) => Object.keys(data.zonas))
    )
  );

  const datosAgrupadosPorAño = useMemo(() => {
    const grouped = {};
  
    filteredData.forEach(({ uen, totalPresupuesto, zonas }) => {
      if (zonas && Object.keys(zonas).length > 0) {
        Object.values(zonas).forEach((zonaData) => {
          if (zonaData.items && Array.isArray(zonaData.items)) {
            zonaData.items.forEach((item) => {
              if (item.fecha) {
                const year = new Date(item.fecha).getFullYear(); // Extract the year
  
                // Initialize the year object if not already done
                if (!grouped[year]) {
                  grouped[year] = {};
                }
  
                // Initialize the UEN object if not already done
                if (!grouped[year][uen]) {
                  grouped[year][uen] = {
                    totalPresupuesto,
                    zonas: {}, // Initialize zonas as an object
                  };
                }
  
                // Access the zone name directly from the key
                const zoneName = Object.keys(zonas).find(z => zonas[z] === zonaData) || 'Zona Desconocida';
  
                // Initialize zone if it doesn't exist
                if (!grouped[year][uen].zonas[zoneName]) {
                  grouped[year][uen].zonas[zoneName] = {
                    totalZonaPresupuesto: 0, // Initialized to 0
                    items: [], // Initialize items array
                  };
                }
  
                // Update totals and add items
                const presupuestoMes = parseFloat(item.presupuestomes) || 0; // Ensure it's a number
                grouped[year][uen].zonas[zoneName].totalZonaPresupuesto += presupuestoMes; // Summing up
                grouped[year][uen].zonas[zoneName].items.push(item);
              }
            });
          }
        });
      }
    });
  
    // Convert grouped data back to a usable format
    const result = {};
    for (const year in grouped) {
      result[year] = [];
      for (const uen in grouped[year]) {
        const { totalPresupuesto, zonas } = grouped[year][uen];
        result[year].push({ uen, totalPresupuesto, zonas: zonas || {} });
      }
    }
  
    return result;
  }, [filteredData]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <Sidebar />
      {/* Your other UI components here */}
      <div style={{ display: "flex", width: "100%", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            marginBottom: "10px",
            width: "100%",
          }}
        >
          <Typography variant="h6" style={{ margin: 20 }}>
            Informe detallado
          </Typography>
          {Object.entries(datosAgrupadosPorAño).length === 0 ? (
            <Typography>No hay datos para mostrar</Typography>
          ) : (
            Object.entries(datosAgrupadosPorAño).map(([year, yearData]) => (
              <Accordion key={year} sx={{ marginBottom: "20px" }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >
                  <Typography>Tabla general {year}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      marginBottom: "10px",
                    }}
                  >
                    <FormControl
                      variant="outlined"
                      style={{ marginRight: "10px", minWidth: 200 }}
                    >
                      <InputLabel>Filtrar por UEN</InputLabel>
                      <Select
                        value={selectedUEN}
                        onChange={(e) => setSelectedUEN(e.target.value)}
                        label="Filtrar por UEN"
                      >
                        <MenuItem value="">
                          <em>Todos</em>
                        </MenuItem>
                        {uenOptions.map((uen) => (
                          <MenuItem key={uen} value={uen}>
                            {uen}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl
                      variant="outlined"
                      style={{ marginRight: "10px", minWidth: 200 }}
                    >
                      <InputLabel>Filtrar por Zona</InputLabel>
                      <Select
                        value={selectedZona}
                        onChange={(e) => setSelectedZona(e.target.value)}
                        label="Filtrar por Zona"
                        disabled={!selectedUEN}
                      >
                        <MenuItem value="">
                          <em>Todas</em>
                        </MenuItem>
                        {zonaOptions.map((zona) => (
                          <MenuItem key={zona} value={zona}>
                            {zona}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl
                      variant="outlined"
                      style={{ marginRight: "10px", minWidth: 200 }}
                    >
                      <InputLabel>Filtrar por Rubro</InputLabel>
                      <Select
                        value={selectedRubro}
                        onChange={(e) => setSelectedRubro(e.target.value)}
                        label="Filtrar por Rubro"
                        disabled={!selectedZona}
                      >
                        <MenuItem value="">
                          <em>Todos</em>
                        </MenuItem>
                        {rubrosEnUso.rubros.map((rubroIndex) => (
                          <MenuItem key={rubroIndex} value={rubroIndex}>
                            {rubros[rubroIndex].nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl variant="outlined" style={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Subrubro</InputLabel>
                      <Select
                        value={selectedSubrubro}
                        onChange={(e) => setSelectedSubrubro(e.target.value)}
                        label="Filtrar por Subrubro"
                        disabled={!selectedRubro}
                      >
                        <MenuItem value="">
                          <em>Todos</em>
                        </MenuItem>
                        {rubros[selectedRubro]?.subrubros
                          .filter((_, subrubroIndex) =>
                            rubrosEnUso.subrubros.includes(subrubroIndex) // Comparación por índice
                          )
                          .map((subrubro, subrubroIndex) => (
                            <MenuItem key={subrubroIndex} value={subrubroIndex}>
                              {subrubro.codigo} {subrubro.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </div>

                  <TableContainer component={Paper} style={{ padding: "20px" }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <td>
                            <Typography>UEN</Typography>
                          </td>
                          <td>
                            <Typography>Zona</Typography>
                          </td>
                          <td>
                            <Typography>Rubro</Typography>
                          </td>
                          <td>
                            <Typography>Subrubro</Typography>
                          </td>
                          <td>
                            <Typography>Total</Typography>
                          </td>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {yearData.map(({ uen, totalPresupuesto, zonas }) => (
                          <React.Fragment key={`${uen}-${totalPresupuesto}`}>
                            {/* UEN Row */}
                            <TableRow>
                              <td
                                colSpan={4}
                                style={{ backgroundColor: "#f0f0f0" }}
                              >
                                <Typography>{uen}</Typography>
                              </td>
                              <td style={{ backgroundColor: "#f0f0f0" }}>
                                <Typography>
                                  {" "}
                                  {totalPresupuesto.toFixed(2)}{" "}
                                </Typography>
                              </td>
                            </TableRow>
                            {Object.entries(zonas).map(([zona, zonaData]) => (
                              <React.Fragment key={zona}>
                                {/* Zona Row */}
                                <TableRow>
                                  <td></td>
                                  <td
                                    colSpan={3}
                                    style={{ backgroundColor: "#d0e0f0" }}
                                  >
                                    <Typography>{zona}</Typography>
                                  </td>
                                  <td style={{ backgroundColor: "#d0e0f0" }}>
                                    <Typography>
                                      {zonaData.totalZonaPresupuesto.toFixed(2)}
                                    </Typography>
                                  </td>
                                </TableRow>
                                {/* Detalle de Rubros y Subrubros */}
                                {Object.entries(
                                  zonaData.items.reduce((acc, item) => {
                                  // Obtener rubro y subrubro asociados
                                  const rubro = rubros[item.rubro];
                                  const rubroName = rubro?.nombre || "Rubro no encontrado";
                                  
                                  // Verifica que el rubro contenga subrubros y accede al subrubro específico
                                  const subrubroData = rubro?.subrubros?.[item.subrubro] || {};
                                  
                                  const subrubroCodigo = subrubroData?.codigo || "Subrubro no encontrado";
                                  const subrubroNombre = subrubroData?.nombre || "Subrubro no encontrado";

                                  // Crear la clave única para el subrubro (código y nombre)
                                  const subrubroKey = `${subrubroCodigo} ${subrubroNombre}`;
                                  const rubroKey = rubroName;

                                    if (!acc[rubroKey]) {
                                      acc[rubroKey] = {
                                        rubroName: rubroName,
                                        subrubros: {},
                                        totalRubro: 0,
                                      };
                                    }

                                    if (!acc[rubroKey].subrubros[subrubroKey]) {
                                      acc[rubroKey].subrubros[subrubroKey] = {
                                        items: [],
                                        totalSubrubro: 0,
                                      };
                                    }

                                    acc[rubroKey].subrubros[
                                      subrubroKey
                                    ].items.push(item);
                                    acc[rubroKey].subrubros[
                                      subrubroKey
                                    ].totalSubrubro += parseFloat(
                                      item.presupuestomes || 0
                                    );
                                    acc[rubroKey].totalRubro += parseFloat(
                                      item.presupuestomes || 0
                                    );

                                    return acc;
                                  }, {})
                                ).map(([rubroKey, rubroData]) => (
                                  <React.Fragment key={rubroKey}>
                                    {/* Rubro Row */}
                                    <TableRow>
                                      <td></td>
                                      <td></td>
                                      <td>
                                        <Typography>
                                          {rubroData.rubroName}
                                        </Typography>
                                      </td>
                                      <td></td>
                                      <td>
                                        <Typography>
                                          {rubroData.totalRubro.toFixed(2)}
                                        </Typography>
                                      </td>
                                    </TableRow>

                                    {/* Subrubro Rows */}
                                    {Object.entries(rubroData.subrubros).map(([subrubroKey, subrubroData]) => (
                                        <TableRow key={subrubroKey}>
                                          <td></td>
                                          <td></td>
                                          <td></td>
                                          <td>
                                            <Typography>
                                              {subrubroKey}
                                            </Typography>
                                          </td>
                                          <td>
                                            <Typography>
                                              {" "}
                                              {subrubroData.totalSubrubro.toFixed(
                                                2
                                              )}{" "}
                                            </Typography>
                                          </td>
                                        </TableRow>
                                      )
                                    )}
                                  </React.Fragment>
                                ))}{" "}
                                {/* End Rubro Mapping */}
                              </React.Fragment>
                            ))}{" "}
                            {/* End Zona Mapping */}
                          </React.Fragment>
                        ))}{" "}
                        {/* End UEN Mapping */}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
          )}
          {/* Muestra los acordeones por UEN */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginBottom: "10px",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" style={{ margin: 20 }}>
              Detallado por UEN
            </Typography>
            <Tooltip title="Ver Subrubro">
              <Button
                variant="outlined"
                onClick={handleToggle}
                aria-label="toggle visibility"
                style={{ height: 40 }}
              >
                {isVisible ? <Visibility /> : <VisibilityOff />}
              </Button>
            </Tooltip>
          </div>

          {Object.entries(presupuestos).map(([uen, data]) => (
            <Accordion
              key={uen}
              expanded={!!expanded[uen]}
              onChange={handleAccordionChange(uen)}
              sx={{ width: "100%", overflow: "auto", borderRadius: 2 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${uen}-content`}
                id={`panel-${uen}-header`}
                style={{
                  backgroundColor:
                    uen == "Constructora"
                      ? "rgb(75, 134, 128, 1)" // Constructora
                      : uen == "Inmobiliaria"
                      ? "rgb(0, 45, 175, 1)" // Inmobiliaria
                      : uen == "Unidades de Apoyo"
                      ? "rgb(138, 138, 135, 1) " // Unidad de Apoyo
                      : "rgb(253, 128, 2, 1)", //Promotora
                  color: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "80%",
                  }}
                >
                  <Typography variant="h6">{uen}</Typography>
                  <Typography variant="body1" sx={{ marginLeft: "20px" }}>
                    Total Presupuesto {uen}: {data.totalPresupuesto.toFixed(2)}
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <Grid
                  container
                  spacing={2}
                  sx={{ overflow: "auto", width: "150%" }}
                >
                  {Object.entries(data.zonas).map(([zona, zonaData]) => (
                    <Grid item xs={12} md={6} lg={3} key={zona}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '10px' }}>
                        <Typography variant="h6" sx={{ margin: 0, fontWeight: 'bold' }}>
                          {zona} {/* Nombre de la zona en negrilla */}
                        </Typography>
                        <Typography variant="body2" sx={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                          {zonaData.totalZonaPresupuesto.toFixed(2)} {/* Total de presupuesto */}
                        </Typography>
                      </div>
                      {/* Detalles de los rubros y subrubros */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <tbody>
                          {Object.entries(
                            zonaData.items.reduce((acc, item) => {
                              // Obtener rubro y subrubro asociados
                              const rubro = rubros[item.rubro];
                              const rubroName = rubro?.nombre || "Rubro no encontrado";
                              const subrubroData = rubro?.subrubros?.[item.subrubro] || {};
                              const subrubroCodigo = subrubroData?.codigo || "Subrubro no encontrado";
                              const subrubroNombre = subrubroData?.nombre || "Subrubro no encontrado";
                              const subrubroKey = `${subrubroCodigo} ${subrubroNombre}`;
                              const rubroKey = rubroName;

                              if (!acc[rubroKey]) {
                                acc[rubroKey] = {
                                  rubroName: rubroName,
                                  subrubros: {},
                                  totalRubro: 0,
                                };
                              }

                              if (!acc[rubroKey].subrubros[subrubroKey]) {
                                acc[rubroKey].subrubros[subrubroKey] = {
                                  items: [],
                                  totalSubrubro: 0,
                                };
                              }

                              acc[rubroKey].subrubros[subrubroKey].items.push(item);
                              acc[rubroKey].subrubros[subrubroKey].totalSubrubro += parseFloat(item.presupuestomes || 0);
                              acc[rubroKey].totalRubro += parseFloat(item.presupuestomes || 0);

                              return acc;
                            }, {})
                          ).map(([rubroKey, rubroData]) => (
                            <React.Fragment key={rubroKey}>
                              {/* Fila del rubro */}
                              <tr style={{ backgroundColor: '#f0f0f0', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}>
                                <td colSpan="2" style={{ padding: '10px', fontWeight: 'bold', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                  <Typography variant="body1">{rubroData.rubroName}</Typography>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                                  <Typography variant="body2">{rubroData.totalRubro.toFixed(2)}</Typography>
                                </td>
                              </tr>

                              {/* Filas de subrubros dentro del rubro */}
                              {Object.entries(rubroData.subrubros).map(([subrubroKey, subrubroData]) =>
                                isVisible && (
                                  <tr key={subrubroKey} style={{ backgroundColor: '#fafafa', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)' }}>
                                    <td style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                      <Typography variant="body2">{subrubroKey}</Typography>
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                                      <Typography variant="body2">{subrubroData.totalSubrubro.toFixed(2)}</Typography>
                                    </td>
                                  </tr>
                                )
                              )}
                            </React.Fragment>
                          ))}

                            {/* Agrega la lógica para calcular utilidad bruta, operativa y antes de impuestos */}
                            {(() => {
                              const ingresosOperacionalesTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (rubroName === "INGRESOS OPERACIONALES") {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const costosIndirectosTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (rubroName === "COSTOS INDIRECTOS") {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                                const costosDeVentaTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (rubroName === "COSTOS DE VENTA") {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const utilidadBruta = ingresosOperacionalesTotal - costosDeVentaTotal - costosIndirectosTotal;

                              const gastosOperacionalesAdministrativosTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (
                                    rubroName ===
                                    "GASTOS OPERACIONALES DE ADMINISTRACION"
                                  ) {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const gastosOperacionalesComercialesTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (
                                    rubroName ===
                                    "GASTOS OPERACIONALES DE COMERCIALIZACION"
                                  ) {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const utilidadoPerdidaOperacional =
                                utilidadBruta -
                                gastosOperacionalesAdministrativosTotal -
                                gastosOperacionalesComercialesTotal;

                              const ingresosNoOperacionalesTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (
                                    rubroName === "INGRESOS NO OPERACIONALES"
                                  ) {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const gastosNoOperacionalesTotal =
                                zonaData.items.reduce((acc, item) => {
                                  const rubroName =
                                    rubros[item.rubro]?.nombre ||
                                    "Rubro no encontrado";
                                  if (rubroName === "GASTOS NO OPERACIONALES") {
                                    return (
                                      acc + parseFloat(item.presupuestomes || 0)
                                    );
                                  }
                                  return acc;
                                }, 0);

                              const utilidadAntesDeImpuesto =
                                utilidadoPerdidaOperacional +
                                ingresosNoOperacionalesTotal -
                                gastosNoOperacionalesTotal;

                              return (
                                <React.Fragment>
                                  <tr>
                                    <td colSpan="2">
                                      <Typography>UTILIDAD BRUTA</Typography>
                                    </td>
                                    <td>
                                      <Typography>
                                        {utilidadBruta.toFixed(2)}
                                      </Typography>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2">
                                      <Typography>
                                        UTILIDAD ó (PERDIDA) OPERACIONAL
                                      </Typography>
                                    </td>
                                    <td>
                                      <Typography>
                                        {utilidadoPerdidaOperacional.toFixed(2)}
                                      </Typography>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="2">
                                      <Typography>
                                        UTILIDAD ANTES DE IMPUESTO
                                      </Typography>
                                    </td>
                                    <td>
                                      <Typography>
                                        {utilidadAntesDeImpuesto.toFixed(2)}
                                      </Typography>
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            })()}
                          </tbody>
                        </table>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Informe;
