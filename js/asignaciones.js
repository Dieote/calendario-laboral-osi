const asignaciones = {
  claveStorage: 'calendarioLaboral.asignaciones.v1',
  opciones: [
    { valor: 'PEON_PRODUCCION', texto: 'Peón Producción' },
    { valor: 'REELEVO', texto: 'Reelevo' },
    { valor: 'ASISTENTE', texto: 'Asistente' }
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

document.getElementById('calendarBody').addEventListener('change', event => {
  const select = event.target;
  if (!select.matches('.asignacion-select')) return;

  const fecha = select.dataset.fecha;


  mostrarEstadoCarga('Asignación guardada.');
});
