function obtenerAñoSemana(fecha) {
  const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  const primeroEneroSiguiente = new Date(lunes.getFullYear() + 1, 0, 1);
  return primeroEneroSiguiente >= lunes && primeroEneroSiguiente <= domingo
    ? primeroEneroSiguiente.getFullYear()
    : lunes.getFullYear();
}

const calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  onYearChange: null,
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  vistaAnual: false,

  init() {
    document.getElementById('prevYear').addEventListener('click', () => this.prevYear());
    document.getElementById('nextYear').addEventListener('click', () => this.nextYear());
    document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
    document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    document.getElementById('irAHoy').addEventListener('click', () => this.irAHoy());
    document.getElementById('toggleVista').addEventListener('click', () => this.toggleVista());
    document.getElementById('buscarSemana').addEventListener('click', () => this.buscarSemana());

    const toggleLeyenda = document.getElementById('toggleLeyenda');
    if (toggleLeyenda) {
      toggleLeyenda.addEventListener('click', () => this.toggleLeyenda());
    }

    const toggleEstadisticas = document.getElementById('toggleEstadisticas');
    if (toggleEstadisticas) {
      toggleEstadisticas.addEventListener('click', () => this.toggleEstadisticas());
    }

    this.generateCalendar();
  },

  toggleLeyenda() {
    const content = document.getElementById('leyendaContent');
    const btn = document.getElementById('toggleLeyenda');
    if (!content || !btn) return;
    const abriendo = content.style.display === 'none';

    if (abriendo) {
      const estContent = document.getElementById('estadisticasContent');
      const estBtn     = document.getElementById('toggleEstadisticas');
      if (estContent) estContent.style.display = 'none';
      if (estBtn)     estBtn.textContent = 'Mostrar';
    }

    content.style.display = abriendo ? 'block' : 'none';
    btn.textContent        = abriendo ? 'Ocultar' : 'Mostrar';
  },

  toggleEstadisticas() {
    const content = document.getElementById('estadisticasContent');
    const btn     = document.getElementById('toggleEstadisticas');
    if (!content || !btn) return;
    const abriendo = content.style.display === 'none';

    if (abriendo) {
      const leyContent = document.getElementById('leyendaContent');
      const leyBtn     = document.getElementById('toggleLeyenda');
      if (leyContent) leyContent.style.display = 'none';
      if (leyBtn)     leyBtn.textContent = 'Mostrar';
    }

    content.style.display = abriendo ? 'block' : 'none';
    btn.textContent        = abriendo ? 'Ocultar' : 'Mostrar';
  },

  toggleVista() {
    this.vistaAnual = !this.vistaAnual;
    const btn = document.getElementById('toggleVista');
    btn.textContent = this.vistaAnual ? 'Vista Mensual' : 'Vista Anual';
    
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    prevMonth.style.display = this.vistaAnual ? 'none' : 'inline-block';
    nextMonth.style.display = this.vistaAnual ? 'none' : 'inline-block';

    this.generateCalendar();
  },

  generateCalendar() {
    if (this.vistaAnual) {
      this.generateCalendarioAnual();
    } else {
      this.generateCalendarioMensual();
    }
  },

  generateCalendarioMensual() {
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    document.getElementById('monthYear').textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    let date = new Date(firstDay);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));

    while (date <= lastDay || date.getDay() !== 1) {
      let row = document.createElement('tr');

      let weekCell = document.createElement('td');
      weekCell.classList.add('week-number');
      weekCell.textContent = this.getSemanaNumero(date);
      row.appendChild(weekCell);

      for (let i = 0; i < 7; i++) {
        let cell = document.createElement('td');

        if (date.getMonth() === this.currentMonth && date.getFullYear() === this.currentYear) {
          const fechaActual = new Date(this.currentYear, this.currentMonth, date.getDate());
          const numeroDia = document.createElement('span');
          numeroDia.classList.add('numero-dia');
          numeroDia.textContent = date.getDate();
          cell.appendChild(numeroDia);

          if (this.esHoy(date.getDate(), this.currentMonth, this.currentYear)) {
            cell.classList.add('today');
          }
          if (typeof obtenerEstadoDia === 'function') {
            const estado = obtenerEstadoDia(fechaActual);

            if (estado) {
              cell.className = cell.className.replace(/estado-\w+/g, '').trim();
              
              switch(estado) {
                case 'TRABAJADO':
                  cell.classList.add('estado-trabajado');
                  break;
                case 'VACACIONES':
                  cell.classList.add('estado-vacaciones');
                  break;
                case 'LIBRE':
                  cell.classList.add('estado-libre');
                  break;
                case 'FESTIVO':
                  cell.classList.add('estado-festivo');
                  break;
                case 'PUENTE':
                  cell.classList.add('estado-puente');
                  break;
                case 'DESCONOCIDO':
                  cell.classList.add('estado-desconocido');
                  break;
              }

              if (estado === 'TRABAJADO' && typeof asignaciones !== 'undefined') {
                const select = document.createElement('select');
                select.classList.add('asignacion-select');
                select.dataset.fecha = fechaKey(fechaActual);
                select.setAttribute(
                  'aria-label',
                  `Zona de trabajo del ${fechaActual.toLocaleDateString('es')}`
                );

                const trabajador = obtenerTrabajadorActual();
                const valorActual = asignaciones.obtener(trabajador, select.dataset.fecha);
                asignaciones.opciones.forEach(opcion => {
                  const elemento = document.createElement('option');
                  elemento.value = opcion.valor;
                  elemento.textContent = opcion.texto;
                  select.appendChild(elemento);
                });
                select.value = valorActual;
                select.dataset.valorAnterior = valorActual;
                cell.appendChild(select);
                cell.classList.toggle('dia-ausente', valorActual === 'AUSENTE');
              }
              
              if (this.esHoy(date.getDate(), this.currentMonth, this.currentYear)) {
                cell.classList.add('today');
              }
            }
          }          
        }
        row.appendChild(cell);
        date.setDate(date.getDate() + 1);
      }

      calendarBody.appendChild(row);
    }
  },

  generateCalendarioAnual() {
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = '';
    document.getElementById('monthYear').textContent = `Año ${this.currentYear}`;

    for (let mes = 0; mes < 12; mes++) {
      let titleRow = document.createElement('tr');
      titleRow.classList.add('month-title-row');
      let titleCell = document.createElement('td');
      titleCell.colSpan = 8;
      titleCell.classList.add('month-title');
      titleCell.textContent = this.monthNames[mes];
      titleRow.appendChild(titleCell);
      calendarBody.appendChild(titleRow);

      const firstDay = new Date(this.currentYear, mes, 1);
      const lastDay = new Date(this.currentYear, mes + 1, 0);
      let date = new Date(firstDay);
      date.setDate(date.getDate() - ((date.getDay() + 6) % 7));

      while (date <= lastDay || date.getDay() !== 1) {
        let row = document.createElement('tr');

        let weekCell = document.createElement('td');
        weekCell.classList.add('week-number');
        weekCell.textContent = this.getSemanaNumero(date);
        row.appendChild(weekCell);

        for (let i = 0; i < 7; i++) {
          let cell = document.createElement('td');

          if (date.getMonth() === mes && date.getFullYear() === this.currentYear) {
            cell.textContent = date.getDate();

            if (this.esHoy(date.getDate(), mes, this.currentYear)) {
              cell.classList.add('today');
            }

            if (typeof obtenerEstadoDia === 'function') {
              const fechaActual = new Date(this.currentYear, mes, date.getDate());
              const estado = obtenerEstadoDia(fechaActual);
              
              if (estado) {
                cell.className = cell.className.replace(/estado-\w+/g, '').trim();
                
                switch(estado) {
                  case 'TRABAJADO':
                    cell.classList.add('estado-trabajado');
                    break;
                  case 'VACACIONES':
                    cell.classList.add('estado-vacaciones');
                    break;
                  case 'LIBRE':
                    cell.classList.add('estado-libre');
                    break;
                  case 'FESTIVO':
                    cell.classList.add('estado-festivo');
                    break;
                  case 'PUENTE':
                    cell.classList.add('estado-puente');
                    break;
                  case 'DESCONOCIDO':
                    cell.classList.add('estado-desconocido');
                    break;
                }
                
                if (this.esHoy(date.getDate(), mes, this.currentYear)) {
                  cell.classList.add('today');
                }
              }
            }          
          }
          row.appendChild(cell);
          date.setDate(date.getDate() + 1);
        }

        calendarBody.appendChild(row);
      }

      if (mes < 11) {
        let spacerRow = document.createElement('tr');
        spacerRow.classList.add('month-spacer');
        let spacerCell = document.createElement('td');
        spacerCell.colSpan = 8;
        spacerCell.innerHTML = '&nbsp;';
        spacerRow.appendChild(spacerCell);
        calendarBody.appendChild(spacerRow);
      }
    }
  },

  getSemanaNumero(date) {
    const lunes = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));

    const añoSemana = obtenerAñoSemana(date);
    const primerDia = new Date(añoSemana, 0, 1);
    const lunesSemana1 = new Date(primerDia);
    lunesSemana1.setDate(primerDia.getDate() - ((primerDia.getDay() + 6) % 7));

    // Los números siguen el calendario laboral, no la numeración ISO.
    const diasDesdeSemana1 = (
      Date.UTC(lunes.getFullYear(), lunes.getMonth(), lunes.getDate()) -
      Date.UTC(lunesSemana1.getFullYear(), lunesSemana1.getMonth(), lunesSemana1.getDate())
    ) / 86400000;
    return Math.floor(diasDesdeSemana1 / 7) + 1;
  },

  prevMonth() {
    const añoAnterior = this.currentYear;
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } 
    else { this.currentMonth--; }
    this.generateCalendar();
    if (this.currentYear !== añoAnterior && this.onYearChange) {
      this.onYearChange(this.currentYear);
    }
  },

  nextMonth() {
    const añoAnterior = this.currentYear;
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } 
    else { this.currentMonth++; }
    this.generateCalendar();
    if (this.currentYear !== añoAnterior && this.onYearChange) {
      this.onYearChange(this.currentYear);
    }
  },

  prevYear() {
    this.currentYear--;
    this.generateCalendar();
    if (this.onYearChange) this.onYearChange(this.currentYear);
  },
  nextYear() {
    this.currentYear++;
    this.generateCalendar();
    if (this.onYearChange) this.onYearChange(this.currentYear);
  },

  irAHoy() {
    const añoAnterior = this.currentYear;
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.generateCalendar();
    if (this.currentYear !== añoAnterior && this.onYearChange) {
      this.onYearChange(this.currentYear);
    }
  },

  esHoy(day, month, year) {
    const today = new Date();
    return day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
  },

  buscarSemana() {
    const weekNumber = parseInt(prompt('Ingrese el Nº de semana (1-52):'), 10);
    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      alert('Por favor ingrese un número de semana válido (1-52)');
      return;
    }

    let date = new Date(this.currentYear, 0, 1);
    let encontrado = false;

    while (date.getFullYear() === this.currentYear && !encontrado) {
      if (this.getSemanaNumero(date) === weekNumber) {
        encontrado = true;
        this.currentMonth = date.getMonth();
        break;
      }
      date.setDate(date.getDate() + 1);
    }

    if (encontrado) {
      this.vistaAnual = false;
      document.getElementById('toggleVista').textContent = 'Vista Anual';
      document.getElementById('prevMonth').style.display = 'inline-block';
      document.getElementById('nextMonth').style.display = 'inline-block';
      this.generateCalendar();
    } else {
      alert(`No se encontró la semana ${weekNumber} en el año ${this.currentYear}`);
    }
  }
};

calendar.init();