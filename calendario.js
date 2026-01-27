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
          if (this.esHoy(date.getDate())) cell.classList.add('today');
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
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
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
    const weekNumber = parseInt(prompt('Ingrese el Nº de semana:'), 10);
    if (!weekNumber) return;

    let date = new Date(this.currentYear, 0, 1);
    while (this.getSemanaNumbero(date) !== weekNumber && date.getFullYear() === this.currentYear) {
      date.setDate(date.getDate() + 1);
    }

    this.currentYear = date.getFullYear();
    this.currentMonth = date.getMonth();
    this.generateCalendar();
  }
};

calendar.init();
