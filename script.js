// Mobile-optimized script: responsive canvas resize, print with canvas->image, and hide log in print
const CONSTS = {
  pr_tt: 46, vetro_tt: 154, inv_tt: 113,
  pr_tgp: 39, vetro_tgp: 139, inv_tgp: 108,
  lat: 22.5
};

function $(id){ return document.getElementById(id); }
function log(msg){
  const el = $('log');
  const t = new Date().toLocaleTimeString();
  if(el) el.textContent += `[${t}] ${msg}\n`;
}

// calculation logic
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
    anta.parts = {AK90027: (nAnte>=2 && i===1)?3:0};
    totalTelaio += anta.h_pr_anta * (anta.l_pr_anta || 1);
    totalVetroArea += anta.h_vetro * (anta.l_vetro || 1);
    parts.ante.push(anta);
  }
  parts.totals.totalTelaioArea = Math.round(totalTelaio);
  parts.totals.totalVetroArea = Math.round(totalVetroArea);
  return parts;
}

// Render functions
function renderSummary(parts){
  const container = $('summaryTableContainer');
  if(!container) return;
  container.innerHTML = '';
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  const rows = [
    ['Tipo infisso', parts.tipo || ''],
    ['Numero ante', parts.nAnte || ''],
    ['Altezza (mm)', parts.H || ''],
    ['Larghezza (mm)', parts.L || ''],
    ['Superficie totale telaio (mm²)', (parts.totals && parts.totals.totalTelaioArea) || ''],
    ['Superficie totale vetro (mm²)', (parts.totals && parts.totals.totalVetroArea) || '']
  ];
  rows.forEach(r => {
    const tr = document.createElement('tr');
    const th = document.createElement('th'); th.textContent = r[0];
    const td = document.createElement('td'); td.textContent = r[1];
    tr.appendChild(th); tr.appendChild(td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody); container.appendChild(table);
}

function renderDetails(parts){
  const container = $('detailsTableContainer');
  if(!container) return;
  container.innerHTML = '';
  if(!parts || !parts.ante) return;
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Anta','Larghezza profilo (mm)','Altezza profilo (mm)','Larghezza vetro (mm)','Altezza vetro (mm)','AK90027'].forEach(h=>{
    const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  const tbody = document.createElement('tbody');
  parts.ante.forEach(a=>{
    const tr = document.createElement('tr');
    const vals = [a.index, a.l_pr_anta, a.h_pr_anta, a.l_vetro, a.h_vetro, (a.parts.AK90027||0)];
    vals.forEach(v=>{ const td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  table.appendChild(thead); table.appendChild(tbody);
  container.appendChild(table);
}

// Canvas drawing and resize
let lastParts = null;
function fitCanvas(canvas, height=300){
  const wrap = canvas.parentElement;
  const DPR = window.devicePixelRatio || 1;
  const styleWidth = Math.max(200, wrap.clientWidth);
  canvas.width = Math.floor(styleWidth * DPR);
  canvas.height = Math.floor(height * DPR);
  canvas.style.width = styleWidth + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(DPR,0,0,DPR,0,0);
  return ctx;
}

function draw(parts){
  const canvas = $('canvas');
  if(!canvas) return;
  const ctx = fitCanvas(canvas, 300);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const margin = 20;
  const W = canvas.clientWidth - margin*2;
  const H = 260;
  const scale = Math.max(0.03, Math.min(W/parts.L, H/parts.H));
  const drawW = parts.L * scale;
  const drawH = parts.H * scale;
  const startX = margin + (W - drawW)/2;
  const startY = 20;
  ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, drawW, drawH);
  const n = parts.nAnte;
  for(let i=0;i<n;i++){
    const x0 = startX + Math.round(i*(drawW/n));
    const w = Math.round(drawW/n);
    ctx.fillStyle = 'rgba(11,102,255,0.04)';
    ctx.fillRect(x0, startY, w, drawH);
    ctx.strokeStyle = '#0b3d91'; ctx.lineWidth = 1;
    ctx.strokeRect(x0, startY, w, drawH);
    const a = parts.ante[i];
    ctx.fillStyle = '#073046'; ctx.font = '12px monospace';
    ctx.fillText(`Anta ${a.index}`, x0+6, startY+16);
    ctx.fillText(`${a.l_pr_anta} x ${a.h_pr_anta} mm`, x0+6, startY+34);
    const gw = Math.max(8, (a.l_vetro||20)*scale);
    const gh = Math.max(8, (a.h_vetro||20)*scale);
    const gx = x0 + (w - gw)/2; const gy = startY + (drawH - gh)/2;
    ctx.fillStyle = 'rgba(180,230,250,0.7)'; ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(11,102,255,0.9)'; ctx.strokeRect(gx, gy, gw, gh);
    ctx.fillStyle = '#073046'; ctx.fillText(`${a.l_vetro} x ${a.h_vetro} mm`, gx+6, gy+14);
  }
  ctx.fillStyle = '#073046'; ctx.font = '12px monospace';
  ctx.fillText(`Scala approssimata`, 10, canvas.clientHeight/(window.devicePixelRatio||1)-6);
}

// Print handling: convert canvas to image, hide log, print, cleanup
function preparePrint(){
  const canvas = $('canvas');
  if(!canvas) return null;
  try{
    const dataUrl = canvas.toDataURL('image/png');
    const img = document.createElement('img');
    img.src = dataUrl; img.alt = 'Disegno ante'; img.className = 'print-canvas-img';
    img.style.width = '100%'; img.style.display = 'block';
    canvas.style.display = 'none';
    canvas.parentElement.appendChild(img);
    // hide log section explicitly
    const logCard = $('logCard'); if(logCard) logCard.style.display = 'none';
    return img;
  }catch(e){
    console.warn('preparePrint error', e); return null;
  }
}
function cleanupPrint(img){
  if(img && img.parentElement) img.remove();
  const canvas = $('canvas'); if(canvas) canvas.style.display='block';
  const logCard = $('logCard'); if(logCard) logCard.style.display='';
}

// Utilities
function download(filename, text, mime='text/plain'){
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function toCSV(parts){
  const rows = [];
  rows.push(['Tipo','NumAnte','Altezza_mm','Larghezza_mm'].join(','));
  rows.push([parts.tipo, parts.nAnte, parts.H, parts.L].join(','));
  rows.push('');
  rows.push(['Index','l_pr_anta','h_pr_anta','l_vetro','h_vetro','AK90027'].join(','));
  for(const a of parts.ante) rows.push([a.index, a.l_pr_anta, a.h_pr_anta, a.l_vetro, a.h_vetro, (a.parts.AK90027||0)].join(','));
  rows.push('');
  rows.push(['TotalTelaioArea_mm2','TotalVetroArea_mm2'].join(','));
  rows.push([parts.totals.totalTelaioArea, parts.totals.totalVetroArea].join(','));
  return rows.join('\n');
}

// Main wiring
document.addEventListener('DOMContentLoaded', ()=>{
  const calcola = $('calcola'); if(calcola) calcola.addEventListener('click', ()=>{ try{ performCalculate(true); }catch(e){ alert(e.message); } });
  const reset = $('reset'); if(reset) reset.addEventListener('click', ()=>{ $('tipo').value='TT'; $('numeroAnte').value=2; $('altezza').value=1200; $('larghezza').value=1500; $('summaryTableContainer').innerHTML=''; $('detailsTableContainer').innerHTML=''; const c=$('canvas'); if(c) c.getContext('2d').clearRect(0,0,c.width,c.height); log('Reset effettuato'); });
  const expJ = $('exportJson'); if(expJ) expJ.addEventListener('click', ()=>{ const p=window._LAST_PARTS; if(!p){ alert('Esegui prima il calcolo'); return; } download('infissipiu-result.json', JSON.stringify(p,null,2),'application/json'); log('Esportato JSON'); });
  const expC = $('exportCsv'); if(expC) expC.addEventListener('click', ()=>{ const p=window._LAST_PARTS; if(!p){ alert('Esegui prima il calcolo'); return; } download('infissipiu-result.csv', toCSV(p),'text/csv'); log('Esportato CSV'); });
  const prt = $('print'); if(prt) prt.addEventListener('click', ()=>{ const img = preparePrint(); setTimeout(()=>{ window.print(); setTimeout(()=>{ cleanupPrint(img); }, 300); }, 200); });
  // redraw on resize/orientation
  window.addEventListener('resize', ()=>{ if(window._LAST_PARTS) draw(window._LAST_PARTS); });
  window.addEventListener('orientationchange', ()=>{ setTimeout(()=>{ if(window._LAST_PARTS) draw(window._LAST_PARTS); }, 200); });
  // initial calculate
  setTimeout(()=>{ try{ performCalculate(false); }catch(e){ console.error(e); } }, 80);
});

function performCalculate(scrollTo=true){
  const tipo = $('tipo').value;
  const nAnte = parseInt($('numeroAnte').value) || 1;
  const H = parseFloat($('altezza').value) || 0;
  const L = parseFloat($('larghezza').value) || 0;
  const parts = calcParts(tipo, nAnte, H, L);
  window._LAST_PARTS = parts; lastParts = parts;
  renderSummary(parts); renderDetails(parts); draw(parts);
  log('Calcolo eseguito');
  if(scrollTo){ setTimeout(()=>{ const el = $('summarySection'); if(el) el.scrollIntoView({behavior:'smooth'}); }, 150); }
}


// ===== Mobile auto-scroll and resize support v2 =====
window.addEventListener("resize", () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  // trigger redraw if function available
  if (typeof ridisegnaInfisso === "function") {
    ridisegnaInfisso();
  }
});

function scrollToResults() {
  const results = document.getElementById("results");
  if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener("DOMContentLoaded", () => {
  const calcButton = document.getElementById("btnCalcola");
  if (calcButton) {
    calcButton.addEventListener("click", () => {
      setTimeout(scrollToResults, 800);
    });
  }
});
