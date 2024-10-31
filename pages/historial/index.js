//index.js
import Sidebar from "@/components/sidebar";
import CardStorage from "@/components/cardStorage";
import { useEffect, useState } from "react";
import { getCookie } from "../../src/utils/cookieUtils";
import { useRouter } from "next/router";
import withAuth from "../api/auth/withAuth";
import { openDB } from "idb";
import LoadingModal from "@/components/loading";

const Storage = () => {
  const [updatedPresupuestos, setPresupuestos] = useState([]);
  const [userId, setUserId] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  let dbInstance = null;

  const initDB = async () => {
    if (dbInstance) return dbInstance;
    dbInstance = await openDB("PresupuestoDB");
    const newVersion = dbInstance.version + 1;
    dbInstance.close();
    dbInstance = await openDB("PresupuestoDB", newVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("selectedPresupuesto")) {
          db.createObjectStore("selectedPresupuesto");
        }
      },
    });
    return dbInstance;
  };

  const clearDataInDB = async (currentView) => {
    try {
      const db = await initDB();
      
      // Vaciar datos de selectedPresupuesto
      await db.put("selectedPresupuesto", {
        inputs: {},
        id: [],
        centroCostoid: [],
        rubrosTotals: {},
        updatedRubros: [],
        monthlyTotals: Array(12).fill(0),
      }, `${currentView}_selectedPresupuesto`);
      
      // Vaciar datos de rubrosData (si es necesario)
      await db.put("rubrosData", {
        updatedRubros: [],
        monthlyTotals: Array(12).fill(0),
        rubrosTotals: {},
        inputs: {},
      }, `${currentView}_rubrosData`);
      
      console.log("Datos vaciados correctamente en IndexedDB");
    } catch (error) {
      console.error("Error al vaciar datos en IndexedDB:", error);
    }
  };

  const saveDataToDB = async (key, data) => {
    const db = await initDB();
    try {
      await db.put("selectedPresupuesto", data, key);
    } catch (error) {
      console.error("Error fetching data from DB:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const csrftoken = getCookie("csrftoken");
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/HistorialPresupuesto/`, {
          method: "GET",
          headers: {
            "X-CSRFToken": csrftoken,
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          keepalive: true 
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();

        const transformedData = data.map((item) => ({
          id: item.id,
          usuario: item.usuario,
          uen: item.uen,
          codigo: item.cuenta,
          rubro: item.rubro,
          subrubro: item.subrubro,
          auxiliar: item.auxiliar,
          item: item.item,
          meses: item.meses,
          value: item.presupuestomes,
          fecha: item.fecha,
          rubrosTotals: item.rubrosTotals,
          updatedRubros: item.updatedRubros,
          monthlyTotals: item.monthlyTotals,
        }));

        setPresupuestos(transformedData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }finally {
        setIsLoading(false);
      }
    };

    if (!userId) {
      fetchData();
    }
  }, [userId]);

  const handleCardClick = async (nombre, usuarioId, fecha) => {
    const filteredPresupuestos = updatedPresupuestos.filter(
      (item) =>
        item.uen.nombre.toLowerCase() === nombre.toLowerCase() &&
        item.usuario.id === usuarioId &&
        item.fecha === fecha
    );

    if (filteredPresupuestos.length > 0) {
      const newInputValues = {};
      filteredPresupuestos.forEach((entry) => {
        const inputId = `outlined-basic-${entry.rubro}-${entry.subrubro}-${entry.auxiliar}-${entry.item}-${entry.meses}`;
        newInputValues[inputId] = { ...entry };
      });

      setInputValues(newInputValues);
      const currentView = nombre === "Unidades de Apoyo" ? "unidad-apoyo" : nombre.toLowerCase();

      await clearDataInDB(currentView);

      await saveDataToDB(`${currentView}_selectedPresupuesto`, {
        inputs: newInputValues,
        id: filteredPresupuestos.map((entry) => entry.id),
        centroCostoid: filteredPresupuestos.map((entry) => entry.codigo),
        rubrosTotals: filteredPresupuestos[filteredPresupuestos.length - 1].rubrosTotals,
        updatedRubros: filteredPresupuestos[filteredPresupuestos.length - 1].updatedRubros,
        monthlyTotals: filteredPresupuestos[filteredPresupuestos.length - 1].monthlyTotals,
      });

      router.push(`/uen/${currentView}`);
    } else {
      console.error("No se encontraron presupuestos para la UEN seleccionada");
    }
  };

  const uniquePresupuestos = Array.from(
    new Map(
      updatedPresupuestos.map((presupuesto) => {
        const uniqueKey = `${presupuesto.uen.nombre}-${presupuesto.usuario.id}-${presupuesto.fecha}`;
        return [uniqueKey, presupuesto];
      })
    ).values()
  );

  if (isLoading) return <LoadingModal open={isLoading} />

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
        <Sidebar />
        <div style={{ display: "flex", flexDirection: "column", width: "80%" }}>
          {uniquePresupuestos.length > 0 &&
            uniquePresupuestos.map((presupuesto, index) => (
              <CardStorage
                key={index}
                area={`${presupuesto.uen.nombre || "N/A"}`}
                user={`${presupuesto.usuario.first_name} ${presupuesto.usuario.last_name}`}
                date={`${presupuesto.fecha || "N/A"}`}
                click={() =>
                  handleCardClick(
                    presupuesto.uen.nombre,
                    presupuesto.usuario.id,
                    presupuesto.fecha
                  )
                }
              />
            ))}
        </div>
      </div>
    </>
  );
};

export default withAuth(Storage);
