const estadisticas = {
  mesesNombres: [
    'Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'
  ],

  actualizar(nombreTrabajador) {
    const mapa = obtenerMapaActual();
    const año  = obtenerAñoExcel();

    if (!mapa || Object.keys(mapa).length === 0) {
      this.limpiar();
      return;
    }

    const datos = this.calcular(mapa, año);
    this.renderizar(datos, nombreTrabajador);
  },

  // limpiar panel cuando no hay trabajador seleccionado
  limpiar() {
    const contenido = document.getElementById('estadisticasContent');
    if (contenido) {
      contenido.innerHTML = `
        <div class="estadisticas-info">
          Selecciona un trabajador para ver sus estadísticas
        </div>`;
    }
  },

  //   cuenta a partir del mapa
  calcular(mapa, año) {
    const anual = {
      trabajados:  0,
      libres:      0,
      vacaciones:  0,
      festivos:    0,
      puentes:     0,
      sabTrabajados: 0,
      domTrabajados: 0
    };

    const mensual = Array.from({ length: 12 }, () => ({
      trabajados:    0,
      sabTrabajados: 0,
      domTrabajados: 0
    }));

    for (const [key, estado] of Object.entries(mapa)) {
      const fecha = new Date(key + 'T00:00:00'); // evitar desfase UTC
      if (fecha.getFullYear() !== año) continue;  // solo el año principal
      const mes      = fecha.getMonth();      // 0-11
      const diaSem   = fecha.getDay();        // 0=Dom, 6=Sáb
      const esSab    = diaSem === 6;
      const esDom    = diaSem === 0;

      // Conteo anual
      switch (estado) {
        case 'TRABAJADO':
          anual.trabajados++;
          if (esSab) anual.sabTrabajados++;
          if (esDom) anual.domTrabajados++;
          break;
        case 'LIBRE':      anual.libres++;     break;
        case 'VACACIONES': anual.vacaciones++; break;
        case 'FESTIVO':    anual.festivos++;   break;
        case 'PUENTE':     anual.puentes++;    break;
      }

      // Conteos  días trabajados + fin de semana)
      if (estado === 'TRABAJADO') {
        mensual[mes].trabajados++;
        if (esSab) mensual[mes].sabTrabajados++;
        if (esDom) mensual[mes].domTrabajados++;
      }
    }

    return { anual, mensual };
  },

  renderizar(datos, nombreTrabajador) {
    const contenido = document.getElementById('estadisticasContent');
    if (!contenido) return;

    const { anual, mensual } = datos;

    // Indicador de fin de semana solo si el trabajador tiene alguno
    const tieneFdS = anual.sabTrabajados > 0 || anual.domTrabajados > 0;
    const fdsBadge = tieneFdS
      ? `<span class="fds-badge">Trabaja en fin de semana</span>`
      : '<span class="fds-badge">No trabaja en fin de semana</span>';

    contenido.innerHTML = `
      <!-- Nombre del trabajador -->
      <div class="est-trabajador-nombre">
        ${nombreTrabajador} ${fdsBadge}
      </div>

      <!-- Tarjetas anuales -->
      <div class="estadisticas-grid">

        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">🟡</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Días trabajados</div>
            <div class="estadistica-valor">${anual.trabajados}</div>
          </div>
        </div>

        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">🟢</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Días libres</div>
            <div class="estadistica-valor">${anual.libres}</div>
          </div>
        </div>

        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">🟠</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Vacaciones</div>
            <div class="estadistica-valor">${anual.vacaciones}</div>
          </div>
        </div>

        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">🔴</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Festivos</div>
            <div class="estadistica-valor">${anual.festivos}</div>
          </div>
        </div>

        ${anual.puentes > 0 ? `
        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">⬜</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Puentes</div>
            <div class="estadistica-valor">${anual.puentes}</div>
          </div>
        </div>` : ''}

        ${anual.sabTrabajados > 0 ? `
        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">📅</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Sábados trabajados</div>
            <div class="estadistica-valor">${anual.sabTrabajados}</div>
          </div>
        </div>` : ''}

        ${anual.domTrabajados > 0 ? `
        <div class="estadistica-tarjeta">
          <div class="estadistica-icono">📅</div>
          <div class="estadistica-info-card">
            <div class="estadistica-label">Domingos trabajados</div>
            <div class="estadistica-valor">${anual.domTrabajados}</div>
          </div>
        </div>` : ''}

      </div>

      <!-- Toggle desglose mensual -->
      <div class="desglose-mensual-header" id="toggleDesglose">
        <span>Ver desglose mensual</span>
        <span class="desglose-flecha" id="desgloseFlecha">▼</span>
      </div>

      <div class="desglose-mensual-content" id="desgloseMensualContent" style="display:none;">
        ${this.renderizarTablaMensual(mensual)}
      </div>
    `;

    document.getElementById('toggleDesglose')
      .addEventListener('click', () => this.toggleDesglose());
  },

  //genera la tabla de desglose mensual
  renderizarTablaMensual(mensual) {
    const filaHeaders = this.mesesNombres
      .map(m => `<th>${m}</th>`)
      .join('');

    const filaTrabajados = mensual
      .map(m => `<td><strong>${m.trabajados}</strong></td>`)
      .join('');

    // Fila de fin de semana: muestra íconos solo si hay alguno ese mes
    const filaFdS = mensual.map(m => {
      const iconos = [];
      if (m.sabTrabajados > 0) iconos.push(`<span title="Sábados: ${m.sabTrabajados}">S(${m.sabTrabajados})</span>`);
      if (m.domTrabajados > 0) iconos.push(`<span title="Domingos: ${m.domTrabajados}">D(${m.domTrabajados})</span>`);
      return `<td class="fds-celda">${iconos.join(' ') || '—'}</td>`;
    }).join('');

    return `
      <table class="tabla-mensual">
        <thead>
          <tr>
            <th class="tabla-mensual-label">Mes</th>
            ${filaHeaders}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tabla-mensual-label">Días trab.</td>
            ${filaTrabajados}
          </tr>
          <tr>
            <td class="tabla-mensual-label">Domingos</td>
            ${filaFdS}
          </tr>
        </tbody>
      </table>
    `;
  },

  toggleDesglose() {
    const content = document.getElementById('desgloseMensualContent');
    const flecha  = document.getElementById('desgloseFlecha');
    if (!content) return;

    const visible = content.style.display !== 'none';
    content.style.display = visible ? 'none' : 'block';
    flecha.textContent     = visible ? '▼' : '▲';
  }
};
