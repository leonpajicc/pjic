
/**
 * Slow, eye-friendly starfield with parallax + ultra-slow camera pan.
 * Continuous shimmer (sinusoidal) + occasional soft peaks and rare halo.
 */
export function startStarfield(){
  const old = document.getElementById('twinkle-stars');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  const canvas = document.createElement('canvas');
  canvas.id = 'twinkle-stars';
  Object.assign(canvas.style, { position:'fixed', inset:'0', zIndex:'0', pointerEvents:'none', opacity:'0.95' });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W=0, H=0;

  const CAM_SPEED = { x: 0.0032, y: 0.0007 };
  let camX = 0, camY = 0;

  const LAYERS = [
    { count: 70, speed: 0.005, parallax: 0.35, size: [0.9, 1.7], base: 0.10, ampA: [0.08, 0.14], ampP: [0.22, 0.32], oscT: [9000, 12000] },
    { count: 45, speed: 0.009, parallax: 0.65, size: [1.0, 2.0], base: 0.11, ampA: [0.10, 0.16], ampP: [0.24, 0.34], oscT: [8000, 11000] },
    { count: 30, speed: 0.015, parallax: 1.00, size: [1.2, 2.4], base: 0.12, ampA: [0.12, 0.18], ampP: [0.26, 0.36], oscT: [7000, 10000] }
  ];
  const GLOBAL_ALPHA = 1.0;
  const MAX_PEAKS = 4;
  const PEAK_DUR = [10000, 16000];
  const PEAK_GAP = [18000, 36000];

  const HALO = { active:false, nextAt:0, start:0, dur:0, x:0, y:0, r:0 };
  const HALO_GAP = [35000, 80000];
  const HALO_DUR = [14000, 22000];
  const HALO_RADIUS = [50, 110];
  const HALO_ALPHA = 0.18;

  let stars = [];

  const rand = (a,b)=> a + Math.random()*(b-a);
  const clamp = (v,min,max)=> Math.min(max, Math.max(min, v));
  const easeInOut = (t)=> t<0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;

  function resize(){
    DPR = Math.max(1, window.devicePixelRatio || 1);
    W = Math.floor(innerWidth * DPR);
    H = Math.floor(innerHeight * DPR);
    canvas.width = W; canvas.height = H;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    build();
  }

  function build(){
    stars = [];
    const now = performance.now();
    for (const layer of LAYERS){
      for (let i=0;i<layer.count;i++){
        const T = rand(layer.oscT[0], layer.oscT[1]);
        stars.push({
          x: Math.random()*W,
          y: Math.random()*H,
          r: rand(layer.size[0], layer.size[1]) * DPR,
          base: layer.base * rand(0.9, 1.1),
          ampA: rand(layer.ampA[0], layer.ampA[1]),
          ampP: rand(layer.ampP[0], layer.ampP[1]),
          phase: rand(0, Math.PI*2),
          omega: (Math.PI*2) / T,
          vx: (-0.8) * layer.speed * DPR,
          vy: ( 0.2) * layer.speed * DPR,
          par: layer.parallax,
          peaking: false,
          peakStart: now + rand(0, 12000),
          peakDur: rand(PEAK_DUR[0], PEAK_DUR[1]),
          peakGap: rand(PEAK_GAP[0], PEAK_GAP[1])
        });
      }
    }
    HALO.active=false; HALO.nextAt = now + rand(40000, 90000);
  }

  const wrapCoord = (v,limit)=> (v%limit + limit) % limit;

  let last = performance.now();
  function frame(now){
    const dt = now - last; last = now;

    camX += CAM_SPEED.x * DPR * dt;
    camY += CAM_SPEED.y * DPR * dt;

    // peak scheduling
    let peakingCount = 0;
    for (const s of stars) if (s.peaking) peakingCount++;
    for (const s of stars){
      if (!s.peaking && peakingCount < MAX_PEAKS && now >= s.peakStart){
        s.peaking = true; s.peakStart = now; s.peakEnd = now + s.peakDur; peakingCount++;
      }
    }

    // halo scheduling
    if (!HALO.active && now >= HALO.nextAt){
      HALO.active = true; HALO.start = now; HALO.dur = rand(HALO_DUR[0], HALO_DUR[1]);
      HALO.x = rand(0.1,0.9)*W; HALO.y = rand(0.1,0.9)*H; HALO.r = rand(HALO_RADIUS[0], HALO_RADIUS[1])*DPR;
    }

    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = GLOBAL_ALPHA;

    for (const s of stars){
      s.x += s.vx * dt; s.y += s.vy * dt;
      const sx = wrapCoord(s.x + camX * s.par, W);
      const sy = wrapCoord(s.y + camY * s.par, H);
      if (s.x < -10) s.x += W+20; if (s.x > W+10) s.x -= W+20;
      if (s.y < -10) s.y += H+20; if (s.y > H+10) s.y -= H+20;

      s.phase += s.omega * dt;
      const osc = 0.5 * (1 - Math.cos(s.phase)); // 0..1 smooth

      let env = 0.12;
      if (s.peaking){
        const t = (now - s.peakStart) / s.peakDur;
        if (t >= 1){ s.peaking=false; s.peakStart = now + s.peakGap; }
        else { env = easeInOut(t); }
      }

      const amp = s.ampA*(1-env) + s.ampP*env;
      let alpha = s.base + amp * osc;
      alpha = clamp(alpha, 0, 1);

      if (env > 0.45){
        const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r*3.2);
        gr.addColorStop(0.0, `rgba(255,255,255,${(alpha*0.9).toFixed(3)})`);
        gr.addColorStop(0.5, `rgba(200,200,255,${(alpha*0.35).toFixed(3)})`);
        gr.addColorStop(1.0, `rgba(0,0,0,0)`);
        ctx.globalAlpha = 1; ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(sx, sy, s.r*3.2, 0, Math.PI*2); ctx.fill();
      } else {
        ctx.globalAlpha = alpha; ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI*2); ctx.fill();
      }
    }

    if (HALO.active){
      const t = (now - HALO.start) / HALO.dur;
      if (t >= 1){ HALO.active=false; HALO.nextAt = now + (HALO_GAP[0] + Math.random()*(HALO_GAP[1]-HALO_GAP[0])); }
      else {
        const k = (t<0.5) ? (2*t*t) : (1 - Math.pow(-2*t+2,2)/2);
        const alpha = HALO_ALPHA * k;
        const r = HALO.r * (0.92 + 0.18*k);
        const x = wrapCoord(HALO.x + camX * 0.6, W);
        const y = wrapCoord(HALO.y + camY * 0.6, H);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, `rgba(255,255,255,${(alpha*0.9).toFixed(3)})`);
        grd.addColorStop(0.35, `rgba(180,180,255,${(alpha*0.45).toFixed(3)})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
      }
    }

    requestAnimationFrame(frame);
  }

  addEventListener('resize', resize, {passive:true});
  resize();
  requestAnimationFrame((t)=>{ frame(t); });
}
