const calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  showCalendar: true,
  vistaAnual: false, // false = mensual, true = anual

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

    this.generateCalendar();
  },

  toggleLeyenda() {
    const content = document.getElementById('leyendaContent');
    const btn = document.getElementById('toggleLeyenda');
    
    if (content && btn) {
      const isVisible = content.style.display !== 'none';
      content.style.display = isVisible ? 'none' : 'block';
      btn.textContent = isVisible ? 'Mostrar' : 'Ocultar';
    }
  },

  toggleVista() {
    this.vistaAnual = !this.vistaAnual;
    const btn = document.getElementById('toggleVista');
    btn.textContent = this.vistaAnual ? 'Vista Mensual' : 'Vista Anual';
    
    // Ocultar/mostrar botones de navegación mensual
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    if (this.vistaAnual) {
      prevMonth.style.display = 'none';
      nextMonth.style.display = 'none';
    } else {
      prevMonth.style.display = 'inline-block';
      nextMonth.style.display = 'inline-block';
    }
    
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
          cell.textContent = date.getDate();

          if (this.esHoy(date.getDate(), this.currentMonth, this.currentYear)) {
            cell.classList.add('today');
          }
          // Aplicar estado del trabajador si está seleccionado
          if (typeof obtenerEstadoDia === 'function') {
            const fechaActual = new Date(this.currentYear, this.currentMonth, date.getDate());
            const estado = obtenerEstadoDia(fechaActual);
            
            if (estado) {
              // Eliminar clases de estado anteriores
              cell.className = cell.className.replace(/estado-\w+/g, '').trim();
              
              // Agregar clase según el estado
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
              
              // Mantener la clase 'today' si es necesario
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

    // Crear tabla anual con 12 meses
    for (let mes = 0; mes < 12; mes++) {
      // Fila de título del mes
      let titleRow = document.createElement('tr');
      titleRow.classList.add('month-title-row');
      let titleCell = document.createElement('td');
      titleCell.colSpan = 8;
      titleCell.classList.add('month-title');
      titleCell.textContent = this.monthNames[mes];
      titleRow.appendChild(titleCell);
      calendarBody.appendChild(titleRow);

      // Generar días del mes
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

      // Espacio entre meses
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
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0,0,0,0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const semanaNum = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    
    // Usar semana 53 tal cual la calcula ISO-8601
    return semanaNum;
  },

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; } 
    else { this.currentMonth--; }
    this.generateCalendar();
  },

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; } 
    else { this.currentMonth++; }
    this.generateCalendar();
  },

  prevYear() { this.currentYear--; this.generateCalendar(); },
  nextYear() { this.currentYear++; this.generateCalendar(); },

  irAHoy() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.generateCalendar();
  },

  esHoy(day, month, year) {
    const today = new Date();
    return day === today.getDate() &&
           month === today.getMonth() &&
           year === today.getFullYear();
  },

  buscarSemana() {
    const weekNumber = parseInt(prompt('Ingrese el Nº de semana (1-53):'), 10);
    if (!weekNumber || weekNumber < 1 || weekNumber > 53) {
      alert('Por favor ingrese un número de semana válido (1-53)');
      return;
    }

    let date = new Date(this.currentYear, 0, 1);
    let encontrado = false;

  // Buscar hasta encontrar la semana o llegar al final del año
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