// InfissiPiu - Complete porting (best-effort)
// Constants discovered in original C# WinForms
const CONSTS = {
  pr_tt: 46, vetro_tt: 154, inv_tt: 113,
  pr_tgp: 39, vetro_tgp: 139, inv_tgp: 108,
  lat: 22.5
};

function log(msg){
  const el = document.getElementById('log');
  const now = new Date().toISOString().slice(11,23);
  el.textContent += `[${now}] ` + msg + "\n";
  el.scrollTop = el.scrollHeight;
}

function calcParts(tipo, nAnte, H, L){
  // Return a structured object with per-anta sizes and summary totals
  const c = CONSTS;
  const parts = {tipo, nAnte, H, L, ante: [], totals:{} };
  // Basic validation
  if(H<=0 || L<=0) throw new Error('Altezza e Larghezza devono essere > 0');
  if(L>H) log('Attenzione: larghezza maggiore di altezza (come nel sorgente originale)');
  // Choose constants based on tipo
  const pr = (tipo==='TT') ? c.pr_tt : c.pr_tgp;
  const vetro = (tipo==='TT') ? c.vetro_tt : c.vetro_tgp;
  const inv = (tipo==='TT') ? c.inv_tt : c.inv_tgp;
  // For each anta compute measures. Heuristic rules derived from original code:
  // - For 1 anta: pr and vetro use full L/H minus respective constants
  // - For >=2 ante: divide width roughly equally, subtract lat for profiles, compute inversion and glass heights
  let totalTelaio = 0, totalVetroArea = 0;
  for(let i=0;i<nAnte;i++){
    let anta = {index:i+1};
    if(nAnte===1){
      anta.h_pr_anta = Math.round(H - pr);
      anta.l_pr_anta = Math.round(H - pr);
      anta.h_vetro = Math.round(H - vetro);
      anta.l_vetro = Math.round(L - vetro);
    } else {
      anta.h_pr_anta = Math.round(H - pr);
      // width per leaf (approx)
      let l_temp = Math.round(L / nAnte);
      anta.l_pr_anta = Math.round(l_temp - c.lat);
      anta.h_pr_inversione = Math.round(H - inv);
      anta.h_vetro = Math.round(H - vetro);
      // some formulas from original used ((L - 315)/2)+35 for 2 leaves; generalize:
      anta.l_vetro = Math.round(((L - 315) / nAnte) + 35);
      // guard values
      if(anta.l_vetro < 0) anta.l_vetro = Math.round(Math.max(10, anta.l_pr_anta - 20));
    }
    // Add basic counts for accessories as placeholders (original code has many akXXXXX counts)
    anta.parts = {
      AK90027: (nAnte>=2 && i===1) ? 3 : 0, // example assignment seen in original
      AKxxx_PLACEHOLDER: 0
    };
    totalTelaio += anta.h_pr_anta * (anta.l_pr_anta || 1);
    totalVetroArea += anta.h_vetro * (anta.l_vetro || 1);
    parts.ante.push(anta);
  }
  parts.totals.totalTelaioArea = Math.round(totalTelaio);
  parts.totals.totalVetroArea = Math.round(totalVetroArea);
  return parts;
}

// Drawing utilities
function draw(parts){
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  // Clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // compute scale to fit L x H into canvas with margins
  const margin = 40;
  const W = canvas.width - margin*2;
  const H = canvas.height - margin*2;
  // choose scale based on real L,H
  const scale = Math.min(W/parts.L, H/parts.H);
  const drawW = parts.L * scale;
  const drawH = parts.H * scale;
  const startX = margin + (W - drawW)/2;
  const startY = margin + (H - drawH)/2;
  // frame
  ctx.strokeStyle = '#0b2947';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, drawW, drawH);
  // divisions for ante
  const n = parts.nAnte;
  for(let i=0;i<n;i++){
    const x0 = startX + Math.round(i*(drawW/n));
    const x1 = startX + Math.round((i+1)*(drawW/n));
    // leaf rect
    ctx.fillStyle = 'rgba(40,120,220,0.06)';
    ctx.fillRect(x0, startY, Math.round(drawW/n), drawH);
    ctx.strokeStyle = '#0b2947';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, startY, Math.round(drawW/n), drawH);
    // label leaf number and sizes
    const anta = parts.ante[i];
    ctx.fillStyle = '#072b3a';
    ctx.font = '14px monospace';
    const label = `Anta ${i+1}: ${anta.l_pr_anta}x${anta.h_pr_anta} mm`;
    ctx.fillText(label, x0 + 6, startY + 18);
    // draw glass area rectangle inside leaf using l_vetro/h_vetro scaled and centered
    const glassW = Math.max(8, (anta.l_vetro||20)*scale);
    const glassH = Math.max(8, (anta.h_vetro||20)*scale);
    const gx = x0 + (Math.round(drawW/n) - glassW)/2;
    const gy = startY + (drawH - glassH)/2;
    ctx.fillStyle = 'rgba(180,230,250,0.6)';
    ctx.fillRect(gx, gy, glassW, glassH);
    ctx.strokeStyle = 'rgba(40,120,220,0.8)';
    ctx.strokeRect(gx, gy, glassW, glassH);
    // show glass dims
    ctx.fillStyle = '#072b3a';
    ctx.fillText(`${anta.l_vetro}x${anta.h_vetro} mm`, gx+4, gy+14);
  }
  // overall labels
  ctx.fillStyle = '#072b3a';
  ctx.font = '12px monospace';
  ctx.fillText(`Scala: 1:${Math.round(1/scale) || 1}`, 10, canvas.height - 10);
  ctx.fillText(`L=${parts.L}mm  H=${parts.H}mm`, canvas.width - 220, canvas.height - 10);
}

// Export helpers
function download(filename, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type:'text/plain'}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function toCSV(parts){
  // header + per-anta rows
  const rows = [];
  rows.push(['Tipo','NumAnte','Altezza_mm','Larghezza_mm'].join(','));
  rows.push([parts.tipo, parts.nAnte, parts.H, parts.L].join(','));
  rows.push('\n');
  rows.push(['Index','l_pr_anta','h_pr_anta','l_vetro','h_vetro','AK90027'].join(','));
  for(const a of parts.ante){
    rows.push([a.index, a.l_pr_anta, a.h_pr_anta, a.l_vetro, a.h_vetro, (a.parts.AK90027||0)].join(','));
  }
  rows.push('\n');
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
    // show results
    const res = document.getElementById('results');
    res.textContent = JSON.stringify(parts, null, 2);
    draw(parts);
    log('Calcolo eseguito con successo.');
    // attach current parts to window for export
    window._LAST_PARTS = parts;
  }catch(e){
    alert('Errore: '+e.message);
    log('Errore: ' + e.message);
  }
});

document.getElementById('exportJson').addEventListener('click', ()=>{
  const p = window._LAST_PARTS;
  if(!p){ alert('Esegui prima il calcolo'); return; }
  download('infissipiu-result.json', JSON.stringify(p, null, 2));
});

document.getElementById('exportCsv').addEventListener('click', ()=>{
  const p = window._LAST_PARTS;
  if(!p){ alert('Esegui prima il calcolo'); return; }
  download('infissipiu-result.csv', toCSV(p));
});

document.getElementById('reset').addEventListener('click', ()=>{
  document.getElementById('tipo').value='TT';
  document.getElementById('numeroAnte').value=2;
  document.getElementById('altezza').value=1200;
  document.getElementById('larghezza').value=1500;
  document.getElementById('results').textContent='';
  const c = document.getElementById('canvas');
  c.getContext('2d').clearRect(0,0,c.width,c.height);
  log('Reset UI.');
});

// initial draw
document.getElementById('calcola').click();
