import React, { useEffect, useState } from 'react';
import ReportTable from '@/components/reportTable';
import Sidebar from "@/components/sidebar";
import { getCookie } from '../../src/utils/cookieUtils';
import { useRouter } from 'next/router';

const Informe = () => {
    const [updatedpresupuestos, setpresupuestos] = useState([]);
    const [userId, setUserId] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const csrftoken = getCookie('csrftoken');
                const token = localStorage.getItem('token');
                const presupuestosResponse = await fetch('http://localhost:8000/HistorialPresupuesto/', {
                    method: 'GET',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!presupuestosResponse.ok) throw new Error(`HTTP error! Status: ${presupuestosResponse.status}`);
                const presupuestosData = await presupuestosResponse.json();
                console.log('Response Data:', presupuestosData); 
                setpresupuestos(presupuestosData[0].updatedRubros);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (!userId) {
            fetchData();
        } 
    }, [userId]); 

    return (
        <>
            <div style={{ display: "flex", flexDirection: 'row', overflow: 'auto', marginRight: '10px', height: '100vh'  }}>
                <Sidebar />
                <ReportTable
                    updatedpresupuestos={updatedpresupuestos}
                />
            </div>
        </>
    );
};

export default Informe;