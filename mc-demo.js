(() => {
 const form=document.querySelector('#mc-form');if(!form)return;
 const button=document.querySelector('#mc-run'),status=document.querySelector('#mc-status');
 let worker=null;
 function axes(canvas,xmax,ymin,ymax,xlabel,ylabel){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,L=80,R=25,T=25,B=65;
  c.clearRect(0,0,w,h);c.fillStyle='#fff';c.fillRect(0,0,w,h);c.font='18px Arial';c.lineWidth=1;
  const x=v=>L+v/xmax*(w-L-R),y=v=>h-B-(v-ymin)/(ymax-ymin)*(h-T-B);
  for(let i=0;i<=4;i++){const value=ymin+(ymax-ymin)*i/4,yy=y(value);c.strokeStyle='#e4ecf2';c.beginPath();c.moveTo(L,yy);c.lineTo(w-R,yy);c.stroke();c.fillStyle='#738390';c.fillText(value.toFixed(ymax>100?0:2),5,yy+6);const xx=x(xmax*i/4);c.fillText((xmax*i/4).toFixed(2),xx-15,h-B+27);}
  c.fillStyle='#637e93';c.fillText(xlabel,w/2-40,h-10);c.fillText(ylabel,L,T-7);return {c,x,y,L,R,T,B,w,h};
 }
 function plot(result){
  const flat=result.paths.flat(),low=Math.min(0,...flat)-.15,high=Math.max(0,...flat)+.15;
  let a=axes(document.querySelector('#mc-paths'),1,low,high,'Time (years)','W(t)');
  result.paths.forEach((p,i)=>{a.c.strokeStyle=['#426c8b','#8bafc8','#547f9c','#a1bacb','#7098b1'][i%5];a.c.lineWidth=1.7;a.c.beginPath();p.forEach((v,j)=>j?a.c.lineTo(a.x(j/52),a.y(v)):a.c.moveTo(a.x(0),a.y(v)));a.c.stroke();});
  a=axes(document.querySelector('#mc-hist'),result.upper,0,Math.max(...result.bins)*1.1,'Discounted payoff','Count');
  result.bins.forEach((v,i)=>{a.c.fillStyle='#83a9c6';a.c.fillRect(a.x(i*result.upper/25)+1,a.y(v),(a.w-a.L-a.R)/25-2,a.y(0)-a.y(v));});
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const n=Number(document.querySelector('#mc-count').value),sigma=Number(document.querySelector('#mc-vol').value);
  if(!Number.isInteger(n)||n<100||n>100000||n%100!==0||!Number.isFinite(sigma)||sigma<0||sigma>1)return;
  const seed=crypto.getRandomValues(new Uint32Array(1))[0];
  document.querySelector('#mc-results').hidden=true;button.disabled=true;status.textContent='正在生成独立路径并计算收益…';
  try{worker=new Worker('mc-worker.js');}catch(error){status.textContent='无法启动计算线程。请通过本地 HTTP 服务打开此页面后重试。';button.disabled=false;return;}
  worker.onerror=()=>{status.textContent='计算线程启动失败，请通过本地 HTTP 服务打开页面后重试。';button.disabled=false;worker.terminate();};
  worker.onmessage=({data:r})=>{
   if(!r.done){status.textContent=`正在计算：${Math.round(r.progress*100)}%`;return;}
   document.querySelector('#mc-results').hidden=false;
   document.querySelector('#mc-value').textContent=r.mean.toFixed(4);document.querySelector('#mc-se').textContent=r.se.toFixed(4);document.querySelector('#mc-ci').textContent=`[${r.ci[0].toFixed(4)}, ${r.ci[1].toFixed(4)}]`;
   document.querySelector('#mc-parameters').textContent=`本次运行：N = ${r.n.toLocaleString()} · σ = ${(r.sigma*100).toFixed(0)}% · 随机种子 = ${r.seed}`;
   document.querySelector('#mc-summary').textContent=`零收益路径：${r.zeros.toLocaleString()} / ${r.n.toLocaleString()}。置信区间仅描述本次模型下的抽样不确定性，不涵盖模型误差；小样本或高偏态下正态近似可能不准确。`;
   plot(r);status.textContent=`已完成 ${r.n.toLocaleString()} 条路径的实际模拟。`;button.disabled=false;worker.terminate();
  };
  worker.postMessage({n,sigma,seed});
 });
})();
