const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    menuButton.focus();
  }
});

const demoChoices = document.querySelectorAll('.demo-choice');
const demoPanels = document.querySelectorAll('.demo-panel');
function selectDemo(id) {
  demoChoices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.project === id)));
  demoPanels.forEach(panel => { panel.hidden = panel.id !== `demo-${id}`; });
}
if (demoChoices.length) {
  demoChoices.forEach(button => button.addEventListener('click', () => selectDemo(button.dataset.project)));
  selectDemo(demoChoices[0].dataset.project);
}

const researchArt = document.querySelector('.research-art');
if (researchArt) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = researchArt.querySelector('.motion-toggle');
  let userPaused = false;
  let countersStarted = false;
  function finishCounters() {
    researchArt.querySelectorAll('.rolling-number').forEach(counter => {
      counter.textContent = counter.dataset.number;
    });
  }
  function syncMotion() {
    const paused = reducedMotion.matches || userPaused;
    researchArt.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.disabled = reducedMotion.matches;
    motionButton.textContent = reducedMotion.matches ? '静态模式' : (paused ? '继续动画' : '暂停动画');
    if (paused) finishCounters();
  }
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => { userPaused = !userPaused; syncMotion(); });
  reducedMotion.addEventListener('change', syncMotion);
  syncMotion();
  function rollCounters() {
    if (countersStarted) return;
    countersStarted = true;
    if (reducedMotion.matches || userPaused) return;
    researchArt.querySelectorAll('.rolling-number').forEach(counter => {
      const fragment = document.createDocumentFragment();
      for (const char of counter.dataset.number) {
        if (!/\d/.test(char)) { fragment.append(document.createTextNode(char)); continue; }
        const digit = Number(char);
        const windowEl = document.createElement('span'); windowEl.className = 'digit-window';
        const reel = document.createElement('span'); reel.className = 'digit-reel';
        for (let i = 0; i <= 10 + digit; i++) { const item = document.createElement('span'); item.textContent = String(i % 10); reel.append(item); }
        windowEl.append(reel); fragment.append(windowEl);
        requestAnimationFrame(() => requestAnimationFrame(() => { reel.style.transform = `translateY(-${(10 + digit) * 1.15}em)`; }));
      }
      counter.replaceChildren(fragment);
    });
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { rollCounters(); observer.disconnect(); }
  }, {threshold:.3});
  observer.observe(researchArt.querySelector('.research-stats'));
}

const lightbox = document.querySelector('.image-lightbox');
if (lightbox) {
  let activeGallery = null;
  let returnFocus = null;
  const galleries = [...document.querySelectorAll('.project-gallery')].map(gallery => {
    const thumbs = [...gallery.querySelectorAll('.gallery-thumb')];
    const state = { gallery, thumbs, index: 0 };
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', event => {
      event.preventDefault(); selectImage(state, index);
    }));
    gallery.querySelector('.gallery-open').addEventListener('click', event => {
      event.preventDefault(); activeGallery = state; returnFocus = event.currentTarget;
      updateLightbox(); lightbox.showModal(); document.body.classList.add('lightbox-open');
      lightbox.querySelector('.lightbox-close').focus();
    });
    return state;
  });
  function selectImage(state, index) {
    state.index = (index + state.thumbs.length) % state.thumbs.length;
    const thumb = state.thumbs[state.index];
    const main = state.gallery.querySelector('.gallery-main');
    main.classList.remove('is-changing');
    main.src = thumb.href; main.alt = thumb.dataset.title;
    const animate = () => {
      if (main.src === thumb.href) { main.classList.remove('is-changing'); void main.offsetWidth; main.classList.add('is-changing'); }
    };
    main.onload = animate;
    if (main.complete) animate();
    const opener = state.gallery.querySelector('.gallery-open');
    opener.href = thumb.href; opener.setAttribute('aria-label', '高清查看：' + thumb.dataset.title);
    state.gallery.querySelector('.gallery-title').textContent = thumb.dataset.title;
    state.gallery.querySelector('.gallery-caption').textContent = thumb.dataset.caption;
    state.gallery.querySelector('.gallery-count').textContent = `${String(state.index+1).padStart(2,'0')} / ${String(state.thumbs.length).padStart(2,'0')}`;
    state.thumbs.forEach((item, i) => { if (i === state.index) item.setAttribute('aria-current','true'); else item.removeAttribute('aria-current'); });
  }
  function updateLightbox() {
    const thumb = activeGallery.thumbs[activeGallery.index];
    lightbox.querySelector('img').src = thumb.href;
    lightbox.querySelector('img').alt = thumb.dataset.title;
    lightbox.querySelector('#lightbox-title').textContent = thumb.dataset.title;
    lightbox.querySelector('.lightbox-caption').textContent = thumb.dataset.caption;
    lightbox.querySelector('.lightbox-count').textContent = `${activeGallery.index+1} / ${activeGallery.thumbs.length}`;
    lightbox.querySelector('.lightbox-original').href = thumb.href;
  }
  function stepImage(delta) { selectImage(activeGallery, activeGallery.index + delta); updateLightbox(); }
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => stepImage(-1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => stepImage(1));
  lightbox.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const rect = lightbox.getBoundingClientRect();
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); stepImage(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepImage(-1); }
  });
  lightbox.addEventListener('close', () => { document.body.classList.remove('lightbox-open'); returnFocus?.focus(); });
}

const computingVisual = document.querySelector('.computing-visual');
if (computingVisual) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = computingVisual.querySelector('.research-motion');
  let paused = false;
  button.hidden = false;
  function sync() {
    computingVisual.classList.toggle('is-paused', paused || motion.matches);
    button.disabled = motion.matches;
    button.setAttribute('aria-pressed', String(paused || motion.matches));
    button.textContent = motion.matches ? '静态模式' : (paused ? '继续动画' : '暂停动画');
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
  motion.addEventListener('change', sync); sync();
  const numbers = [...document.querySelectorAll('[data-research-count]')];
  let started = false;
  function animateNumbers() {
    if (started) return;
    started = true;
    if (motion.matches) return;
    const start = performance.now();
    function frame(now) {
      const progress = motion.matches ? 1 : Math.min(1, (now-start)/1300);
      const eased = 1 - Math.pow(1-progress,3);
      numbers.forEach(el => { el.textContent = Math.round(Number(el.dataset.researchCount)*eased).toLocaleString('en-US'); });
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { animateNumbers(); observer.disconnect(); } }, {threshold:.25});
  observer.observe(document.querySelector('.data-evidence'));
}

const capabilityCards = document.querySelectorAll('.capability-card');
if (capabilityCards.length) {
  const capabilityObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('is-revealed'); capabilityObserver.unobserve(entry.target); } });
  }, {threshold:.2});
  capabilityCards.forEach(card => capabilityObserver.observe(card));
}

function revealHashDetails(){
 const id=decodeURIComponent(location.hash.slice(1));if(!id)return;
 const target=document.getElementById(id);if(!target)return;
 let node=target;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement;}
 requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange',revealHashDetails);
revealHashDetails();

