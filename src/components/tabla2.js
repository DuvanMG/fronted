import { useEffect, useState, useRef } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { Accordion, Autocomplete, SpeedDial, Button, Dialog, DialogTitle, AccordionSummary, DialogActions, DialogContent, TextField, Typography, useMediaQuery, SpeedDialAction } from '@mui/material';
import HoverButton from './hoverButton';
import styles from '../styles/table';
import { getCookie } from '../utils/cookieUtils';
import { Snackbar, Alert } from '@mui/material';
import * as XLSX from 'xlsx';

const CustomTable = ({
  MONTHS, rubrosTotals, setRubrosTotals, setInputValues, inputValues, updatedRubros, setUpdatedRubros,
  setMonthlyTotals, monthlyTotals, updatedcentroCostos, userId, uenId, CentroCostoid, setCentroCostoid, presupuestoid

}) => {
  const [open, setOpen] = useState(false);
  const [selectedRubro, setSelectedRubro] = useState('');
  const [selectedSubrubro, setSelectedSubrubro] = useState('');
  const [newItem, setNewItem] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);
  const [opacity, setOpacity] = useState(0.5);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isUsed, setIsUsed] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width:600px)');
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const fileInputRef = useRef(null);

  const handleMouseLeave = () => {
    setOpacity(0.5);
  };
  const handleMouseEnter = () => {
    setOpacity(1);
  };

  useEffect(() => {
    const debounceSave = setTimeout(() => {
      const savedData = {
        updatedRubros,
        monthlyTotals,
        rubrosTotals,
        inputs: inputValues,
      };
      localStorage.setItem('rubrosData', JSON.stringify(savedData));
    }, 500);

    return () => clearTimeout(debounceSave);
  }, [updatedRubros, monthlyTotals, rubrosTotals, inputValues]);

  const handleInputChange = (value, monthIndex, rubroName, inputId) => {
    const numericValue = parseFloat(value) || 0;
    const previousValue = inputValues[inputId]?.value || 0;
    const difference = numericValue - previousValue;
    localStorage.removeItem('selectedPresupuesto');
    setInputValues((prevInputValues) => ({
      ...prevInputValues,
      [inputId]: {
        value: numericValue,
        centroCostoid: CentroCostoid || localStorage.getItem('CentroCostoid'),
        id: prevInputValues[inputId]?.id || parseInt(inputId.split('-')[3]),
      },
    }));
    console.log(inputValues)
    // Update monthly and rubro totals
    setMonthlyTotals((prevTotals) => {
      const newTotals = [...prevTotals];
      newTotals[monthIndex] = (newTotals[monthIndex] || 0) + difference;
      return newTotals;
    });

    setRubrosTotals((prevRubrosTotals) => {
      const updatedTotals = { ...prevRubrosTotals };
      if (!updatedTotals[rubroName]) {
        updatedTotals[rubroName] = Array(12).fill(0);
      }
      updatedTotals[rubroName][monthIndex] = (updatedTotals[rubroName][monthIndex] || 0) + difference;
      return updatedTotals;
    });
  };

  const handleAddItem = () => {
    const rubroIndex = updatedRubros.findIndex((r) => r.nombre === selectedRubro);
    if (rubroIndex !== -1) {
      if (!Array.isArray(updatedRubros[rubroIndex].subrubros)) {
        updatedRubros[rubroIndex].subrubros = [];
      }
      const subrubroIndex = updatedRubros[rubroIndex].subrubros.findIndex(
        (s) => s.nombre === selectedSubrubro
      );

      if (subrubroIndex !== -1 && newItem.trim() !== '') {
        const updatedSubrubros = [...updatedRubros];
        if (!Array.isArray(updatedSubrubros[rubroIndex].subrubros[subrubroIndex].items)) {
          updatedSubrubros[rubroIndex].subrubros[subrubroIndex].items = [];
        }
        updatedSubrubros[rubroIndex].subrubros[subrubroIndex].items.push({ nombre: newItem, centroCostoid: CentroCostoid });
        setUpdatedRubros(updatedSubrubros);
        setNewItem('');
      }
    }

    setIsAccepted(true);
    setOpen(false);
  };

  const handleRemoveItem = (rubroIndex, subrubroIndex, itemIndex) => {
    const updatedRubrosCopy = [...updatedRubros];

    const itemToRemove = updatedRubrosCopy[rubroIndex].subrubros[subrubroIndex].items[itemIndex];
    updatedRubrosCopy[rubroIndex].subrubros[subrubroIndex].items.splice(itemIndex, 1);

    const updatedInputValues = { ...inputValues };
    Object.keys(updatedInputValues).forEach((key) => {
      const [prefix, basic, rIndex, sIndex, iIndex] = key.split('-');
      if (
        parseInt(rIndex) === rubroIndex &&
        parseInt(sIndex) === subrubroIndex &&
        parseInt(iIndex) === itemIndex
      ) {
        delete updatedInputValues[key];
      }
    });

    const newMonthlyTotals = [...monthlyTotals];
    const newRubrosTotals = { ...rubrosTotals };

    MONTHS.forEach((_, monthIndex) => {
      const inputId = `outlined-basic-${rubroIndex}-${subrubroIndex}-${itemIndex}-${monthIndex}`;
      const value = parseFloat(inputValues[inputId]?.value) || 0;
      newMonthlyTotals[monthIndex] -= value;

      if (newRubrosTotals[updatedRubrosCopy[rubroIndex].nombre]) {
        newRubrosTotals[updatedRubrosCopy[rubroIndex].nombre][monthIndex] -= value;
      }
    });

    if (newRubrosTotals[updatedRubrosCopy[rubroIndex].nombre] &&
      newRubrosTotals[updatedRubrosCopy[rubroIndex].nombre].every(val => val === 0)) {
      delete newRubrosTotals[updatedRubrosCopy[rubroIndex].nombre];
    }

    setUpdatedRubros(updatedRubrosCopy);
    setInputValues(updatedInputValues);
    setMonthlyTotals(newMonthlyTotals);
    setRubrosTotals(newRubrosTotals);
  };

  const calculateAnnualTotal = (totals) => {
    return totals.reduce((acc, curr) => acc + curr, 0);
  };

  // const handleSave = async () => {
  //   const data = Object.keys(inputValues).map(inputId => {
  //     const [_, basic, rubroIndex, subrubroIndex, itemIndex, colIndex] = inputId.split('-');
  //     const inputValue = inputValues[inputId];
  //     const presupuestomes = parseFloat(inputValue?.value || 0);

  //     return {
  //       usuario: userId,
  //       uen: parseInt(uenId),
  //       cuenta: parseInt(inputValue.centroCostoid),
  //       rubro: parseInt(rubroIndex),
  //       subrubro: parseInt(subrubroIndex),
  //       item: parseInt(itemIndex),
  //       meses: parseInt(colIndex),
  //       presupuestomes: isNaN(presupuestomes) ? 0 : presupuestomes,
  //       updatedRubros: updatedRubros,
  //       rubrosTotals: rubrosTotals,
  //       monthlyTotals: monthlyTotals,
  //     };
  //   });

  //   try {
  //     const csrftoken = getCookie('csrftoken');
  //     const token = localStorage.getItem('token');
  //     const response = await fetch('http://localhost:8000/presupuestos/', {
  //       method: 'POST',
  //       headers: {
  //         'X-CSRFToken': csrftoken,
  //         'Authorization': `Token ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       credentials: 'include',
  //       body: JSON.stringify(data)
  //     });

  //     if (!response.ok) {
  //       throw new Error('Network response was not ok: ${response.statusText}');
  //     }

  //     localStorage.removeItem('rubrosData');
  //     localStorage.removeItem('selectedPresupuesto');
  //     localStorage.removeItem('CentroCostoid');

  //     setSnackbarMessage('Datos guardados exitosamente');
  //     setSnackbarSeverity('success');
  //   } catch (error) {
  //     setSnackbarMessage('Error saving data');
  //     setSnackbarSeverity('error');
  //   } finally {
  //     setIsUsed(true);
  //     setSnackbarOpen(true);
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 2000);
  //   }
  // };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const exportRubrosToExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [];

    // Agregar encabezados
    data.push(['Rubro', 'Subrubro', 'Cuenta', 'CentroCostoid', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']);

    // Recorrer los rubros y subrubros
    updatedRubros.forEach((rubro) => {
      if (Array.isArray(rubro.subrubros)) {
        rubro.subrubros.forEach((subrubro) => {
          if (Array.isArray(subrubro.items)) {
            subrubro.items.forEach((item, itemIndex) => {
              const row = [rubro.nombre, subrubro.nombre, item.nombre];

              const centroCostoid = item.centroCostoid;
              row.push(centroCostoid);

              // Agregar valores mensuales
              MONTHS.forEach((_, monthIndex) => {
                const inputId = `outlined-basic-${updatedRubros.indexOf(rubro)}-${rubro.subrubros.indexOf(subrubro)}-${itemIndex}-${monthIndex}`;
                row.push(inputValues[inputId]?.value || 0);
              });

              data.push(row);
            });
          }
        });
      }
    });

    // Convertir a hoja de Excel
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Rubros');
    XLSX.writeFile(wb, 'Presupuestos.xlsx');
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      processImportedData(jsonData);
    }
  };

  const handleSpeedDialClick = () => {
    fileInputRef.current.click();
  };

  const processImportedData = (data) => {
    const rubros = [];
    const newInputValues = { ...inputValues };
    const newMonthlyTotals = Array(12).fill(0);
    const newRubrosTotals = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rubroName = row[0];
      const subrubroName = row[1];
      const itemName = row[2];
      const centroCostoid = row[3];
      const monthlyValues = row.slice(4, 16);

      let rubro = rubros.find(r => r.nombre === rubroName);
      if (!rubro) {
        rubro = { nombre: rubroName, subrubros: [] };
        rubros.push(rubro);
      }

      let subrubro = rubro.subrubros.find(s => s.nombre === subrubroName);
      if (!subrubro) {
        subrubro = { nombre: subrubroName, items: [] };
        rubro.subrubros.push(subrubro);
      }

      const item = { nombre: itemName };

      monthlyValues.forEach((monthValue, monthIndex) => {
        const numericValue = monthValue || 0;
        const inputId = `outlined-basic-${rubros.indexOf(rubro)}-${rubro.subrubros.indexOf(subrubro)}-${subrubro.items.length}-${monthIndex}`;

        // Organizar los valores y el id a la que pertenece
        newInputValues[inputId] = {
          value: numericValue,
          centroCostoid: centroCostoid,
        };

        // Actualizar los totales rubros generales
        if (!newRubrosTotals[rubroName]) {
          newRubrosTotals[rubroName] = Array(12).fill(0);
        }
        newRubrosTotals[rubroName][monthIndex] += numericValue;

        // Actualizar los totales mensuales generales
        newMonthlyTotals[monthIndex] += numericValue;

        // Obtener los nombres del centro de costo
        item[inputId] = numericValue;
      });

      subrubro.items.push(item);
    }

    setUpdatedRubros(rubros);
    setInputValues(newInputValues);
    setRubrosTotals(newRubrosTotals);
    setMonthlyTotals(newMonthlyTotals);

    return rubros;
  };

  const handleUpdatePresupuesto = async () => {
    const csrftoken = getCookie('csrftoken');
    const token = localStorage.getItem('token');

    const data = Object.keys(inputValues).map(inputId => {
      const [_, basic, rubroIndex, subrubroIndex, itemIndex, colIndex] = inputId.split('-');
      const inputValue = inputValues[inputId];
      const presupuestomes = parseFloat(inputValue?.value || 0);

      return {
        id: parseInt(inputValue.id),
        usuario: userId,
        uen: parseInt(uenId),
        cuenta: parseInt(inputValue.centroCostoid),
        rubro: parseInt(rubroIndex),
        subrubro: parseInt(subrubroIndex),
        item: parseInt(itemIndex),
        meses: parseInt(colIndex),
        presupuestomes: isNaN(presupuestomes) ? 0 : presupuestomes,
        updatedRubros: updatedRubros,
        rubrosTotals: rubrosTotals,
        monthlyTotals: monthlyTotals,
      };
    });

    try {
      const response = await fetch(`http://localhost:8000/presupuestos/batch-update/`, {
        method: 'PATCH',
        headers: {
          'X-CSRFToken': csrftoken,
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      localStorage.removeItem('rubrosData');
      localStorage.removeItem('selectedPresupuesto');

      if (response.ok) {
        const result = await response.json();
        const { created, updated } = result;

        setSnackbarMessage(`Presupuesto actualizado exitosamente. ${updated} actualizados, ${created} creados.`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        throw new Error('Error in response');
      }
    } catch (error) {
      setSnackbarMessage('Error al actualizar el presupuesto.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }finally {
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <>
      <div style={{ marginLeft: 5 }}>
        <table style={styles.tableContainer}>
          <thead>
            <tr>
              <th style={styles.tableCell}><Typography>Rubro/Mes</Typography></th>
              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month, index) => (
                <th key={index} style={styles.tableCell}><Typography>{month}</Typography></th>
              ))}
              <th style={styles.tableCell}><Typography>Total Anual</Typography></th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(rubrosTotals).map(([rubroName, totals], index) => (
              <tr key={index}>
                <td style={styles.tableCell}><Typography>{rubroName}</Typography></td>
                {totals.map((total, monthIndex) => (
                  <td key={monthIndex} style={styles.totalCell(total)}>
                    <Typography>{Math.round(total)}</Typography>
                  </td>
                ))}
                <td style={styles.totalCell(calculateAnnualTotal(totals))}>
                  <Typography>{Math.round(calculateAnnualTotal(totals))}</Typography>
                </td>
              </tr>
            ))}
            <tr>
              <td style={styles.tableCell}><Typography>Total General</Typography></td>
              {monthlyTotals.map((total, index) => (
                <td key={index} style={styles.totalCell(total)}>
                  <Typography>{Math.round(total)}</Typography>
                </td>
              ))}
              <td style={styles.totalCell(calculateAnnualTotal(monthlyTotals))}>
                <Typography>{Math.round(calculateAnnualTotal(monthlyTotals))}</Typography>
              </td>
            </tr>
          </tbody>
        </table>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>
                <Typography>Rubro</Typography>
              </th>
              {MONTHS.map((month, index) => (
                <th style={styles.monthHeader} key={index}>
                  <Typography>{month} 24</Typography>
                </th>
              ))}
            </tr>
          </thead>
        </table>
        {updatedRubros.map((rubro, rubroIndex) => (
          <Accordion key={rubroIndex}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${rubroIndex}-content`}
              id={`panel${rubroIndex}-header`}
              sx={styles.accordionSummary}>
              <Typography>{rubro.nombre}</Typography>
            </AccordionSummary>
            {rubro.subrubros.map((subrubro, subrubroIndex) => (
              <Accordion key={subrubroIndex}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${rubroIndex}-${subrubroIndex}-content`}
                  id={`panel${rubroIndex}-${subrubroIndex}-header`}
                  sx={styles.subAccordionSummary}>
                  <Typography>{subrubro.nombre}</Typography>
                </AccordionSummary>
                {updatedRubros[rubroIndex] && updatedRubros[rubroIndex].subrubros && updatedRubros[rubroIndex].subrubros[subrubroIndex] && updatedRubros[rubroIndex].subrubros[subrubroIndex].items && updatedRubros[rubroIndex].subrubros[subrubroIndex].items.length > 0 ? (
                  <table style={{ width: "500px" }}>
                    <tbody>
                      {updatedRubros[rubroIndex].subrubros[subrubroIndex].items.map((item, itemIndex) => (
                        <tr key={itemIndex}>
                          <td style={styles.itemCell}>
                            <Typography>{item.nombre}</Typography>
                            <HoverButton onRemove={() => handleRemoveItem(rubroIndex, subrubroIndex, itemIndex)} />
                          </td>
                          {MONTHS.map((_, colIndex) => {
                            const inputId = `outlined-basic-${rubroIndex}-${subrubroIndex}-${itemIndex}-${colIndex}`;
                            return (
                              <td key={colIndex}>
                                <input
                                  type="number"
                                  id={inputId}
                                  style={styles.input}
                                  value={inputValues[inputId]?.value || ''}
                                  onChange={(e) => handleInputChange(e.target.value, colIndex, rubro.nombre, inputId)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', height: 40 }}>
                    <Typography sx={{ color: '#ABABAB' }}>No hay centro de costo creado</Typography>
                  </div>
                )}
                <button style={styles.dialogButton} onClick={handleOpen}>
                  <AddCircleOutlineIcon />
                </button>
              </Accordion>
            ))}
          </Accordion>
        ))}
      </div>
      <input
        type="file"
        accept=".xlsx, .xls"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={styles.speedDial(isSmallScreen, opacity)}
        icon={< AddIcon />}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <SpeedDialAction
          key={'Download'}
          icon={<CloudDownloadIcon />}
          tooltipTitle={'Descargar archivo'}
          onClick={exportRubrosToExcel}
        />
        <SpeedDialAction
          key={'Upload'}
          icon={<CloudUploadIcon />}
          tooltipTitle={'Subir archivo'}
          onClick={handleSpeedDialClick}
        />
        {/* <SpeedDialAction
          key={'update'}
          icon={<AutorenewIcon />}
          tooltipTitle={'Actualizar'}
          onClick={handleUpdatePresupuesto}
          disabled={isUsed}
        /> */}
        <SpeedDialAction
          key={'Save'}
          icon={<SaveIcon />}
          tooltipTitle={'Guardar'}
          onClick={handleUpdatePresupuesto}
          disabled={isUsed}
        />

      </SpeedDial>
      <Dialog open={open} onClose={handleClose} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Crear centro de costos</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={updatedRubros.map((rubro) => rubro.nombre)}
            sx={{ width: 300, marginTop: 5 }}
            renderInput={(params) => <TextField {...params} label="Rubro" />}
            onChange={(event, newValue) => setSelectedRubro(newValue)} />
          {selectedRubro && (
             <Autocomplete
             key={Math.random()}
             options={updatedRubros.find((r) => r.nombre === selectedRubro)?.subrubros.map((subrubro) => ({ label: subrubro.nombre, id: Math.random() })) || []}
             getOptionLabel={(option) => option.label}
             sx={{ width: 300, marginTop: 5 }}
             renderInput={(params) => <TextField {...params} label="Subrubro" />}
             onChange={(event, newValue) => setSelectedSubrubro(newValue?.label || '')}
         />
          )}
          {selectedSubrubro && (
            Array.isArray(updatedcentroCostos) && updatedcentroCostos.length > 0 ? (
              <Autocomplete
                options={updatedcentroCostos.map((centroCostos) => centroCostos.nombre)}
                sx={{ width: 300, marginTop: 5 }}
                renderInput={(params) => <TextField {...params} label="Centro Costos" />}
                onChange={(event, newValue) => {
                  const selectedCentroCosto = updatedcentroCostos.find(c => c.nombre === newValue);
                  if (selectedCentroCosto) {
                    const centroCostoId = selectedCentroCosto.id;
                    setCentroCostoid(centroCostoId);
                  } else {
                    console.error("CentroCostos no encontrado o no válido");
                  }
                  setNewItem(newValue);
                }}
              />
            ) : (
              <Typography>No Hay Centro De Costos habilitados</Typography>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleAddItem} aria-hidden={false} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default CustomTable;