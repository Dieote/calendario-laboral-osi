const input = document.getElementById('excelInput');

let trabajadorActual = null;
let worksheetGlobal = null;
let trabajadores = [];
let añoExcel = null;

let mapaEstados = {};

function fechaKey(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

input.addEventListener('change', manejarArchivo);

async function manejarArchivo(event) {
  const file = event.target.files[0];
  if (!file) return;
  console.log('Archivo cargado:', file.name);
  await leerExcel(file);
}

async function leerExcel(file) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  console.log('Workbook cargado correctamente');
  procesarWorkbook(workbook);
}

function procesarWorkbook(workbook) {
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    console.warn('No se encontró ninguna hoja en el archivo Excel.');
    return;
  }
  console.log('Procesando hoja:', worksheet.name);

  worksheetGlobal = worksheet;
  añoExcel = detectarAñoExcel(worksheet);
  console.log('Año del calendario:', añoExcel);

  cargarSelectTrabajadores(worksheet);
}

function detectarAñoExcel(worksheet) {
  const añoActual = new Date().getFullYear();
  console.log('Año de referencia:', añoActual);
  return añoActual;
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
  const diasPorFila = {};

  for (let row = FILA_INICIO; row <= worksheet.rowCount; row++) {
    const valor = worksheet.getRow(row).getCell(COLUMNA_DIA).value;
    if (typeof valor === 'string' && valor.trim() !== '') {
      diasPorFila[row] = valor.trim().toUpperCase();
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

  let filaAncla = null;
  for (let row = FILA_INICIO; row <= FILA_FIN; row++) {
    if (diasPorFila[row] === 'L') {
      filaAncla = row;
      break;
    }
  }

  if (filaAncla === null) {
    console.warn('No se encontró fila ancla (primer lunes).');
    return {};
  }

  let numeroSemanaAncla = null;
  for (let row = filaAncla; row >= FILA_INICIO; row--) {
    const valor = worksheet.getRow(row).getCell(1).value;
    if (typeof valor === 'string' && valor.toLowerCase().includes('semana')) {
      numeroSemanaAncla = parseInt(valor.replace(/\D/g, ''), 10);
      break;
    }
  }

  if (numeroSemanaAncla === null) {
    console.warn('No se encontró número de semana ancla.');
    return {};
  }

  const añoAncla = numeroSemanaAncla > 50 ? añoExcel - 1 : añoExcel;
  const fechaAncla = lunesDeSemanISO(añoAncla, numeroSemanaAncla);

  console.log(
    `Ancla: fila ${filaAncla} = Semana ${numeroSemanaAncla} → ${fechaKey(fechaAncla)}`
  );

  const mapa = {};
  let fechaActual = new Date(fechaAncla);
  const ordenDias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  for (let row = filaAncla; row <= FILA_FIN; row++) {
    const letraDia = diasPorFila[row];
    if (!letraDia) continue;

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
    mapa[fechaKey(fechaActual)] = estado;

    fechaActual = new Date(fechaActual);
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  console.log(`Mapa construido para ${trabajador.nombre}: ${Object.keys(mapa).length} días`);
  return mapa;
}

function lunesDeSemanISO(año, semana) {
  const cuatroEnero = new Date(año, 0, 4);
  const diaSemana = cuatroEnero.getDay() || 7; // 1=Lun…7=Dom
  const lunesSemana1 = new Date(cuatroEnero);
  lunesSemana1.setDate(cuatroEnero.getDate() - (diaSemana - 1));

  const resultado = new Date(lunesSemana1);
  resultado.setDate(lunesSemana1.getDate() + (semana - 1) * 7);
  return resultado;
}

function cargarSelectTrabajadores(worksheet) {
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
}

document.getElementById('trabajadorSelect')
  .addEventListener('change', e => {
    const nombre = e.target.value;

    if (!nombre) {
      trabajadorActual = null;
      mapaEstados = {};
      calendar.generateCalendar();
      if (typeof estadisticas !== 'undefined') {
        estadisticas.limpiar();
      }
      return;
    }

    trabajadorActual = nombre;

    const trabajador = trabajadores.find(
      t => t.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (!trabajador || !worksheetGlobal) return;
    mapaEstados = construirMapaEstados(worksheetGlobal, trabajador);
    calendar.generateCalendar();

    if (typeof estadisticas !== 'undefined') {
      estadisticas.actualizar(nombre);
    }
  });

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

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('assets/calendario2026.xlsx');
    const blob = await response.blob();
    const file = new File([blob], 'calendario2026.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    await leerExcel(file);
    console.log('✅ Excel cargado automáticamente');
  } catch (error) {
    console.log('⚠️ Carga manual del Excel necesaria:', error.message);
  }
});