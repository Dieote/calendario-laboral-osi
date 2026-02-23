const pdfVisor = {
  pdfDoc: null,
  actualPage: 1,
  totalPages: 0,
  scale: 1.5, // zoom
  canvas: null,
  ctx: null, // contexto

  init(){
 // Configurar PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    this.canvas = document.getElementById('pdfCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.unirEventosInterfaz();
    this.actualizarVisor();

  },

  //eventos en interfaz
  unirEventosInterfaz() {
    const pdfInput = document.getElementById('pdfInput');
    if(pdfInput) {
      pdfInput.addEventListener('change', (e) => this.cargarArchivo(e));
    }

    document.getElementById('zoomIn')
      .addEventListener('click', () => this.zoomIn());

    document.getElementById('zoomOut')
      .addEventListener('click', () => this.zoomOut());

    document.getElementById('nextPage')
      .addEventListener('click', () => this.nextPage());

    document.getElementById('prevPage')
      .addEventListener('click', () => this.prevPage());
  },

  cargarArchivo(event) {
    const file = event.target.files[0];
    if(!file) return;

    this.leerArchivo(file);
  },

  leerArchivo(file) {
    const fileReader = new FileReader();

    fileReader.onload = () => {
    const typedArray = new Uint8Array(fileReader.result);

    pdfjsLib.getDocument(typedArray).promise.then(pdf => {
      this.pdfDoc = pdf;
      this.totalPages = pdf.numPages;
      this.actualPage = 1;

      this.mostrarPagina(this.actualPage);
      this.actualizarVisor();
    });
  };

  fileReader.readAsArrayBuffer(file);

  },

  mostrarPagina(num) {
    this.pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale: this.scale });

    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;

    const renderContext = {
      canvasContext: this.ctx,
      viewport: viewport
    };

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    page.render(renderContext);
  });
  },

 /* ========= NAVEGACIÓN ========= */
  nextPage() {
    if (!this.pdfDoc) return;
    if (this.actualPage >= this.totalPages) return;

    this.actualPage++;
    this.mostrarPagina(this.actualPage);
    this.actualizarVisor();
  },

  prevPage() {
    if (!this.pdfDoc) return;
    if (this.actualPage <= 1) return;

    this.actualPage--;
    this.mostrarPagina(this.actualPage);
    this.actualizarVisor();
  },

 /* ========= ZOOM ========= */
  zoomIn() {
    if (!this.pdfDoc) return;

    this.scale += 0.1;
    this.mostrarPagina(this.actualPage);
    this.actualizarVisor();
  },

  zoomOut() {
    if (!this.pdfDoc) return;
    if (this.scale <= 0.4) return;

    this.scale -= 0.1;
    this.mostrarPagina(this.actualPage);
    this.actualizarVisor();
  },

  actualizarVisor() {
    const zoomLabel = document.querySelector('.zoom-level');
    const pageLabel = document.querySelector('.page-indicator');

    zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
    pageLabel.textContent = `Página ${this.actualPage} / ${this.totalPages || 1}`;
  },

};

document.addEventListener('DOMContentLoaded', () => {
  pdfVisor.init();
});