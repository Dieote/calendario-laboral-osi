const calendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  showCalendar: true,

  init() {
    document.getElementById('prevYear').addEventListener('click', () => this.prevYear());
    document.getElementById('nextYear').addEventListener('click', () => this.nextYear());
    document.getElementById('prevMonth').addEventListener('click', () => this.prevMonth());
    document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    document.getElementById('irAHoy').addEventListener('click', () => this.irAHoy());
    document.getElementById('toggleCalendar').addEventListener('click', () => this.toggleCalendar());
    document.getElementById('buscarSemana').addEventListener('click', () => this.buscarSemana());

    this.generateCalendar();
  },

  toggleCalendar() {
    this.showCalendar = !this.showCalendar;
    const container = document.getElementById('calendarContainer');
    container.style.display = this.showCalendar ? 'block' : 'none';
  },

  generateCalendar() {
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

          if (this.esHoy(date.getDate())) {
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
              if (this.esHoy(date.getDate())) {
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

  getSemanaNumero(date) {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0,0,0,0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const semanaNum =  Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    return semanaNum > 52 ? 1 : semanaNum;
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

  esHoy(day) {
    const today = new Date();
    return day === today.getDate() &&
           this.currentMonth === today.getMonth() &&
           this.currentYear === today.getFullYear();
  },

  buscarSemana() {
    const weekNumber = parseInt(prompt('Ingrese el Nº de semana(1 - 52):'), 10);
    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      alert('Por favor ingrese un número de semana válido (1-52)');
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
      this.generateCalendar();
    } else {
      alert(`No se encontró la semana ${weekNumber} en el año ${this.currentYear}`);
    }
  }
};

calendar.init();
