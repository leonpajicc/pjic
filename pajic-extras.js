
/*! pajic-extras.js — one-line drop-in
   - Makes the header logo link to index.html
   - Reuses your EXISTING 3 dots to rotate the sub-title + paragraph under the H1
   - No extra dots or bars are created
*/
(function(){
  const WIN = window;
  function ready(fn){ (document.readyState==='loading') ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  // Inject minimal CSS
  function injectCSS(){
    const css = `
      .pajic-rot-wrap{ position:relative; overflow:hidden; }
      .pajic-rot-track{ position:absolute; left:0; top:0; width:100%; transition:transform .7s cubic-bezier(.22,.61,.36,1); }
      .pajic-rot-item{ width:100%; }
    `.trim();
    const s=document.createElement('style'); s.id='pajic-extras-style'; s.textContent=css; document.head.appendChild(s);
  }

  // Make logo clickable to index.html
  function hookLogo(){
    const header = document.querySelector('header') || document;
    const logo = header.querySelector('#pajic-logo, img[alt*="pajic" i], img[alt*="logo" i]');
    if(!logo) return;
    let a = logo.closest('a');
    if(!a){
      a = document.createElement('a');
      a.href='index.html'; a.setAttribute('aria-label','Home');
      logo.before(a); a.append(logo);
    }
    a.href='index.html';
  }

  // Find a good hero container
  function findHero(){
    return document.querySelector('.hero') ||
           document.querySelector('main') ||
           document.querySelector('section') ||
           document.body;
  }

  // Find H1 (master), H2 (subtitle) and following paragraph
  function findBlocks(scope){
    const h1 = scope.querySelector('h1');
    // Sub-title candidate: next h2 after h1, else the first h2 under hero
    let h2 = h1 ? h1.parentElement.querySelector('h2') : scope.querySelector('h2');
    if(!h2){
      // fallback: next block-level sibling after h1 that is not p (some themes use div)
      h2 = h1 && h1.nextElementSibling && h1.nextElementSibling.tagName!=='P' ? h1.nextElementSibling : null;
    }
    // Paragraph below h2
    let p = h2 ? h2.nextElementSibling : null;
    if(p && p.tagName!=='P'){ p = scope.querySelector('p'); }
    return {h1, h2, p};
  }

  // Locate the EXISTING 3 dots element near the hero
  function findDots(scope){
    // Common classnames
    let el = scope.querySelector('.dots, .slider-dots, .pagination, .nav-dots');
    if(el && el.children.length===3) return el;
    // fallback: closest element with exactly 3 small children (likely the dots)
    const cands = [...scope.querySelectorAll('*')].filter(x => x.children && x.children.length===3);
    // prefer the one visually under the h2/p (later in DOM)
    return cands.reverse().find(x=>x.offsetTop > (scope.querySelector('h2')?.offsetTop||0)) || null;
  }

  // Build sliding tracks around existing h2 + p
  function buildTrack(el, items){
    if(!el) return null;
    const height = el.getBoundingClientRect().height || el.offsetHeight || 0;
    const wrap = document.createElement('div'); wrap.className='pajic-rot-wrap'; wrap.style.height = height+'px';
    const track = document.createElement('div'); track.className='pajic-rot-track';
    // First item is current content to avoid initial jump
    const first = document.createElement('div'); first.className='pajic-rot-item'; first.innerHTML = items[0]; track.appendChild(first);
    for(let i=1;i<items.length;i++){ const d=document.createElement('div'); d.className='pajic-rot-item'; d.innerHTML=items[i]; track.appendChild(d); }
    el.after(wrap); wrap.appendChild(el); el.style.margin=0; el.style.visibility='hidden';
    wrap.appendChild(track);
    return {wrap, track, source: el};
  }

  function initSlider(){
    const hero = findHero(); if(!hero) return;
    const {h1,h2,p} = findBlocks(hero); if(!h2 || !p) return;
    const dotsWrap = findDots(hero); if(!dotsWrap) return;
    const dots = [...dotsWrap.children].slice(0,3);
    if(dots.length!==3) return;

    // If we previously injected our old rotator, remove it
    document.querySelectorAll('.tagline-rotator, .rotator-dots').forEach(n=>n.remove());

    // Slides: keep first equal to current DOM so nothing changes at load
    const SLIDES = [
      { sub: h2.innerHTML, body: p.innerHTML },
      { sub: "Nothing (yet) to see here.", body: "We are setting everything up and that may take a while. Stay tuned." },
      { sub: "Launching soon.", body: "Follow along as we bring the systems online and open the hangar doors." }
    ];

    const subTrack  = buildTrack(h2, SLIDES.map(s=>s.sub));
    const bodyTrack = buildTrack(p,  SLIDES.map(s=>s.body));
    if(!subTrack || !bodyTrack) return;

    let idx = 0, timer = null, DUR = 6000;
    function go(n, manual=false){
      idx = (n+SLIDES.length)%SLIDES.length;
      subTrack.track.style.transform  = `translateY(${-idx * subTrack.wrap.clientHeight}px)`;
      bodyTrack.track.style.transform = `translateY(${-idx * bodyTrack.wrap.clientHeight}px)`;
      dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
      if (manual){ schedule(); }
    }
    function schedule(){ clearTimeout(timer); timer=setTimeout(()=>{ go(idx+1); schedule(); }, DUR); }

    dots.forEach((d,i)=> d.addEventListener('click', ()=> go(i, true)));
    dots.forEach((d,i)=> d.classList.toggle('active', i===0));
    schedule();

    // Keep heights in sync on resize
    let rAF=null;
    window.addEventListener('resize', ()=>{ cancelAnimationFrame(rAF); rAF=requestAnimationFrame(()=>{
      const hSub  = subTrack.source.getBoundingClientRect().height || subTrack.source.offsetHeight;
      const hBody = bodyTrack.source.getBoundingClientRect().height || bodyTrack.source.offsetHeight;
      subTrack.wrap.style.height  = hSub+'px';
      bodyTrack.wrap.style.height = hBody+'px';
      go(idx);
    }); });
  }

  ready(function(){
    injectCSS();
    hookLogo();
    initSlider();
  });
})();
