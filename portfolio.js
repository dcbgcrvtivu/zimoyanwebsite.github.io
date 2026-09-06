const subtleMotion = matchMedia('(prefers-reduced-motion: reduce)');
const narrativeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
 if (!entry.isIntersecting) return;
 entry.target.classList.add('in-view'); narrativeObserver.unobserve(entry.target);
}), {threshold:0.08});
document.querySelectorAll('.reveal').forEach(el => narrativeObserver.observe(el));
const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
 if (!entry.isIntersecting) return;
 countObserver.unobserve(entry.target);
 if (subtleMotion.matches) return;
 const el=entry.target, value=Number(el.dataset.count), decimals=Number(el.dataset.decimals||0), start=performance.now();
 function tick(now){const t=Math.min(1,(now-start)/850);el.textContent=(value*(1-Math.pow(1-t,3))).toFixed(decimals);if(t<1&&!subtleMotion.matches)requestAnimationFrame(tick);else el.textContent=value.toFixed(decimals);}
 requestAnimationFrame(tick);
}),{threshold:1});
document.querySelectorAll('[data-count]').forEach(el=>countObserver.observe(el));
