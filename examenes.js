// SIEMBRA — examenes.js
// Extraído automáticamente de index.html
// Parte del refactoring Fase 3.2

// ══════════════════════════════════════════════════════
// MÓDULO: EXÁMENES
// ══════════════════════════════════════════════════════
let _examenesData = [];

async function examenesInit() {
  const grupoSel = document.getElementById('ex-filtro-grupo');
  const matSel   = document.getElementById('ex-filtro-materia');
  if (grupoSel && window._gruposDocente?.length) {
    grupoSel.innerHTML = '<option value="">Todos los grupos</option>' +
      window._gruposDocente.map(g =>
        `<option value="${g.id}">${g.nombre||g.grado+'°'} ${g.seccion||''}</option>`
      ).join('');
  }
  if (matSel && window._materiasDocente?.length) {
    matSel.innerHTML = '<option value="">Todas las materias</option>' +
      window._materiasDocente.map(m => `<option value="${m}">${m}</option>`).join('');
  }
  await examenesCargar();
}

async function examenesCargar() {
  if (!sb || !currentPerfil) return;
  try {
    const { data, error } = await sb.from('examenes_docente')
      .select('*').eq('docente_id', currentPerfil.id)
      .eq('ciclo', window.CICLO_ACTIVO)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    _examenesData = data || [];
  } catch(e) {
    console.warn('[examenes]', e.message);
    _examenesData = [];
  }
  examenesRender();
  examenesStats();
}

function examenesRender() {
  const el = document.getElementById('ex-lista');
  if (!el) return;
  const filtGrupo = document.getElementById('ex-filtro-grupo')?.value || '';
  const filtMat   = document.getElementById('ex-filtro-materia')?.value || '';
  const filtTrim  = document.getElementById('ex-filtro-trim')?.value || '';
  let lista = _examenesData;
  if (filtGrupo) lista = lista.filter(e => e.grupo_id === filtGrupo);
  if (filtMat)   lista = lista.filter(e => e.materia  === filtMat);
  if (filtTrim)  lista = lista.filter(e => String(e.trimestre) === filtTrim);
  if (!lista.length) {
    el.innerHTML = '<div style="text-align:center;padding:48px 20px;color:#94a3b8;"><div style="font-size:40px;margin-bottom:12px;">📝</div><div style="font-weight:700;color:#0f172a;margin-bottom:6px;">Sin exámenes registrados</div><div style="font-size:13px;">Crea tu primer examen con el botón &quot;+ Nuevo examen&quot;</div></div>';
    return;
  }
  el.innerHTML = lista.map(ex => {
    const prom = ex.promedio_grupo ?? '—';
    const aprobados = ex.total_aprobados ?? 0;
    const total = ex.total_alumnos ?? 0;
    const pct = total ? Math.round(aprobados/total*100) : 0;
    const color = pct>=70?'#166534':pct>=50?'#92400e':'#991b1b';
    const bg    = pct>=70?'#f0fdf4':pct>=50?'#fffbeb':'#fef2f2';
    return '<div style="background:white;border:1.5px solid #e2e8f0;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;">' +
      '<div style="flex:1;min-width:200px;"><div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:3px;">'+ex.nombre+'</div>' +
      '<div style="font-size:12px;color:#64748b;">'+(ex.materia||'—')+' · '+(ex.grupo_nombre||'—')+' · Trimestre '+(ex.trimestre||'—')+(ex.fecha_aplicacion?' · '+ex.fecha_aplicacion:'')+'</div></div>' +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">' +
      '<div style="text-align:center;padding:8px 14px;background:'+bg+';border-radius:8px;"><div style="font-size:20px;font-weight:800;color:'+color+';">'+prom+'</div><div style="font-size:10px;color:#64748b;font-weight:600;">PROMEDIO</div></div>' +
      '<div style="text-align:center;padding:8px 14px;background:#f8fafc;border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#1e40af;">'+aprobados+'/'+total+'</div><div style="font-size:10px;color:#64748b;font-weight:600;">APROBADOS</div></div>' +
      '<div style="display:flex;gap:6px;">' +
      '<button onclick="examenesCapturar(\'' + ex.id + '\')" style="padding:7px 14px;background:#0d5c2f;color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">✏️ Capturar notas</button>' +
      '</div></div></div>';
  }).join('');
}

function examenesStats() {
  const el = document.getElementById('ex-stats');
  if (!el || !_examenesData.length) { if(el) el.innerHTML=''; return; }
  const total = _examenesData.length;
  const withProm = _examenesData.filter(e=>e.promedio_grupo);
  const promGlobal = withProm.length ? withProm.reduce((s,e)=>s+(e.promedio_grupo||0),0)/withProm.length : 0;
  const enRiesgo = _examenesData.filter(e=>(e.promedio_grupo||10)<6).length;
  el.innerHTML = [
    {ico:'📝',val:total,lbl:'Exámenes',color:'#1e40af',bg:'#eff6ff'},
    {ico:'📊',val:promGlobal.toFixed(1),lbl:'Promedio global',color:'#166534',bg:'#f0fdf4'},
    {ico:'⚠️',val:enRiesgo,lbl:'Grupos en riesgo',color:'#b91c1c',bg:'#fef2f2'},
  ].map(s=>'<div style="background:'+s.bg+';border-radius:10px;padding:14px 16px;text-align:center;"><div style="font-size:22px;">'+s.ico+'</div><div style="font-size:22px;font-weight:800;color:'+s.color+';">'+s.val+'</div><div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">'+s.lbl+'</div></div>').join('');
}

function examenesNuevo() {
  const div = document.createElement('div');
  div.id = 'ex-modal';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

  const inner = document.createElement('div');
  inner.style.cssText = 'background:white;border-radius:16px;padding:28px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;';

  const today = new Date().toISOString().split('T')[0];
  const gruposOpts = (window._gruposDocente||[]).map(g => {
    const o = document.createElement('option');
    o.value = g.id;
    o.textContent = (g.nombre||g.grado+'° '+(g.seccion||''));
    return o.outerHTML;
  }).join('');
  const matsOpts = (window._materiasDocente||[]).map(m => {
    const o = document.createElement('option');
    o.value = m; o.textContent = m;
    return o.outerHTML;
  }).join('');

  inner.innerHTML = [
    '<div style="font-family:Fraunces,serif;font-size:20px;font-weight:700;color:#0d5c2f;margin-bottom:20px;">📝 Nuevo examen</div>',
    '<div style="display:flex;flex-direction:column;gap:12px;">',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Nombre del examen *</label>',
    '<input id="ex-n-nombre" type="text" placeholder="Ej: Examen parcial 1" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;box-sizing:border-box;"></div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Grupo *</label>',
    '<select id="ex-n-grupo" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;"><option value="">Seleccionar...</option>'+gruposOpts+'</select></div>',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Materia *</label>',
    '<select id="ex-n-materia" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;"><option value="">Seleccionar...</option>'+matsOpts+'</select></div>',
    '</div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Trimestre</label>',
    '<select id="ex-n-trim" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;"><option value="1">T1</option><option value="2">T2</option><option value="3">T3</option></select></div>',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Valor (pts)</label>',
    '<input id="ex-n-valor" type="number" min="1" max="100" value="10" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;box-sizing:border-box;"></div>',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Fecha</label>',
    '<input id="ex-n-fecha" type="date" value="'+today+'" style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;box-sizing:border-box;"></div></div>',
    '<div><label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:4px;">Temas evaluados</label>',
    '<textarea id="ex-n-desc" rows="2" placeholder="Ej: Fracciones, decimales..." style="width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;resize:vertical;box-sizing:border-box;"></textarea></div>',
    '</div>',
    '<div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">',
    '<button id="ex-cancel-btn" style="padding:10px 18px;background:#f1f5f9;border:none;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;cursor:pointer;">Cancelar</button>',
    '<button id="ex-save-btn" style="padding:10px 18px;background:#0d5c2f;color:white;border:none;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;cursor:pointer;">Crear examen</button>',
    '</div>'
  ].join('');

  div.appendChild(inner);
  document.body.appendChild(div);
  // Attach events after DOM insertion (no inline onclick)
  document.getElementById('ex-cancel-btn').onclick = () => div.remove();
  document.getElementById('ex-save-btn').onclick = () => examenesGuardarNuevo();
}

async function examenesGuardarNuevo() {
  const nombre  = document.getElementById('ex-n-nombre')?.value.trim();
  const grupoId = document.getElementById('ex-n-grupo')?.value;
  const materia = document.getElementById('ex-n-materia')?.value;
  const trim    = parseInt(document.getElementById('ex-n-trim')?.value||'1');
  const valor   = parseFloat(document.getElementById('ex-n-valor')?.value||'10');
  const fecha   = document.getElementById('ex-n-fecha')?.value;
  const desc    = document.getElementById('ex-n-desc')?.value.trim();
  if (!nombre||!grupoId||!materia){hubToast('⚠️ Nombre, grupo y materia son obligatorios','warn');return;}
  const grupoObj = (window._gruposDocente||[]).find(g=>g.id===grupoId);
  try {
    const {data,error} = await sb.from('examenes_docente').insert({
      docente_id:currentPerfil.id,grupo_id:grupoId,grupo_nombre:grupoObj?.nombre||'',
      materia,trimestre:trim,fecha_aplicacion:fecha||null,valor_maximo:valor,
      nombre,descripcion:desc||null,ciclo:window.CICLO_ACTIVO,creado_en:new Date().toISOString()
    }).select().single();
    if(error) throw error;
    hubToast('✅ Examen creado','ok');
    document.getElementById('ex-modal')?.remove();
    _examenesData.unshift(data);
    examenesRender();
    setTimeout(()=>examenesCapturar(data.id),300);
  } catch(e){hubToast('❌ '+e.message,'err');console.error(e);}
}

async function examenesCapturar(examenId) {
  const ex = _examenesData.find(e=>e.id===examenId);
  if(!ex) return;
  const alumnosDB = await calCargarAlumnosGrupo(ex.grupo_id);
  let calMap = {};
  try {
    const {data:cals} = await sb.from('examenes_calificaciones').select('*').eq('examen_id',examenId);
    (cals||[]).forEach(c=>calMap[c.alumno_id]=c);
  } catch(e){}
  const rows = alumnosDB.map((a,i)=>{
    const prev=calMap[a.id];
    return '<div style="display:grid;grid-template-columns:1fr 80px 1fr;align-items:center;gap:8px;padding:7px 10px;background:'+(i%2?'white':'#f8fafc')+';border-radius:6px;">' +
      '<div style="font-size:13px;font-weight:600;">'+a.n+'</div>' +
      '<input type="number" min="0" max="'+ex.valor_maximo+'" step="0.5" value="'+(prev?.calificacion??'')+'" placeholder="—" id="ecal_'+a.id+'" style="width:100%;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-family:Sora,sans-serif;font-size:13px;text-align:center;">' +
      '<input type="text" placeholder="Comentario…" value="'+(prev?.comentario||'')+'" id="ecmt_'+a.id+'" style="width:100%;padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:6px;font-family:Sora,sans-serif;font-size:12px;"></div>';
  }).join('');
  const div = document.createElement('div');
  div.id = 'ex-cap-modal';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
  const inner = document.createElement('div');
  inner.style.cssText = 'background:white;border-radius:16px;padding:24px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;';
  inner.innerHTML = [
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">',
    '<div><div style="font-family:Fraunces,serif;font-size:18px;font-weight:700;color:#0d5c2f;">'+ex.nombre+'</div>',
    '<div style="font-size:12px;color:#64748b;">'+ex.materia+' · '+ex.grupo_nombre+' · T'+ex.trimestre+' · Valor: '+ex.valor_maximo+' pts</div></div>',
    '<button id="ex-cap-close" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:16px;">✕</button></div>',
    '<div style="display:grid;grid-template-columns:1fr 80px 1fr;gap:6px;padding:6px 10px;background:#f0fdf4;border-radius:6px;margin-bottom:8px;">',
    '<div style="font-size:11px;font-weight:700;color:#64748b;">ALUMNO</div>',
    '<div style="font-size:11px;font-weight:700;color:#64748b;text-align:center;">CALIF.</div>',
    '<div style="font-size:11px;font-weight:700;color:#64748b;">COMENTARIO</div></div>',
    '<div style="display:flex;flex-direction:column;gap:3px;">'+rows+'</div>',
    '<div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">',
    '<button id="ex-cap-cancel" style="padding:10px 18px;background:#f1f5f9;border:none;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;cursor:pointer;">Cancelar</button>',
    '<button id="ex-cap-save" style="padding:10px 18px;background:#0d5c2f;color:white;border:none;border-radius:8px;font-family:Sora,sans-serif;font-size:13px;font-weight:700;cursor:pointer;">Guardar calificaciones</button>',
    '</div>'
  ].join('');
  div.appendChild(inner);
  document.body.appendChild(div);
  // Attach events after DOM insertion
  document.getElementById('ex-cap-close').onclick   = () => div.remove();
  document.getElementById('ex-cap-cancel').onclick  = () => div.remove();
  document.getElementById('ex-cap-save').onclick    = () => examenesGuardarCalif(examenId);
}

async function examenesGuardarCalif(examenId) {
  const ex = _examenesData.find(e=>e.id===examenId);
  if(!ex) return;
  const alumnosDB = await calCargarAlumnosGrupo(ex.grupo_id);
  const rows=[]; let suma=0,count=0,aprobados=0;
  alumnosDB.forEach(a=>{
    const cal = document.getElementById('ecal_'+a.id)?.value;
    const cmt = document.getElementById('ecmt_'+a.id)?.value.trim()||null;
    if(cal!==''&&cal!==undefined){
      const v=parseFloat(cal);
      rows.push({examen_id:examenId,alumno_id:a.id,grupo_id:ex.grupo_id,docente_id:currentPerfil.id,calificacion:v,comentario:cmt,ciclo:window.CICLO_ACTIVO});
      suma+=v; count++;
      if(v>=(ex.valor_maximo*0.6)) aprobados++;
    }
  });
  try {
    if(rows.length){
      const {error}=await sb.from('examenes_calificaciones').upsert(rows,{onConflict:'examen_id,alumno_id'});
      if(error) throw error;
    }
    const prom=count?Math.round(suma/count*10)/10:null;
    await sb.from('examenes_docente').update({promedio_grupo:prom,total_alumnos:alumnosDB.length,total_aprobados:aprobados}).eq('id',examenId);
    const exIdx=_examenesData.findIndex(e=>e.id===examenId);
    if(exIdx>=0) _examenesData[exIdx]={..._examenesData[exIdx],promedio_grupo:prom,total_alumnos:alumnosDB.length,total_aprobados:aprobados};
    hubToast('✅ '+rows.length+' calificaciones guardadas','ok');
    document.getElementById('ex-cap-modal')?.remove();
    examenesRender(); examenesStats();
    // Auto-notificar reprobados
    const reprobados=rows.filter(r=>r.calificacion<(ex.valor_maximo*0.6));
    if(reprobados.length){
      const nombres=reprobados.map(r=>(alumnosDB.find(a=>a.id===r.alumno_id)?.n||'?')).join(', ');
      try{await sb.from('alertas').insert({tipo:'reprobado_examen',origen:'docente',docente_id:currentPerfil.id,grupo_id:ex.grupo_id,materia:ex.materia,mensaje:'📝 Examen "'+ex.nombre+'" — '+reprobados.length+' alumno(s) reprobaron: '+nombres+'. Promedio: '+(prom||'—'),escuela_cct:currentPerfil.escuela_cct,ciclo:window.CICLO_ACTIVO,leido:false,creado_en:new Date().toISOString()});}
      catch(e2){console.warn('[alertas]',e2.message);}
    }
  } catch(e){hubToast('❌ '+e.message,'err');}
}

async function calDetectarRiesgoYNotificar() {
  if(!sb||!currentPerfil) return;
  try {
    const als=window._alumnosActivos||[];
    const mat=calMatActual; const trim=calTrimActual;
    if(!als.length) return;
    const enRiesgo=als.map((_,ai)=>({ai,prom:calPromPonderado(ai,mat,trim)}))
      .filter(r=>r.prom>0&&r.prom<6)
      .map(r=>als[r.ai]?.n||'?');
    if(!enRiesgo.length) return;
    await sb.from('alertas').insert({tipo:'riesgo_academico',origen:'docente',docente_id:currentPerfil.id,grupo_id:window._grupoActivo,materia:mat,mensaje:'⚠️ Riesgo en '+mat+' T'+trim+': '+enRiesgo.join(', '),escuela_cct:currentPerfil.escuela_cct,ciclo:window.CICLO_ACTIVO,leido:false,creado_en:new Date().toISOString()});
  } catch(e){console.warn('[riesgo]',e.message);}
}

function calExportar() {
  const mat  = calMatActual;
  const trim = calTrimActual;
  const als  = window._alumnosActivos || alumnos;
  if (!als.length) { hubToast('⚠️ Sin alumnos para exportar', 'warn'); return; }

  const aspectos = CAL_ASPECTOS[mat] || [];
  const headers  = ['No.', 'Nombre', ...aspectos.map(a => a.nombre), 'Promedio'];
  const rows     = als.map((a, ai) => {
    const asps = aspectos.map((_, asi) => {
      const val = CAL_DATA[mat]?.[trim]?.[ai]?.[asi];
      return val !== undefined && val !== null ? val : '';
    });
    const prom = calPromPonderado(ai, mat, trim);
    return [ai + 1, a.n || a.nombre || '—', ...asps, prom.toFixed(1)];
  });

  const csvLines = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvLines], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `SIEMBRA_${mat.replace(/ /g,'_')}_T${trim}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  hubToast('✅ CSV exportado correctamente', 'ok');
}

// ── Gráficas ──
function calVerGraficas() {
  const wrap = document.getElementById('cal-graficas-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  document.getElementById('cal-graf-titulo').textContent = `${calMatActual} · T${calTrimActual}`;

  // Barras por alumno
  const barras = document.getElementById('cal-graf-barras');
  const datos  = alumnos.map((a,ai) => ({ n: a.n, p: calPromPonderado(ai, calMatActual, calTrimActual) }));
  const maxVal = 10;
  barras.innerHTML = datos.map(d => `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:110px;font-size:12px;color:var(--gris-50);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.n.split(' ')[0]}</div>
      <div style="flex:1;height:20px;background:var(--gris-10);border-radius:99px;overflow:hidden;">
        <div style="height:100%;width:${(d.p/maxVal)*100}%;background:${calColor(d.p)};border-radius:99px;transition:.4s;"></div>
      </div>
      <div style="width:36px;font-size:13px;font-weight:700;color:${calColor(d.p)};">${d.p.toFixed(1)}</div>
    </div>`).join('');

  // Promedio por aspecto
  const aspectos = CAL_ASPECTOS[calMatActual] || [];
  const grafAsp  = document.getElementById('cal-graf-aspectos');
  grafAsp.innerHTML = aspectos.map((asp, asi) => {
    const avg = alumnos.reduce((s,_,ai) => s + (CAL_DATA[calMatActual]?.[calTrimActual]?.[ai]?.[asi] || 7), 0) / alumnos.length;
    const pct = ((avg - 5) / 5) * 100;
    return `
      <div style="flex:1;min-width:100px;background:var(--crema);border-radius:12px;padding:14px;text-align:center;border:1px solid var(--gris-20);">
        <div style="font-size:11px;color:var(--gris-50);margin-bottom:8px;font-weight:700;">${asp.nombre}</div>
        <div style="font-size:11px;color:var(--gris-50);margin-bottom:8px;">${asp.pct}%</div>
        <div style="width:100%;height:8px;background:var(--gris-20);border-radius:99px;overflow:hidden;margin-bottom:8px;">
          <div style="height:100%;width:${pct}%;background:${calColor(avg)};border-radius:99px;"></div>
        </div>
        <div style="font-size:18px;font-weight:800;color:${calColor(avg)};">${avg.toFixed(1)}</div>
      </div>`;
  }).join('');

  wrap.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Reporte IA ──
async function calVerReporte() {
  const wrap = document.getElementById('cal-reporte-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  document.getElementById('cal-rep-titulo').textContent = `${calMatActual} · Trimestre ${calTrimActual}`;

  const textEl = document.getElementById('cal-rep-texto');
  textEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><div style="width:20px;height:20px;border:2px solid rgba(255,255,255,.4);border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;"></div> Generando análisis…</div>';

  const aspectos = CAL_ASPECTOS[calMatActual] || [];
  const promedios = alumnos.map((a,ai) => ({
    nombre: a.n,
    prom: calPromPonderado(ai, calMatActual, calTrimActual),
    aspectos: aspectos.map((asp,asi) => `${asp.nombre}: ${CAL_DATA[calMatActual]?.[calTrimActual]?.[ai]?.[asi] || 7}`)
  }));
  const promGrupo = (promedios.reduce((s,p)=>s+p.prom,0)/promedios.length).toFixed(1);
  const enAtencion = promedios.filter(p=>p.prom<6).map(p=>p.nombre);

  const prompt = `Eres un asesor pedagógico de la Nueva Escuela Mexicana (NEM) en México.
Genera un reporte breve (máximo 5 oraciones) sobre el desempeño del grupo en la materia ${calMatActual}, Trimestre ${calTrimActual}.
Datos: Promedio grupal: ${promGrupo}. Alumnos que requieren atención: ${enAtencion.join(', ') || 'ninguno'}.
Aspectos evaluados: ${aspectos.map(a=>a.nombre+' '+a.pct+'%').join(', ')}.
Incluye: 1) Diagnóstico del grupo, 2) Fortalezas, 3) Áreas de oportunidad, 4) Sugerencia pedagógica concreta.
IMPORTANTE: NO hagas diagnósticos clínicos ni psicológicos. Usa lenguaje pedagógico orientativo conforme al Acuerdo SEP 09/08/23.`;

  try {
    textEl.textContent = await callAI({
      feature: 'cal_reporte',
      prompt,
      context: { materia: calMatActual, trimestre: calTrimActual, promGrupo, enAtencion },
    });
  } catch(e) {
    textEl.textContent = `El grupo de ${calMatActual} tiene un promedio de ${promGrupo}/10 en el Trimestre ${calTrimActual}. ${enAtencion.length>0?`Los alumnos ${enAtencion.join(' y ')} requieren atención especial.`:''} Se recomienda reforzar actividades diferenciadas para consolidar los aprendizajes clave del campo formativo.`;
  }
  wrap.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ══ CONFIGURACIÓN DE ASPECTOS ══
function calAbrirConfigAspectos() {
  const ov = document.getElementById('modal-aspectos-ov');
  ov.style.display = 'flex';
  // Poblar selector de materias
  const sel = document.getElementById('cfg-mat-sel');
  sel.innerHTML = MATERIAS_NEM.map(m => `<option value="${m}" ${m===calMatActual?'selected':''}>${m}</option>`).join('');
  calCargarConfigMateria(calMatActual);
}

function calCerrarConfig() {
  document.getElementById('modal-aspectos-ov').style.display = 'none';
}

function calCargarConfigMateria(mat) {
  document.getElementById('cfg-mat-nombre').textContent = mat;
  const aspectos = CAL_ASPECTOS[mat] || ASPECTOS_DEFAULT.map(a=>({...a}));
  calRenderAspectosList(mat, aspectos);
}

function calRenderAspectosList(mat, aspectos) {
  const lista = document.getElementById('cfg-aspectos-lista');
  lista.innerHTML = aspectos.map((a, i) => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid var(--gris-20);border-radius:10px;margin-bottom:8px;background:var(--crema);">
      <div style="flex:1;">
        <input type="text" value="${a.nombre}" placeholder="Nombre del aspecto"
          style="width:100%;border:none;background:transparent;font-family:'Sora',sans-serif;font-size:13px;font-weight:600;outline:none;"
          onchange="calUpdateAspectoNombre('${mat}',${i},this.value)">
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="number" min="0" max="100" step="5" value="${a.pct}"
          style="width:60px;padding:6px 8px;border:1.5px solid var(--gris-20);border-radius:8px;font-family:'Sora',sans-serif;font-size:13px;font-weight:700;text-align:center;outline:none;"
          onchange="calUpdateAspectoPct('${mat}',${i},this.value)">
        <span style="font-size:13px;color:var(--gris-50);">%</span>
        <button onclick="calEliminarAspecto('${mat}',${i})" 
          style="width:28px;height:28px;border:none;background:var(--rojo-light);color:var(--rojo);border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
    </div>`).join('');
  calActualizarSuma(mat);
}

function calUpdateAspectoNombre(mat, i, val) {
  if (!CAL_ASPECTOS[mat]) CAL_ASPECTOS[mat] = ASPECTOS_DEFAULT.map(a=>({...a}));
  CAL_ASPECTOS[mat][i].nombre = val;
}
function calUpdateAspectoPct(mat, i, val) {
  if (!CAL_ASPECTOS[mat]) CAL_ASPECTOS[mat] = ASPECTOS_DEFAULT.map(a=>({...a}));
  CAL_ASPECTOS[mat][i].pct = parseInt(val)||0;
  calActualizarSuma(mat);
}
function calEliminarAspecto(mat, i) {
  if (!CAL_ASPECTOS[mat]) return;
  if (CAL_ASPECTOS[mat].length <= 1) { hubToast('⚠️ Debe haber al menos un aspecto','warn'); return; }
  CAL_ASPECTOS[mat].splice(i, 1);
  calRenderAspectosList(mat, CAL_ASPECTOS[mat]);
}
function calAgregarAspecto() {
  const mat = document.getElementById('cfg-mat-sel').value;
  if (!CAL_ASPECTOS[mat]) CAL_ASPECTOS[mat] = ASPECTOS_DEFAULT.map(a=>({...a}));
  CAL_ASPECTOS[mat].push({ nombre: 'Nuevo aspecto', pct: 0 });
  calRenderAspectosList(mat, CAL_ASPECTOS[mat]);
}
function calActualizarSuma(mat) {
  const suma = (CAL_ASPECTOS[mat]||[]).reduce((s,a)=>s+a.pct,0);
  const el   = document.getElementById('cfg-suma-val');
  const row  = document.getElementById('cfg-suma-row');
  if (el)  el.textContent = suma + '%';
  if (row) row.style.background = suma === 100 ? '#dcfce7' : suma > 100 ? '#fee2e2' : '#fef9c3';
}
function calGuardarConfig() {
  const mat   = document.getElementById('cfg-mat-sel').value;
  const suma  = (CAL_ASPECTOS[mat]||[]).reduce((s,a)=>s+a.pct,0);
  if (suma !== 100) {
    hubToast(`⚠️ Los porcentajes de ${mat} suman ${suma}%. Deben sumar exactamente 100%.`, 'warn');
    return;
  }
  calCerrarConfig();
  calRenderTabla();
  calRenderStats();
  hubToast('✅ Aspectos de ' + mat + ' guardados correctamente', 'ok');
}

