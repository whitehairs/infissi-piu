// Script per versione cliente: tabelle, export, stampa, drawing
const CONSTS = {
  pr_tt: 46, vetro_tt: 154, inv_tt: 113,
  pr_tgp: 39, vetro_tgp: 139, inv_tgp: 108,
  lat: 22.5
};

function log(msg){
  const el = document.getElementById('log');
  const t = new Date().toLocaleTimeString();
  el.textContent += `[${t}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
}

function calcParts(tipo, nAnte, H, L){
  const c = CONSTS;
  if(H<=0 || L<=0) throw new Error('Altezza e Larghezza devono essere > 0');
  const pr = tipo==='TT' ? c.pr_tt : c.pr_tgp;
  const vetro = tipo==='TT' ? c.vetro_tt : c.vetro_tgp;
  const inv = tipo==='TT' ? c.inv_tt : c.inv_tgp;
  const parts = {tipo, nAnte, H, L, ante: [], totals:{}};
  let totalTelaio = 0, totalVetroArea = 0;
  for(let i=0;i<nAnte;i++){
    const anta = {index:i+1};
    if(nAnte===1){
      anta.h_pr_anta = Math.round(H - pr);
      anta.l_pr_anta = Math.round(H - pr);
      anta.h_vetro = Math.round(H - vetro);
      anta.l_vetro = Math.round(L - vetro);
    } else {
      anta.h_pr_anta = Math.round(H - pr);
      const l_temp = Math.round(L / nAnte);
      anta.l_pr_anta = Math.round(l_temp - c.lat);
      anta.h_pr_inversione = Math.round(H - inv);
      anta.h_vetro = Math.round(H - vetro);
      anta.l_vetro = Math.round(((L - 315) / nAnte) + 35);
      if(anta.l_vetro < 0) anta.l_vetro = Math.round(Math.max(10, anta.l_pr_anta - 20));
    }
    // placeholder parts counts (il sorgente originale ha molte variabili akXXXXX)
    anta.parts = {AK90027: (nAnte>=2 && i===1)?3:0};
    totalTelaio += anta.h_pr_anta * (anta.l_pr_anta || 1);
    totalVetroArea += anta.h_vetro * (anta.l_vetro || 1);
    parts.ante.push(anta);
  }
  parts.totals.totalTelaioArea = Math.round(totalTelaio);
  parts.totals.totalVetroArea = Math.round(totalVetroArea);
  return parts;
}

// Render riepilogo come tabella friendly
function renderSummary(parts){
  const container = document.getElementById('summaryTableContainer');
  container.innerHTML = '';
  const table = document.createElement('table');
  const rows = [
    ['Tipo infisso', parts.tipo],
    ['Numero ante', parts.nAnte],
    ['Altezza (mm)', parts.H],
    ['Larghezza (mm)', parts.L],
    ['Superficie totale telaio (mm²)', parts.totals.totalTelaioArea],
    ['Superficie totale vetro (mm²)', parts.totals.totalVetroArea]
  ];
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  for(const r of rows){
    const tr = document.createElement('tr');
    const th = document.createElement('th'); th.textContent = r[0];
    const td = document.createElement('td'); td.textContent = r[1];
    tr.appendChild(th); tr.appendChild(td);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

// Render dettagli per anta in tabella
function renderDetails(parts){
  const container = document.getElementById('detailsTableContainer');
  container.innerHTML = '';
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hrow = document.createElement('tr');
  ['Anta','Larghezza profilo (mm)','Altezza profilo (mm)','Larghezza vetro (mm)','Altezza vetro (mm)','AK90027'].forEach(h=>{
    const th = document.createElement('th'); th.textContent = h; hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  const tbody = document.createElement('tbody');
  for(const a of parts.ante){
    const tr = document.createElement('tr');
    const vals = [a.index, a.l_pr_anta, a.h_pr_anta, a.l_vetro, a.h_vetro, (a.parts.AK90027||0)];
    for(const v of vals){
      const td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(thead); table.appendChild(tbody);
  container.appendChild(table);
}

// Draw on canvas
function draw(parts){
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  // fit high-dpi
  const DPR = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * DPR;
  canvas.height = 380 * DPR;
  ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // compute scale
  const margin = 30;
  const W = canvas.clientWidth - margin*2;
  const H = 300;
  const scale = Math.min(W/parts.L, H/parts.H);
  const drawW = parts.L * scale;
  const drawH = parts.H * scale;
  const startX = margin + (W - drawW)/2;
  const startY = 30;
  // frame
  ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, drawW, drawH);
  // ante
  const n = parts.nAnte;
  for(let i=0;i<n;i++){
    const x0 = startX + Math.round(i*(drawW/n));
    const w = Math.round(drawW/n);
    // fill leaf
    ctx.fillStyle = 'rgba(11,102,255,0.04)';
    ctx.fillRect(x0, startY, w, drawH);
    ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 1;
    ctx.strokeRect(x0, startY, w, drawH);
    const a = parts.ante[i];
    ctx.fillStyle = '#073046'; ctx.font = '12px monospace';
    ctx.fillText(`Anta ${a.index}`, x0+8, startY+18);
    ctx.fillText(`${a.l_pr_anta} x ${a.h_pr_anta} mm`, x0+8, startY+36);
    // glass
    const gw = Math.max(8, (a.l_vetro||20)*scale);
    const gh = Math.max(8, (a.h_vetro||20)*scale);
    const gx = x0 + (w - gw)/2; const gy = startY + (drawH - gh)/2;
    ctx.fillStyle = 'rgba(180,230,250,0.7)'; ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(11,102,255,0.9)'; ctx.strokeRect(gx, gy, gw, gh);
    ctx.fillStyle = '#073046'; ctx.fillText(`${a.l_vetro} x ${a.h_vetro} mm`, gx+6, gy+14);
  }
  // footer labels
  ctx.fillStyle = '#073046'; ctx.font = '12px monospace';
  ctx.fillText(`Scala approssimata`, 12, canvas.clientHeight - 6);
}

// Export helpers
function download(filename, text, mime='text/plain'){
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function toCSV(parts){
  const rows = [];
  rows.push(['Tipo','NumAnte','Altezza_mm','Larghezza_mm'].join(','));
  rows.push([parts.tipo, parts.nAnte, parts.H, parts.L].join(','));
  rows.push('');
  rows.push(['Index','l_pr_anta','h_pr_anta','l_vetro','h_vetro','AK90027'].join(','));
  for(const a of parts.ante){
    rows.push([a.index, a.l_pr_anta, a.h_pr_anta, a.l_vetro, a.h_vetro, (a.parts.AK90027||0)].join(','));
  }
  rows.push('');
  rows.push(['TotalTelaioArea_mm2','TotalVetroArea_mm2'].join(','));
  rows.push([parts.totals.totalTelaioArea, parts.totals.totalVetroArea].join(','));
  return rows.join('\n');
}

// UI wiring
document.getElementById('calcola').addEventListener('click', ()=>{
  try{
    const tipo = document.getElementById('tipo').value;
    const nAnte = parseInt(document.getElementById('numeroAnte').value) || 1;
    const H = parseFloat(document.getElementById('altezza').value) || 0;
    const L = parseFloat(document.getElementById('larghezza').value) || 0;
    const parts = calcParts(tipo, nAnte, H, L);
    window._LAST_PARTS = parts;
    renderSummary(parts); renderDetails(parts); draw(parts);
    log('Calcolo eseguito.');
  }catch(e){
    alert('Errore: '+e.message); log('Errore: '+e.message);
  }
});

document.getElementById('exportJson').addEventListener('click', ()=>{
  const p = window._LAST_PARTS; if(!p){ alert('Esegui prima il calcolo'); return; }
  download('infissipiu-result.json', JSON.stringify(p, null, 2), 'application/json');
  log('Esportato JSON');
});

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const p = window._LAST_PARTS; if(!p){ alert('Esegui prima il calcolo'); return; }
  download('infissipiu-result.csv', toCSV(p), 'text/csv');
  log('Esportato CSV');
});

document.getElementById('print').addEventListener('click', ()=>{
  window.print();
});

document.getElementById('reset').addEventListener('click', ()=>{
  document.getElementById('tipo').value='TT';
  document.getElementById('numeroAnte').value=2;
  document.getElementById('altezza').value=1200;
  document.getElementById('larghezza').value=1500;
  document.getElementById('summaryTableContainer').innerHTML='';
  document.getElementById('detailsTableContainer').innerHTML='';
  const c = document.getElementById('canvas'); c.getContext('2d').clearRect(0,0,c.width,c.height);
  log('Reset effettuato');
});

// auto-calculate on load
document.addEventListener('DOMContentLoaded', ()=>{ document.getElementById('calcola').click(); });
