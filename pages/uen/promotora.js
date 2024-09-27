import { useEffect, useState } from 'react';
import { getCookie } from '../../src/utils/cookieUtils';
import CustomTable from '@/components/table';
import Sidebar from '@/components/sidebar';
import withAuth from '../api/auth/withAuth';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Octe', 'Nov', 'Dic'];

const Promotora = () => {
    const [updatedRubros, setUpdatedRubros] = useState([]);
    const [monthlyTotals, setMonthlyTotals] = useState(Array(12).fill(0) || 0);
    const [rubrosTotals, setRubrosTotals] = useState({});
    const [inputValues, setInputValues] = useState({});
    const [updatedcentroCostos, setCentroCostos] = useState([]);
    const [presupuestoid, setpresupuestoid] = useState([]);
    const [userId, setUserId] = useState(null);
    const [CentroCostoid, setCentroCostoid] = useState();

    const currentView = 'promotora';
    useEffect(() => {
        const fetchData = async () => {
            try {
                const savedData = JSON.parse(localStorage.getItem(`${currentView}_rubrosData`));
                if (savedData && savedData.updatedRubros) {
                    setUpdatedRubros(savedData.updatedRubros);
                    setMonthlyTotals(savedData.monthlyTotals || Array(12).fill(0));
                    setRubrosTotals(savedData.rubrosTotals || {});
                    setInputValues(savedData.inputs || {});

                } else {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const csrftoken = getCookie('csrftoken');
                    const token = localStorage.getItem('token');
                    const rubrosResponse = await fetch(`${API_URL}/rubros/`, {
                    // const rubrosResponse = await fetch(`http://localhost:8000/rubros/`, {
                        method: 'GET',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'Authorization': `Token ${token}`,
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    });
                    if (!rubrosResponse.ok) throw new Error(`HTTP error! Status: ${rubrosResponse.status}`);
                    const rubrosData = await rubrosResponse.json();

                    setUpdatedRubros(rubrosData || []);
                }
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const csrftoken = getCookie('csrftoken');
                const token = localStorage.getItem('token');
                const centroCostosResponse = await fetch(`${API_URL}/CentroCostos/`, {
                // const centroCostosResponse = await fetch(`http://localhost:8000/CentroCostos/`, {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!centroCostosResponse.ok) throw new Error(`HTTP error! Status: ${centroCostosResponse.status}`);
                const centroCostosData = await centroCostosResponse.json();

                let Promotora = centroCostosData.results.filter(item => item.uen.nombre === 'Promotora');
                setCentroCostos(Promotora || []);
                setUserId(centroCostosData.user_id || null);

                if (!userId) {
                    setUserId(centroCostosData.user_id || null);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (!userId) {
            fetchData();
        }

        const removeDecimalsFromValues = (values) => {
            const formattedValues = {};
            Object.keys(values).forEach((key) => {
                const item = values[key];

                if (item && typeof item.value === 'string') {
                    formattedValues[key] = {
                        ...item,
                        value: item.value.replace(/\.00$/, ''),
                    };
                } else {
                    formattedValues[key] = item;
                }
            });
            return formattedValues;
        };

        const savedData = JSON.parse(localStorage.getItem(`${currentView}_rubrosData`));
        if (savedData && savedData.updatedRubros) {
            setUpdatedRubros(savedData.updatedRubros);
            setMonthlyTotals(savedData.monthlyTotals || Array(12).fill(0));
            setRubrosTotals(savedData.rubrosTotals || {});
            setInputValues(savedData.inputs || {});
        }

        const savedPresupuesto = JSON.parse(localStorage.getItem(`${currentView}_selectedPresupuesto`));
        if (savedPresupuesto) {
            const formattedInputs = removeDecimalsFromValues(savedPresupuesto.inputs || {});
            setInputValues(formattedInputs);
            setMonthlyTotals(savedPresupuesto.monthlyTotals || {});
            setRubrosTotals(savedPresupuesto.rubrosTotals || {});
            setUpdatedRubros(savedPresupuesto.updatedRubros || {});
            setCentroCostoid(savedPresupuesto.centroCostoid || {});
            setpresupuestoid(savedPresupuesto.id || {});
        }

        const handleStorageChange = (event) => {
            if (event.key === 'selectedPresupuesto') {
                const updatedPresupuesto = JSON.parse(event.newValue);
                if (updatedPresupuesto) {
                    const formattedInputs = removeDecimalsFromValues(updatedPresupuesto.inputs || {});
                    setInputValues(formattedInputs);
                    setMonthlyTotals(updatedPresupuesto.monthlyTotals || []);
                    setRubrosTotals(updatedPresupuesto.rubrosTotals || {});
                    setUpdatedRubros(updatedPresupuesto.updatedRubros || []);
                    setCentroCostoid(updatedPresupuesto.centroCostoid || []);
                    setpresupuestoid(updatedPresupuesto.id || []);
                }
            }
        };

        // Añadir listener de storage
        window.addEventListener('storage', handleStorageChange);

        // Limpiar el listener al desmontar el componente
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };

    }, [userId]);

    return (
        <>
            <div style={{ display: "flex", flexDirection: 'row', overflow: 'auto', marginRight: '10px', height: '100vh' }}>
                <Sidebar />
                <CustomTable
                    presupuestoid={presupuestoid}
                    CentroCostoid={CentroCostoid}
                    setCentroCostoid={setCentroCostoid}
                    updatedRubros={updatedRubros}
                    setUpdatedRubros={setUpdatedRubros}
                    setInputValues={setInputValues}
                    inputValues={inputValues}
                    rubrosTotals={rubrosTotals}
                    setRubrosTotals={setRubrosTotals}
                    monthlyTotals={monthlyTotals}
                    setMonthlyTotals={setMonthlyTotals}
                    MONTHS={MONTHS}
                    userId={userId}
                    updatedcentroCostos={updatedcentroCostos}
                    uen='Promotora'
                />
            </div>
        </>
    )
}

export default withAuth(Promotora); 