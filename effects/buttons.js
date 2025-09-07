
/**
 * Buttons effects:
 *  - Outer corner glow (outside the pill): TL green, BR blue, cursor-aware
 *  - Edge reflection: crisp 1px segment on the border edge, cursor-traced
 * Non-destructive: doesn't alter .btn visuals.
 */

export function initButtons(scope=document){
  initOuterCornerGlow(scope);
  initEdgeReflection(scope);
}

/* ---------- Outer Corner Glow (soft blooms outside the button) ---------- */
function initOuterCornerGlow(scope){
  const targets = scope.querySelectorAll('a.btn[data-glow]');
  targets.forEach(btn => {
    if (btn.closest('.btn-glow-wrap')) return;
    const wrap = document.createElement('span');
    wrap.className = 'btn-glow-wrap';
    const tl = document.createElement('span'); tl.className = 'btn-glow tl';
    const br = document.createElement('span'); br.className = 'btn-glow br';
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(tl); wrap.appendChild(br); wrap.appendChild(btn);

    const setSize = ()=>{
      const h = btn.offsetHeight||44;
      wrap.style.setProperty('--sz', Math.round(h*1.2) + 'px');
    };
    setSize(); addEventListener('resize', setSize, {passive:true});

    const clamp = (v,min,max)=>Math.min(max, Math.max(min, v));
    const sigma = 0.35;
    const gaussian = (d,s)=>Math.exp(-(d*d)/(2*s*s));

    const onMove = (e)=>{
      const r = btn.getBoundingClientRect();
      const x = clamp((e.clientX - r.left)/r.width, 0, 1);
      const y = clamp((e.clientY - r.top)/r.height, 0, 1);
      let tlA=0, brA=0;
      if (x <= 0.5){
        const dTL = Math.hypot(x, y);
        tlA = gaussian(dTL, sigma);
      } else {
        const dBR = Math.hypot(1-x, 1-y);
        brA = gaussian(dBR, sigma);
      }
      wrap.style.setProperty('--tlA', (tlA*0.9).toFixed(3));
      wrap.style.setProperty('--brA', (brA*0.9).toFixed(3));
      const sc = 1 + 0.06 * Math.max(tlA, brA);
      wrap.style.setProperty('--sc', sc.toFixed(3));
    };
    btn.addEventListener('pointerenter', onMove);
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', ()=>{
      wrap.style.setProperty('--tlA','0'); wrap.style.setProperty('--brA','0'); wrap.style.setProperty('--sc','1');
    });
  });
}

/* CSS for corner glow (injected once) */
injectCSS(`
.btn-glow-wrap{ position:relative; display:inline-block; overflow:visible; isolation:isolate; z-index:0; }
.btn-glow-wrap>.btn{ position:relative; z-index:1; }
.btn-glow{ position:absolute; pointer-events:none; width: var(--sz,60px); height: var(--sz,60px);
  filter: blur(14px); opacity: 0; transform: translateZ(0) scale(var(--sc,1));
  transition: opacity .22s ease, transform .22s ease; z-index:0; }
.btn-glow.tl{ left: calc(-0.45 * var(--sz,60px)); top: calc(-0.45 * var(--sz,60px)); border-top-left-radius: 100%;
  background: radial-gradient(circle at 100% 100%,
    rgba(0,255,9,0.80) 0 28%,
    rgba(0,255,9,0.25) 46%,
    rgba(0,255,9,0.00) 70%);
  opacity: var(--tlA,0);
}
.btn-glow.br{ right: calc(-0.45 * var(--sz,60px)); bottom: calc(-0.45 * var(--sz,60px)); border-bottom-right-radius: 100%;
  background: radial-gradient(circle at 0% 0%,
    rgba(0,25,255,0.80) 0 28%,
    rgba(0,25,255,0.25) 46%,
    rgba(0,25,255,0.00) 70%);
  opacity: var(--brA,0);
}
`);

/* ---------- Edge Reflection (1px SVG stroke tracing the edge) ---------- */
function initEdgeReflection(scope){
  const targets = scope.querySelectorAll('a.btn[data-glow]');
  targets.forEach(btn => {
    // add overlay svg if missing
    let wrap = btn.closest('.btn-edge-wrap');
    if (!wrap){
      wrap = document.createElement('span');
      wrap.className = 'btn-edge-wrap';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
    }
    let svg = wrap.querySelector('svg.edge-overlay');
    if (!svg){
      svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('class','edge-overlay');
      const tl = document.createElementNS('http://www.w3.org/2000/svg','path'); tl.setAttribute('class','tl');
      const br = document.createElementNS('http://www.w3.org/2000/svg','path'); br.setAttribute('class','br');
      svg.appendChild(tl); svg.appendChild(br);
      wrap.appendChild(svg);
    }
    const tl = svg.querySelector('path.tl');
    const br = svg.querySelector('path.br');

    const size = ()=>{
      const r = btn.getBoundingClientRect();
      const w=r.width, h=r.height, rad=h/2;
      const bw = parseFloat(getComputedStyle(btn).borderTopWidth)||0;
      const edgeR = Math.max(1, rad - bw*0.5);
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      // TL arc: top→left centered at (rad,rad) with radius edgeR
      tl.setAttribute('d', `M ${rad},${rad-edgeR} A ${edgeR} ${edgeR} 0 0 0 ${rad-edgeR},${rad}`);
      // BR arc: right→bottom centered at (w-rad, h-rad)
      br.setAttribute('d', `M ${w-edgeR},${h-rad} A ${edgeR} ${edgeR} 0 0 0 ${w-rad},${h-edgeR}`);

      const Ltl = tl.getTotalLength(), Lbr = br.getTotalLength();
      const seg = Math.max(18, Math.min(42, edgeR*0.65));
      tl.style.strokeDasharray = `${seg} ${Ltl}`;
      br.style.strokeDasharray = `${seg} ${Lbr}`;
      tl.dataset.total=Ltl; tl.dataset.seg=seg;
      br.dataset.total=Lbr; br.dataset.seg=seg;
    };
    size(); addEventListener('resize', size, {passive:true});

    const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
    const onMove = (e)=>{
      const r = btn.getBoundingClientRect();
      const w=r.width, h=r.height, rad=h/2;
      const x = clamp(e.clientX - r.left, 0, w);
      const y = clamp(e.clientY - r.top,  0, h);

      if (x <= w/2){
        let theta = Math.atan2(y - rad, x - rad);
        if (theta > -Math.PI/2) theta = -Math.PI/2;
        if (theta < -Math.PI)   theta = -Math.PI;
        const t = (theta + Math.PI) / (Math.PI/2); // 0..1 along TL
        const L = parseFloat(tl.dataset.total), seg = parseFloat(tl.dataset.seg);
        const start = Math.max(0, Math.min(L - seg, t*L - seg/2));
        tl.style.strokeDashoffset = start; tl.style.opacity = 0.95; br.style.opacity = 0;
      } else {
        let theta = Math.atan2(y - (h-rad), x - (w-rad));
        if (theta < 0) theta = 0;
        if (theta > Math.PI/2) theta = Math.PI/2;
        const t = theta / (Math.PI/2); // 0..1 along BR
        const L = parseFloat(br.dataset.total), seg = parseFloat(br.dataset.seg);
        const start = Math.max(0, Math.min(L - seg, t*L - seg/2));
        br.style.strokeDashoffset = start; br.style.opacity = 0.95; tl.style.opacity = 0;
      }
    };
    btn.addEventListener('pointerenter', onMove);
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', ()=>{ tl.style.opacity=0; br.style.opacity=0; });
  });
}

/* CSS for edge overlay */
injectCSS(`
.btn-edge-wrap{ position:relative; display:inline-block; }
.btn-edge-wrap>.btn{ position:relative; z-index:1; }
.edge-overlay{ position:absolute; inset:0; pointer-events:none; z-index:0; overflow:visible; }
.edge-overlay path{ fill:none; stroke-width:1; vector-effect: non-scaling-stroke; stroke-linecap:round; opacity:0; transition:opacity .1s ease; }
.edge-overlay path.tl{ stroke: var(--mateja-green); }
.edge-overlay path.br{ stroke: var(--leon-blue); }
`);

/* one-time CSS injector */
function injectCSS(css){
  if (document.querySelector(`style[data-injected="buttons"]`)) return;
  const s = document.createElement('style');
  s.dataset.injected = "buttons";
  s.textContent = css;
  document.head.appendChild(s);
}
