/* Purposeful navigation and planar geometric loaders.
 * Load after the shared recipes (and signature, when present). No engine changes.
 * A loop owns one periodic phase; its first derivative matches across the seam.
 */
(function (M) {
  'use strict';
  const {clamp01, arc, polar, lerpPath} = M.util;
  const TAU = Math.PI * 2;
  const attr = (p,k,v) => p.setAttribute(k,v);
  const opacity = (p,v) => attr(p,'opacity',clamp01(v));
  const n = v => +v.toFixed(3);
  const move = (p,x=0,y=0,a=0,cx=60,cy=60) => attr(p,'transform',`translate(${n(x)} ${n(y)}) rotate(${n(a)} ${cx} ${cy})`);
  const act = (label,run,pose,from) => ({label,run,...(pose?{pose}:{}),...(from?{from}:{})});
  const ease = (c,values,preset='gentle') => { for(const[k,v]of Object.entries(values)) c.to(k,v,preset); };
  const blend = (a,b,t) => n(a+(b-a)*t);
  function define(name,r) { M.define(name,{...r,motionDesign:'planar-geometry-v1'}); }

  // Add: the four arms unfold into the corners of a new space. No wiggle,
  // whole-icon bounce, or misleading rotation into a dismiss cross on hover.
  define('plus', {
    svg:`<g data-part="arms">${[0,1,2,3].map(i=>`<path data-part="a${i}"/>`).join('')}</g><path data-part="center" d="M50 60H70M60 50V70"/><path data-part="tick" d="M44 61L55 72L77 48"/>`,
    state:{opening:0,confirmed:0,turn:0},
    poses:{idle:{},open:{opening:1},confirmed:{confirmed:1},closed:{turn:45}},
    render(s,p) {
      const t=clamp01(s.opening),done=clamp01(s.confirmed);
      // Move the elbow, then derive its tangent points. Interpolating all
      // points independently made the last segment diagonal halfway through.
      const x=60-30*t,y=32-2*t,r=6*t;
      const d=`M${n(x)} ${n(60-16*t)}L${n(x)} ${n(y+r)}Q${n(x)} ${n(y)} ${n(x+r)} ${n(y)}L${n(60-16*t)} ${n(y)}`;
      for(let i=0;i<4;i++){attr(p['a'+i],'d',d);move(p['a'+i],0,0,90*i+s.turn);}
      opacity(p.arms,1-done);opacity(p.center,1-done);
      // Grow the retained center mark by length, not a structural cross-fade.
      attr(p.center,'d',`M${n(60-10*t)} 60H${n(60+10*t)}M60 ${n(60-10*t)}V${n(60+10*t)}`);
      opacity(p.tick,done);attr(p.tick,'pathLength',1);attr(p.tick,'stroke-dasharray',`${done} 2`);
      p.tick.style.color='var(--mi-success,#29814a)';
    },
    actions:{
      tap:act('打开新空间',async c=>{c.to('opening',1,'gentle');await c.wait(240);},'open'),
      unfold:{label:'展开进度',initial:0,drive(c,v){c.to('opening',clamp01(v),'track');}},
      peek:act('展开添加入口',async c=>{c.to('opening',1,'gentle');await c.wait(260);},'open'),
      add:act('进入添加',async c=>{ease(c,{opening:1,confirmed:0});await c.wait(260);},'open'),
      confirm:act('添加成功',async c=>{ease(c,{confirmed:1,opening:0});await c.wait(300);},'confirmed'),
      reject:act('暂未添加',async c=>{c.error();c.to('opening',.35,'gentle');await c.wait(280);}),
      reset:act('回到加号',async c=>{ease(c,{opening:0,confirmed:0,turn:0});await c.wait(280);},'idle'),
      toClose:act('变为关闭',async c=>{ease(c,{opening:0,confirmed:0,turn:45});await c.wait(280);},'closed')
    }
  });

  // Book: real line ownership. The back leaf is tucked behind the complete cover,
  // then unfolds from that silhouette. A bookmark retracts through a geometric
  // clip; a binding line becomes the open gutter. No opacity handoff is involved.
  let bookSerial=0;const bookMasks=new WeakMap();
  function bookLayers(p,right) {
    let masks=bookMasks.get(p.back);
    if(!masks){
      const doc=p.back.ownerDocument,ns='http://www.w3.org/2000/svg',defs=doc.createElementNS(ns,'defs');
      const id='mi-book-fold-'+(++bookSerial),mask=doc.createElementNS(ns,'mask');
      mask.id=id;
      for(const[k,v]of Object.entries({maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:-60,y:-60,width:240,height:240}))attr(mask,k,v);
      mask.style.cssText='mask-type:luminance';
      const keep=doc.createElementNS(ns,'rect');
      for(const[k,v]of Object.entries({x:-60,y:-60,width:240,height:240}))attr(keep,k,v);
      keep.style.cssText='fill:white;stroke:none';
      const cut=doc.createElementNS(ns,'path');cut.style.cssText='fill:black;stroke:black;stroke-width:inherit';
      mask.append(keep,cut);
      const clip=doc.createElementNS(ns,'clipPath'),inside=doc.createElementNS(ns,'path');
      clip.id=id+'-inside';attr(clip,'clipPathUnits','userSpaceOnUse');clip.append(inside);
      defs.append(mask,clip);p.back.parentNode.insertBefore(defs,p.back);
      attr(p.back,'mask',`url(#${id})`);attr(p.markClip,'clip-path',`url(#${clip.id})`);
      masks={cut,inside};bookMasks.set(p.back,masks);
    }
    attr(masks.cut,'d',right);attr(masks.inside,'d',right);
  }
  const bookClosed='M48 24C56.667 24 65.333 24 74 24Q82 24 82 32L82 90Q82 98 74 98C65.333 98 56.667 98 48 98Q40 98 40 90L40 32Q40 24 48 24Z';
  const bookOpen='M60 33C72 25 88 25 98 28Q104 29 104 36L104 86Q104 93 98 92C85 89 73 91 60 98Q60 98 60 90L60 40Q60 33 60 33Z';
  let bookCoordinate=0;
  const bookLeftOpen=bookOpen.replace(/-?\d+(?:\.\d+)?/g,value=>String(bookCoordinate++%2===0?120-Number(value):Number(value)));
  define('book', {
    geometryOnly:true,
    svg:`<g data-part="back"><path data-part="left"/></g><path data-part="right"/><g data-part="markClip"><path data-part="mark" d="M58 26V48L64 43L70 48V26"/></g><path data-part="spine"/>`,
    state:{opening:0,leaf:0},
    poses:{idle:{},open:{opening:1},selected:{opening:1}},
    periodic:{leaf:1},
    render(s,p){
      const t=clamp01(s.opening);
      // The cover leads; the tucked inner leaf follows. These spatial profiles
      // are reversible and share one spring, so interruptions never queue stages.
      const cover=t*(2-t),page=t*t*(3-2*t);
      const right=lerpPath(bookClosed,bookOpen,cover);
      attr(p.right,'d',right);attr(p.left,'d',lerpPath(bookClosed,bookLeftOpen,page));
      bookLayers(p,right);
      attr(p.mark,'transform',`translate(${n(20*cover)} ${n(-48*t)})`);
      const x=49+11*cover,top=32+cover,bottom=90+8*cover;
      // A flexing page edge peels away from, then rejoins, the persistent gutter.
      const bow=28*Math.sin(TAU*s.leaf)*page;
      attr(p.spine,'d',`M${n(x)} ${n(top)}C${n(x+bow)} ${n(top+18)} ${n(x+bow)} ${n(bottom-18)} ${n(x)} ${n(bottom)}`);
    },
    actions:{
      tap:act('展开书封',async c=>{c.to('opening',1,'gentle');await c.wait(360);},'open'),
      unfold:{label:'展开进度',initial:0,drive(c,v){c.to('opening',clamp01(v),'track');}},
      peek:act('书封带出内页',async c=>{c.to('opening',1,'gentle');await c.wait(380);},'open','idle'),
      select:act('沿书脊展开',async c=>{c.to('opening',1,'gentle');await c.wait(380);},'selected'),
      close:act('内页收回书封',async c=>{ease(c,{opening:0,leaf:0});await c.wait(380);},'idle'),
      turn:act('页缘弯曲换页',async c=>{c.to('opening',1,'gentle');c.to('leaf',c.s.leaf+1,'slow');await c.wait(620);},'open','open')
    }
  });

  // Settings: three independent, segmented tracks. Knobs cover no rear lines;
  // their positions genuinely change instead of scaling a container or gear.
  define('settings', {
    svg:[32,60,88].map((x,i)=>`<path data-part="rail${i}"/><circle data-part="knob${i}" data-fill cx="${x}" cy="60" r="8"/>`).join(''),
    state:{mix:0},poses:{idle:{},adjusting:{mix:.65},selected:{mix:1}},
    render(s,p){[32,60,88].forEach((x,i)=>{const y=[44,76,54][i]+([70,42,78][i]-[44,76,54][i])*clamp01(s.mix);
      attr(p['rail'+i],'d',`M${x} 24V${n(y-12)}M${x} ${n(y+12)}V96`);
      opacity(p['rail'+i],.55);attr(p['knob'+i],'cy',n(y));});},
    actions:{
      tap:act('微调参数',async c=>{c.to('mix',c.goal('mix')===1?.8:.2,'gentle');await c.wait(200);}),
      peek:act('预览调节',async c=>{c.to('mix',.65,'gentle');await c.wait(300);},'adjusting'),
      select:act('调到设置',async c=>{c.to('mix',1,'gentle');await c.wait(320);},'selected'),
      turn:act('调整组合',async c=>{c.to('mix',c.goal('mix')>.5?0:1,'gentle');await c.wait(320);})
    }
  });

  // One phase + a spring-gated envelope. No loop-driven DOM reordering, resets,
  // clipped pop opacity, or a forced trip to phase zero when finishing.
  function loader(name,svg,render,period=1.8,pose='busy') {
    define(name,{svg,state:{phase:0,energy:0,speed:0},poses:{idle:{},[pose]:{energy:1,speed:1}},periodic:{phase:1},
      task:{busy:'loading',success:'confirm',fail:'fail'},
      render,loopPeriod:period,
      actions:{
        tap:act('预演节奏',async c=>{c.to('energy',.6,'fade');c.to('phase',.2,'gentle');await c.wait(220);c.to('energy',0,'fade');await c.wait(220);}),
        start:act('预演一拍',async c=>{c.to('energy',1,'fade');c.to('phase',.42,'slow');await c.wait(600);c.to('energy',0,'fade');await c.wait(260);},'idle','idle'),
        loading:{label:'加载中',loop:true,pose,exit:'finish',run(c){
          ease(c,{energy:1,speed:1},'fade');c.claim('phase');
          c.loop((t,dt)=>{c.s.phase=(c.s.phase+c.s.speed*dt/period)%1;});
        }},
        finish:act('平稳收束',async c=>{
          ease(c,{energy:0,speed:0},'exit');c.claim('phase');
          const stop=c.loop((t,dt)=>{c.s.phase=(c.s.phase+c.s.speed*dt/period)%1;});
          await c.wait(440);stop();
          if(c.alive()) c.setGoal('phase',c.s.phase);
        },'idle',pose)
      }});
  }
  const intensity=(phase,offset,sharpness=3)=>Math.exp(sharpness*(Math.cos(TAU*(phase-offset))-1));
  loader('load-activity',[0,1,2,3,4,5,6,7].map((i)=>{const a=-90+i*45;const [x,y]=polar(60,60,21,a),[xx,yy]=polar(60,60,36,a);return `<path data-part="t${i}" d="M${n(x)} ${n(y)}L${n(xx)} ${n(yy)}"/>`;}).join(''),
    (s,p)=>{for(let i=0;i<8;i++)opacity(p['t'+i],.22+.78*((1-s.energy)*.3+s.energy*intensity(s.phase,i/8,2.8)));},1.55);

  loader('load-typing',[36,60,84].map((x,i)=>`<circle data-part="d${i}" data-fill cx="${x}" cy="64" r="6"/>`).join(''),
    (s,p)=>{for(let i=0;i<3;i++){const wave=(1-Math.cos(TAU*(s.phase-i*.16)))/2;attr(p['d'+i],'cy',n(64-15*s.energy*wave));opacity(p['d'+i],.45+.55*((1-s.energy)+s.energy*wave));}},1.7);

  loader('load-comet',`<path data-part="arc"/><path data-part="echo"/><circle data-part="head" data-fill cx="60" cy="28" r="4"/>`,
    (s,p)=>{const a=-90+360*s.phase,len=68+56*s.energy*(1-Math.cos(TAU*s.phase))/2;
      attr(p.arc,'d',arc(60,60,32,a-len,a));attr(p.echo,'d',arc(60,60,32,a+90,a+150));opacity(p.echo,.22);
      const[x,y]=polar(60,60,32,a);attr(p.head,'cx',n(x));attr(p.head,'cy',n(y));},1.8);

  loader('load-bars',[27,47,67,87].map((x,i)=>`<rect data-part="b${i}" data-fill x="${x}" y="50" width="8" height="20" rx="4"/>`).join(''),
    (s,p)=>{for(let i=0;i<4;i++){const h=18+32*s.energy*(1-Math.cos(TAU*(s.phase-i*.16)))/2;attr(p['b'+i],'height',n(h));attr(p['b'+i],'y',n(60-h/2));}},1.9);

  // Uniform arc-length traversal, not constant Bezier parameter speed.
  const curves=[[[24,60],[24,28],[44,28],[60,60]],[[60,60],[76,92],[96,92],[96,60]],[[96,60],[96,28],[76,28],[60,60]],[[60,60],[44,92],[24,92],[24,60]]];
  function eight(t){const w=((t%1)+1)%1*4,i=Math.floor(w),v=w-i,u=1-v,[a,b,c,d]=curves[i];return [0,1].map(k=>u*u*u*a[k]+3*u*u*v*b[k]+3*u*v*v*c[k]+v*v*v*d[k]);}
  const lut=[{d:0,p:eight(0)}];
  for(let i=1;i<=256;i++){const p=eight(i/256),prev=lut[i-1];lut.push({d:prev.d+Math.hypot(p[0]-prev.p[0],p[1]-prev.p[1]),p});}
  function onEight(t){const d=(((t%1)+1)%1)*lut[256].d;let lo=0,hi=256;while(hi-lo>1){const m=(lo+hi)>>1;if(lut[m].d<d)lo=m;else hi=m;}const k=(d-lut[lo].d)/(lut[hi].d-lut[lo].d);return [0,1].map(i=>lut[lo].p[i]+k*(lut[hi].p[i]-lut[lo].p[i]));}
  loader('load-infinity',`<path data-part="track" d="M24 60C24 28 44 28 60 60C76 92 96 92 96 60C96 28 76 28 60 60C44 92 24 92 24 60"/>`+[0,1,2].map(i=>`<circle data-part="d${i}" data-fill cx="24" cy="60" r="${6.6-i*.6}"/>`).join(''),
    (s,p)=>{opacity(p.track,.18);for(let i=0;i<3;i++){const[x,y]=onEight(s.phase-i*.045);attr(p['d'+i],'cx',n(x));attr(p['d'+i],'cy',n(y));opacity(p['d'+i],i? s.energy*(.65-i*.15):1);}},2.8);

  // A planar four-tile permutation replaces the transparent wireframe cube.
  loader('load-tumble',[0,1,2,3].map(i=>`<rect data-part="q${i}" x="20" y="20" width="21" height="21" rx="5"/>`).join(''),
    (s,p)=>{for(let i=0;i<4;i++){const a=(s.phase+i/4)*TAU,r=26+4*s.energy*Math.sin(TAU*s.phase)**2;
      attr(p['q'+i],'x',n(60+r*Math.cos(a)-10.5));attr(p['q'+i],'y',n(60+r*Math.sin(a)-10.5));}},3.2);

  loader('load-matrix',Array.from({length:9},(_,i)=>`<rect data-part="p${i}" data-fill x="${28+(i%3)*26}" y="${28+Math.floor(i/3)*26}" width="12" height="12" rx="3"/>`).join(''),
    (s,p)=>{for(let i=0;i<9;i++)opacity(p['p'+i],.22+.78*((1-s.energy)*.6+s.energy*intensity(s.phase,((i%3)+Math.floor(i/3))/6,3)));},2.2);

  // Nested flat orbits: no projected depth, size pumping, or per-frame z sorting.
  loader('load-sphere',[0,1,2,3,4,5].map(i=>`<circle data-part="s${i}" data-fill cx="60" cy="60" r="5.8"/>`).join(''),
    (s,p)=>{for(let i=0;i<6;i++){const inner=i>2,r=inner?20:36,a=(i%3)/3*TAU+(inner?-1:1)*s.phase*TAU;
      attr(p['s'+i],'cx',n(60+r*Math.cos(a)));attr(p['s'+i],'cy',n(60+r*Math.sin(a)));opacity(p['s'+i],inner?.55:1);}},3.4);

  loader('loading',`<path data-part="rail" d="M28 60H92"/><rect data-part="cap" data-fill x="26" y="53" width="22" height="14" rx="7"/>`,
    (s,p)=>{opacity(p.rail,.22);const x=26+46*s.energy*(1-Math.cos(TAU*s.phase))/2;attr(p.cap,'x',n(x));},1.85,'loading');
})(window.MotionIcon);

/* Review: an opaque physical prompt-shutter slides inside a fixed flashcard.
 * Hover is a preview reveal, never a simulated correct-answer confirmation. */
(function (M) {
  'use strict';
  const ns = 'http://www.w3.org/2000/svg';
  const set = (p, k, v) => p.setAttribute(k, v);
  const states = new WeakMap();
  let serial = 0;
  const action = (label, run, pose, internal) => ({label, run,
    ...(pose ? {pose} : {}), ...(internal ? {internal:true} : {})});
  function element(doc, name, attrs, css) {
    const p = doc.createElementNS(ns, name);
    Object.entries(attrs || {}).forEach(([k, v]) => set(p, k, v));
    if (css) p.style.cssText = css;
    return p;
  }
  function masks(p) {
    let state = states.get(p.rearLayer);
    if (state) return state;
    const doc = p.front.ownerDocument, id = `review-shutter-${++serial}`;
    const defs = element(doc, 'defs');
    const rear = element(doc, 'mask', {id:`${id}-rear`, maskUnits:'userSpaceOnUse',
      maskContentUnits:'userSpaceOnUse', x:-20, y:-20, width:160, height:160}, 'mask-type:luminance');
    rear.append(element(doc, 'rect', {x:-20,y:-20,width:160,height:160}, 'fill:white;stroke:none'));
    // This mask is outside the rotated rear group. Its cut is the complete final
    // foreground silhouette, including the optically constant outline footprint.
    rear.append(element(doc, 'rect', {x:34,y:25,width:66,height:74,rx:11},
      'fill:black;stroke:black;stroke-width:inherit'));
    const reveal = element(doc, 'mask', {id:`${id}-reveal`, maskUnits:'userSpaceOnUse',
      maskContentUnits:'userSpaceOnUse', x:30,y:20,width:76,height:84}, 'mask-type:luminance');
    reveal.append(element(doc, 'rect', {x:30,y:20,width:76,height:84}, 'fill:white;stroke:none'));
    const shutterCut = element(doc, 'rect', {x:37,y:32,width:60,height:58,rx:5},
      'fill:black;stroke:black;stroke-width:inherit');
    reveal.append(shutterCut);
    const interior = element(doc, 'clipPath', {id:`${id}-inside`,clipPathUnits:'userSpaceOnUse'});
    interior.append(element(doc, 'rect', {x:40,y:32,width:54,height:60,rx:5}));
    defs.append(rear, reveal, interior);
    p.rearLayer.parentNode.insertBefore(defs, p.rearLayer);
    set(p.rearLayer, 'mask', `url(#${id}-rear)`);
    set(p.recall, 'mask', `url(#${id}-reveal)`);
    // A stationary clip surrounds the moving shutter, not the other way around.
    set(p.shutterClip, 'clip-path', `url(#${id}-inside)`);
    state = {shutterCut}; states.set(p.rearLayer, state);
    return state;
  }
  M.define('cards', {
    layering:'fixed-flashcard-with-clipped-sliding-prompt-and-transparent-rear-mask',
    svg:`<g data-part="rearLayer"><g transform="rotate(-10 51 66)"><rect x="22" y="34" width="62" height="64" rx="10"/></g></g>
      <g data-part="front"><rect x="34" y="25" width="66" height="74" rx="11"/>
        <g data-part="recall"><path d="M81 68a15 15 0 1 0-1 17M81 58v11H70"/></g>
        <g data-part="shutterClip"><g data-part="shutter">
          <path d="M59 53a8 8 0 0 1 16 0c0 6-8 6-8 13"/>
          <circle cx="67" cy="77" r="1.7" data-fill/>
          <path d="M42 88h50"/>
        </g></g>
        <path data-part="pull" d="M61 91h12"/>
      </g>`,
    state:{reveal:0,pull:0},
    poses:{idle:{},open:{reveal:1},selected:{reveal:1}},
    render(s,p) {
      const cut = masks(p).shutterCut;
      const dy = -52 * M.util.clamp01(s.reveal);
      const transform = `translate(0 ${dy})`;
      set(p.shutter, 'transform', transform);
      set(cut, 'transform', transform);
      set(p.pull, 'transform', `translate(0 ${dy+s.pull})`);
      set(p.recall, 'opacity', .94);
    },
    actions:{
      tap:action('拨开遮片',async c => {
        c.to('reveal', .38, 'gentle'); await c.wait(180);
      },null,true),
      peek:action('揭开词卡',async c => {
        c.to('reveal',1,'gentle'); await c.wait(320);
      },'open'),
      select:action('进入回顾',async c => {
        c.to('reveal',1,'gentle'); await c.wait(270);
      },'selected'),
      remember:action('展开回顾',async c => {
        c.to('reveal',1,'gentle'); await c.wait(280);
      },'selected'),
      revisit:action('收起遮片',async c => {
        c.to('reveal',0,'gentle'); await c.wait(300);
      },'idle'),
      preparing:{label:'整理词卡',loop:true,run(c) {
        c.claim('reveal'); c.loop(t => {
          c.s.reveal = .55+.45*(1-Math.cos(t*Math.PI*1.25))/2;
        });
      }}
    }
  });
})(window.MotionIcon);

/* Dictation: a nib produces a short handwritten curve, then lifts from the paper.
 * The curve and nib share a cubic parameter: no detached tip or simulated page. */
(function (M) {
  'use strict';
  if (!M) return;
  const attr = (p, k, v) => p.setAttribute(k, v);
  const clamp = M.util.clamp01;
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const P = [[29, 88], [39, 66], [43, 108], [59, 83]];
  const masks = new WeakMap();
  let serial = 0;

  // De Casteljau splits this *same* curve at t. Stroke length is not used as
  // a proxy for cubic t, which would let the writing tip drift away from the ink.
  function trace(t) {
    const a = mix(P[0], P[1], t), b = mix(P[1], P[2], t), d = mix(P[2], P[3], t);
    const e = mix(a, b, t), f = mix(b, d, t), tip = mix(e, f, t);
    return {tip, path: `M${P[0]} C${a} ${e} ${tip}`};
  }

  function cutInk(p, transform) {
    let cut = masks.get(p.inkLayer);
    if (!cut) {
      const doc = p.inkLayer.ownerDocument, ns = 'http://www.w3.org/2000/svg';
      const defs = doc.createElementNS(ns, 'defs'), mask = doc.createElementNS(ns, 'mask');
      mask.id = `dictation-nib-cut-${++serial}`;
      Object.entries({maskUnits:'userSpaceOnUse', maskContentUnits:'userSpaceOnUse',
        x:-60, y:-60, width:240, height:240}).forEach(([k, v]) => attr(mask, k, v));
      mask.style.cssText = 'mask-type:luminance';
      const keep = doc.createElementNS(ns, 'rect');
      Object.entries({x:-60, y:-60, width:240, height:240}).forEach(([k, v]) => attr(keep, k, v));
      keep.style.cssText = 'fill:white;stroke:none';
      cut = p.penOutline.cloneNode(false); cut.removeAttribute('data-part');
      cut.style.cssText = 'fill:black;stroke:black;stroke-width:inherit';
      mask.append(keep, cut); defs.append(mask);
      p.inkLayer.parentNode.insertBefore(defs, p.inkLayer);
      attr(p.inkLayer, 'mask', `url(#${mask.id})`); masks.set(p.inkLayer, cut);
    }
    attr(cut, 'transform', transform);
  }

  async function writeCurve(c, end = 1, lift = 7) {
    // No global bounce: first make contact, draw with the tip, then lift only
    // the pencil. New actions inherit the spring's current position/velocity.
    c.to('lift', 0, 'gentle');
    await c.wait(75);
    if (!c.alive()) return;
    c.to('progress', end, 'draw');
    c.to('angle', -14 * end, 'gentle');
    await c.wait(end < .5 ? 160 : 290);
    if (!c.alive()) return;
    c.to('lift', lift, 'gentle');
    await c.wait(120);
  }

  M.define('pencil', {
    layering: 'nib-and-ink-share-cubic-final-transform-mask',
    svg: `<g data-part="inkLayer"><path data-part="ink" d="M29 88"/></g>
      <g data-part="pen"><path data-part="penOutline" d="M0 0L5-17 37-49Q41-53 45-49L51-43Q55-39 51-35L17-3Z"/>
      <path d="M34-46L48-32M5-17L17-3"/>
      <path data-fill d="M0 0L3-9 9-2Z"/></g>`,
    state: {progress:0, lift:0, angle:0},
    poses: {
      idle: {},
      open: {progress:1, lift:7, angle:-14},
      selected: {progress:1, lift:4, angle:-10}
    },
    render(s, p) {
      const t = clamp(s.progress), line = trace(t);
      attr(p.ink, 'd', line.path);
      // Fade only the initial sub-pixel dot, not the meaningful handwriting.
      attr(p.ink, 'opacity', clamp(t * 16));
      const transform = `translate(${line.tip[0]} ${line.tip[1] - s.lift}) rotate(${s.angle})`;
      attr(p.pen, 'transform', transform);
      cutInk(p, transform);
    },
    actions: {
      tap: {label:'试写一笔', internal:true, run:c => writeCurve(c, .35, 4)},
      peek: {label:'落笔成形', pose:'open', run:c => writeCurve(c)},
      select: {label:'执笔默写', pose:'selected', run:c => writeCurve(c, 1, 4)},
      write: {label:'写下短笔画', pose:'open', run:c => writeCurve(c)}
    }
  });
})(window.MotionIcon);
