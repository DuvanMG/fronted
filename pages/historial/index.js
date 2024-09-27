import Sidebar from "@/components/sidebar";
import CardStorage from "@/components/cardStorage";
import { useEffect, useState } from 'react';
import { getCookie } from '../../src/utils/cookieUtils';
import { useRouter } from 'next/router';
import withAuth from "../api/auth/withAuth";

const Storage = () => {
    const [updatedpresupuestos, setpresupuestos] = useState([]);
    const [userId, setUserId] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const csrftoken = getCookie('csrftoken');
                const token = localStorage.getItem('token');
                const presupuestosResponse = await fetch(`${API_URL}/HistorialPresupuesto/`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                localStorage.removeItem('rubrosData');
                localStorage.removeItem('selectedPresupuesto');

                if (!presupuestosResponse.ok) throw new Error(`HTTP error! Status: ${presupuestosResponse.status}`);
                const presupuestosData = await presupuestosResponse.json();

                const transformedData = presupuestosData.map(item => ({
                    id: item.id,
                    usuario: item.usuario,
                    uen: item.uen,
                    centroCostoid: item.cuenta,
                    rubro: item.rubro,
                    subrubro: item.subrubro,
                    item: item.item,
                    meses: item.meses,
                    value: item.presupuestomes,
                    fecha: item.fecha,
                    rubrosTotals: item.rubrosTotals,
                    updatedRubros: item.updatedRubros,
                    monthlyTotals: item.monthlyTotals,
                }));

                setpresupuestos(transformedData || []);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        if (!userId) {
            fetchData();
        }
    }, [userId]);

    const handleCardClick = (nombre) => {
        // Filtrar los presupuestos por la UEN seleccionada
        const filteredPresupuesto = updatedpresupuestos.filter(
            (item) => item.uen.nombre.toLowerCase() === nombre.toLowerCase()
        );

        if (filteredPresupuesto.length > 0) {
            // Crear inputValues basado en los presupuestos filtrados
            const newInputValues = {};
            filteredPresupuesto.forEach(entry => {
                const { id, usuario, uen, centroCostoid, rubro, subrubro, item, meses, value, rubrosTotals, updatedRubros, monthlyTotals } = entry;
                const inputId = `outlined-basic-${rubro}-${subrubro}-${item}-${meses}`; 

                newInputValues[inputId] = {
                    id,
                    usuario,
                    uen,
                    centroCostoid,
                    rubro,
                    subrubro,
                    item,
                    meses,
                    value,
                    rubrosTotals,
                    updatedRubros,
                    monthlyTotals,
                };
            });
            setInputValues(newInputValues);

            // Preparar los datos que quieres enviar a la nueva ruta
            const updatedRubrosList = filteredPresupuesto.map((entry) => entry.updatedRubros);
            const monthlyTotalsList = filteredPresupuesto.map((entry) => entry.monthlyTotals);
            const rubrosTotalsList = filteredPresupuesto.map((entry) => entry.rubrosTotals);
            const centroCostoid = filteredPresupuesto.map((entry) => entry.centroCostoid);
            const id = filteredPresupuesto.map((entry) => entry.id);

            const filteredInputValues = {};
            Object.keys(newInputValues).forEach(key => {
                const item = newInputValues[key];
                filteredInputValues[key] = {
                    id: item.id,
                    value: item.value,
                    centroCostoid: item.centroCostoid,
                };
            });

            localStorage.setItem(
                `${nombre === 'Unidades de Apoyo' ? 'unidad-apoyo' : nombre.toLowerCase()}_selectedPresupuesto`,
                JSON.stringify({
                    inputs: filteredInputValues,
                    centroCostoid: centroCostoid,
                    id: id,
                    rubrosTotals: rubrosTotalsList[rubrosTotalsList.length - 1],
                    updatedRubros: updatedRubrosList[updatedRubrosList.length - 1],
                    monthlyTotals: monthlyTotalsList[monthlyTotalsList.length - 1]
                })
            );

            const routePath = nombre === 'Unidades de Apoyo' ? 'unidad-apoyo' : nombre.toLowerCase();
            router.push(`/uen/${routePath}`);
        } else {
            console.error('No se encontraron presupuestos para la UEN seleccionada');
        }
    };

    // Obtener presupuestos únicos por nombre de UEN y nombre de usuario
    const uniquePresupuestos = Array.from(new Map(updatedpresupuestos.map(presupuesto => {
        const uniqueKey = `${presupuesto.uen.nombre}-${presupuesto.usuario.first_name}`;
        return [uniqueKey, presupuesto];
    })).values());

    return (
        <>
            <div style={{ display: "flex", flexDirection: 'row', height: "100vh" }}>
                <Sidebar />
                <div style={{ display: "flex", flexDirection: 'column', width: "80%" }}>
                    {uniquePresupuestos.length > 0 && uniquePresupuestos.map((presupuesto, index) => (
                        <CardStorage
                            key={index}
                            area={`${presupuesto.uen.nombre || 'N/A'}`}
                            user={`${presupuesto.usuario.first_name} ${presupuesto.usuario.last_name}`}
                            date={`${presupuesto.fecha || 'N/A'}`}
                            click={() => handleCardClick(presupuesto.uen.nombre)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};

export default withAuth(Storage);