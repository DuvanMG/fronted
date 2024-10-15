import React, { useState, useEffect } from 'react'; 
import ReportTable from '@/components/reportTable';
import Sidebar from "@/components/sidebar";
import { getCookie } from '../../src/utils/cookieUtils';
import { useRouter } from 'next/router';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const csrftoken = getCookie('csrftoken');
                const token = localStorage.getItem('token');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const presupuestosResponse = await fetch(`${API_URL}/InformeDetalladoPresupuesto/`, {
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

                if (presupuestosData.length === 0) {
                    setError('No existe información.');
                    return;
                }
    
                if (!presupuestosData[0].updatedRubros || presupuestosData[0].updatedRubros.length === 0) {
                    console.error('updatedRubros is missing or undefined.');
                    setRubros([]);  
                } else {
                    const rubros = presupuestosData[0].updatedRubros || [];
                    setRubros(rubros);

                    rubros.forEach(rubro => {
                        const subrubros = rubro.subrubros || [];
                        setSubRubros(subrubros);
                    });
                }

                const totalPorRubro = {};
                const totalPorSubRubro = {};
                const totalPorCuenta = {}; 

                presupuestosData.forEach(presupuesto => {
                    const rubroIndex = presupuesto.rubro; 
                    const subrubroIndex = presupuesto.subrubro; 
                    const valor = parseFloat(presupuesto.presupuestomes); 
                    const updatedRubros = presupuesto.updatedRubros || []; 

                    let rubroNombre = '';
                    if (rubroIndex >= 0 && rubroIndex < updatedRubros.length) {
                        rubroNombre = updatedRubros[rubroIndex]?.nombre || 'Rubro no encontrado';
                        const rubro = updatedRubros[rubroIndex]; 
                        const subrubros = rubro.subrubros || []; 

                        let subrubroNombre = '';
                        let subrubroCodigo = '';
                        if (subrubroIndex >= 0 && subrubroIndex < subrubros.length) {
                            subrubroNombre = subrubros[subrubroIndex]?.nombre || 'Subrubro no encontrado';
                            subrubroCodigo = subrubros[subrubroIndex]?.codigo || '';

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
                    acc[uen.nombre].zonas[zona].totalZonaPresupuesto += parseFloat(presupuesto.presupuestomes || 0);

                    acc[uen.nombre].totalPresupuesto += parseFloat(presupuesto.presupuestomes || 0);
                    acc[uen.nombre].mensualTotales[meses] += parseFloat(presupuestomes || 0);

                    return acc;
                }, {});                

                setPresupuestos(groupedData);

            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data. Please try again later.');
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
            // Iterar sobre los totales y guardar cada uno con el nombre y el total correspondiente
            for (const [key, total] of Object.entries(totals)) {
                let nombre = '';  // Para almacenar el nombre (rubro, subrubro o cuenta)
                let total_presupuesto = 0;  // Para almacenar el total de cada rubro/subrubro/cuenta
    
                if (type === 'rubro') {
                    nombre = `Rubro: ${key}`;  // El nombre del rubro
                    total_presupuesto = total;  // El total del rubro
                } else if (type === 'subrubro') {
                    nombre = `SubRubro: ${totals[key].codigo} ${totals[key].nombre}`;  // Nombre del subrubro
                    total_presupuesto = totals[key].total;  // Total del subrubro
                } else if (type === 'cuenta') {
                    nombre = `Cuenta: ${totals[key].codigo} ${totals[key].nombre} ${totals[key].regional}`;  // Nombre de la cuenta
                    total_presupuesto = totals[key].total;  // Total de la cuenta
                }
                const csrftoken = getCookie('csrftoken');
                const token = localStorage.getItem('token');
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/save-presupuesto-total/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nombre: nombre,  // Enviar el nombre dinámico (rubro/subrubro/cuenta)
                        total_presupuesto: total_presupuesto,  // Enviar el total correspondiente
                        fecha: new Date().getFullYear(),  // Enviar el año actual
                    }),
                });
    
                if (!response.ok) {
                    throw new Error('Failed to save total');
                }
            }
        } catch (error) {
            console.error('Error saving totals:', error);
        }
    };
    
    // Llamadas para guardar rubros, subrubros y cuentas con el total correspondiente
    saveTotalsToBackend(rubroTotales, 'rubro');
    saveTotalsToBackend(SubRubroTotales, 'subrubro');
    saveTotalsToBackend(itemTotales, 'cuenta');
    
    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {/* <div>
                <h2>Totales por Item</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Centro de Costo</th>
                            <th>Total Presupuesto</th>
                        </tr>
                    </thead>
                    <tbody>
                    {Object.values(itemTotales).map((cuenta) => {
                        return (
                            <tr key={cuenta.codigo}>
                                <td>{`${cuenta.codigo} ${cuenta.nombre} ${cuenta.regional}`}</td>
                                <td>{cuenta.total !== undefined ? cuenta.total.toFixed(2) : 'N/A'}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div>
                <h2>Totales por Rubro</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rubro</th>
                            <th>Total Presupuesto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(rubroTotales).map(([nombre, total]) => (
                            <tr key={nombre}>
                                <td>{nombre}</td>
                                <td>{total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <h2>Totales por SubRubro</h2>
                <table>
                    <thead>
                        <tr>
                            <th>SubRubro</th>
                            <th>Total Presupuesto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(SubRubroTotales).map((subrubro) => (
                            <tr key={subrubro.codigo}>
                                <td>{`${subrubro.codigo} ${subrubro.nombre}`}</td>
                                <td>{subrubro.total !== undefined ? subrubro.total.toFixed(2) : 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}
            {/* Mostrar la tabla por UEN, zona, etc. */}
            {Object.entries(presupuestos).map(([uen, data]) => (
                <div key={uen}>
                    <h2>UEN: {uen}</h2>
                    <p><strong>Total Presupuesto UEN:</strong> {data.totalPresupuesto.toFixed(2)}</p>
                    {Object.entries(data.zonas).map(([zona, zonaData]) => (
                        <div key={zona}>
                            <h3>Zona: {zona}</h3>
                            <p><strong>Total Presupuesto Zona:</strong> {zonaData.totalZonaPresupuesto.toFixed(2)}</p>
                            <table>
                                <tbody>
                                    {Object.entries(
                                        zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            const subrubroCodigo = subrubros[item.subrubro]?.codigo || "SubRubro no encontrado";
                                            const subrubroNombre = subrubros[item.subrubro]?.nombre || "SubRubro no encontrado";
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

                                            // Agregar ítem al subrubro
                                            acc[rubroKey].subrubros[subrubroKey].items.push(item);
                                            acc[rubroKey].subrubros[subrubroKey].totalSubrubro += parseFloat(item.presupuestomes || 0);

                                            // Sumar al total del rubro
                                            acc[rubroKey].totalRubro += parseFloat(item.presupuestomes || 0);

                                            return acc;
                                        }, {})
                                    ).map(([rubroKey, rubroData]) => (
                                        <React.Fragment key={rubroKey}>
                                            {/* Fila del rubro */}
                                            <tr>
                                                <td colSpan="2"><strong>{rubroData.rubroName}</strong></td>
                                                <td><strong>{rubroData.totalRubro.toFixed(2)}</strong></td>
                                            </tr>

                                            {/* Filas de subrubros dentro del rubro */}
                                            {Object.entries(rubroData.subrubros).map(([subrubroKey, subrubroData]) => (
                                                <tr key={subrubroKey}>
                                                    <td>{subrubroKey}</td>
                                                    <td>{subrubroData.totalSubrubro.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}

                                    
                                    {(() => {
                                        {/* Calcular utilidad bruta */}
                                        const ingresosOperacionalesTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "INGRESOS OPERACIONALES") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const costosIndirectosTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "COSTOS INDIRECTOS") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const utilidadBruta = ingresosOperacionalesTotal - costosIndirectosTotal;
                                        
                                        {/* Calcular UTILIDAD ó (PERDIDA) OPERACIONAL */}
                                        const gastosOperacionalesAdministrativosTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "GASTOS OPERACIONALES DE ADMINISTRACION") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const gastosOperacionalesComercialesTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "GASTOS OPERACIONALES DE COMERCIALIZACION") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const utilidadoPerdidaOperacional = utilidadBruta - gastosOperacionalesAdministrativosTotal - gastosOperacionalesComercialesTotal
                                        
                                        {/* Calcular UTILIDAD ANTES DE IMPUESTO */}
                                        const ingresosNoOperacionalesTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "INGRESOS NO OPERACIONALES") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const gastosNoOperacionalesTotal = zonaData.items.reduce((acc, item) => {
                                            const rubroName = rubros[item.rubro]?.nombre || "Rubro no encontrado";
                                            if (rubroName === "GASTOS NO OPERACIONALES") {
                                                return acc + parseFloat(item.presupuestomes || 0);
                                            }
                                            return acc;
                                        }, 0);

                                        const utilidadAntesDeImpuesto = utilidadoPerdidaOperacional + ingresosNoOperacionalesTotal - gastosNoOperacionalesTotal

                                        return (
                                            <React.Fragment>
                                                <tr>
                                                    <td colSpan="2"><strong>UTILIDAD BRUTA</strong></td>
                                                    <td><strong>{utilidadBruta.toFixed(2)}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2"><strong>UTILIDAD ó (PERDIDA) OPERACIONAL</strong></td>
                                                    <td><strong>{utilidadoPerdidaOperacional.toFixed(2)}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan="2"><strong>UTILIDAD ANTES DE IMPUESTO</strong></td>
                                                    <td><strong>{utilidadAntesDeImpuesto.toFixed(2)}</strong></td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Informe;

//     return (
//         <>
//             <div style={{ display: "flex", flexDirection: 'row', overflow: 'auto', marginRight: '10px', height: '100vh'  }}>
//                 <Sidebar />
//                 <ReportTable
//                     updatedpresupuestos={updatedpresupuestos}
//                 />
//             </div>
//         </>
//     );
// };