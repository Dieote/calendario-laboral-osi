const input = document.getElementById('excelInput');

let trabajadorActual = null;
let worksheetGlobal = null;
let trabajadores = []; // Variable global para trabajadores

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
    
    worksheetGlobal = worksheet; // Guardar worksheet globalmente
    
    const totalFilas = worksheet.rowCount;
    const totalColumnas = worksheet.columnCount;
    
    console.log(`Total de filas: ${totalFilas} Total de columnas: ${totalColumnas}`);
    cargarSelectTrabajadores(worksheet);
}

function detectarTrabajadores(worksheet) {
  const FILA_NOMBRES = 1;
  const COLUMNA_INICIO = 3;   // C
  const COLUMNA_FIN = 61;     // BI

  const trabajadoresDetectados = [];

  for (let col = COLUMNA_INICIO; col <= COLUMNA_FIN; col++) {
    const cell = worksheet.getRow(FILA_NOMBRES).getCell(col);
    const valor = cell.value;

    if (typeof valor === 'string' && valor.trim() !== '') {
      trabajadoresDetectados.push({
        nombre: valor.trim(),
        columna: col
      });
    }
  }

  console.log('Trabajadores detectados:', trabajadoresDetectados);
  return trabajadoresDetectados;
}

function detectarSemanas(worksheet, diasPorFila) {
  const COLUMNA_SEMANA = 1; // A
  const FILA_INICIO = 9;
  
  const semanas = [];

  let ultimaSemanaDetectada = null; //con esto evitamos que se repitan las semanas

  for (let row = FILA_INICIO; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getRow(row).getCell(COLUMNA_SEMANA);
    const valor = cell.value;

    if (typeof valor === 'string' && valor.toLowerCase().includes('semana')) {
      let numero = parseInt(valor.replace(/\D/g, ''), 10); // remover todo menos dígitos

      // CORRECCIÓN: Convertir semana 53 a semana 1
      if (numero === 53) {
        numero = 1;
      }

      if(numero === ultimaSemanaDetectada) continue; //con esto evitamos que se repitan las semanas

      let filaLunes = null;
      for (let r = row; r <= worksheet.rowCount; r++) {
          if (diasPorFila[r] === 'L') {
            filaLunes = r;
            break;
          }
        }
        
      if (!filaLunes) continue;

      semanas.push({
        semana: numero,
        filaInicio: filaLunes,
        filaFin: filaLunes + 6 
      });

      ultimaSemanaDetectada = numero; //con esto evitamos que se repitan las semanas
    }
  }
  return semanas;
}

function detectarDias(worksheet) {
  const COLUMNA_DIA = 2; // B
  const FILA_INICIO = 9;

  const diasPorFila = {};

  for (let row = FILA_INICIO; row <= worksheet.rowCount; row++) {
    const cell = worksheet.getRow(row).getCell(COLUMNA_DIA);
    const valor = cell.value;

    if (typeof valor === 'string' && valor.trim() !== '') {
      diasPorFila[row] = valor.trim().toUpperCase();
    }
  }

  return diasPorFila;
}

//Logica colores + valores

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
    const hex = argb.substring(2); // Extraer el canal
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
}

function clasificarEstado(valor, colorInfo) {

  if (valor === 1 || valor === "1") return "TRABAJADO";
  if (valor === 0 || valor === "0") return "VACACIONES";

  // Si no hay valor, analizamos color
  if (!colorInfo) return "DESCONOCIDO";

  const { argb, theme, tint } = colorInfo;
  
  //colores
  if (theme === 0 && tint !== null && tint < 0) {
    return "PUENTE"; // gris
  }

   if (theme === 5 && tint !== null && tint > 0) {
    return "FESTIVO"; // rojo claro - rosado
  }

  if (argb) {
    const rgb = hexCambiaRgb(argb);

    const margenColor = 20; // Margen para comparar colores
    const colores = {
      amarillo: { r: 255, g: 255, b: 153 },
      //rosado: { r: 248, g: 203, b: 173 },
      //rojoClaro: { r: 244, g: 176, b: 132 },
      rojoFuerte: { r: 255, g: 0, b: 0 },
      celeste: { r: 102, g: 255, b: 204 },
      //gris: { r: 191, g: 191, b: 191 },
      verdeFuerte: { r: 0, g: 176, b: 80 },
      naranja: { r: 255, g: 192, b: 0 }
    }; 
    
    function colorMatch(c1, c2) {
      return Math.abs(c1.r - c2.r) <= margenColor &&
            Math.abs(c1.g - c2.g) <= margenColor &&
            Math.abs(c1.b - c2.b) <= margenColor;
    }
    
      if (colorMatch(rgb, colores.amarillo)) return "TRABAJADO";
      //if (colorMatch(colorInfo, colores.rosado)) return "FESTIVO";
      //if (colorMatch(colorInfo, colores.rojoClaro)) return "FESTIVO";
      if (colorMatch(rgb, colores.celeste)) return "LIBRE";
      //if (colorMatch(colorInfo, colores.gris)) return "PUENTE";
      if (colorMatch(rgb, colores.rojoFuerte)) return "VACACIONES";
      if (colorMatch(rgb, colores.verdeFuerte)) return "VACACIONES";
      if (colorMatch(rgb, colores.naranja)) return "VACACIONES";
      return "DESCONOCIDO";
    }    
    return "DESCONOCIDO";
}

function obtenerEstadoCelda(worksheet, fila, col) {
    const { valor, colorInfo } = leerCelda(worksheet, fila, col);
    const estado =  clasificarEstado(valor, colorInfo);  
    return estado;
}

function obtenerRangoTrabajador(worksheet, trabajador, filaInicio, filaFin, diasPorFila) {
  const resultados = [];
  const col = trabajador.columna;

  for (let fila = filaInicio; fila <= filaFin; fila++) {
    const dia = diasPorFila[fila];
    if (!dia) continue;

    const estado = obtenerEstadoCelda(worksheet, fila, col);

    resultados.push({ fila, col, dia, estado });
  }

  return resultados;
}

function procesarTrabajador(worksheet, nombreBuscado) {
  const trabajadoresTemp = detectarTrabajadores(worksheet);
  const dias = detectarDias(worksheet);
  const semanas = detectarSemanas(worksheet, dias);

  const trabajador = trabajadoresTemp.find(t =>
    t.nombre.toLowerCase() === nombreBuscado.toLowerCase()
  );

  if (!trabajador) {
    console.warn('No se encontró el trabajador:', nombreBuscado);
    return null;
  }

  const calendario = [];

  for (const semana of semanas) {
    const rango = obtenerRangoTrabajador(
      worksheet,
      trabajador,
      semana.filaInicio,
      semana.filaFin,
      dias
    );

    calendario.push({
      semana: semana.semana,
      rango
    });
  }

  console.log(`Calendario ${trabajador.nombre}:`, calendario);
  return calendario;
}

/*Manejo de eventos*/

document.getElementById('trabajadorSelect')
  .addEventListener('change', e => {
    const nombre = e.target.value;
    if (!nombre) {
      trabajadorActual = null;
      calendar.generateCalendar();
      return;
    }

    trabajadorActual = nombre;

    const trabajador = trabajadores.find(
      t => t.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (!trabajador) return;
    
    // Regenerar calendario con datos del trabajador
    calendar.generateCalendar();
  });

function cargarSelectTrabajadores(worksheet) {
  trabajadores = detectarTrabajadores(worksheet);
  const select = document.getElementById('trabajadorSelect');
  // Limpiar opciones existentes
  select.innerHTML = '<option value="">Seleccionar trabajador</option>';

  trabajadores.forEach(trabajador => {
    const option = document.createElement('option');
    option.value = trabajador.nombre;
    option.textContent = trabajador.nombre;
    select.appendChild(option);
  });
}

// Función auxiliar para obtener el estado de un día específico
function obtenerEstadoDia(fecha) {
  if (!trabajadorActual || !worksheetGlobal) return null;

  const calendarioTrabajador = procesarTrabajador(worksheetGlobal, trabajadorActual);
  if (!calendarioTrabajador) return null;

  // Obtener número de semana de la fecha
  const numSemana = calendar.getSemanaNumero(fecha);
  
  // Buscar la semana en el calendario
  const semanaData = calendarioTrabajador.find(s => s.semana === numSemana);
  if (!semanaData) return null;

  // Obtener día de la semana (0=Domingo, 1=Lunes, etc.)
  const diaSemana = fecha.getDay();
  const diasMap = { 0: 'D', 1: 'L', 2: 'M', 3: 'X', 4: 'J', 5: 'V', 6: 'S' };
  const letraDia = diasMap[diaSemana];

  // Buscar el día en el rango
  const diaData = semanaData.rango.find(d => d.dia === letraDia);
  
  return diaData ? diaData.estado : null;
}
// Cargar Excel auto
// máticamente
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('assets/calendario2026.xlsx');
    const blob = await response.blob();
    const file = new File([blob], 'calendario2026.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    await leerExcel(file);
  } catch (error) {
    console.log('Carga manual del Excel');
  }
});