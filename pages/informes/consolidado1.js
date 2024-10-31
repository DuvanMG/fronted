import React, { useState, useEffect } from "react";
import ReportTable from "@/components/reportTable"; // Assuming this is your table component
import Sidebar from "@/components/sidebar"; // If needed, include your sidebar as well
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
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Search from "@/components/search";

const Informe = () => {
  // State declarations
  const [presupuestos, setPresupuestos] = useState([]);
  const [rubros, setRubros] = useState([]);
  const [subrubros, setSubRubros] = useState([]);
  const [rubroTotales, setRubroTotales] = useState({});
  const [subRubroTotales, setSubRubroTotales] = useState({});
  const [itemTotales, setItemTotales] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState({});

  const router = useRouter();

  const handleAccordionChange = (uen) => () => {
    setExpanded((prev) => ({
      ...prev,
      [uen]: !prev[uen],
    }));
  };

  const handleToggle = () => {
    setIsVisible(!isVisible);
    setVisible(!visible);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const presupuestosResponse = await fetch(`${API_URL}/InformeDetalladoPresupuesto/`, {
          method: "GET",
          headers: {
            "X-CSRFToken": csrftoken,
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!presupuestosResponse.ok)
          throw new Error(`HTTP error! Status: ${presupuestosResponse.status}`);
        const presupuestosData = await presupuestosResponse.json();
      
        if (presupuestosData.length === 0) {
          setError("No existe información.");
          return;
        }

        if (!presupuestosData[0].updatedRubros || presupuestosData[0].updatedRubros.length === 0) {
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
          const presupuestoYear = new Date(presupuesto.fecha).getFullYear();
          const rubroIndex = presupuesto.rubro;
          const subrubroIndex = presupuesto.subrubro;
          const valor = parseFloat(presupuesto.presupuestomes);
          const updatedRubros = presupuesto.updatedRubros || [];

          // Handle Rubros
          if (rubroIndex >= 0 && rubroIndex < updatedRubros.length) {
            const rubroNombre = updatedRubros[rubroIndex]?.nombre || "Rubro no encontrado";
            if (!totalPorRubro[presupuestoYear]) {
              totalPorRubro[presupuestoYear] = {};
            }
            if (!totalPorRubro[presupuestoYear][rubroNombre]) {
              totalPorRubro[presupuestoYear][rubroNombre] = 0;
            }
            totalPorRubro[presupuestoYear][rubroNombre] += valor;

            // Handle Subrubros
            const rubro = updatedRubros[rubroIndex];
            const subrubros = rubro.subrubros || [];
            if (subrubroIndex >= 0 && subrubroIndex < subrubros.length) {
              const subrubroNombre = subrubros[subrubroIndex]?.nombre || "Subrubro no encontrado";
              const subrubroCodigo = subrubros[subrubroIndex]?.codigo || "";
              if (!totalPorSubRubro[presupuestoYear]) {
                totalPorSubRubro[presupuestoYear] = {};
              }
              if (!totalPorSubRubro[presupuestoYear][subrubroCodigo]) {
                totalPorSubRubro[presupuestoYear][subrubroCodigo] = {
                  nombre: subrubroNombre,
                  total: 0,
                };
              }
              totalPorSubRubro[presupuestoYear][subrubroCodigo].total += valor;
            }
          }

          // Handle Cuentas
          const { codigo, nombre, regional } = presupuesto.cuenta;
          if (!totalPorCuenta[presupuestoYear]) {
            totalPorCuenta[presupuestoYear] = {};
          }
          if (!totalPorCuenta[presupuestoYear][codigo]) {
            totalPorCuenta[presupuestoYear][codigo] = {
              nombre,
              regional,
              total: 0,
            };
          }
          totalPorCuenta[presupuestoYear][codigo].total += valor;
        });

        setRubroTotales(totalPorRubro);
        setSubRubroTotales(totalPorSubRubro);
        setItemTotales(totalPorCuenta);
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

  const saveTotalsToBackend = async (totals, type) => {
    try {
      for (const [year, totalsByKey] of Object.entries(totals)) {
        for (const [key, total] of Object.entries(totalsByKey)) {
          let nombre = "";
          let totalpresupuestoProyectado = 0;

          if (type === "rubro") {
            nombre = `Rubro: ${key}`;
            totalpresupuestoProyectado = total;
          } else if (type === "subrubro") {
            nombre = `SubRubro: ${key} ${total.nombre}`;
            totalpresupuestoProyectado = total.total;
          } else if (type === "cuenta") {
            nombre = `Cuenta: ${key} ${total.nombre} ${total.regional}`;
            totalpresupuestoProyectado = total.total;
          }

          const fecha = new Date(Number(year) + 1, 0, 1).toISOString().split('T')[0];

          const csrftoken = getCookie("csrftoken");
          const token = localStorage.getItem("token");
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(`${API_URL}/save-presupuesto-total/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": csrftoken,
              Authorization: `Token ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: nombre,
              totalpresupuestoProyectado: totalpresupuestoProyectado,
              fecha: fecha,
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

  // Llamadas para guardar rubros, subrubros y cuentas con el total correspondiente
  useEffect(() => {
    if (Object.keys(rubroTotales).length > 0) {
      saveTotalsToBackend(rubroTotales, "rubro");
    }
    if (Object.keys(subRubroTotales).length > 0) {
      saveTotalsToBackend(subRubroTotales, "subrubro");
    }
    if (Object.keys(itemTotales).length > 0) {
      saveTotalsToBackend(itemTotales, "cuenta");
    }
  }, [rubroTotales, subRubroTotales, itemTotales]);

  return (
    <div>
      <Sidebar /> {/* Include your sidebar if needed */}
      <Search /> {/* Include your search component if needed */}
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
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : (
            <>
              {/* Table for Rubros */}
              <Typography variant="h6">Totales por Rubro</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Rubro</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(rubroTotales).map(([year, rubros]) => 
                      Object.entries(rubros).map(([rubro, total]) => (
                        <TableRow key={`${year}-${rubro}`}>
                          <TableCell>{year}</TableCell>
                          <TableCell>{rubro}</TableCell>
                          <TableCell>{total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table for Subrubros */}
              <Typography variant="h6">Totales por Subrubro</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Subrubro</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(subRubroTotales).map(([year, subrubros]) => 
                      Object.entries(subrubros).map(([codigo, { nombre, total }]) => (
                        <TableRow key={`${year}-${codigo}`}>
                          <TableCell>{year}</TableCell>
                          <TableCell>{nombre}</TableCell>
                          <TableCell>{total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Table for Cuentas */}
              <Typography variant="h6">Totales por Cuenta</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Año</TableCell>
                      <TableCell>Cuenta</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Regional</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(itemTotales).map(([year, cuentas]) => 
                      Object.entries(cuentas).map(([codigo, { nombre, regional, total }]) => (
                        <TableRow key={`${year}-${codigo}`}>
                          <TableCell>{year}</TableCell>
                          <TableCell>{codigo}</TableCell>
                          <TableCell>{nombre}</TableCell>
                          <TableCell>{regional}</TableCell>
                          <TableCell>{total}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Informe;
