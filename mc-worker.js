// Independent paths; exact GBM transitions and Box–Muller standard normals.
self.onmessage = ({data:{n,sigma,seed}}) => {
  let state=seed>>>0;
  function uniform(){ state=(state+0x6D2B79F5)>>>0; let t=state; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return (((t^(t>>>14))>>>0)+0.5)/4294967296; }
  let spare=null;
  function normal(){if(spare!==null){const z=spare;spare=null;return z;} const radius=Math.sqrt(-2*Math.log(uniform())),angle=2*Math.PI*uniform();spare=radius*Math.sin(angle);return radius*Math.cos(angle);}
  const steps=52,dt=1/steps,root=Math.sqrt(dt),discount=Math.exp(-.05);
  const payoffs=new Float64Array(n),paths=[];let mean=0,m2=0,zeros=0,max=0;
  for(let i=0;i<n;i++){
    let s=100,w=0,sum=0;const path=i<10?[0]:null;
    for(let j=0;j<steps;j++){const dw=root*normal();w+=dw;s*=Math.exp((.05-.5*sigma*sigma)*dt+sigma*dw);sum+=s;if(path)path.push(w);}
    const y=discount*Math.max(sum/steps-100,0);payoffs[i]=y;if(y===0)zeros++;max=Math.max(max,y);
    const delta=y-mean;mean+=delta/(i+1);m2+=delta*(y-mean);if(path)paths.push(path);
    if((i+1)%5000===0)self.postMessage({progress:(i+1)/n});
  }
  const bins=Array(25).fill(0),upper=max>0?max*1.000001:1;
  for(const y of payoffs)bins[Math.min(24,Math.floor(y/upper*25))]++;
  const se=Math.sqrt(m2/(n-1)/n);
  self.postMessage({done:true,n,sigma,seed,mean,se,ci:[mean-1.96*se,mean+1.96*se],paths,bins,upper,zeros});
};
