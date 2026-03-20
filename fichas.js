// SIEMBRA — fichas.js
// Extraído automáticamente de index.html
// Parte del refactoring Fase 3.2

// ══════════════════════════════════════════════════════════
//  MÓDULO FICHAS DESCRIPTIVAS — v8
// ══════════════════════════════════════════════════════════

const COLORES_AVATARES = ['#3b7be8','#7c3aed','#059669','#d97706','#db2777','#0891b2','#dc2626','#65a30d','#0d5c2f','#9333ea','#ea580c','#0e7490'];

// Base de datos de fichas (por alumno index)
let FICHAS_DATA = {};
let fichaAlumnoActual = null;

const ESTILOS_APZ = [
  { id:'visual',    ico:'👁️', txt:'Visual',    sub:'Aprende con imágenes, diagramas, colores' },
  { id:'auditivo',  ico:'👂', txt:'Auditivo',   sub:'Aprende escuchando explicaciones y música' },
  { id:'kinestesico',ico:'✋',txt:'Kinestésico', sub:'Aprende haciendo, manipulando, moviéndose' },
  { id:'lector',    ico:'📖', txt:'Lector',     sub:'Aprende leyendo y escribiendo' },
];
const RITMOS = [
  { id:'rapido',   ico:'⚡', lbl:'Rápido — avanza por encima del grupo' },
  { id:'normal',   ico:'✅', lbl:'Regular — sigue el ritmo del grupo' },
  { id:'pausado',  ico:'🐢', lbl:'Pausado — necesita más tiempo' },
  { id:'irregular',ico:'📈', lbl:'Irregular — varía según la materia' },
];
const APOYOS = ['NEE','TDAH','Dislexia','Discalculia','Visual','Auditivo','Superdotado','Bilingüe','Tutoría'];
const INDICADORES = [
  'Se distrae con facilidad',
  'Molesta a compañeros',
  'Agresividad verbal o física',
  'Timidez extrema',
  'Dificultad para seguir instrucciones',
  'Llega sin desayunar',
  'Apoyo familiar insuficiente',
];

function fichaInit() {
  // Inicializar fichas vacías para todos los alumnos
  alumnos.forEach((a, i) => {
    if (!FICHAS_DATA[i]) {
      FICHAS_DATA[i] = {
        nombre: a.n, curp: '', nacimiento: '', num: i+1,
        tutor: '', parentesco: 'Madre', tel: '', emailTutor: '',
        conducta: 'Buena', participacion: 'Activo/a', relacion: 'Muy sociable',
        responsabilidad: 'Casi siempre',
        fortalezas: '', dificultades: '', oportunidades: '',
        estilos: ['visual'], ritmo: 'normal', apoyos: [],
        indicadores: {},
        observaciones: [],
        reportes: [],
      };
    }
  });
  fichaRenderLista('');
}

function fichaRenderLista(filtro) {
  const cont = document.getElementById('fichas-lista-alumnos');
  if (!cont) return;
  const ff = filtro.toLowerCase();
  const items = alumnos.map((a, i) => ({a, i})).filter(({a}) => a.n.toLowerCase().includes(ff));
  cont.innerHTML = items.map(({a, i}) => {
    const prom = typeof calPromPonderado === 'function' && CAL_DATA && Object.keys(CAL_DATA).length
      ? (MATERIAS_NEM.reduce((s,m) => s + calPromPonderado(i,m,1), 0) / MATERIAS_NEM.length)
      : (a.cals.reduce((s,c)=>s+c,0)/a.cals.length);
    const niv = calNivel ? calNivel(prom) : 'B';
    const col = COLORES_AVATARES[i % COLORES_AVATARES.length];
    const inis = a.n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
    const nColor = niv==='A'?'#15803d':niv==='B'?'#1d4ed8':niv==='C'?'#a16207':'#b91c1c';
    const nBg    = niv==='A'?'#dcfce7':niv==='B'?'#dbeafe':niv==='C'?'#fef9c3':'#fee2e2';
    return `<div class="ficha-alumno-item ${fichaAlumnoActual===i?'active':''}" onclick="fichaSeleccionar(${i})">
      <div class="ficha-alumno-av" style="background:${col};">${inis}</div>
      <div style="flex:1;min-width:0;">
        <div class="ficha-alumno-nombre">${a.n}</div>
        <div style="font-size:11px;color:var(--gris-50);">Núm. ${i+1}</div>
      </div>
      <span class="ficha-alumno-nivel" style="background:${nBg};color:${nColor};">${niv} · ${prom.toFixed(1)}</span>
    </div>`;
  }).join('') || '<div style="padding:20px;text-align:center;color:var(--gris-50);font-size:13px;">Sin resultados</div>';
}

function fichaFiltrar(v) { fichaRenderLista(v); }

function fichaSeleccionar(idx) {
  fichaAlumnoActual = idx;
  fichaRenderLista(document.querySelector('#p-fichas input[type="text"]')?.value || '');
  fichaCargarDatos(idx);
  document.getElementById('fichas-empty').style.display = 'none';
  document.getElementById('fichas-contenido').style.display = 'block';
  fichaTab('perfil', document.querySelector('#p-fichas .tab-btn'));
}

function fichaCargarDatos(idx) {
  const fd = FICHAS_DATA[idx];
  const a  = alumnos[idx];
  const col = COLORES_AVATARES[idx % COLORES_AVATARES.length];
  const inis = a.n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();

  // Cabecera
  document.getElementById('ficha-avatar-grande').textContent = inis;
  document.getElementById('ficha-avatar-grande').style.background = col;
  document.getElementById('ficha-nombre-h').textContent = a.n;

  // Asistencia
  const pres = alumnos.filter((_,i)=>i===idx?a.as==='P':false).length;
  const totalDias = 80; // días del trimestre demo
  const ausDemo = Math.floor(Math.random()*3);
  const tardDemo = Math.floor(Math.random()*2);
  const presDemo = totalDias - ausDemo - tardDemo;
  const pctAs = Math.round(presDemo/totalDias*100);
  setEl('ficha-pct-asist', pctAs+'%');
  setEl('fd-as-pres', presDemo);
  setEl('fd-as-aus', ausDemo);
  setEl('fd-as-tard', tardDemo);
  setEl('fd-as-pct', pctAs+'%');
  const bar = document.getElementById('fd-as-bar');
  if (bar) { bar.style.width = pctAs+'%'; bar.style.background = pctAs>=90?'#22c55e':pctAs>=75?'#eab308':'#ef4444'; }

  // Promedio
  const prom = typeof calPromPonderado === 'function' && CAL_DATA && Object.keys(CAL_DATA).length
    ? (MATERIAS_NEM.reduce((s,m) => s + calPromPonderado(idx,m,1), 0) / MATERIAS_NEM.length)
    : (a.cals.reduce((s,c)=>s+c,0)/a.cals.length);
  setEl('ficha-prom-badge', prom.toFixed(1));

  // Datos perfil
  setVal('fd-nombre', fd.nombre || a.n);
  setVal('fd-curp', fd.curp);
  setVal('fd-nacimiento', fd.nacimiento);
  setVal('fd-num', fd.num);
  setVal('fd-tutor', fd.tutor);
  setVal('fd-parentesco', fd.parentesco);
  setVal('fd-tel', fd.tel);
  setVal('fd-email-tutor', fd.emailTutor);

  // Académico
  fichaRenderCalsTrim(idx);
  setVal('fd-fortalezas', fd.fortalezas);
  setVal('fd-dificultades', fd.dificultades);
  setVal('fd-oportunidades', fd.oportunidades);
  fichaRenderMatAtencion(idx);

  // Conductual
  setVal('fd-conducta', fd.conducta);
  setVal('fd-participacion', fd.participacion);
  setVal('fd-relacion', fd.relacion);
  setVal('fd-responsabilidad', fd.responsabilidad);
  fichaRenderIndicadores(fd);
  fichaRenderReportes(fd);

  // Académico — gráfica de progreso y metas
  setTimeout(() => {
    fichaRenderGraficaProgreso(idx);
    metasRender(idx);
  }, 50);

  // Aprendizaje
  fichaRenderEstilos(fd);
  fichaRenderRitmo(fd);
  fichaRenderApoyos(fd);
  // Reset para regenerar estrategias IA al cargar nuevo alumno
  const iaEl = document.getElementById('fd-ia-estrategias');
  if (iaEl) { iaEl.dataset.generado = ''; iaEl.innerHTML = '<em style="color:var(--gris-50);">Guardando la ficha generará estrategias personalizadas.</em>'; }

  // Observaciones
  const today = new Date().toISOString().split('T')[0];
  setVal('fd-obs-fecha', today);
  fichaRenderObsHistorial(fd);
}

function fichaRenderCalsTrim(idx) {
  const cont = document.getElementById('fd-cals-tabla');
  if (!cont) return;
  if (!CAL_DATA || !Object.keys(CAL_DATA).length) { cont.innerHTML = '<p style="color:var(--gris-50);font-size:13px;">Carga calificaciones en el módulo de Calificaciones primero.</p>'; return; }
  let html = '<table class="tabla" style="width:100%;"><thead><tr><th>Materia</th>';
  [1,2,3].forEach(t => html += `<th style="text-align:center;">Trim. ${t}</th>`);
  html += '<th style="text-align:center;">Anual</th></tr></thead><tbody>';
  MATERIAS_NEM.forEach(m => {
    const ps = [1,2,3].map(t => typeof calPromPonderado === 'function' ? calPromPonderado(idx,m,t) : 7);
    const anual = ps.reduce((s,p)=>s+p,0)/3;
    const fmt = v => v < 6.5 ? v.toFixed(1) : Math.round(v);
    const c = v => v>=8?'#dcfce7':v>=6?'#fef9c3':'#fee2e2';
    const tc= v => v>=8?'#15803d':v>=6?'#a16207':'#b91c1c';
    html += `<tr><td style="font-weight:600;font-size:13px;">${m}</td>
      ${ps.map(p=>`<td style="text-align:center;"><span style="background:${c(p)};color:${tc(p)};padding:3px 8px;border-radius:6px;font-weight:700;font-size:12px;">${fmt(p)}</span></td>`).join('')}
      <td style="text-align:center;"><strong style="color:${tc(anual)};">${fmt(anual)}</strong></td></tr>`;
  });
  html += '</tbody></table>';
  cont.innerHTML = html;
}

function fichaRenderMatAtencion(idx) {
  const cont = document.getElementById('fd-mat-atencion');
  if (!cont || !CAL_DATA || !Object.keys(CAL_DATA).length) { if(cont) cont.innerHTML='<span style="font-size:12px;color:var(--gris-50);">—</span>'; return; }
  const matAtencion = MATERIAS_NEM.filter(m => calPromPonderado(idx,m,calTrimActual||1) < 7);
  cont.innerHTML = matAtencion.length
    ? matAtencion.map(m=>`<span style="padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:#fee2e2;color:#b91c1c;">${m}</span>`).join('')
    : '<span style="font-size:12px;color:#15803d;font-weight:600;">✅ Sin materias en atención</span>';
}

function fichaRenderIndicadores(fd) {
  const cont = document.getElementById('fd-conducta-indicadores');
  if (!cont) return;
  cont.innerHTML = INDICADORES.map((ind, i) => {
    const sel = fd.indicadores[i] || 'neu';
    return `<div class="fd-indicador">
      <div class="fd-ind-label">${ind}</div>
      <div class="fd-ind-btns">
        <button class="fd-ind-btn ${sel==='yes'?'sel-yes':''}" onclick="fdSetInd(${i},'yes',this)" title="Sí">✅</button>
        <button class="fd-ind-btn ${sel==='neu'?'sel-neu':''}" onclick="fdSetInd(${i},'neu',this)" title="A veces">⚠️</button>
        <button class="fd-ind-btn ${sel==='no'?'sel-no':''}" onclick="fdSetInd(${i},'no',this)" title="No">❌</button>
      </div>
    </div>`;
  }).join('');
}
function fdSetInd(i, v, btn) {
  if (fichaAlumnoActual===null) return;
  FICHAS_DATA[fichaAlumnoActual].indicadores[i] = v;
  btn.closest('.fd-ind-btns').querySelectorAll('.fd-ind-btn').forEach(b=>b.className='fd-ind-btn');
  const vals = ['yes','neu','no'];
  const cls  = ['sel-yes','sel-neu','sel-no'];
  btn.classList.add(cls[vals.indexOf(v)]);
}

function fichaRenderReportes(fd) {
  const cont = document.getElementById('fd-reportes-conducta');
  if (!cont) return;
  cont.innerHTML = fd.reportes.length
    ? fd.reportes.map((r,i)=>`<div class="reporte-item">
        <span style="font-size:16px;">🚨</span>
        <div style="flex:1;"><div style="font-size:13px;">${r.texto}</div><div style="font-size:11px;color:var(--gris-50);margin-top:2px;">${r.fecha}</div></div>
        <button onclick="fdEliminarReporte(${i})" style="background:none;border:none;cursor:pointer;color:var(--gris-50);font-size:14px;">✕</button>
      </div>`).join('')
    : '<div style="font-size:13px;color:var(--gris-50);font-style:italic;">Sin reportes registrados.</div>';
}
function fdAgregarReporte() {
  if (fichaAlumnoActual===null) return;
  const inp = document.getElementById('fd-nuevo-reporte');
  if (!inp||!inp.value.trim()) return;
  const hoy = new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'});
  FICHAS_DATA[fichaAlumnoActual].reportes.push({ texto: inp.value.trim(), fecha: hoy });
  inp.value = '';
  fichaRenderReportes(FICHAS_DATA[fichaAlumnoActual]);
}
function fdEliminarReporte(i) {
  if (fichaAlumnoActual===null) return;
  FICHAS_DATA[fichaAlumnoActual].reportes.splice(i,1);
  fichaRenderReportes(FICHAS_DATA[fichaAlumnoActual]);
}

function fichaRenderEstilos(fd) {
  const cont = document.getElementById('fd-estilos-wrap');
  if (!cont) return;
  cont.innerHTML = ESTILOS_APZ.map(e=>`
    <div class="estilo-chip ${fd.estilos.includes(e.id)?'sel':''}" onclick="fdToggleEstilo('${e.id}',this)">
      <span class="estilo-chip-ico">${e.ico}</span>
      <div><div class="estilo-chip-txt">${e.txt}</div><div class="estilo-chip-sub">${e.sub}</div></div>
    </div>`).join('');
}
function fdToggleEstilo(id, el) {
  if (fichaAlumnoActual===null) return;
  const fd = FICHAS_DATA[fichaAlumnoActual];
  if (fd.estilos.includes(id)) fd.estilos = fd.estilos.filter(e=>e!==id);
  else fd.estilos.push(id);
  el.classList.toggle('sel');
}

function fichaRenderRitmo(fd) {
  const cont = document.getElementById('fd-ritmo-wrap');
  if (!cont) return;
  cont.innerHTML = RITMOS.map(r=>`
    <div onclick="fdSetRitmo('${r.id}',this)" style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:9px;border:1.5px solid ${fd.ritmo===r.id?'var(--verde)':'var(--gris-20)'};background:${fd.ritmo===r.id?'var(--verde-light)':'white'};cursor:pointer;transition:.15s;">
      <span style="font-size:16px;">${r.ico}</span>
      <span style="font-size:13px;font-weight:${fd.ritmo===r.id?'700':'500'};">${r.lbl}</span>
    </div>`).join('');
}
function fdSetRitmo(id) {
  if (fichaAlumnoActual===null) return;
  FICHAS_DATA[fichaAlumnoActual].ritmo = id;
  fichaRenderRitmo(FICHAS_DATA[fichaAlumnoActual]);
}

function fichaRenderApoyos(fd) {
  const cont  = document.getElementById('fd-apoyo-wrap');
  const vacio = document.getElementById('fd-apoyo-vacio');
  if (!cont) return;
  const apoyos = fd.apoyos || [];
  if (!apoyos.length) {
    cont.innerHTML = '';
    if (vacio) vacio.style.display = 'block';
    return;
  }
  if (vacio) vacio.style.display = 'none';

  // ── Política de privacidad: el docente NO ve etiquetas de discapacidad/diagnóstico
  // Solo Trabajo Social y Director tienen acceso al diagnóstico completo.
  // El docente ve únicamente recomendaciones pedagógicas generales.
  const esDocente = currentPerfil?.rol === 'docente' || currentPerfil?.rol === 'tutor' || (!currentPerfil && !window._grupoTutoria);
  const esTSoDir  = currentPerfil?.rol === 'ts' || currentPerfil?.rol === 'director' || currentPerfil?.rol === 'subdirector' || currentPerfil?.rol === 'coordinador';

  if (esDocente && !esTSoDir) {
    // El docente ve solo que el alumno tiene apoyos, sin diagnóstico específico
    cont.innerHTML = `<div style="padding:12px 14px;background:#eff6ff;border-radius:10px;border-left:3px solid #3b82f6;">
      <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:4px;">🛡️ Este alumno tiene apoyos pedagógicos asignados</div>
      <div style="font-size:12px;color:#3b82f6;line-height:1.6;">Consulta las estrategias de enseñanza personalizadas en la sección de abajo. Los detalles del diagnóstico son confidenciales y están disponibles con Trabajo Social.</div>
    </div>`;
    fichaGenerarEstrategiasConApoyos(fd);
    return;
  }

  // TS / Director sí ven las etiquetas completas
  const APOYO_COLORS = {
    'NEE':['#dbeafe','#1d4ed8'],'TDAH':['#fdf4ff','#7c3aed'],
    'Dislexia':['#fff7ed','#c2410c'],'Discalculia':['#fef9c3','#a16207'],
    'Visual':['#f0fdf4','#15803d'],'Auditivo':['#f0f9ff','#0369a1'],
    'Superdotado':['#fdf4ff','#6d28d9'],'Bilingüe':['#ecfdf5','#047857'],
    'Tutoría':['#f8fafc','#475569'],
  };
  cont.innerHTML = apoyos.map(ap => {
    const [bg,color] = APOYO_COLORS[ap]||['#f1f5f9','#475569'];
    return `<span title="Apoyo registrado por Trabajo Social" style="padding:5px 12px;border-radius:99px;font-size:11px;font-weight:700;border:1.5px solid ${color}40;background:${bg};color:${color};">🛡️ ${ap}</span>`;
  }).join('');
  fichaGenerarEstrategiasConApoyos(fd);
}
function fdToggleApoyo(ap) {
  hubToast('⚠️ Solo Trabajo Social puede modificar los apoyos especiales','warn');
}
async function fichaGenerarEstrategiasConApoyos(fd) {
  const el = document.getElementById('fd-ia-estrategias');
  if (!el || el.dataset.generado==='true') return;
  const apoyos = fd.apoyos||[];
  if (!apoyos.length && !fd.estilos?.length) return;
  el.innerHTML='<span style="color:var(--verde);">✨ Generando estrategias personalizadas…</span>';
  const prompt=`Eres docente experto en educación inclusiva NEM. El alumno ${fd.nombre||'este alumno'} tiene:
- Estilo(s) de aprendizaje: ${(fd.estilos||[]).join(', ')||'no definido'}
- Ritmo: ${fd.ritmo||'regular'}
- Apoyos especiales (Trabajo Social): ${apoyos.join(', ')||'ninguno'}
- Fortalezas: ${fd.fortalezas||'no especificadas'}
- Dificultades: ${fd.dificultades||'no especificadas'}
Da 4 estrategias pedagógicas concretas (1-2 oraciones). Formato: emoji + estrategia. Sin encabezados.`;
  try {
    const texto = await callAI({ feature: 'ficha_estrategias', prompt });
    el.innerHTML=texto.replace(/\n/g,'<br>');
    el.dataset.generado='true';
  } catch(e){ el.innerHTML='<em style="color:var(--gris-50);">Error al generar estrategias.</em>'; }
}

function fichaRenderObsHistorial(fd) {
  const cont = document.getElementById('fd-obs-historial');
  if (!cont) return;
  const tipoClases = {Académica:'academica',Conductual:'conductual',Emocional:'emocional',Familiar:'familiar',Salud:'salud',Logro:'logro'};
  cont.innerHTML = fd.observaciones.length
    ? [...fd.observaciones].reverse().map((o,i)=>`
        <div class="obs-item-fd">
          <div class="obs-item-fd-header">
            <span class="obs-tipo-chip obs-tipo-${tipoClases[o.tipo]||'academica'}">${o.tipo}</span>
            <span style="font-size:11px;color:var(--gris-50);margin-left:auto;">${o.fecha}</span>
          </div>
          <div style="font-size:13px;line-height:1.6;">${o.texto}</div>
        </div>`).join('')
    : '<div style="font-size:13px;color:var(--gris-50);font-style:italic;padding:8px 0;">Sin observaciones registradas.</div>';
}
function fdAgregarObservacion() {
  if (fichaAlumnoActual===null) return;
  const texto = document.getElementById('fd-obs-texto')?.value?.trim();
  const tipo  = document.getElementById('fd-obs-tipo')?.value;
  const fecha = document.getElementById('fd-obs-fecha')?.value;
  if (!texto) { hubToast('⚠️ Escribe el texto de la observación','warn'); return; }
  FICHAS_DATA[fichaAlumnoActual].observaciones.push({ texto, tipo, fecha });
  document.getElementById('fd-obs-texto').value = '';
  fichaRenderObsHistorial(FICHAS_DATA[fichaAlumnoActual]);
  hubToast('✅ Observación registrada','ok');
}

// ── Guardar ficha ──
function fichaGuardar() {
  if (fichaAlumnoActual===null) { hubToast('⚠️ Selecciona un alumno primero','warn'); return; }
  const fd = FICHAS_DATA[fichaAlumnoActual];
  fd.nombre = getVal('fd-nombre');
  fd.curp   = getVal('fd-curp');
  fd.nacimiento = getVal('fd-nacimiento');
  fd.num    = getVal('fd-num');
  fd.tutor  = getVal('fd-tutor');
  fd.parentesco = getVal('fd-parentesco');
  fd.tel    = getVal('fd-tel');
  fd.emailTutor = getVal('fd-email-tutor');
  fd.conducta      = getVal('fd-conducta');
  fd.participacion = getVal('fd-participacion');
  fd.relacion      = getVal('fd-relacion');
  fd.responsabilidad = getVal('fd-responsabilidad');
  fd.fortalezas  = getVal('fd-fortalezas');
  fd.dificultades= getVal('fd-dificultades');
  fd.oportunidades=getVal('fd-oportunidades');
  hubToast('✅ Ficha de ' + alumnos[fichaAlumnoActual].n + ' guardada','ok');
  fichaRenderLista('');
  // IA estrategias
  fichaGenerarIA(fd);
}
async function fichaGenerarIA(fd) {
  // Called on save - updates the aprendizaje tab suggestions
  const el = document.getElementById('fd-ia-estrategias');
  if (!el) return;
  el.innerHTML = '<em style="color:var(--gris-50);">🤖 Generando sugerencias…</em>';
  const prompt = `Eres asesor pedagógico NEM. Genera 3 estrategias concretas para el docente (máx 2 líneas cada una) para apoyar a un alumno con estas características:
Estilo de aprendizaje: ${fd.estilos.join(', ')}.
Ritmo: ${fd.ritmo}.
Apoyos especiales: ${fd.apoyos.join(', ')||'ninguno'}.
Dificultades: ${fd.dificultades||'no especificadas'}.
Fortalezas: ${fd.fortalezas||'no especificadas'}.
Formato: lista numerada, lenguaje pedagógico, sin diagnósticos clínicos. Marco NEM.`;
  try {
    const texto = await callAI({ feature: 'ficha_estrategias', prompt });
    el.innerHTML = texto.replace(/\n/g,'<br>');
  } catch(e) {
    el.innerHTML = '1. Usar recursos visuales como mapas mentales y esquemas.<br>2. Dar instrucciones paso a paso y verificar comprensión.<br>3. Asignar actividades diferenciadas según su ritmo de aprendizaje.';
  }
}

// ── Análisis completo IA para Trabajo Social ──
async function fichaGenerarAnalisisCompleto() {
  if (fichaAlumnoActual === null) { hubToast('⚠️ Selecciona un alumno','warn'); return; }
  const fd = FICHAS_DATA[fichaAlumnoActual];
  const a = alumnos[fichaAlumnoActual];
  if (!a) return;

  document.getElementById('fd-btn-analisis').disabled = true;
  document.getElementById('fd-analisis-loading').style.display = 'block';
  document.getElementById('fd-analisis-empty').style.display = 'none';
  document.getElementById('fd-analisis-resultado').style.display = 'none';

  // Build a comprehensive profile for the prompt
  const promsStr = MATERIAS_NEM.map(m => {
    const p = typeof calPromPonderado==='function' ? calPromPonderado(fichaAlumnoActual, m, 1) : 7;
    return `${m}: ${p.toFixed(1)}`;
  }).join(', ');

  const prompt = `Eres un orientador pedagógico escolar de primaria en México, sistema NEM (Nueva Escuela Mexicana). Analiza la siguiente ficha descriptiva de un alumno y genera un reporte estructurado en JSON estricto (sin markdown, sin backticks).

FICHA DEL ALUMNO:
- Nombre: ${a.n}
- Grado: 6° A
- Calificaciones por materia: ${promsStr}
- Estilo de aprendizaje: ${(fd.estilos||[]).join(', ')||'No especificado'}
- Ritmo de aprendizaje: ${fd.ritmo||'normal'}
- Apoyos especiales detectados: ${(fd.apoyos||[]).join(', ')||'ninguno'}
- Fortalezas académicas (docente): ${fd.fortalezas||'No especificado'}
- Dificultades académicas (docente): ${fd.dificultades||'No especificado'}
- Áreas de oportunidad (docente): ${fd.oportunidades||'No especificado'}
- Conducta general: ${fd.conducta||'Buena'}
- Participación: ${fd.participacion||'Activo/a'}
- Relación con compañeros: ${fd.relacion||'Sociable'}
- Responsabilidad: ${fd.responsabilidad||'Casi siempre'}
- Indicadores de conducta: ${Object.entries(fd.indicadores||{}).filter(([k,v])=>v==='yes').map(([k])=>INDICADORES[parseInt(k)]).join(', ')||'ninguno'}
- Observaciones registradas: ${(fd.observaciones||[]).length} observaciones
- Reportes de conducta: ${(fd.reportes||[]).length} reportes

INSTRUCCIONES:
Responde ÚNICAMENTE con un objeto JSON con estas claves exactas:
{
  "resumen": "Párrafo de 3-4 oraciones con el perfil integral del alumno. Lenguaje objetivo y pedagógico, sin diagnósticos clínicos.",
  "fortalezas": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "alertas": ["área de atención 1", "área de atención 2"],
  "recomendaciones": ["recomendación pedagógica 1", "recomendación 2", "recomendación 3"],
  "derivaciones": [
    {"instancia": "Trabajo Social", "motivo": "motivo concreto", "urgencia": "alta|media|baja", "aplicar": true|false},
    {"instancia": "Psicólogo escolar", "motivo": "motivo concreto", "urgencia": "alta|media|baja", "aplicar": true|false},
    {"instancia": "Dirección", "motivo": "motivo concreto", "urgencia": "alta|media|baja", "aplicar": true|false},
    {"instancia": "DIF Municipal", "motivo": "motivo concreto", "urgencia": "alta|media|baja", "aplicar": true|false}
  ]
}
Solo incluye derivaciones con "aplicar": true si hay indicios pedagógicos reales. Sé honesto y proporcional.`;

  try {
    const raw = await callAI({ feature: 'ficha_analisis', prompt });
    const clean = raw.replace(/```json|```/g,'').trim();
    const res = JSON.parse(clean);

    // Render results
    document.getElementById('fd-ia-resumen').innerHTML = res.resumen || '—';
    document.getElementById('fd-ia-fortalezas-res').innerHTML = (res.fortalezas||[]).map(f=>`<div style="display:flex;gap:8px;margin-bottom:6px;"><span style="color:#15803d;flex-shrink:0;">✅</span><span>${f}</span></div>`).join('') || '—';
    document.getElementById('fd-ia-alertas').innerHTML = (res.alertas||[]).map(a=>`<div style="display:flex;gap:8px;margin-bottom:6px;"><span style="color:#c2410c;flex-shrink:0;">⚠️</span><span>${a}</span></div>`).join('') || '—';
    document.getElementById('fd-ia-recomendaciones').innerHTML = (res.recomendaciones||[]).map((r,i)=>`<div style="display:flex;gap:10px;margin-bottom:8px;"><span style="font-size:11px;font-weight:800;background:#dbeafe;color:#1d4ed8;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</span><span style="font-size:13px;line-height:1.5;">${r}</span></div>`).join('') || '—';

    const urgColors = {alta:'#fee2e2;color:#b91c1c', media:'#fef9c3;color:#a16207', baja:'#dcfce7;color:#15803d'};
    const urgLabels = {alta:'🔴 Urgente', media:'🟡 Media', baja:'🟢 Baja'};
    const deriv = (res.derivaciones||[]).filter(d=>d.aplicar);
    document.getElementById('fd-ia-derivaciones').innerHTML = deriv.length
      ? deriv.map(d=>`<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:10px;background:white;border:1.5px solid var(--gris-20);margin-bottom:8px;">
          <div style="flex:1;"><div style="font-size:13px;font-weight:700;margin-bottom:3px;">${d.instancia}</div><div style="font-size:12px;color:var(--gris-50);line-height:1.5;">${d.motivo}</div></div>
          <span style="padding:3px 10px;border-radius:99px;font-size:10px;font-weight:800;background:${urgColors[d.urgencia]||urgColors.baja};">${urgLabels[d.urgencia]||'🟢 Baja'}</span>
        </div>`).join('')
      : '<div style="font-size:13px;color:#15803d;">✅ La IA no detecta necesidad de derivación en este momento.</div>';

    // Store result for sending
    fd._ultimoAnalisis = res;

    document.getElementById('fd-analisis-loading').style.display = 'none';
    document.getElementById('fd-analisis-resultado').style.display = 'block';
    document.getElementById('fd-analisis-empty').style.display = 'none';

  } catch(e) {
    console.error(e);
    document.getElementById('fd-analisis-loading').style.display = 'none';
    document.getElementById('fd-analisis-empty').style.display = 'block';
    document.getElementById('fd-analisis-empty').innerHTML = '<div style="padding:20px;text-align:center;"><div style="font-size:36px;margin-bottom:8px;">⚠️</div><div style="font-size:13px;color:#b91c1c;">Error al generar el análisis. Verifica la clave de IA en configuración.</div></div>';
  }
  document.getElementById('fd-btn-analisis').disabled = false;
}

function fichaEnviarTS() {
  if (fichaAlumnoActual===null) return;
  const a = alumnos[fichaAlumnoActual];
  const fd = FICHAS_DATA[fichaAlumnoActual];
  const analisis = fd?._ultimoAnalisis;
  // Auto-create a trabajo social case
  const caso = {
    id: Date.now(),
    alumnoIdx: fichaAlumnoActual,
    tipo: 'riesgo',
    estado: 'seguimiento',
    fecha: new Date().toISOString().split('T')[0],
    desc: analisis?.resumen || fd?.dificultades || 'Derivado desde ficha descriptiva.',
    notifDir: 'En proceso',
    notifFam: 'Pendiente',
    canalizo: 'No',
    instExterna: '',
    acciones: 'Derivación automática desde Ficha Descriptiva mediante análisis IA.',
    proxFecha: (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0]; })(),
    responsable: 'Trabajador/a social',
  };
  TS_CASOS.unshift(caso);
  hubToast(`📤 Caso de ${a.n} enviado a Trabajo Social`, 'ok');
}

function fichaEnviarDir() {
  const a = fichaAlumnoActual!==null ? alumnos[fichaAlumnoActual] : null;
  hubToast(a ? `🏫 Análisis de ${a.n} enviado a Dirección` : '⚠️ Selecciona alumno','ok');
}

function fichaExportarAnalisis() { hubToast('⬇ Exportando análisis en PDF…'); }

function fichaExportar() { hubToast('⬇ Exportando fichas en PDF…'); }

// ── Tabs de la ficha ──
function fichaTab(tab, btn) {
  document.querySelectorAll('#fichas-contenido .ficha-tab-content').forEach(t=>t.style.display='none');
  document.querySelectorAll('#fichas-contenido .tab-btn').forEach(b=>b.classList.remove('active'));
  const el = document.getElementById('ftab-'+tab);
  if (el) el.style.display='block';
  const btns = document.querySelectorAll('#fichas-contenido .tab-btn');
  const tabMap = {perfil:0,academico:1,conductual:2,aprendizaje:3,observaciones:4,'analisis-ia':5};
  const idx = tabMap[tab];
  if (idx!==undefined && btns[idx]) btns[idx].classList.add('active');
  // Show/hide correct empty state
  if(tab==='analisis-ia') {
    const hasResult = document.getElementById('fd-analisis-resultado')?.style.display !== 'none';
    document.getElementById('fd-analisis-empty').style.display = hasResult ? 'none' : 'block';
  }
}

// Helpers
function setEl(id, v) { const e=document.getElementById(id); if(e) e.textContent=v; }
function setVal(id, v) { const e=document.getElementById(id); if(e) e.value=v||''; }
function getVal(id) { return document.getElementById(id)?.value||''; }

