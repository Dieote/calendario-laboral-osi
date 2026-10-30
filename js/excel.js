const input = document.getElementById('excelInput');

let trabajadorActual = null;
let worksheetGlobal = null;
let trabajadores = [];
let añoExcel = null;
let solicitudCarga = 0;

let mapaEstados = {};

function fechaKey(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

input.addEventListener('change', manejarArchivo);

function mostrarEstadoCarga(mensaje, esError = false) {
  const estado = document.getElementById('excelStatus');
  if (!estado) return;

  estado.textContent = mensaje;
  estado.classList.toggle('error', esError);
}

async function manejarArchivo(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    await leerExcel(file);
    mostrarEstadoCarga(`Calendario ${añoExcel} cargado correctamente.`);
  } catch (error) {
    console.error('No se pudo cargar el archivo Excel:', error);
    mostrarEstadoCarga(`No se pudo cargar el calendario: ${error.message}`, true);
  }
}

async function leerExcel(file, añoEsperado, nombreTrabajador = trabajadorActual, solicitudActual) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  if (solicitudActual && solicitudActual !== solicitudCarga) return;
  procesarWorkbook(workbook, añoEsperado, nombreTrabajador);
}

function procesarWorkbook(workbook, añoEsperado, nombreTrabajador) {
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('El archivo no contiene ninguna hoja de cálculo.');
  }

  const añoDetectado = detectarAñoExcel(worksheet);
  if (!añoDetectado) {
    throw new Error('La celda A1 debe contener el año del calendario.');
  }
  if (añoEsperado && añoDetectado !== añoEsperado) {
    throw new Error(`El archivo contiene el año ${añoDetectado}, pero se esperaba ${añoEsperado}.`);
  }

  worksheetGlobal = worksheet;
  añoExcel = añoDetectado;
  calendar.currentYear = añoDetectado;
  cargarSelectTrabajadores(worksheet, nombreTrabajador);
}

function detectarAñoExcel(worksheet) {
  const valor = worksheet.getCell('A1').value;
  const año = typeof valor === 'number'
    ? valor
    : typeof valor === 'string' && /^\d{4}$/.test(valor.trim())
      ? Number(valor.trim())
      : null;

  return Number.isInteger(año) && año >= 1900 && año <= 9999 ? año : null;
}

function detectarTrabajadores(worksheet) {
  const FILA_NOMBRES = 1;
  const COLUMNA_INICIO = 3;   // C
  const COLUMNA_FIN = 61;  // BI

  const detectados = [];

  for (let col = COLUMNA_INICIO; col <= COLUMNA_FIN; col++) {
    const valor = worksheet.getRow(FILA_NOMBRES).getCell(col).value;
    if (typeof valor === 'string' && valor.trim() !== '') {
      detectados.push({ nombre: valor.trim(), columna: col });
    }
  }

  console.log('Trabajadores detectados:', detectados.length);
  return detectados;
}

function detectarDias(worksheet) {
  const COLUMNA_DIA = 2;  // B
  const FILA_INICIO = 9;
  const diasValidos = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const diasPorFila = {};

  for (let row = FILA_INICIO; row <= worksheet.rowCount; row++) {
    const valor = worksheet.getRow(row).getCell(COLUMNA_DIA).value;
    if (typeof valor === 'string') {
      const dia = valor.trim().toUpperCase();
      if (diasValidos.includes(dia)) diasPorFila[row] = dia;
    }
  }
  return diasPorFila;
}

function leerCelda(worksheet, fila, col) {
  const cell = worksheet.getRow(fila).getCell(col);
  const valor = cell.value;

  let colorInfo = null;
  if (cell.fill && cell.fill.fgColor) {
    const fg = cell.fill.fgColor;
    colorInfo = {
      argb: fg.argb || null,
      theme: fg.theme ?? null,
      tint: fg.tint ?? null,
      indexed: fg.indexed ?? null
    };
  }
  return { valor, colorInfo };
}

function hexCambiaRgb(argb) {
  if (!argb) return null;
  const hex = argb.substring(2);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function clasificarEstado(valor, colorInfo) {
  if (valor === 1 || valor === '1') return 'TRABAJADO';
  if (valor === 0 || valor === '0') return 'VACACIONES';

  if (colorInfo) {
    const { argb, theme, tint } = colorInfo;

    if (theme === 5 && tint !== null && tint > 0) return 'FESTIVO';
    if (theme === 0 && tint !== null && tint < 0) return 'PUENTE';

    if (argb) {
      const rgb = hexCambiaRgb(argb);
      const margen = 20;

      const colores = {
        amarillo: { r: 255, g: 255, b: 153 },
        rojoFuerte: { r: 255, g: 0, b: 0 },
        celeste: { r: 102, g: 255, b: 204 },
        verdeFuerte: { r: 0, g: 176, b: 80 },
        naranja: { r: 255, g: 192, b: 0 },
        rosado: { r: 244, g: 176, b: 132 }
      };

      const match = (c1, c2) =>
        Math.abs(c1.r - c2.r) <= margen &&
        Math.abs(c1.g - c2.g) <= margen &&
        Math.abs(c1.b - c2.b) <= margen;

      if (match(rgb, colores.rosado)) return 'FESTIVO';
      if (match(rgb, colores.amarillo)) return 'TRABAJADO';
      if (match(rgb, colores.celeste)) return 'LIBRE';
      if (match(rgb, colores.rojoFuerte)) return 'VACACIONES';
      if (match(rgb, colores.verdeFuerte)) return 'VACACIONES';
      if (match(rgb, colores.naranja)) return 'VACACIONES';
    }
  }

  return 'DESCONOCIDO';
}

function construirMapaEstados(worksheet, trabajador) {
  const diasPorFila = detectarDias(worksheet);
  const col = trabajador.columna;
  const FILA_INICIO = 9;
  const FILA_FIN = worksheet.rowCount;

  const filasDias = Object.keys(diasPorFila).map(Number).sort((a, b) => a - b);
  const primeraFilaDia = filasDias[0];
  let filaSemana1 = null;

  for (let row = FILA_INICIO; row <= FILA_FIN; row++) {
    const valor = worksheet.getRow(row).getCell(1).value;
    if (typeof valor === 'string' && /semana\s*1\b/i.test(valor)) {
      filaSemana1 = row;
      break;
    }
  }

  if (!primeraFilaDia || !filaSemana1 || diasPorFila[filaSemana1] !== 'L') {
    throw new Error('No se encontró la primera fila de la semana 1 en el calendario.');
  }

  // La semana 1 contiene el 1 de enero; las filas previas son semanas de contexto.
  const diasAntesSemana1 = filasDias.filter(row => row < filaSemana1).length;
  const mapa = {};
  const fechaSemana1 = lunesDeSemana(añoExcel, 1);
  let fechaActual = new Date(fechaSemana1);
  fechaActual.setDate(fechaSemana1.getDate() - diasAntesSemana1);

  for (const row of filasDias) {
    const letraDia = diasPorFila[row];

    const diaSemanaJS = fechaActual.getDay();
    const letrasJS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const letraEsperada = letrasJS[diaSemanaJS];

    if (letraDia !== letraEsperada) {
      let intentos = 0;
      while (intentos < 7) {
        fechaActual.setDate(fechaActual.getDate() + 1);
        intentos++;
        const nuevodia = letrasJS[fechaActual.getDay()];
        if (nuevodia === letraDia) break;
      }
    }

    const { valor, colorInfo } = leerCelda(worksheet, row, col);
    const estado = clasificarEstado(valor, colorInfo);
    // Se conservan las semanas vecinas para completar el calendario en sus límites.
    mapa[fechaKey(fechaActual)] = estado;

    fechaActual = new Date(fechaActual);
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return mapa;
}

function lunesDeSemana(año, semana) {
  const primerDia = new Date(año, 0, 1);
  const lunesSemana1 = new Date(primerDia);
  lunesSemana1.setDate(primerDia.getDate() - ((primerDia.getDay() + 6) % 7));

  const resultado = new Date(lunesSemana1);
  resultado.setDate(lunesSemana1.getDate() + (semana - 1) * 7);
  return resultado;
}

function cargarSelectTrabajadores(worksheet, nombreSeleccionado = null) {
  trabajadores = detectarTrabajadores(worksheet);
  trabajadores.sort((a, b) => a.nombre > b.nombre ? 1 : -1);

  const select = document.getElementById('trabajadorSelect');
  select.innerHTML = '<option value="">Seleccionar trabajador</option>';

  trabajadores.forEach(t => {
    const option = document.createElement('option');
    option.value = t.nombre;
    option.textContent = t.nombre;
    select.appendChild(option);
  });

  const trabajador = trabajadores.find(
    t => t.nombre.toLowerCase() === (nombreSeleccionado || '').toLowerCase()
  );
  select.value = trabajador ? trabajador.nombre : '';
  actualizarTrabajador(select.value);
}

document.getElementById('trabajadorSelect')
  .addEventListener('change', e => {
    actualizarTrabajador(e.target.value);
  });

function actualizarTrabajador(nombre) {
  trabajadorActual = nombre || null;

  if (!nombre) {
    mapaEstados = {};
    calendar.generateCalendar();
    if (typeof estadisticas !== 'undefined') estadisticas.limpiar();
    return;
  }

  const trabajador = trabajadores.find(
    t => t.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (!trabajador || !worksheetGlobal) return;

  try {
    mapaEstados = construirMapaEstados(worksheetGlobal, trabajador);
    calendar.generateCalendar();

    if (typeof estadisticas !== 'undefined') {
      estadisticas.actualizar(nombre);
    }
  } catch (error) {
    console.error('No se pudo construir el calendario:', error);
    mostrarEstadoCarga(`No se pudo mostrar el calendario: ${error.message}`, true);
  }
}

function obtenerMapaActual() {
  return mapaEstados;
}

function obtenerAñoExcel() {
  return añoExcel;
}

function obtenerEstadoDia(fecha) {
  if (!trabajadorActual) return null;

  const key = fechaKey(fecha);
  const estado = mapaEstados[key];

  return estado || null;
}

async function cargarCalendarioAño(año) {
  const solicitudActual = ++solicitudCarga;
  const nombreArchivo = `calendario${año}.xlsx`;
  const trabajadorAnterior = trabajadorActual;

  worksheetGlobal = null;
  añoExcel = null;
  trabajadorActual = null;
  mapaEstados = {};
  calendar.generateCalendar();
  if (typeof estadisticas !== 'undefined') estadisticas.limpiar();
  document.getElementById('trabajadorSelect').innerHTML =
    '<option value="">Seleccionar trabajador</option>';

  try {
    mostrarEstadoCarga(`Cargando calendario ${año}...`);
    const response = await fetch(`assets/${nombreArchivo}`);
    if (solicitudActual !== solicitudCarga) return;
    if (!response.ok) {
      throw new Error(`No se pudo acceder a ${nombreArchivo} (HTTP ${response.status}).`);
    }

    const blob = await response.blob();
    const file = new File([blob], nombreArchivo, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    await leerExcel(file, año, trabajadorAnterior, solicitudActual);
    if (solicitudActual !== solicitudCarga) return;
    if (trabajadorAnterior && !trabajadorActual) {
      mostrarEstadoCarga(`Calendario ${añoExcel} cargado. Selecciona un trabajador.`);
      return;
    }
    mostrarEstadoCarga(`Calendario ${añoExcel} cargado correctamente.`);
  } catch (error) {
    if (solicitudActual !== solicitudCarga) return;
    console.error('No se pudo cargar el calendario automáticamente:', error);
    mostrarEstadoCarga(`No se pudo cargar el calendario: ${error.message}`, true);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  calendar.onYearChange = cargarCalendarioAño;
  cargarCalendarioAño(calendar.currentYear);
});