// SIEMBRA — cotejo.js
// Extraído automáticamente de index.html
// Parte del refactoring Fase 3.2

// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// MÓDULO COTEJO / TAREAS v2
// Calificación numérica 5-10 · Notas seleccionables · Análisis IA
// ══════════════════════════════════════════════════════════════════════

// Notas pedagógicas predefinidas — el docente las marca por alumno
const CT_NOTAS = {
  positivo: [
    { id:'buena_letra',    ico:'✍️', txt:'Buena letra y presentación' },
    { id:'participacion',  ico:'🙋', txt:'Participa activamente' },
    { id:'creatividad',    ico:'💡', txt:'Muestra creatividad' },
    { id:'puntual',        ico:'⏰', txt:'Entregó a tiempo' },
    { id:'esfuerzo',       ico:'💪', txt:'Se nota el esfuerzo' },
    { id:'comprension',    ico:'🎯', txt:'Comprende el tema' },
    { id:'ayuda_pares',    ico:'🤝', txt:'Ayuda a sus compañeros' },
  ],
  mejorar: [
    { id:'ortografia',     ico:'🔤', txt:'Mejorar ortografía' },
    { id:'redaccion',      ico:'📝', txt:'Mejorar redacción' },
    { id:'presentacion',   ico:'📋', txt:'Mejorar presentación' },
    { id:'copiado',        ico:'🚫', txt:'No copiar — trabajo propio' },
    { id:'incompleto',     ico:'📌', txt:'Trabajo incompleto' },
    { id:'comprension_b',  ico:'🔄', txt:'Repasar el tema' },
    { id:'atencion',       ico:'👀', txt:'Mejorar atención en clase' },
    { id:'puntualidad',    ico:'⌚', txt:'Entregar a tiempo' },
    { id:'esfuerzo_b',     ico:'📈', txt:'Se puede esforzar más' },
    { id:'orden',          ico:'📦', txt:'Organizar mejor el trabajo' },
  ]
};

// Estado central: { [tareaId]: { [alumnoIdx]: { cal, notas:[], obs } } }
let CT_DATA = {};
let CT_TAREAS = []; // array de tareas con criterios
let CT_TAREA_ACTIVA = null;

// Alias para compatibilidad con código antiguo
let TAREAS_DATA = [];

function tareasInit() {
  TAREAS_DATA = JSON.parse(localStorage.getItem('siembra_tareas')||'[]');
  CT_TAREAS = TAREAS_DATA;
  ctInit();
}

function ctInit() {
  // Poblar selector de materias en modal nueva actividad
  const matSel = document.getElementById('ct-new-materia');
  if (matSel) {
    const mats = window._materiasDocente || MATERIAS_NEM;
    matSel.innerHTML = '<option value="">— Seleccionar —</option>' +
      mats.map(m => `<option value="${m}">${m}</option>`).join('');
  }
  // Render grupos panel
  ctRenderGrupos();
  // Poblar selector de tareas en cotejo (backward compat)
  ctPoblarSelectorTareas();
  // Init rubrica items in modal (if function exists)
  if (typeof ctRenderRubricaItems === 'function') ctRenderRubricaItems();
  tareasRender();

  // Auto-seleccionar primer grupo en demo
  const grupos = window._gruposDocente || [];
  const gruposDemo = grupos.length ? grupos : [
    { id:'g1', nombre:'2° K', nivel:'secundaria', grado:2, grupo:'K', alumno_count:35 },
    { id:'g2', nombre:'6° A', nivel:'primaria', grado:6, grupo:'A', alumno_count:28 },
    { id:'g3', nombre:'3° B', nivel:'secundaria', grado:3, grupo:'B', alumno_count:32 },
  ];
  if (gruposDemo.length && !CT_GRUPO_SELECCIONADO) {
    setTimeout(() => ctSeleccionarGrupo(gruposDemo[0].id), 100);
  }
}

// ── RUBRICA PRESETS ──
const RUBRICA_PRESETS = {
  nem_basica: [
    { nombre: 'Comprensión del tema',   peso: 30 },
    { nombre: 'Participación activa',   peso: 20 },
    { nombre: 'Trabajo colaborativo',   peso: 20 },
    { nombre: 'Reflexión personal',     peso: 15 },
    { nombre: 'Presentación',           peso: 15 },
  ],
  nem_proyecto: [
    { nombre: 'Investigación y contenido', peso: 25 },
    { nombre: 'Creatividad e innovación',  peso: 20 },
    { nombre: 'Trabajo en equipo',         peso: 15 },
    { nombre: 'Presentación oral',         peso: 20 },
    { nombre: 'Impacto comunitario',       peso: 10 },
    { nombre: 'Autoevaluación',            peso: 10 },
  ],
  exposicion: [
    { nombre: 'Dominio del tema',      peso: 30 },
    { nombre: 'Claridad al exponer',   peso: 25 },
    { nombre: 'Material de apoyo',     peso: 15 },
    { nombre: 'Manejo del tiempo',     peso: 10 },
    { nombre: 'Respuesta a preguntas', peso: 10 },
    { nombre: 'Presencia y postura',   peso: 10 },
  ],
  participacion: [
    { nombre: 'Aporta ideas relevantes', peso: 30 },
    { nombre: 'Escucha activa',          peso: 25 },
    { nombre: 'Respeto al participar',   peso: 20 },
    { nombre: 'Frecuencia de participación', peso: 15 },
    { nombre: 'Actitud positiva',        peso: 10 },
  ],
  trabajo_escrito: [
    { nombre: 'Contenido y profundidad', peso: 30 },
    { nombre: 'Redacción y coherencia',  peso: 25 },
    { nombre: 'Ortografía y gramática',  peso: 15 },
    { nombre: 'Presentación y formato',  peso: 15 },
    { nombre: 'Fuentes y referencias',   peso: 15 },
  ],
  custom: [
    { nombre: 'Criterio 1', peso: 50 },
    { nombre: 'Criterio 2', peso: 50 },
  ],
};

let CT_RUBRICA_ITEMS = [];

function ctRenderRubricaItems() {
  if (!CT_RUBRICA_ITEMS.length) {
    CT_RUBRICA_ITEMS = RUBRICA_PRESETS.nem_basica.map(r => ({...r}));
  }
  const wrap = document.getElementById('ct-rubrica-items');
  if (!wrap) return;
  wrap.innerHTML = CT_RUBRICA_ITEMS.map((r, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:white;border:1px solid #e2e8f0;border-radius:8px;">
      <input type="text" value="${r.nombre}" placeholder="Nombre del criterio"
        style="flex:1;border:none;background:transparent;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;outline:none;"
        onchange="CT_RUBRICA_ITEMS[${i}].nombre=this.value">
      <input type="number" min="0" max="100" step="5" value="${r.peso}"
        style="width:55px;padding:4px 6px;border:1px solid #e2e8f0;border-radius:6px;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;text-align:center;outline:none;"
        onchange="CT_RUBRICA_ITEMS[${i}].peso=parseInt(this.value)||0;ctActualizarRubricaSuma()">
      <span style="font-size:11px;color:var(--gris-50);">%</span>
      <button onclick="CT_RUBRICA_ITEMS.splice(${i},1);ctRenderRubricaItems()"
        style="width:24px;height:24px;border:none;background:#fee2e2;color:#b91c1c;border-radius:6px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>`).join('');
  ctActualizarRubricaSuma();
}

function ctActualizarRubricaSuma() {
  const suma = CT_RUBRICA_ITEMS.reduce((s,r) => s + (r.peso||0), 0);
  const el = document.getElementById('ct-rubrica-suma');
  if (el) {
    el.textContent = `Suma: ${suma}%`;
    el.style.color = suma === 100 ? '#15803d' : suma > 100 ? '#b91c1c' : '#a16207';
  }
}

function ctAgregarRubricaItem() {
  CT_RUBRICA_ITEMS.push({ nombre: 'Nuevo criterio', peso: 0 });
  ctRenderRubricaItems();
}

function ctCargarPresetRubrica(preset) {
  if (!preset || !RUBRICA_PRESETS[preset]) return;
  CT_RUBRICA_ITEMS = RUBRICA_PRESETS[preset].map(r => ({...r}));
  ctRenderRubricaItems();
}

async function ctRubricaSugerenciaIA() {
  const titulo = document.getElementById('ct-new-titulo')?.value || '';
  const materia = document.getElementById('ct-new-materia')?.value || '';
  const tipo = document.querySelector('input[name="ct-tipo"]:checked')?.value || 'tarea';
  const nivel = window._nivelActivo || 'primaria';

  const sugerenciaDiv = document.getElementById('ct-ia-sugerencia');
  const textoDiv = document.getElementById('ct-ia-texto');
  sugerenciaDiv.style.display = 'block';
  textoDiv.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;"></div> Generando sugerencia…</div>';

  try {
    const prompt = `Eres un asesor pedagógico de ${nivel} en México (NEM).
El docente creó una actividad:
- Título: ${titulo || 'Actividad sin título'}
- Materia: ${materia || 'General'}
- Tipo: ${tipo}
- Nivel: ${nivel}

Sugiere una rúbrica de evaluación con 4-6 criterios y sus pesos (que sumen 100%).
${nivel === 'secundaria' ? 'Las calificaciones serán SIEMPRE numéricas (5-10).' : 'Puede ser evaluación formativa o numérica.'}

Responde en formato JSON así:
{"criterios":[{"nombre":"...","peso":...,"descripcion":"..."}],"nota":"Breve sugerencia pedagógica"}

Solo el JSON, sin backticks ni introducción.`;

    const text = await callAI({ feature: 'rubrica_sugerencia', prompt, system: 'Responde solo JSON válido.' });
    const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
    
    window._sugerenciaRubricaIA = parsed;
    textoDiv.innerHTML = `<div style="margin-bottom:8px;font-weight:600;">Rúbrica sugerida:</div>` +
      (parsed.criterios||[]).map(c => `<div style="margin-bottom:4px;">• <strong>${c.nombre}</strong> (${c.peso}%) — ${c.descripcion||''}</div>`).join('') +
      (parsed.nota ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.2);font-style:italic;">${parsed.nota}</div>` : '');
  } catch(e) {
    // Fallback sugerencia local
    const fallback = RUBRICA_PRESETS[tipo === 'exposicion' ? 'exposicion' : tipo === 'participacion' ? 'participacion' : 'nem_basica'];
    window._sugerenciaRubricaIA = { criterios: fallback.map(r => ({...r, descripcion:''})), nota:'Sugerencia basada en plantillas predefinidas NEM.' };
    textoDiv.innerHTML = `<div style="margin-bottom:8px;font-weight:600;">Rúbrica sugerida (plantilla NEM):</div>` +
      fallback.map(c => `<div style="margin-bottom:4px;">• <strong>${c.nombre}</strong> (${c.peso}%)</div>`).join('') +
      `<div style="margin-top:8px;font-style:italic;">Puedes personalizar estos criterios según tu planeación.</div>`;
  }
}

function ctAplicarSugerenciaIA() {
  const sug = window._sugerenciaRubricaIA;
  if (!sug?.criterios) return;
  CT_RUBRICA_ITEMS = sug.criterios.map(c => ({ nombre: c.nombre, peso: c.peso }));
  ctRenderRubricaItems();
  document.getElementById('ct-ia-sugerencia').style.display = 'none';
  hubToast('✅ Rúbrica IA aplicada', 'ok');
}

function ctConfigRubrica() {
  // Open the aspectos config modal for current materia
  if (typeof calAbrirConfigAspectos === 'function') calAbrirConfigAspectos();
}

// ── RÚBRICAS NEM CON NIVELES DESCRIPTIVOS ──
const RUBRICAS_NEM = {
  exposicion: {
    nombre: 'Exposición oral',
    criterios: [
      { nombre:'Contenido', desc:'¿El contenido ha sido adecuado a la temática?',
        niveles:['Se ha profundizado en los temas','Se han cubierto diferentes temas','Ideas correctas pero incompletas','Ideas simplistas'] },
      { nombre:'Estructura', desc:'¿La presentación estaba estructurada?',
        niveles:['Secciones planificadas para una presentación global','Se ha intentando relacionar las diferentes explicaciones','Secuencia correcta pero las secciones aparecen aisladas','Mal estructurado y difícil de entender'] },
      { nombre:'Organización', desc:'¿El equipo ha organizado bien la exposición?',
        niveles:['Tono apropiado y lenguaje preciso. Ha hecho participar al público','Fluida. El público sigue con interés','Clara y entendedora en general','Poco clara. Difícil de seguir'] },
      { nombre:'Materiales', desc:'¿Los materiales usados ayudaban?',
        niveles:['Muy interesantes y atractivos. Han sido un excelente soporte','Adecuados, han ayudado a entender conceptos','Adecuados, aunque no los han sabido aprovechar','Pocos y nada acertados'] },
      { nombre:'Equipo', desc:'¿Cómo ha trabajado el equipo?',
        niveles:['Muestra planificación y trabajo de grupo','Todos los miembros muestran conocer la presentación global','Muestra cierta planificación','Demasiado individualista'] },
    ]
  },
  participacion: {
    nombre: 'Participación',
    criterios: [
      { nombre:'Aportes', desc:'¿Aporta ideas relevantes al tema?',
        niveles:['Aporta ideas originales y relevantes constantemente','Aporta ideas que contribuyen a la discusión','Participa pero con aportes básicos','No aporta ideas significativas'] },
      { nombre:'Escucha', desc:'¿Escucha activamente a sus compañeros?',
        niveles:['Escucha con atención y retoma ideas de otros','Escucha con respeto la mayoría del tiempo','Escucha pero se distrae con frecuencia','No presta atención a los demás'] },
      { nombre:'Respeto', desc:'¿Muestra respeto al participar?',
        niveles:['Siempre respetuoso, pide la palabra y valora opiniones','Generalmente respetuoso','A veces interrumpe o no respeta turnos','Falta de respeto frecuente'] },
      { nombre:'Actitud', desc:'¿Muestra actitud positiva hacia el aprendizaje?',
        niveles:['Muy motivado, inspira a sus compañeros','Actitud positiva y dispuesto a aprender','Actitud indiferente','Actitud negativa o de rechazo'] },
    ]
  },
  proyecto: {
    nombre: 'Proyecto integrador NEM',
    criterios: [
      { nombre:'Investigación', desc:'¿El proyecto demuestra investigación?',
        niveles:['Investigación profunda con fuentes variadas y confiables','Investigación adecuada con fuentes pertinentes','Investigación básica, pocas fuentes','Sin investigación evidente'] },
      { nombre:'Creatividad', desc:'¿Demuestra creatividad e innovación?',
        niveles:['Propuesta original e innovadora que sorprende','Muestra creatividad en su desarrollo','Algunos elementos creativos','Sin creatividad, copia de modelos'] },
      { nombre:'Presentación', desc:'¿La presentación es clara y ordenada?',
        niveles:['Excelente presentación, limpia y profesional','Buena presentación, clara y ordenada','Presentación aceptable pero mejorable','Desordenado y poco claro'] },
      { nombre:'Impacto', desc:'¿Tiene impacto comunitario o social?',
        niveles:['Impacto claro y significativo en la comunidad','Se identifica un beneficio social','Mención de beneficio pero poco desarrollado','Sin relación con la comunidad'] },
      { nombre:'Reflexión', desc:'¿Incluye reflexión personal sobre el aprendizaje?',
        niveles:['Reflexión profunda que conecta con su vida','Reflexión clara sobre lo aprendido','Reflexión superficial','Sin reflexión personal'] },
    ]
  },
  aprend: {
    nombre: 'Aprendizaje formativo (NEM)',
    criterios: [
      { nombre:'Comprensión', desc:'¿Demuestra comprensión del tema?',
        niveles:['Comprensión profunda, explica con sus propias palabras','Comprende los conceptos principales','Comprensión parcial, requiere apoyo','No demuestra comprensión'] },
      { nombre:'Aplicación', desc:'¿Aplica lo aprendido en nuevas situaciones?',
        niveles:['Aplica en contextos diversos y propone soluciones','Aplica correctamente en situaciones similares','Aplica con apoyo del docente','No logra aplicar lo aprendido'] },
      { nombre:'Colaboración', desc:'¿Trabaja de forma colaborativa?',
        niveles:['Lidera y motiva al equipo constructivamente','Colabora activamente con sus compañeros','Colabora cuando se le pide','No colabora con el equipo'] },
      { nombre:'Autonomía', desc:'¿Muestra autonomía en su trabajo?',
        niveles:['Trabaja de forma autónoma y busca ampliar','Realiza el trabajo con poca supervisión','Necesita apoyo constante para avanzar','Dependiente total del docente'] },
    ]
  },
};

let CT_EVAL_TIPO = 'carita'; // 'carita' | 'rubrica'
let CT_RUBRICA_SEL = null;   // key de RUBRICAS_NEM
let RB_ALUMNO_IDX = null;
let RB_ACT_IDX = null;
let RB_SCORES = {};  // { [criterioIdx]: 1-4 }

function ctNuevaActividad() {
  // Open modal, init
  const modal = document.getElementById('ct-modal-tarea');
  modal.style.display = 'flex';
  // Poblar materias
  const matSel = document.getElementById('ct-new-materia');
  if (matSel) {
    const mats = window._materiasDocente || MATERIAS_NEM;
    matSel.innerHTML = '<option value="">— Seleccionar —</option>' +
      mats.map(m => `<option value="${m}">${m}</option>`).join('');
  }
  // Render rubricas lista
  ctRenderRubricasLista();
  CT_EVAL_TIPO = 'carita';
  ctSelTipoEval('carita');
}

function ctSelTipoEval(tipo) {
  CT_EVAL_TIPO = tipo;
  const caritaBtn = document.getElementById('ct-eval-carita');
  const rubricaBtn = document.getElementById('ct-eval-rubrica');
  const rubricaCfg = document.getElementById('ct-rubrica-config');
  if (caritaBtn) { caritaBtn.style.borderColor = tipo==='carita' ? 'var(--verde)' : 'var(--gris-20)'; caritaBtn.style.background = tipo==='carita' ? 'var(--verde-light)' : 'white'; }
  if (rubricaBtn) { rubricaBtn.style.borderColor = tipo==='rubrica' ? 'var(--verde)' : 'var(--gris-20)'; rubricaBtn.style.background = tipo==='rubrica' ? 'var(--verde-light)' : 'white'; }
  if (rubricaCfg) rubricaCfg.style.display = tipo==='rubrica' ? '' : 'none';
}

function ctRenderRubricasLista() {
  const wrap = document.getElementById('ct-rubricas-lista');
  if (!wrap) return;
  wrap.innerHTML = Object.entries(RUBRICAS_NEM).map(([key, rb]) => {
    const isActive = CT_RUBRICA_SEL === key;
    return `<button onclick="CT_RUBRICA_SEL='${key}';ctRenderRubricasLista()"
      style="padding:10px 14px;border:1.5px solid ${isActive?'var(--verde)':'#e2e8f0'};border-radius:10px;
             background:${isActive?'var(--verde-light)':'white'};cursor:pointer;text-align:left;
             font-family:'Sora',sans-serif;transition:.15s;">
      <div style="font-size:13px;font-weight:${isActive?'700':'500'};color:${isActive?'var(--verde)':'var(--gris-80)'};">${rb.nombre}</div>
      <div style="font-size:11px;color:var(--gris-50);margin-top:2px;">${rb.criterios.length} criterios · 4 niveles</div>
    </button>`;
  }).join('');
}

function ctCrearRubricaCustom() {
  hubToast('🚧 Editor de rúbricas personalizadas — próximamente', 'ok');
}

// ── GRUPOS Y ALUMNOS ──
let CT_GRUPO_SELECCIONADO = null;
let CT_ACTIVIDADES_GRUPO = {}; // { [grupoId]: [ {id, titulo, subtitulo, materia, fecha, tipo_eval, rubrica} ] }

function ctRenderGrupos() {
  const lista = document.getElementById('ct-grupos-lista');
  if (!lista) return;
  const grupos = window._gruposDocente || [];
  const gruposRender = grupos.length ? grupos : [
    { id:'g1', nombre:'2° K', nivel:'secundaria', grado:2, grupo:'K', alumno_count:35 },
    { id:'g2', nombre:'6° A', nivel:'primaria', grado:6, grupo:'A', alumno_count:28 },
    { id:'g3', nombre:'3° B', nivel:'secundaria', grado:3, grupo:'B', alumno_count:32 },
  ];
  lista.innerHTML = gruposRender.map(g => {
    const isActive = CT_GRUPO_SELECCIONADO === g.id;
    const cnt = g.alumno_count || (window._alumnosActivos || alumnos).length;
    return `<button onclick="ctSeleccionarGrupo('${g.id}')" 
      style="width:100%;padding:12px 14px;border:1.5px solid ${isActive?'var(--verde)':'transparent'};
             border-radius:10px;background:${isActive?'var(--verde-light)':'transparent'};cursor:pointer;
             font-family:'Sora',sans-serif;text-align:left;margin-bottom:2px;transition:.15s;"
      onmouseover="if(!${isActive})this.style.background='#f8fafc'"
      onmouseout="if(!${isActive})this.style.background='transparent'">
      <div style="font-weight:700;font-size:14px;color:${isActive?'var(--verde)':'var(--gris-80)'};">${g.nombre || `${g.grado}° ${g.grupo}`}</div>
      <div style="font-size:11px;color:var(--gris-50);margin-top:2px;">${cnt} alumnos</div>
    </button>`;
  }).join('');
}

async function ctSeleccionarGrupo(grupoId) {
  CT_GRUPO_SELECCIONADO = grupoId;
  ctRenderGrupos();
  const tituloEl = document.getElementById('ct-grupo-titulo');
  const countEl = document.getElementById('ct-grupo-count');
  const wrapEl = document.getElementById('ct-alumnos-actividades');
  const grupo = (window._gruposDocente || []).find(g => g.id === grupoId) ||
    [{ id:'g1', nombre:'2° K' },{ id:'g2', nombre:'6° A' },{ id:'g3', nombre:'3° B' }].find(g => g.id === grupoId);
  if (tituloEl) tituloEl.textContent = grupo ? (grupo.nombre || `${grupo.grado}° ${grupo.grupo}`) : 'Grupo';

  // Load students
  let alumnosGrupo = [];
  if (sb && grupoId && !grupoId.startsWith('g')) {
    try { alumnosGrupo = await calCargarAlumnosGrupo(grupoId); } catch(e) {}
  }
  if (!alumnosGrupo.length) {
    // Demo students with realistic names
    alumnosGrupo = [
      {n:'ALVARADO LOZANO, LEONARDO DANIEL',id:'d1'},{n:'BOCANEGRA HERNANDEZ, DEVANY ARLETH',id:'d2'},
      {n:'CAMPUZANO GOMEZ, BELLA JOCABET',id:'d3'},{n:'COLUNGA BARRIOS, CARLOS MATEO',id:'d4'},
      {n:'CORONA PONCE, LUIS REY',id:'d5'},{n:'CRUZ ALAMILLA, KEYLI YARENDI',id:'d6'},
      {n:'CUELLAR BAUTISTA, LIONEL',id:'d7'},{n:'DEL ANGEL GUADARRAMA, AXEL EDUARDO',id:'d8'},
      {n:'DOMINGUEZ FLORES, KARLA LIZBETH',id:'d9'},{n:'ESPIRICUETA RUIZ, EDGAR ALEXIS',id:'d10'},
      {n:'GALLEGOS HERNANDEZ, NUVIA ESTRELLA',id:'d11'},{n:'GARCIA LEIJA, EDSON YEHOSHAFAT',id:'d12'},
      {n:'GRAJALES GONZALEZ, KRISTEL GUADALUPE',id:'d13'},{n:'GUZMAN BUSTOS, JESUS EDUARDO',id:'d14'},
      {n:'GUZMAN GARCIA, VALERIA ALEJANDRA',id:'d15'},
    ];
    // Also store as window for rubrica modal
    window._alumnosActivos = alumnosGrupo;
  }
  if (countEl) countEl.textContent = `${alumnosGrupo.length} alumnos`;

  // Get or create demo activities with pre-filled scores
  if (!CT_ACTIVIDADES_GRUPO[grupoId]) {
    CT_ACTIVIDADES_GRUPO[grupoId] = [
      { id:'act_'+grupoId+'_1', titulo:'Portada', subtitulo:'13:33', materia:'Ciencias', tipo_eval:'carita', rubrica:null },
      { id:'act_'+grupoId+'_2', titulo:'Ex Firmado', subtitulo:'ACT 2', materia:'Ciencias', tipo_eval:'carita', rubrica:null },
      { id:'act_'+grupoId+'_3', titulo:'Transf de calor', subtitulo:'Act 3', materia:'Ciencias', tipo_eval:'carita', rubrica:'aprend' },
      { id:'act_'+grupoId+'_4', titulo:'electricidad', subtitulo:'Actividades 5', materia:'Ciencias', tipo_eval:'rubrica', rubrica:'exposicion' },
    ];
    // Pre-fill demo scores
    const acts = CT_ACTIVIDADES_GRUPO[grupoId];
    alumnosGrupo.forEach((a, ai) => {
      acts.forEach((act, aci) => {
        if (!CT_DATA[act.id]) CT_DATA[act.id] = {};
        // Generate realistic demo scores — some students better than others
        const baseScore = [5, 5, 5, 10, 5, 5, 5, 10, 5, 8, 5, 10, 5, 6, 5][ai] || 5;
        const variation = aci === 3 ? baseScore : (ai % 3 === 0 ? 10 : ai % 3 === 1 ? 5 : 8);
        CT_DATA[act.id][ai] = {
          cal: aci === 3 ? baseScore : variation, // Last column = numeric, others = caritas
          notas: [], obs: '',
          entregada: true,
        };
      });
    });
  }
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId];

  // Render spreadsheet with emojis
  if (!wrapEl) return;

  const emojiFromScore = (score) => {
    if (score === null || score === undefined) return '<span style="font-size:20px;opacity:.3;">○</span>';
    if (score >= 9) return '<span style="font-size:20px;">😊</span>';
    if (score >= 7) return '<span style="font-size:20px;">🙂</span>';
    if (score >= 6) return '<span style="font-size:20px;">😐</span>';
    return '<span style="font-size:20px;">😟</span>';
  };

  const actHeaders = actividades.map((a, ai) =>
    `<th style="padding:8px 6px;text-align:center;font-size:11px;min-width:90px;border-bottom:2px solid #e2e8f0;cursor:pointer;position:relative;"
        onclick="ctEditarColumna(${ai},'${grupoId}')">
      <div style="font-weight:700;color:#c2720c;font-size:12px;">${a.titulo}</div>
      <div style="font-size:10px;font-weight:400;color:var(--gris-50);">${a.subtitulo||''}</div>
    </th>`).join('') +
    `<th style="padding:8px 6px;text-align:center;min-width:50px;border-bottom:2px solid #e2e8f0;">
      <button onclick="ctNuevaActividad()" style="width:32px;height:32px;border-radius:50%;border:2px solid #e2e8f0;background:white;cursor:pointer;font-size:16px;color:var(--gris-50);" title="Agregar actividad">+</button>
    </th>`;

  const rows = alumnosGrupo.map((a, ai) => {
    const nombre = a.n || `${a.nombre||''} ${a.apellido_p||''}`.trim();
    const celdas = actividades.map((act, aci) => {
      const rec = CT_DATA[act.id]?.[ai] || {};
      const score = rec.cal;
      const numVal = score !== null && score !== undefined ? score : '';
      const isRubrica = act.tipo_eval === 'rubrica' || act.rubrica;
      return `<td style="padding:6px;text-align:center;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:.1s;"
                  onclick="${isRubrica ? `ctAbrirRubrica(${ai},${aci},'${grupoId}')` : `ctCiclarCarita(${ai},${aci},'${grupoId}')`}"
                  onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''"
                  id="ct-cell-${ai}-${aci}">
        ${act.tipo_eval === 'rubrica' || act.tipo_eval === 'numerico'
          ? `<span style="font-size:15px;font-weight:700;color:${score>=9?'#15803d':score>=7?'#a16207':score>=5?'#b91c1c':'var(--gris-50)'};">${numVal || '0,5'}</span>`
          : emojiFromScore(score)}
      </td>`;
    }).join('');

    return `<tr style="${ai%2===0?'':'background:#fafbfc;'}">
      <td style="padding:10px 14px;font-weight:600;font-size:12px;border-bottom:1px solid #f1f5f9;white-space:nowrap;position:sticky;left:0;background:${ai%2===0?'white':'#fafbfc'};z-index:1;max-width:280px;overflow:hidden;text-overflow:ellipsis;">
        <span style="color:var(--gris-50);margin-right:4px;">${ai+1}.</span> ${nombre}
        <span style="color:var(--gris-50);font-size:16px;margin-left:4px;">👤</span>
      </td>
      ${celdas}
      <td style="border-bottom:1px solid #f1f5f9;"></td>
    </tr>`;
  }).join('');

  wrapEl.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:white;">
      <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--gris-50);min-width:240px;position:sticky;left:0;background:white;z-index:2;border-bottom:2px solid #e2e8f0;">Actividades</th>
      ${actHeaders}
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function ctCiclarCarita(ai, aci, grupoId) {
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId] || [];
  const act = actividades[aci];
  if (!act) return;
  if (!CT_DATA[act.id]) CT_DATA[act.id] = {};
  if (!CT_DATA[act.id][ai]) CT_DATA[act.id][ai] = { cal: null, notas: [], obs: '', entregada: false };
  const rec = CT_DATA[act.id][ai];
  // Cycle: null → 10 → 8 → 6 → 5 → null
  const cycle = [null, 10, 8, 6, 5];
  const idx = cycle.indexOf(rec.cal);
  rec.cal = cycle[(idx + 1) % cycle.length];
  rec.entregada = rec.cal !== null;
  ctSeleccionarGrupo(grupoId); // Re-render
}

function ctAbrirRubrica(ai, aci, grupoId) {
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId] || [];
  const act = actividades[aci];
  if (!act) return;
  // Get students from the grupo's loaded data
  const alumnosGrupo = window._alumnosActivos || alumnos || [];
  const alumno = alumnosGrupo[ai] || { n: `Alumno ${ai+1}` };

  RB_ALUMNO_IDX = ai;
  RB_ACT_IDX = aci;
  RB_SCORES = {};
  window._rbGrupoId = grupoId;

  document.getElementById('rb-alumno-nombre').textContent = alumno.n || `${alumno.nombre||''} ${alumno.apellido_p||''}`.trim();
  document.getElementById('rb-actividad-nombre').textContent = `${act.titulo} · ${act.materia||''}`;

  // Get rubrica
  const rubricaKey = act.rubrica || 'aprend';
  const rubrica = RUBRICAS_NEM[rubricaKey] || RUBRICAS_NEM.aprend;

  // Load existing scores
  const rec = CT_DATA[act.id]?.[ai] || {};
  if (rec.rubrica_scores) RB_SCORES = {...rec.rubrica_scores};

  // Render criterios
  const body = document.getElementById('rb-criterios-body');
  body.innerHTML = rubrica.criterios.map((c, ci) => {
    const selected = RB_SCORES[ci] || 0;
    return `<div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:10px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:140px;padding:12px;vertical-align:top;border-right:1px solid #f1f5f9;background:#fafbfc;">
            <div style="font-weight:700;font-size:13px;">${c.nombre}</div>
            <div style="font-size:11px;color:var(--gris-50);margin-top:4px;line-height:1.4;">${c.desc}</div>
          </td>
          ${c.niveles.map((n, ni) => {
            const score = 4 - ni; // 4,3,2,1
            const isSelected = selected === score;
            const bgColor = isSelected ? (score>=4?'#dcfce7':score>=3?'#fef9c3':score>=2?'#fff7ed':'#fee2e2') : 'white';
            const borderColor = isSelected ? (score>=4?'#22c55e':score>=3?'#eab308':score>=2?'#f97316':'#ef4444') : 'transparent';
            return `<td onclick="rbSeleccionar(${ci},${score})" 
              style="padding:10px 12px;font-size:11px;line-height:1.5;color:var(--gris-80);cursor:pointer;
                     border-right:1px solid #f1f5f9;background:${bgColor};border-top:3px solid ${borderColor};
                     transition:.15s;vertical-align:top;width:${Math.floor(60/c.niveles.length)}%;"
              onmouseover="this.style.background='${isSelected?bgColor:'#f8fafc'}'"
              onmouseout="this.style.background='${bgColor}'"
              id="rb-cell-${ci}-${score}">${n}</td>`;
          }).join('')}
        </tr>
      </table>
    </div>`;
  }).join('');

  rbCalcNota();
  document.getElementById('ct-modal-rubrica').style.display = 'flex';
}

function rbSeleccionar(ci, score) {
  RB_SCORES[ci] = score;
  // Update visual — re-render the entire rubrica to update selection
  ctAbrirRubrica(RB_ALUMNO_IDX, RB_ACT_IDX, window._rbGrupoId);
}

function rbCalcNota() {
  const scores = Object.values(RB_SCORES);
  if (!scores.length) { document.getElementById('rb-nota-final').textContent = '—'; return; }
  // Average of scores (1-4) mapped to 5-10
  const avg = scores.reduce((s,v) => s+v, 0) / scores.length;
  // Map: 4→10, 3→8, 2→6, 1→5
  const nota = Math.round((avg / 4) * 5 + 5);
  const notaFinal = Math.min(10, Math.max(5, nota));
  document.getElementById('rb-nota-final').textContent = notaFinal;
}

function rbGuardar() {
  const grupoId = window._rbGrupoId;
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId] || [];
  const act = actividades[RB_ACT_IDX];
  if (!act) return;

  const scores = Object.values(RB_SCORES);
  const avg = scores.length ? scores.reduce((s,v)=>s+v,0)/scores.length : 0;
  const nota = scores.length ? Math.min(10, Math.max(5, Math.round((avg/4)*5+5))) : null;

  if (!CT_DATA[act.id]) CT_DATA[act.id] = {};
  if (!CT_DATA[act.id][RB_ALUMNO_IDX]) CT_DATA[act.id][RB_ALUMNO_IDX] = { cal: null, notas: [], obs: '', entregada: false };
  CT_DATA[act.id][RB_ALUMNO_IDX].cal = nota;
  CT_DATA[act.id][RB_ALUMNO_IDX].entregada = nota !== null;
  CT_DATA[act.id][RB_ALUMNO_IDX].rubrica_scores = {...RB_SCORES};

  document.getElementById('ct-modal-rubrica').style.display = 'none';

  // If "saltar al siguiente"
  if (document.getElementById('rb-saltar-siguiente')?.checked) {
    const alumnosGrupo = window._alumnosActivos || alumnos;
    if (RB_ALUMNO_IDX + 1 < alumnosGrupo.length) {
      setTimeout(() => ctAbrirRubrica(RB_ALUMNO_IDX + 1, RB_ACT_IDX, grupoId), 200);
    }
  }

  ctSeleccionarGrupo(grupoId);
  hubToast('✅ Nota guardada: ' + nota + '/10', 'ok');
}

function ctEditarColumna(aci, grupoId) {
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId] || [];
  const act = actividades[aci];
  if (!act) return;
  document.getElementById('ccol-nombre').value = act.titulo || '';
  document.getElementById('ccol-tipo').value = act.tipo_eval || 'carita';
  // Poblar rúbricas select
  const sel = document.getElementById('ccol-rubrica');
  sel.innerHTML = '<option value="">Ninguna</option>' +
    Object.entries(RUBRICAS_NEM).map(([k,r]) => `<option value="${k}" ${act.rubrica===k?'selected':''}>${r.nombre}</option>`).join('');
  window._editColIdx = aci;
  window._editColGrupo = grupoId;
  document.getElementById('ct-modal-config-col').style.display = 'flex';
}

function ctGuardarConfigCol() {
  const aci = window._editColIdx;
  const grupoId = window._editColGrupo;
  const actividades = CT_ACTIVIDADES_GRUPO[grupoId];
  if (!actividades || !actividades[aci]) return;
  actividades[aci].titulo = document.getElementById('ccol-nombre').value || actividades[aci].titulo;
  actividades[aci].tipo_eval = document.getElementById('ccol-tipo').value || 'carita';
  actividades[aci].rubrica = document.getElementById('ccol-rubrica').value || null;
  document.getElementById('ct-modal-config-col').style.display = 'none';
  ctSeleccionarGrupo(grupoId);
  hubToast('✅ Columna actualizada', 'ok');
}

function ctEliminarActividad() {
  if (!confirm('¿Eliminar esta actividad?')) return;
  const aci = window._editColIdx;
  const grupoId = window._editColGrupo;
  CT_ACTIVIDADES_GRUPO[grupoId]?.splice(aci, 1);
  document.getElementById('ct-modal-config-col').style.display = 'none';
  ctSeleccionarGrupo(grupoId);
}

function ctAbrirConfigColumna() {
  // Open config for first activity
  const grupoId = CT_GRUPO_SELECCIONADO;
  if (!grupoId) { hubToast('Selecciona un grupo primero', 'warn'); return; }
  const acts = CT_ACTIVIDADES_GRUPO[grupoId];
  if (acts?.length) ctEditarColumna(0, grupoId);
}

function ctGuardarCalGrupo(actId, ai, val) {
  if (!CT_DATA[actId]) CT_DATA[actId] = {};
  if (!CT_DATA[actId][ai]) CT_DATA[actId][ai] = { cal: null, notas: [], obs: '' };
  CT_DATA[actId][ai].cal = val ? parseFloat(val) : null;
  CT_DATA[actId][ai].entregada = !!val;
}

function ctTab(tab) {
  ['grupos','cotejo','analisis'].forEach(t => {
    const btn = document.getElementById('ct-tab-'+t);
    const pan = document.getElementById('ct-panel-'+t);
    const active = t === tab;
    if (btn) { btn.style.background = active?'white':'transparent'; btn.style.color = active?'var(--verde)':'var(--gris-50)'; btn.style.fontWeight = active?'700':'600'; btn.style.boxShadow = active?'0 1px 3px rgba(0,0,0,.08)':'none'; }
    if (pan) pan.style.display = active?'':'none';
  });
  if (tab === 'grupos')   ctRenderGrupos();
  if (tab === 'analisis') ctMostrarAnalisis();
}

function ctPoblarSelectorTareas() {
  const sel = document.getElementById('ct-sel-tarea');
  if (!sel) return;
  const tareas = CT_TAREAS.length ? CT_TAREAS : TAREAS_DATA;
  sel.innerHTML = '<option value="">— Seleccionar tarea —</option>' +
    tareas.map((t,i) => `<option value="${i}">${t.titulo} · ${t.materia||''}</option>`).join('');
}

function ctCargarCotejo() {
  const ti = document.getElementById('ct-sel-tarea')?.value;
  if (ti === '' || ti === undefined) return;
  const tarea = (CT_TAREAS.length ? CT_TAREAS : TAREAS_DATA)[parseInt(ti)];
  if (!tarea) return;
  CT_TAREA_ACTIVA = { ...tarea, idx: parseInt(ti) };
  ctRenderTabla(CT_TAREA_ACTIVA);
}

function ctRenderTabla(tarea) {
  const wrap = document.getElementById('ct-tabla-wrap');
  if (!wrap) return;
  const listaCompleta = window._alumnosActivos || alumnos;
  if (!listaCompleta.length) {
    wrap.innerHTML = `<div style="padding:40px;text-align:center;color:var(--gris-50);">Sin alumnos registrados.</div>`;
    return;
  }
  if (!CT_DATA[tarea.id]) CT_DATA[tarea.id] = {};

  // Aplicar filtro entregado/pendiente
  const filtroActual = window._ctFiltroEstado || 'todos';
  const lista = listaCompleta.filter((a, ai) => {
    if (filtroActual === 'todos') return true;
    const rec = CT_DATA[tarea.id]?.[ai] || {};
    const entregado = rec.entregada === true || (rec.cal !== null && rec.cal !== undefined);
    return filtroActual === 'entregado' ? entregado : !entregado;
  });

  wrap.innerHTML = `
    <div style="padding:14px 16px;border-bottom:1px solid var(--gris-10);display:flex;align-items:center;justify-content:space-between;">
      <div style="font-weight:700;font-size:14px;">${tarea.titulo}</div>
      <div style="font-size:12px;color:var(--gris-50);">${tarea.materia||''} · ${tarea.fecha||''}</div>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:var(--crema);">
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;min-width:160px;">Alumno</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;min-width:90px;">Entregado</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;min-width:100px;">Calificación</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;">Notas positivas</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;">Áreas de mejora</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:var(--gris-50);text-transform:uppercase;min-width:140px;">Observación</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map((a) => {
            const ai = listaCompleta.indexOf(a);
            const nombre = a.n || `${a.nombre||''} ${a.apellido_p||''}`.trim();
            const rec = CT_DATA[tarea.id]?.[ai] || { entregada: false, cal: null, notas: [], obs: '' };
            const calVal = rec.cal ?? '';
            const entregada = rec.entregada === true || (rec.cal !== null && rec.cal !== undefined);

            const calOpts = [5,6,7,8,9,10].map(n =>
              `<option value="${n}" ${calVal==n?'selected':''}>${n}</option>`
            ).join('');

            const posChips = CT_NOTAS.positivo.map(n =>
              `<button onclick="ctToggleNota(${ai},'${n.id}','positivo')"
                style="padding:2px 7px;border-radius:99px;font-size:10px;border:1.5px solid ${rec.notas.includes(n.id)?'var(--verde)':'var(--gris-20)'};background:${rec.notas.includes(n.id)?'var(--verde-light)':'white'};color:${rec.notas.includes(n.id)?'var(--verde)':'var(--gris-50)'};cursor:pointer;margin:2px;white-space:nowrap;">
                ${n.ico} ${n.txt}
              </button>`
            ).join('');

            const mejChips = CT_NOTAS.mejorar.map(n =>
              `<button onclick="ctToggleNota(${ai},'${n.id}','mejorar')"
                style="padding:2px 7px;border-radius:99px;font-size:10px;border:1.5px solid ${rec.notas.includes(n.id)?'#ef4444':'var(--gris-20)'};background:${rec.notas.includes(n.id)?'#fee2e2':'white'};color:${rec.notas.includes(n.id)?'#b91c1c':'var(--gris-50)'};cursor:pointer;margin:2px;white-space:nowrap;">
                ${n.ico} ${n.txt}
              </button>`
            ).join('');

            return `<tr style="border-bottom:1px solid var(--gris-10);${entregada?'':'opacity:.75;'}" id="ct-row-${ai}">
              <td style="padding:12px 14px;font-weight:600;">${nombre}</td>
              <td style="padding:12px 14px;text-align:center;">
                <button onclick="ctToggleEntregada(${ai})"
                  style="padding:5px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1.5px solid ${entregada?'#86efac':'var(--gris-20)'};background:${entregada?'#f0fdf4':'white'};color:${entregada?'#15803d':'var(--gris-50)'};cursor:pointer;font-family:'Sora',sans-serif;">
                  ${entregada?'✅ Sí':'⏳ No'}
                </button>
              </td>
              <td style="padding:12px 14px;text-align:center;">
                <select onchange="ctGuardarCal(${ai},this.value)"
                  style="padding:6px 10px;border:1.5px solid ${calVal?'var(--verde)':'var(--gris-20)'};border-radius:8px;font-family:'Sora',sans-serif;font-size:14px;font-weight:700;color:${calVal>=9?'#15803d':calVal>=7?'#a16207':calVal?'#b91c1c':'var(--gris-50)'};background:${calVal>=9?'#f0fdf4':calVal>=7?'#fef9c3':calVal?'#fef2f2':'white'};outline:none;cursor:pointer;">
                  <option value="">—</option>
                  ${calOpts}
                </select>
              </td>
              <td style="padding:10px 14px;max-width:220px;"><div style="display:flex;flex-wrap:wrap;">${posChips}</div></td>
              <td style="padding:10px 14px;max-width:220px;"><div style="display:flex;flex-wrap:wrap;">${mejChips}</div></td>
              <td style="padding:10px 14px;">
                <textarea onchange="ctGuardarObs(${ai},this.value)" placeholder="Nota libre…" rows="2"
                  style="width:100%;padding:6px 8px;border:1.5px solid var(--gris-20);border-radius:6px;font-family:'Sora',sans-serif;font-size:12px;outline:none;resize:vertical;">${rec.obs||''}</textarea>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:12px 16px;background:var(--crema);border-top:1px solid var(--gris-10);font-size:12px;color:var(--gris-50);display:flex;align-items:center;gap:16px;">
      <span id="ct-prom-label" style="color:var(--gris-80);font-weight:600;"></span>
      <button onclick="ctGuardarTodoEnDB()" class="btn btn-primary btn-sm" style="margin-left:auto;">💾 Guardar en Supabase</button>
    </div>`;

  ctActualizarStats(tarea.id);
}

function ctGuardarCal(ai, val) {
  if (!CT_TAREA_ACTIVA) return;
  const tid = CT_TAREA_ACTIVA.id;
  if (!CT_DATA[tid]) CT_DATA[tid] = {};
  if (!CT_DATA[tid][ai]) CT_DATA[tid][ai] = { cal: null, notas: [], obs: '' };
  CT_DATA[tid][ai].cal = val ? parseFloat(val) : null;
  ctActualizarStats(tid);
  ctGuardarLocalStorage();
}

function ctToggleNota(ai, notaId, tipo) {
  if (!CT_TAREA_ACTIVA) return;
  const tid = CT_TAREA_ACTIVA.id;
  if (!CT_DATA[tid]) CT_DATA[tid] = {};
  if (!CT_DATA[tid][ai]) CT_DATA[tid][ai] = { cal: null, notas: [], obs: '' };
  const notas = CT_DATA[tid][ai].notas;
  const idx = notas.indexOf(notaId);
  if (idx >= 0) notas.splice(idx, 1);
  else notas.push(notaId);
  ctGuardarLocalStorage();
  // Refresh row
  ctRenderTabla(CT_TAREA_ACTIVA);
}

function ctGuardarObs(ai, val) {
  if (!CT_TAREA_ACTIVA) return;
  const tid = CT_TAREA_ACTIVA.id;
  if (!CT_DATA[tid]) CT_DATA[tid] = {};
  if (!CT_DATA[tid][ai]) CT_DATA[tid][ai] = { cal: null, notas: [], obs: '' };
  CT_DATA[tid][ai].obs = val;
  ctGuardarLocalStorage();
}

function ctActualizarStats(tid) {
  const lista = window._alumnosActivos || alumnos;
  const recs = CT_DATA[tid] || {};
  const cals = Object.values(recs).map(r => r.cal).filter(c => c !== null && c !== undefined);
  const entregados = Object.values(recs).filter(r => r.entregada === true || r.cal !== null).length;
  const pendientes = lista.length - entregados;
  const prom = cals.length ? (cals.reduce((s,c)=>s+c,0)/cals.length).toFixed(1) : null;

  const promEl = document.getElementById('ct-prom-label');
  if (promEl) promEl.textContent = `${entregados}/${lista.length} entregados · Promedio: ${prom||'—'}`;

  const stEnt = document.getElementById('ct-stat-entregados');
  const stPen = document.getElementById('ct-stat-pendientes');
  const stPro = document.getElementById('ct-stat-promedio');
  if (stEnt) { stEnt.textContent = `✅ ${entregados} entregados`; stEnt.style.display = 'inline'; }
  if (stPen) { stPen.textContent = `⏳ ${pendientes} pendientes`; stPen.style.display = 'inline'; }
  if (stPro) { stPro.textContent = `Prom: ${prom||'—'}`; stPro.style.display = 'inline'; }
}

function ctToggleEntregada(ai) {
  if (!CT_TAREA_ACTIVA) return;
  const tid = CT_TAREA_ACTIVA.id;
  if (!CT_DATA[tid]) CT_DATA[tid] = {};
  if (!CT_DATA[tid][ai]) CT_DATA[tid][ai] = { entregada: false, cal: null, notas: [], obs: '' };
  CT_DATA[tid][ai].entregada = !CT_DATA[tid][ai].entregada;
  ctGuardarLocalStorage();
  ctRenderTabla(CT_TAREA_ACTIVA);
}

function ctFiltrarEstado(estado, btn) {
  window._ctFiltroEstado = estado;
  document.querySelectorAll('[id^="ct-filtro-"]').forEach(b => {
    b.style.background = 'white';
    b.style.color = 'var(--gris-50)';
    b.style.borderColor = 'var(--gris-20)';
  });
  if (btn) {
    btn.style.background = 'var(--verde-light)';
    btn.style.color = 'var(--verde)';
    btn.style.borderColor = 'var(--verde)';
  }
  if (CT_TAREA_ACTIVA) ctRenderTabla(CT_TAREA_ACTIVA);
}

function ctGuardarLocalStorage() {
  try { localStorage.setItem('siembra_ct_data', JSON.stringify(CT_DATA)); } catch(e) {}
}

async function ctGuardarTodoEnDB() {
  if (!sb || !CT_TAREA_ACTIVA) { hubToast('ℹ️ Datos guardados localmente', 'ok'); return; }
  const lista = window._alumnosActivos || alumnos;
  const tid   = CT_TAREA_ACTIVA.id;
  const recs  = CT_DATA[tid] || {};
  let ok = 0;
  for (const [aiStr, rec] of Object.entries(recs)) {
    const ai = parseInt(aiStr);
    const alumno = lista[ai];
    if (!alumno?.id) continue;
    try {
      const entregada = rec.entregada === true || (rec.cal !== null && rec.cal !== undefined);
      await sb.from('tareas_entregas').upsert({
        tarea_id:           tid,
        alumno_id:          alumno.id,
        entregada:          entregada,
        calificacion:       rec.cal || null,
        notas:              rec.notas || [],
        observacion:        rec.obs || null,
        comentario_docente: rec.obs || null,
        fecha_entrega:      entregada ? new Date().toISOString() : null,
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'tarea_id,alumno_id' });
      ok++;
    } catch(e) { console.warn(e); }
  }
  hubToast(`✅ ${ok} registros guardados en Supabase`, 'ok');
}

function ctNuevaTarea() {
  // Pre-fill fecha con hoy
  const fechaEl = document.getElementById('ct-new-fecha');
  if (fechaEl) fechaEl.value = new Date().toISOString().split('T')[0];
  document.getElementById('ct-modal-tarea').style.display = 'flex';
}

async function ctGuardarTarea() {
  const titulo = document.getElementById('ct-new-titulo')?.value.trim();
  const materia = document.getElementById('ct-new-materia')?.value;
  const fecha = document.getElementById('ct-new-fecha')?.value;
  const tipo = document.querySelector('input[name="ct-tipo"]:checked')?.value || 'tarea';
  const instrucciones = document.getElementById('ct-new-instrucciones')?.value.trim();
  const criteriosChk = [...document.querySelectorAll('input[name="ct-criterio"]:checked')].map(c => c.value);

  if (!titulo) { hubToast('⚠️ Escribe el nombre de la tarea', 'warn'); return; }

  const lista = window._alumnosActivos || alumnos;
  const nueva = {
    id: `t_${Date.now()}`,
    titulo, materia, fecha, tipo, instrucciones, criterios: criteriosChk,
    alumnos: lista.map((a, ai) => ({ ai, alumno_id: a.id || null, estado: 'pendiente' }))
  };

  CT_TAREAS.unshift(nueva);
  TAREAS_DATA = CT_TAREAS;

  // Guardar en Supabase
  if (sb && currentPerfil) {
    try {
      const grupoId = window._grupoActivo || null;
      const { data, error } = await sb.from('tareas_docente').insert({
        docente_id: currentPerfil.id, grupo_id: grupoId,
        titulo, materia, tipo, instrucciones,
        criterios: criteriosChk, fecha_entrega: fecha,
        ciclo: window.CICLO_ACTIVO, created_at: new Date().toISOString(),
      }).select('id').single();
      if (!error && data) nueva.id = data.id;
    } catch(e) { console.warn('[ctGuardarTarea]', e.message); }
  }

  try { localStorage.setItem('siembra_tareas', JSON.stringify(CT_TAREAS)); } catch(e) {}

  document.getElementById('ct-modal-tarea').style.display = 'none';
  document.getElementById('ct-new-titulo').value = '';
  document.getElementById('ct-new-instrucciones').value = '';

  ctPoblarSelectorTareas();
  tareasRender();
  hubToast(`✅ Tarea "${titulo}" creada`, 'ok');
}

function ctExportarCSV() {
  if (!CT_TAREA_ACTIVA) { hubToast('⚠️ Selecciona una tarea primero', 'warn'); return; }
  const lista = window._alumnosActivos || alumnos;
  const recs  = CT_DATA[CT_TAREA_ACTIVA.id] || {};
  const rows = lista.map((a, ai) => {
    const rec = recs[ai] || { cal: '', notas: [], obs: '' };
    const nombre = a.n || `${a.nombre||''} ${a.apellido_p||''}`.trim();
    const notasTexto = rec.notas.map(id => {
      const n = [...CT_NOTAS.positivo, ...CT_NOTAS.mejorar].find(x => x.id === id);
      return n ? n.txt : id;
    }).join(' | ');
    return { alumno: nombre, calificacion: rec.cal ?? '', notas: notasTexto, observacion: rec.obs || '' };
  });
  const bom = '﻿';
  const csv = bom + ['alumno,calificacion,notas,observacion',
    ...rows.map(r => `"${r.alumno}",${r.calificacion},"${r.notas}","${r.observacion}"`)
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `cotejo_${CT_TAREA_ACTIVA.titulo.replace(/\s+/g,'_')}.csv`;
  a.click();
  hubToast('✅ CSV exportado', 'ok');
}

// ── Análisis IA por alumno ─────────────────────────────────────────────────

async function ctAnalisisIA() {
  const lista = window._alumnosActivos || alumnos;
  if (!lista.length) { hubToast('⚠️ Sin alumnos para analizar', 'warn'); return; }
  ctTab('analisis');
  const grid = document.getElementById('ct-analisis-grid');
  if (!grid) return;

  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--gris-50);">
    <div style="font-size:28px;margin-bottom:10px;">🤖</div>
    <div style="font-weight:600;margin-bottom:6px;">Generando análisis individual…</div>
    <div style="font-size:12px;">Esto puede tomar unos segundos</div>
  </div>`;

  // Compilar datos por alumno
  const resumen = lista.map((a, ai) => {
    const nombre = a.n || `${a.nombre||''} ${a.apellido_p||''}`.trim();
    const todasNotas = [];
    Object.values(CT_DATA).forEach(td => {
      const rec = td[ai];
      if (rec?.notas) todasNotas.push(...rec.notas);
    });

    // Contar frecuencia de notas
    const freq = {};
    todasNotas.forEach(id => { freq[id] = (freq[id]||0)+1; });

    // Calificación promedio de todas las tareas
    const cals = Object.values(CT_DATA).map(td => td[ai]?.cal).filter(c => c != null);
    const prom = cals.length ? cals.reduce((s,c)=>s+c,0)/cals.length : null;

    // Observaciones libres
    const obs = Object.values(CT_DATA).map(td => td[ai]?.obs).filter(Boolean);

    return { nombre, freq, prom, obs, ai };
  });

  // Generar tarjetas con análisis local (sin IA si no hay conexión)
  grid.innerHTML = resumen.map(r => {
    const notasPos = Object.entries(r.freq)
      .filter(([id]) => CT_NOTAS.positivo.find(n=>n.id===id))
      .sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([id]) => CT_NOTAS.positivo.find(n=>n.id===id))
      .filter(Boolean);

    const notasMej = Object.entries(r.freq)
      .filter(([id]) => CT_NOTAS.mejorar.find(n=>n.id===id))
      .sort((a,b)=>b[1]-a[1]).slice(0,3)
      .map(([id]) => CT_NOTAS.mejorar.find(n=>n.id===id))
      .filter(Boolean);

    const promColor = r.prom==null?'var(--gris-50)':r.prom>=9?'#15803d':r.prom>=7?'#a16207':'#b91c1c';
    const promBg    = r.prom==null?'#f4f5f8':r.prom>=9?'#f0fdf4':r.prom>=7?'#fef9c3':'#fee2e2';

    return `<div class="card" style="padding:16px;" id="ct-card-${r.ai}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--verde);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px;flex-shrink:0;">
          ${r.nombre.charAt(0)}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:13px;">${r.nombre}</div>
          <div style="font-size:11px;color:var(--gris-50);">${Object.keys(r.freq).length} notas · ${Object.values(CT_DATA).filter(td=>td[r.ai]?.cal).length} tareas calificadas</div>
        </div>
        <div style="background:${promBg};color:${promColor};padding:4px 10px;border-radius:8px;font-weight:900;font-size:16px;">
          ${r.prom != null ? r.prom.toFixed(1) : '—'}
        </div>
      </div>

      ${notasPos.length ? `<div style="margin-bottom:8px;">
        <div style="font-size:10px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;">✅ Fortalezas</div>
        ${notasPos.map(n=>`<div style="font-size:12px;color:var(--gris-80);padding:2px 0;">${n.ico} ${n.txt}</div>`).join('')}
      </div>` : ''}

      ${notasMej.length ? `<div style="margin-bottom:8px;">
        <div style="font-size:10px;font-weight:700;color:#b91c1c;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;">📈 Áreas de mejora</div>
        ${notasMej.map(n=>`<div style="font-size:12px;color:var(--gris-80);padding:2px 0;">${n.ico} ${n.txt}</div>`).join('')}
      </div>` : ''}

      ${r.obs.length ? `<div style="margin-bottom:8px;">
        <div style="font-size:10px;font-weight:700;color:var(--gris-50);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;">📝 Notas del docente</div>
        <div style="font-size:11px;color:var(--gris-80);line-height:1.5;">${r.obs.slice(0,2).join(' · ')}</div>
      </div>` : ''}

      <button onclick="ctAnalisisIAAlumno(${r.ai})" style="width:100%;padding:7px;background:var(--verde-light);border:1.5px solid var(--verde-mid);color:var(--verde);border-radius:7px;font-family:'Sora',sans-serif;font-size:12px;font-weight:700;cursor:pointer;margin-top:6px;">
        🤖 Análisis IA detallado
      </button>
    </div>`;
  }).join('');
}

function ctMostrarAnalisis() {
  const grid = document.getElementById('ct-analisis-grid');
  if (!grid || grid.children.length <= 1) ctAnalisisIA();
}

async function ctAnalisisIAAlumno(ai) {
  const lista = window._alumnosActivos || alumnos;
  const alumno = lista[ai];
  const nombre = alumno?.n || `${alumno?.nombre||''} ${alumno?.apellido_p||''}`.trim();
  const cardEl = document.getElementById(`ct-card-${ai}`);
  const btn = cardEl?.querySelector('button');
  if (btn) { btn.textContent = '⏳ Analizando con IA…'; btn.disabled = true; }

  // Compilar todas las notas y calificaciones del alumno
  const todasNotas = [];
  const todasObs = [];
  const cals = [];
  const tareas = [];
  Object.entries(CT_DATA).forEach(([tid, td]) => {
    const rec = td[ai];
    if (!rec) return;
    const tarea = CT_TAREAS.find(t => t.id === tid);
    if (rec.notas) todasNotas.push(...rec.notas);
    if (rec.obs) todasObs.push(rec.obs);
    if (rec.cal) { cals.push(rec.cal); tareas.push(`${tarea?.titulo||tid}: ${rec.cal}`); }
  });

  const notasTexto = todasNotas.map(id => {
    const n = [...CT_NOTAS.positivo, ...CT_NOTAS.mejorar].find(x => x.id === id);
    return n ? n.txt : id;
  }).join(', ');

  const prom = cals.length ? cals.reduce((s,c)=>s+c,0)/cals.length : null;

  // Prompt para IA
  const prompt = `Eres un asistente pedagógico para docentes de primaria/secundaria en México.
Analiza el desempeño de ${nombre} y genera retroalimentación concisa y útil para el docente.

Calificaciones: ${tareas.join(' | ')||'Sin calificaciones aún'}
Promedio: ${prom?.toFixed(1)||'—'}
Notas pedagógicas del docente: ${notasTexto||'Ninguna aún'}
Observaciones: ${todasObs.join(' | ')||'Ninguna'}

Responde en JSON con exactamente esta estructura:
{
  "resumen": "Una oración describiendo el perfil del alumno",
  "fortalezas": ["fortaleza 1", "fortaleza 2"],
  "areas_mejora": ["área 1", "área 2", "área 3"],
  "recomendacion_docente": "Acción concreta que el docente puede hacer",
  "mensaje_alumno": "Mensaje motivador breve para el alumno (máx 20 palabras)"
}`;

  try {
    let analisis = null;

    if (typeof fetch !== 'undefined') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      const txt = data.content?.[0]?.text || '';
      const clean = txt.replace(/```json|```/g,'').trim();
      analisis = JSON.parse(clean);
    }

    if (!analisis) throw new Error('Sin respuesta IA');

    // Render resultado IA en la tarjeta
    const iaHTML = `
      <div style="background:linear-gradient(135deg,#f0fdf4,#eaf6ee);border:1.5px solid #86efac;border-radius:10px;padding:12px;margin-top:10px;">
        <div style="font-size:10px;font-weight:700;color:var(--verde);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🤖 Análisis IA</div>
        <div style="font-size:12px;color:var(--gris-80);margin-bottom:8px;font-style:italic;">"${analisis.resumen}"</div>
        ${analisis.fortalezas?.length ? `<div style="margin-bottom:6px;"><span style="font-size:10px;font-weight:700;color:#15803d;">✅ Fortalezas: </span><span style="font-size:11px;color:var(--gris-80);">${analisis.fortalezas.join(' · ')}</span></div>` : ''}
        ${analisis.areas_mejora?.length ? `<div style="margin-bottom:6px;"><span style="font-size:10px;font-weight:700;color:#b91c1c;">📈 Mejorar: </span><span style="font-size:11px;color:var(--gris-80);">${analisis.areas_mejora.join(' · ')}</span></div>` : ''}
        ${analisis.recomendacion_docente ? `<div style="background:white;border-radius:6px;padding:8px;margin-top:6px;font-size:11px;color:var(--gris-80);"><strong>Para el docente:</strong> ${analisis.recomendacion_docente}</div>` : ''}
        ${analisis.mensaje_alumno ? `<div style="background:#fff9c4;border-radius:6px;padding:6px 8px;margin-top:6px;font-size:11px;color:#a16207;">💌 Para ${nombre.split(' ')[0]}: <em>${analisis.mensaje_alumno}</em></div>` : ''}
      </div>`;

    cardEl?.insertAdjacentHTML('beforeend', iaHTML);
    if (btn) { btn.style.display='none'; }

  } catch(e) {
    // Fallback análisis local si no hay IA disponible
    const local = ctAnalisisLocal(ai, todasNotas, prom);
    cardEl?.insertAdjacentHTML('beforeend', local);
    if (btn) { btn.textContent = '🤖 Análisis IA detallado'; btn.disabled = false; }
  }
}

function ctAnalisisLocal(ai, notas, prom) {
  const mejoras = notas.filter(id => CT_NOTAS.mejorar.find(n=>n.id===id));
  const fortalezas = notas.filter(id => CT_NOTAS.positivo.find(n=>n.id===id));
  const textosMej = mejoras.slice(0,3).map(id => CT_NOTAS.mejorar.find(n=>n.id===id)?.txt).filter(Boolean);
  const textosFort = fortalezas.slice(0,2).map(id => CT_NOTAS.positivo.find(n=>n.id===id)?.txt).filter(Boolean);

  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-top:10px;font-size:11px;color:var(--gris-80);">
    <div style="font-size:10px;font-weight:700;color:var(--gris-50);margin-bottom:6px;">📊 Análisis basado en notas</div>
    ${textosFort.length ? `<div><strong style="color:#15803d;">Fortalezas:</strong> ${textosFort.join(', ')}</div>` : ''}
    ${textosMej.length ? `<div style="margin-top:4px;"><strong style="color:#b91c1c;">Trabajar en:</strong> ${textosMej.join(', ')}</div>` : ''}
    ${prom ? `<div style="margin-top:4px;"><strong>Promedio tareas:</strong> ${prom.toFixed(1)}</div>` : ''}
    <div style="margin-top:6px;font-size:10px;color:var(--gris-50);">Conecta la API de Anthropic para análisis IA completo</div>
  </div>`;
}

// Mantener compatibilidad con código antiguo
// tareasRender defined below



// ══ SEGUIMIENTO DE TAREAS POR ALUMNO (legacy)
let TAREAS_DATA_LEGACY = [];

function tareasRender() {
  const cont = document.getElementById('tareas-lista');
  if (!cont) return;
  if (!TAREAS_DATA.length) {
    const listaActual = window._alumnosActivos || alumnos;
    if (!listaActual.length) {
      cont.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--gris-50);">
        <div style="font-size:36px;margin-bottom:12px;">📋</div>
        <div style="font-size:15px;font-weight:700;color:var(--gris-80);margin-bottom:6px;">Aún no hay alumnos</div>
        <div style="font-size:13px;">Registra alumnos primero para poder asignar tareas.</div>
      </div>`;
    } else {
      cont.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--gris-50);">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <div style="font-size:15px;font-weight:700;color:var(--gris-80);margin-bottom:6px;">Aún no hay tareas registradas</div>
        <div style="font-size:13px;margin-bottom:14px;">Crea la primera tarea para tu grupo.</div>
        <button onclick="tareasNueva()" class="btn btn-primary btn-sm">+ Nueva tarea</button>
      </div>`;
    }
    return;
  }
  const alumnosList = window._alumnosActivos||alumnos;
  cont.innerHTML = TAREAS_DATA.map((t,ti) => {
    const entregadas = t.alumnos.filter(a=>a.estado==='entregada').length;
    const total = alumnosList.length;
    const pct = total ? Math.round(entregadas/total*100) : 0;
    const color = pct>=80?'#22c55e':pct>=50?'#f59e0b':'#ef4444';
    return `<div class="card" style="padding:16px;margin-bottom:10px;cursor:pointer;" onclick="tareasVerDetalle(${ti})">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:700;">${t.titulo}</div>
          <div style="font-size:12px;color:var(--gris-50);">${t.materia} · ${t.fecha}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:900;color:${color};">${pct}%</div>
          <div style="font-size:11px;color:var(--gris-50);">${entregadas}/${total} entregas</div>
        </div>
      </div>
      <div style="margin-top:10px;height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;transition:.5s;"></div>
      </div>
    </div>`;
  }).join('');
}

async function tareasNueva() {
  const titulo = prompt('Nombre de la tarea:');
  if (!titulo) return;
  const materia = prompt('Materia (ej: Matemáticas):') || 'General';
  const alumnosList = window._alumnosActivos || alumnos;
  const nueva = {
    id: Date.now(), titulo, materia,
    fecha: new Date().toLocaleDateString('es-MX'),
    _db: false,
    alumnos: alumnosList.map((a, ai) => ({
      ai, alumno_id: a.id || null, estado: 'pendiente'
    }))
  };
  TAREAS_DATA.unshift(nueva);
  tareasRender();
  hubToast('✅ Tarea registrada — guardando…', 'ok');
  await tareasGuardarDB(nueva);
  hubToast('✅ Tarea guardada en Supabase', 'ok');
}

function tareasVerDetalle(ti) {
  const t = TAREAS_DATA[ti];
  const alumnosList = window._alumnosActivos||alumnos;
  const lista = alumnosList.map((a,ai)=>{
    const reg = t.alumnos.find(r=>r.ai===ai)||{estado:'pendiente'};
    const nombre = a.n||`${a.nombre||''} ${a.apellido_p||''}`.trim();
    const estados = [{v:'pendiente',lbl:'⏳ Pendiente',bg:'#fef9c3',c:'#a16207'},{v:'entregada',lbl:'✅ Entregada',bg:'#dcfce7',c:'#15803d'},{v:'tarde',lbl:'⚠️ Tarde',bg:'#fee2e2',c:'#b91c1c'}];
    const chips = estados.map(e=>`<button onclick="tareasMarcar(${ti},${ai},'${e.v}')" style="padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;border:1.5px solid ${reg.estado===e.v?e.c:'#e2e8f0'};background:${reg.estado===e.v?e.bg:'white'};color:${reg.estado===e.v?e.c:'#94a3b8'};cursor:pointer;">${e.lbl}</button>`).join('');
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9;"><div style="font-size:13px;font-weight:600;flex:1;">${nombre}</div><div style="display:flex;gap:4px;">${chips}</div></div>`;
  }).join('');

  document.getElementById('modal-tareas-titulo').textContent = t.titulo;
  document.getElementById('modal-tareas-body').innerHTML = lista;
  document.getElementById('modal-tareas-idx').value = ti;
  document.getElementById('modal-tareas').style.display='flex';
}

function tareasMarcar(ti, ai, estado) {
  tareasActualizarEntrega(ti, ai, estado);
  tareasVerDetalle(ti);
}
