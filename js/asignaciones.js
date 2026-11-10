const asignaciones = {
  claveStorage: 'calendarioLaboral.asignaciones.v1',
  opciones: [
    { valor: 'PEON_PRODUCCION', texto: 'Peón Producción' },
    { valor: 'CALIDAD_OFICIAL_1RA', texto: 'Calidad Oficial 1ra' },
    { valor: 'CALIDAD_OFICIAL_2DA', texto: 'Calidad Oficial 2da' },
    { valor: 'REELEVO', texto: 'Reelevo' },
    { valor: 'PALLETIZADO_OFICIAL_1RA', texto: 'Palletizado Oficial 1ra' },
    { valor: 'PALLETIZADO_OFICIAL_2DA', texto: 'Palletizado Oficial 2da' },
    { valor: 'ASISTENTE', texto: 'Asistente' },
    { valor: 'AUSENTE', texto: 'Ausente' }
  ],
  datos: null,

  cargar() {
    if (this.datos !== null) return this.datos;

    const guardado = localStorage.getItem(this.claveStorage);
    const datos = guardado ? JSON.parse(guardado) : {};
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
      throw new Error('Los datos de asignaciones guardados no tienen un formato válido.');
    }
    this.datos = datos;
    return datos;
  },

  obtener(nombreTrabajador, fecha) {
    const datos = this.cargar();
    const valor = datos[nombreTrabajador]?.[fecha];
    if (!valor) return 'PEON_PRODUCCION';
    if (!this.opciones.some(opcion => opcion.valor === valor)) {
      throw new Error('La asignación guardada no es válida.');
    }
    return valor;
  },

  guardar(nombreTrabajador, fecha, valor) {
    const datosActuales = this.cargar();
    const opcionValida = this.opciones.some(opcion => opcion.valor === valor);
    if (!opcionValida) {
      throw new Error('La zona seleccionada no es válida.');
    }

    const datos = { ...datosActuales };
    datos[nombreTrabajador] = { ...(datosActuales[nombreTrabajador] || {}) };

    // Peón Producción es el valor predeterminado y no necesita guardarse.
    if (valor === 'PEON_PRODUCCION') {
      delete datos[nombreTrabajador][fecha];
    } else {
      datos[nombreTrabajador][fecha] = valor;
    }

    if (Object.keys(datos[nombreTrabajador]).length === 0) {
      delete datos[nombreTrabajador];
    }

    if (Object.keys(datos).length === 0) {
      localStorage.removeItem(this.claveStorage);
    } else {
      localStorage.setItem(this.claveStorage, JSON.stringify(datos));
    }
    this.datos = datos;
  }
};

document.getElementById('calendarBody').addEventListener('change', event => {
  const select = event.target;
  if (!select.matches('.asignacion-select')) return;

  const nombreTrabajador = obtenerTrabajadorActual();
  const fecha = select.dataset.fecha;

  try {
    asignaciones.guardar(nombreTrabajador, fecha, select.value);
  } catch (error) {
    console.error('No se pudo guardar la asignación:', error);
    mostrarEstadoCarga(`No se pudo guardar la asignación: ${error.message}`, true);
    select.value = select.dataset.valorAnterior;
    return;
  }

  select.dataset.valorAnterior = select.value;
  select.closest('td').classList.toggle('dia-ausente', select.value === 'AUSENTE');
  mostrarEstadoCarga('Asignación guardada.');
  estadisticas.actualizar(nombreTrabajador);
});
