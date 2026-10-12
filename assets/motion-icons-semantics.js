/* Product meanings: persistent outcomes, distinct verbs and planar composition.
 * Load after refinements. Original engine and built-in source remain unchanged. */
(function(M){
  'use strict';
  const {clamp01,around,arc,lerpPath}=M.util;
  const attr=(p,k,v)=>p.setAttribute(k,v),op=(p,v)=>attr(p,'opacity',clamp01(v));
  const ink=(p,role,t=1)=>{p.style.color=`color-mix(in srgb,currentColor ${100*(1-clamp01(t))}%,var(--mi-${role}) ${100*clamp01(t)}%)`;};
  const lengths=new WeakMap();
  const draw=(p,t)=>{let length=lengths.get(p);if(length===undefined){length=p.getTotalLength();lengths.set(p,length);}attr(p,'stroke-dasharray',`${length*clamp01(t)} ${length+1}`);op(p,clamp01(t)*8);};
  const move=(p,x=0,y=0,angle=0,cx=60,cy=60)=>attr(p,'transform',`translate(${x} ${y}) rotate(${angle} ${cx} ${cy})`);
  const change=(values,ms=300)=>async c=>{for(const[k,v]of Object.entries(values))c.to(k,v,'gentle');await c.wait(ms);};
  const action=(label,run,pose,from)=>({label,run,...(pose?{pose}:{}),...(from?{from}:{})});
  const refuse=values=>async c=>{c.error();for(const[k,v]of Object.entries(values))c.to(k,v,'snap');await c.wait(300);};
  function define(name,svg,state,poses,render,actions,extra={}){
    const old=M.recipes[name];
    // Internal tap compatibility remains, but it is not a separate semantic demo.
    actions.tap={label:'按下反馈',internal:true,run:async c=>{await c.press(.96);}};
    M.define(name,{...old,svg,state,poses,render,actions,...extra});
  }
  // Independent masks, safe for transparent hosts and many instances in one document.
  let serial=0;const masks=new WeakMap();
  function hideBehind(part,key,path,transform=''){
    let all=masks.get(part);if(!all){all={};masks.set(part,all);}
    let cut=all[key];
    if(!cut){const d=part.ownerDocument,ns='http://www.w3.org/2000/svg',defs=d.createElementNS(ns,'defs'),m=d.createElementNS(ns,'mask');
      m.id='mi-semantic-mask-'+(++serial);attr(m,'maskUnits','userSpaceOnUse');attr(m,'x',-120);attr(m,'y',-120);attr(m,'width',360);attr(m,'height',360);
      const white=d.createElementNS(ns,'rect');for(const[k,v]of Object.entries({x:-120,y:-120,width:360,height:360}))attr(white,k,v);white.style.cssText='fill:white;stroke:none';m.appendChild(white);
      cut=d.createElementNS(ns,'path');cut.style.cssText='fill:black;stroke:none';m.appendChild(cut);defs.appendChild(m);part.ownerSVGElement.prepend(defs);
      const wrap=d.createElementNS(ns,'g');attr(wrap,'mask',`url(#${m.id})`);part.before(wrap);wrap.appendChild(part);all[key]=cut;
    }attr(cut,'d',path);attr(cut,'transform',transform);return cut;
  }

  define('phone',`<g data-part="hand"><path d="M34 20L49 25Q54 27 52 33L46 45Q42 50 48 58L62 74Q68 80 73 76L84 69Q89 66 93 71L102 84Q105 90 98 96C83 108 65 96 47 78C29 60 18 36 26 24Q29 20 34 20Z"/></g><path data-part="signal" d="M78 24Q94 30 98 46M73 35Q81 38 84 47"/><path data-part="end" d="M83 29L99 45M99 29L83 45"/>`,
    {angle:0,x:0,y:0,signal:0,end:0,connected:0},
    {idle:{},answered:{angle:-18,x:-3,y:-4,connected:1},rejected:{end:1}},
    (s,p)=>{move(p.hand,s.x,s.y,s.angle);op(p.signal,s.signal);draw(p.end,s.end);ink(p.hand,'success',s.connected);ink(p.end,'recording');},
    {ring:action('振铃',async c=>{c.to('signal',1,'fade');c.to('angle',-12,'snap');await c.wait(100);c.to('angle',10,'gentle');await c.wait(160);}),
     ringing:{label:'振铃中',loop:true,run(c){c.claim('angle','signal');c.loop(t=>{c.s.angle=10*Math.sin(t*7);c.s.signal=.45+.55*Math.sin(t*3.5)**2;});}},
     answer:action('接听',change({angle:-18,x:-3,y:-4,signal:0,connected:1}),'answered','idle'),
     hangup:action('挂断',async c=>{c.to('angle',34,'gentle');c.to('y',12,'gentle');c.to('connected',0,'fade');await c.wait(200);c.to('angle',0,'gentle');c.to('y',0,'snap');c.to('x',0,'gentle');await c.wait(170);},'idle','answered'),
     reject:action('拒接',async c=>{c.to('signal',0,'fade');c.to('x',-12,'snap');c.to('end',1,'draw');await c.wait(220);},'rejected','idle')});

  define('cart',`<g data-part="rig"><path d="M18 28H28L40 80H90M32 44H99L91 72H39"/><g data-part="item"><rect x="53" y="28" width="24" height="21" rx="4"/><path d="M60 28V36H70V28"/></g><g data-part="w1"><circle cx="47" cy="94" r="7"/><path d="M47 88V100"/></g><g data-part="w2"><circle cx="83" cy="94" r="7"/><path d="M83 88V100"/></g></g><path data-part="result" d="M43 58L56 71L81 43"/>`,
    {x:0,rigOn:1,iy:0,io:0,roll:0,result:0},
    {idle:{},loaded:{io:1,iy:19},checkedOut:{x:128,rigOn:0,result:1}},
    (s,p)=>{move(p.rig,s.x);op(p.rig,s.rigOn);move(p.item,0,s.iy);op(p.item,s.io);for(const[k,x]of [['w1',47],['w2',83]])move(p[k],0,0,s.roll,x,94);draw(p.result,s.result);ink(p.result,'success');},
    {add:action('放入商品',async c=>{c.to('result',0,'fade');c.to('rigOn',1,'fade');c.to('x',0,'gentle');c.set({iy:-12,io:0});c.to('io',1,'fade');c.to('iy',19,'snap');await c.wait(320);},'loaded','idle'),
     remove:action('取出商品',async c=>{c.to('iy',-22,'gentle');await c.wait(180);c.to('io',0,'fade');await c.wait(160);},'idle','loaded'),
     checkout:action('结算',async c=>{c.to('x',128,'exit');c.to('roll',220,'gentle');await c.wait(140);c.to('rigOn',0,'fade');await c.wait(120);c.to('result',1,'draw');await c.wait(220);},'checkedOut','loaded')});

  define('ai-coding',`<path data-part="l" d="M44 26L24 52L44 78"/><path data-part="r" d="M76 26L96 52L76 78"/><path data-part="caret" d="M61 35L53 69"/><path data-part="output" d="M34 94L40 100L50 88M61 94H91"/><g data-part="bug"><circle cx="82" cy="54" r="9"/><path d="M80 47V60M84 47V60M71 49L76 51M71 60L76 58M88 51L94 49M88 58L94 60"/></g><path data-part="focus" d="M69 39H61V69H69M95 39H103V69H95"/>`,
    {cx:0,typed:1,output:0,bug:0,focus:0,join:0},
    {idle:{},running:{output:.3},executed:{output:1},failed:{bug:1,typed:.3,join:6},located:{bug:1,typed:.3,focus:1,join:6},repaired:{output:1}},
    (s,p)=>{move(p.l,-s.join);move(p.r,s.join);move(p.caret,s.cx);op(p.caret,s.typed);draw(p.output,s.output);ink(p.output,'success');op(p.bug,s.bug);ink(p.bug,'recording');op(p.focus,s.focus);ink(p.focus,'warning');},
    {type:action('输入代码',async c=>{for(const x of [-8,0,8]){c.to('cx',x,'snap');await c.wait(80);}c.to('cx',0,'gentle');}),
     execute:action('执行并输出',async c=>{c.to('output',0,'draw');c.to('typed',.35,'fade');await c.wait(120);c.to('output',1,'draw');c.to('typed',1,'fade');await c.wait(320);},'executed','idle'),
     debug:action('定位错误',async c=>{c.to('focus',1,'draw');await c.wait(180);c.to('bug',1,'fade');await c.wait(160);},'located','failed'),
     repair:action('修复连接',async c=>{c.to('join',0,'gentle');c.to('bug',0,'fade');await c.wait(160);c.to('focus',0,'fade');c.to('typed',1,'fade');c.to('output',1,'draw');await c.wait(240);},'repaired','located')});

  const ridges=['M27 91C14 63 24 24 50 19C77 14 99 34 98 63','M40 103C21 69 35 38 56 35C78 31 87 50 85 71C84 85 87 95 92 101','M54 104C40 87 38 60 53 51C67 41 74 54 73 68C72 84 65 90 71 104','M61 88C54 77 53 67 59 64C66 61 65 72 61 80'];
  define('fingerprint',ridges.map((d,i)=>`<path data-part="r${i}" d="${d}"/>`).join('')+'<path data-part="scanner" d="M21 26H98"/><path data-part="result" d="M80 82L89 91L105 73"/>',
    {scanY:0,scanOn:0,ok:0,blocked:0},{idle:{},scanning:{scanOn:1},recognised:{ok:1}},
    (s,p)=>{for(let i=0;i<4;i++)ink(p['r'+i],'success',s.ok);move(p.scanner,s.blocked,s.scanY);op(p.scanner,s.scanOn);ink(p.scanner,'connected');draw(p.result,s.ok);ink(p.result,'success');},
    {scan:action('扫描纹线',async c=>{c.set({scanY:0,ok:0});c.to('scanOn',1,'fade');c.to('scanY',70,'gentle');await c.wait(380);},'scanning','idle'),
     scanning:{label:'扫描中',loop:true,pose:'scanning',run(c){c.set({ok:0});c.to('scanOn',1,'fade');c.claim('scanY');c.loop(t=>{c.s.scanY=35+35*Math.sin(t*3);});}},
     accept:action('纹线匹配',change({scanOn:0,ok:1}),'recognised','scanning'),
     reject:action('扫描受阻',async c=>{c.error();c.to('scanY',35,'snap');c.to('blocked',-10,'snap');await c.wait(120);c.to('blocked',0,'gentle');c.to('scanOn',0,'fade');await c.wait(220);},'idle','scanning'),
     reset:action('重新等待',change({ok:0,scanOn:0,scanY:0}),'idle','recognised')});

  define('permission',`<rect data-part="track" x="18" y="40" width="84" height="40" rx="20"/><g data-part="knob"><circle data-fill cx="39" cy="60" r="12"/></g><path data-part="pending" d="M55 24C55 15 70 15 70 24C70 30 62 30 62 35M62 40V41"/>`,
    {x:0,pending:0,approved:0},{idle:{},requested:{pending:1},granted:{x:42,approved:1}},
    (s,p)=>{move(p.knob,s.x);ink(p.knob,'success',s.approved);ink(p.track,'success',s.approved);op(p.pending,s.pending);},
    {request:action('等待授权',change({pending:1,x:0,approved:0}),'requested','idle'),
     grant:action('允许',change({pending:0,x:42,approved:1}),'granted','requested'),
     deny:action('拒绝',async c=>{c.to('pending',0,'fade');c.to('x',-6,'snap');await c.wait(180);},'idle','requested'),
     revoke:action('收回',change({x:0,approved:0,pending:0}),'idle','granted')});

  define('two-factor',`<rect data-part="phone" x="30" y="16" width="60" height="88" rx="10"/><path d="M49 24H71M55 96H65"/><g data-part="badge"><rect x="38" y="41" width="44" height="30" rx="6"/><path data-part="code" d="M47 51V61M60 51V61M73 51V61"/><path data-part="tick" d="M46 57L56 66L75 47"/><path data-part="expired" d="M42 66L78 46"/></g>`,
    {by:0,shown:0,code:0,ok:0,expired:0},{idle:{},shown:{shown:1,code:1},verified:{shown:1,ok:1},expired:{shown:1,code:.25,expired:1}},
    (s,p)=>{move(p.badge,0,s.by);op(p.badge,s.shown);op(p.code,s.code);draw(p.tick,s.ok);ink(p.tick,'success');draw(p.expired,s.expired);ink(p.expired,'warning');},
    {request:action('收到验证码',async c=>{c.set({by:-18});c.to('shown',1,'fade');c.to('by',0,'gentle');c.to('code',1,'draw');await c.wait(320);},'shown','idle'),
     verify:action('验证码通过',async c=>{c.to('code',0,'fade');c.to('expired',0,'fade');await c.wait(100);c.to('ok',1,'draw');await c.wait(240);},'verified','shown'),
     expire:action('验证码过期',change({code:.25,expired:1,ok:0}),'expired','shown')});

  define('ai-tool-call',`<g data-part="source"><rect x="12" y="40" width="26" height="40" rx="7"/><path d="M19 51H31M19 62H27"/></g><g data-part="tool"><rect x="84" y="40" width="24" height="40" rx="7"/><path d="M89 54L96 61L103 54"/></g><path data-part="wire" d="M40 60H82"/><g data-part="packet"><rect x="18" y="48" width="14" height="24" rx="3"/><path data-part="payload" d="M23 55H28M23 62H27"/><path data-part="tick" d="M21 60L25 64L30 56"/></g><path data-part="barrier" d="M68 45V75"/>`,
    {tx:0,po:0,wire:0,result:0,barrier:0,toolY:0},{idle:{},connected:{wire:1},sent:{tx:72,po:1,wire:1},returned:{po:1,result:1,wire:1},blocked:{tx:44,po:1,barrier:1,wire:1}},
    (s,p)=>{move(p.packet,s.tx);op(p.packet,s.po);for(const host of [p.source,p.tool,p.wire]){const cut=hideBehind(host,'packet','M18 48H32V72H18Z',`translate(${s.tx} 0)`);op(cut,s.po);}draw(p.wire,s.wire);move(p.tool,0,s.toolY);op(p.payload,1-s.result);draw(p.tick,s.result);ink(p.tick,'success');op(p.barrier,s.barrier);ink(p.barrier,'recording');},
    {connect:action('接通工具',change({wire:1}),'connected','idle'),
     invoke:action('发出请求',async c=>{c.set({tx:0,result:0,po:0,barrier:0});c.to('wire',1,'draw');c.to('po',1,'fade');c.to('tx',72,'gentle');await c.wait(300);c.to('toolY',4,'snap');await c.wait(100);},'sent','idle'),
     return:action('返回结果',async c=>{c.to('result',1,'draw');await c.wait(100);c.to('tx',0,'gentle');await c.wait(340);},'returned','sent'),
     fail:action('请求受阻',async c=>{c.to('wire',1,'draw');c.to('po',1,'fade');c.to('barrier',1,'draw');c.to('tx',47,'snap');await c.wait(170);c.to('tx',40,'gentle');await c.wait(160);},'blocked','idle')});

  define('ai-browsing',`<rect x="18" y="22" width="84" height="76" rx="10"/><path d="M18 41H102"/><path data-part="address" d="M43 32H85"/><g data-part="content"><path d="M29 55H83M29 70H74M29 84H63"/></g><g data-part="target"><path d="M75 61V54H96V75H89"/><circle cx="83" cy="65" r="9"/><path d="M89 72L98 81"/></g><path data-part="back" d="M34 49L24 59L34 69M25 59H51"/>`,
    {pageX:0,pageOn:1,address:0,target:0,back:0},{idle:{},navigated:{address:1},inspected:{address:1,target:1}},
    (s,p)=>{move(p.content,s.pageX);op(p.content,s.pageOn);ink(p.address,'connected',s.address);op(p.target,s.target);op(p.back,s.back);},
    {navigate:action('切换页面',async c=>{c.to('pageX',-18,'gentle');c.to('pageOn',0,'fade');await c.wait(150);c.set({pageX:18});c.to('pageOn',1,'fade');c.to('pageX',0,'gentle');c.to('address',1,'fade');await c.wait(220);},'navigated','idle'),
     inspect:action('定位并检查',change({target:1}),'inspected','navigated'),
     return:action('返回上一页',async c=>{c.to('target',0,'fade');c.to('back',1,'draw');c.to('pageX',18,'gentle');c.to('pageOn',0,'fade');await c.wait(140);c.set({pageX:-18});c.to('pageX',0,'gentle');c.to('pageOn',1,'fade');c.to('address',0,'fade');await c.wait(220);},'idle','navigated')});

  const corners=t=>{const d=30-8*clamp01(t),e=46+8*clamp01(t);return `M${d} ${e}V${d}H${e}M${120-d} ${e}V${d}H${120-e}M${d} ${120-e}V${120-d}H${e}M${120-d} ${120-e}V${120-d}H${120-e}`;};
  define('face-id',`<path data-part="corners"/><path data-part="face" d="M46 47V55M74 47V55M60 55V64H54M46 73Q60 76 74 73"/><path data-part="line" d="M34 35H86"/>`,
    {lock:0,line:0,lineOn:0,ok:0,block:0},{idle:{},scanning:{lineOn:1},recognised:{lock:1,ok:1}},
    (s,p)=>{attr(p.corners,'d',corners(s.lock));move(p.corners,s.block);ink(p.corners,'success',s.ok);move(p.line,0,s.line);op(p.line,s.lineOn);attr(p.face,'d',`M46 47V55M74 47V55M60 55V64H54M46 73Q60 ${76+6*s.ok} 74 73`);},
    {scan:action('扫过轮廓',change({lineOn:1,line:42,ok:0,lock:0}),'scanning','idle'),
     scanning:{label:'扫描中',loop:true,pose:'scanning',run(c){c.set({ok:0});c.to('lock',0,'gentle');c.to('lineOn',1,'fade');c.claim('line');c.loop(t=>{c.s.line=21+21*Math.sin(t*3);});}},
     recognise:action('锁定面部轮廓',change({lineOn:0,lock:1,ok:1}),'recognised','scanning'),
     reject:action('锁定受阻',async c=>{c.to('line',22,'snap');c.to('lock',.7,'snap');await c.wait(130);c.to('lock',0,'gentle');c.to('block',-8,'snap');c.to('lineOn',0,'fade');await c.wait(200);},'idle','scanning'),
     reset:action('重新等待',change({lock:0,ok:0,lineOn:0}),'idle','recognised')});

  define('qr-scan',`<path data-part="corners"/><g data-part="code"><path d="M37 37H51V51H37ZM69 37H83V51H69ZM37 69H51V83H37Z"/><path d="M64 60H79V68H72V80H64M81 77V83"/></g><path data-part="line" d="M30 35H90"/><path data-part="tick" d="M48 61L58 71L76 49"/><path data-part="reject" d="M52 51L72 71M72 51L52 71"/>`,
    {line:0,lineOn:0,lock:0,code:1,ok:0,no:0},{idle:{},found:{lock:1,code:.2,ok:1},rejected:{no:1,code:.3}},
    (s,p)=>{attr(p.corners,'d',corners(s.lock));ink(p.corners,'success',s.ok);op(p.code,s.code);move(p.line,0,s.line);op(p.line,s.lineOn);draw(p.tick,s.ok);ink(p.tick,'success');draw(p.reject,s.no);ink(p.reject,'recording');},
    {scan:action('扫过二维码',async c=>{c.set({ok:0,no:0});c.to('code',1,'fade');c.to('lock',0,'gentle');c.to('lineOn',1,'fade');c.to('line',48,'gentle');await c.wait(300);c.to('lineOn',0,'fade');await c.wait(100);}),
     scanning:{label:'扫描中',loop:true,run(c){c.set({ok:0,no:0});c.to('code',1,'fade');c.to('lock',0,'gentle');c.claim('line');c.to('lineOn',1,'fade');c.loop(t=>{c.s.line=24+24*Math.sin(t*3);});}},
     detected:action('锁定二维码',change({lineOn:0,lock:1,code:.2,ok:1,no:0}),'found','idle'),
     rejected:action('无法识别',change({lineOn:0,no:1,code:.3,ok:0}),'rejected','idle')});

  define('clock',`<circle cx="60" cy="60" r="34"/><path data-part="hour" d="M60 60V40"/><path data-part="minute" d="M60 60V30"/><circle data-fill cx="60" cy="60" r="3"/><path data-part="progress"/>`,
    {hour:0,minute:0,progress:0},{idle:{},running:{},paused:{}},
    (s,p)=>{move(p.hour,0,0,s.hour);move(p.minute,0,0,s.minute);attr(p.progress,'d',arc(60,60,44,-90,-90+359.9*clamp01(s.progress)));op(p.progress,s.progress);ink(p.progress,'connected');},
    {start:{label:'开始计时',loop:true,pose:'running',from:'idle',run(c){c.claim('hour','minute');c.loop((t,dt)=>{c.s.minute+=100*dt;c.s.hour+=8*dt;c.setGoal('minute',c.s.minute);c.setGoal('hour',c.s.hour);});}},
     running:{label:'走动',loop:true,pose:'running',run(c){c.claim('hour','minute');c.loop((t,dt)=>{c.s.minute+=100*dt;c.s.hour+=8*dt;c.setGoal('minute',c.s.minute);c.setGoal('hour',c.s.hour);});}},
     progress:{label:'独立进度弧',drive(c,v){c.to('progress',v,'track');c.setGoal('progress',v);}},
     pause:action('冻结表针',async c=>{for(const k of ['hour','minute','progress'])c.setGoal(k,c.s[k]);await c.wait(100);},'paused','running'),
     resume:{label:'继续计时',loop:true,pose:'running',from:'paused',run(c){for(const k of ['hour','minute'])c.setGoal(k,c.s[k]);c.claim('hour','minute');c.loop((t,dt)=>{c.s.minute+=100*dt;c.s.hour+=8*dt;c.setGoal('minute',c.s.minute);c.setGoal('hour',c.s.hour);});}},
     reset:action('计时归零',async c=>{for(const k of ['hour','minute','progress']){c.setGoal(k,0);c.to(k,0,'gentle');}await c.wait(320);},'idle')},
    {periodic:{hour:360,minute:360}});

  define('shield',`<path data-part="plate" d="M60 20L95 35V59C95 79 79 97 60 105C41 97 25 79 25 59V35Z"/><path data-part="seam" d="M60 34V89"/><path data-part="tick" d="M42 60L55 73L79 47"/><path data-part="alert" d="M60 45V66M60 78V79"/>`,
    {closed:0,ok:0,warning:0},{idle:{},protected:{closed:1},verified:{closed:1,ok:1},alerted:{warning:1}},
    (s,p)=>{attr(p.plate,'d',`M60 20L${95-5*s.closed} 35V59C${95-5*s.closed} 79 79 97 60 105C41 97 ${25+5*s.closed} 79 ${25+5*s.closed} 59V35Z`);op(p.seam,s.closed*(1-s.ok));draw(p.tick,s.ok);ink(p.tick,'success');op(p.alert,s.warning);ink(p.alert,'warning');},
    {protect:action('闭合保护',change({closed:1}),'protected','idle'),
     alert:action('安全警告',change({warning:1,ok:0}),'alerted','idle'),
     verified:action('确认保护',change({closed:1,warning:0,ok:1}),'verified','idle')});

  define('ai-generating',`<g data-part="pieces">${[0,1,2,3].map(i=>`<rect data-part="p${i}" x="${i%2?62:38}" y="${i<2?38:62}" width="20" height="20" rx="4"/>`).join('')}</g><rect data-part="object" x="34" y="34" width="52" height="52" rx="10"/><path data-part="detail" d="M46 48H74M46 60H74M46 72H63"/>`,
    {assemble:1,seam:0,detail:0,d0:.35,d1:0,d2:0,d3:0},{idle:{},draft:{},generated:{assemble:0,seam:1,d0:1,d1:1,d2:1,d3:1},refined:{assemble:0,seam:1,detail:1,d0:1,d1:1,d2:1,d3:1}},
    (s,p)=>{for(let i=0;i<4;i++){move(p['p'+i],(i%2?1:-1)*14*s.assemble,(i<2?-1:1)*14*s.assemble);op(p['p'+i],s['d'+i]*(1-s.seam));}op(p.object,s.seam);draw(p.detail,s.detail);},
    {generate:action('拼成对象',async c=>{for(let i=0;i<4;i++){c.to('d'+i,1,'draw');await c.wait(60);}c.to('assemble',0,'gentle');await c.wait(170);c.to('seam',1,'fade');await c.wait(160);},'generated','draft'),
     refine:action('细化对象',async c=>{c.to('seam',1,'fade');c.to('detail',1,'draw');await c.wait(320);},'refined','generated'),
     finish:action('保留成品',change({assemble:0,seam:1,d0:1,d1:1,d2:1,d3:1}),'generated','draft')});

  // Paper objects share occlusion, not the same lid animation.
  define('folder',`<path data-part="back" d="M22 45V33Q22 27 28 27H48L60 39H96Q102 39 102 45V96H22Z"/><g data-part="paper"><rect x="38" y="35" width="44" height="52" rx="4"/><path d="M46 49H74M46 61H67"/></g><path data-part="front"/>`,
    {open:0,py:0,paperOn:0},{closed:{},open:{open:1},loaded:{paperOn:1,py:18}},
    (s,p)=>{const top=48+16*s.open,front=`M22 ${top}H${100+7*s.open}L97 96Q97 102 91 102H29Q23 102 23 96Z`;attr(p.front,'d',front);move(p.paper,0,s.py);op(p.paper,s.paperOn);hideBehind(p.paper,'pocket',front);},
    {open:action('展开前片',change({open:1}),'open','closed'),close:action('合上前片',change({open:0}),'closed','open'),
     insert:action('收入文件',async c=>{c.to('open',1,'gentle');c.set({py:-18,paperOn:0});c.to('paperOn',1,'fade');await c.wait(100);c.to('py',18,'gentle');await c.wait(220);c.to('open',0,'gentle');await c.wait(180);},'loaded','open'),
     remove:action('取出文件',async c=>{c.to('open',1,'gentle');await c.wait(120);c.to('py',-24,'gentle');await c.wait(180);c.to('paperOn',0,'fade');await c.wait(140);},'open','loaded')});

  define('wallet',`<rect data-part="back" x="21" y="36" width="78" height="66" rx="10"/><g data-part="card"><rect x="33" y="32" width="50" height="36" rx="5"/><path d="M39 44H77M40 56H53"/></g><path data-part="front" d="M21 59H99V92Q99 102 89 102H31Q21 102 21 92Z"/><path data-part="flap"/><circle data-part="button" data-fill cx="86" cy="68" r="3"/>`,
    {open:0,cy:0,cardOn:0},{closed:{},open:{open:1,cardOn:1,cy:-12},loaded:{cardOn:1,cy:16}},
    (s,p)=>{move(p.card,0,s.cy);op(p.card,s.cardOn);hideBehind(p.card,'slot','M21 59H99V102H21Z');const x=78-22*s.open;attr(p.flap,'d',`M99 55H${x}Q${x-7} 55 ${x-7} 63V73Q${x-7} 81 ${x} 81H99`);move(p.flap,0,-22*s.open);op(p.button,1-s.open);},
    {open:action('打开卡槽',change({open:1,cardOn:1,cy:-12}),'open','closed'),
     close:action('扣上钱包',change({open:0,cy:16}),'loaded','open'),
     insertCard:action('收好卡片',async c=>{c.to('open',1,'gentle');c.set({cy:-24,cardOn:0});c.to('cardOn',1,'fade');c.to('cy',16,'gentle');await c.wait(230);c.to('open',0,'gentle');await c.wait(160);},'loaded','open'),
     takeCard:action('取出卡片',async c=>{c.to('open',1,'gentle');await c.wait(100);c.to('cy',-28,'gentle');await c.wait(220);c.to('cardOn',0,'fade');await c.wait(130);},'open','loaded')});

  define('mail',`<path data-part="back" d="M22 46L60 24L98 46V90H22Z"/><g data-part="letter"><rect x="35" y="33" width="50" height="42" rx="4"/><path d="M43 45H77M43 56H68"/></g><path data-part="front" d="M22 46L60 70L98 46V90H22Z"/><path data-part="flap"/><path data-part="slot" d="M21 91H99V104H21ZM45 98H75"/><path data-part="stamp" d="M78 75L83 80L93 67"/>`,
    {open:0,ly:0,letterOn:0,x:0,y:0,envOn:1,slot:0,stamp:0},
    {idle:{},received:{letterOn:1,ly:14,stamp:1},open:{open:1,letterOn:1,ly:-12},sent:{stamp:1},archived:{slot:1,y:46,envOn:0}},
    (s,p)=>{const tr=`translate(${s.x} ${s.y}) ${around(1-.3*s.slot,60,65)}`;
      for(const key of ['back','front','flap','letter','stamp']){attr(p[key],'transform',tr);op(p[key],s.envOn);}
      attr(p.letter,'transform',`${tr} translate(0 ${s.ly})`);op(p.letter,s.letterOn*s.envOn);
      hideBehind(p.letter,'envelope','M22 46L60 70L98 46V105H22Z',tr);
      attr(p.flap,'d',`M22 46L60 ${70-46*s.open}L98 46`);op(p.slot,s.slot);draw(p.stamp,s.stamp*s.envOn);ink(p.stamp,'success');for(const key of ['back','front','flap','letter','stamp'])op(hideBehind(p[key],'archive-slot','M21 91H99V140H21Z'),s.slot);},
    {receive:action('收到信件',async c=>{c.to('open',1,'gentle');c.set({ly:-25,letterOn:0});c.to('letterOn',1,'fade');c.to('ly',14,'gentle');await c.wait(230);c.to('open',0,'gentle');c.to('stamp',1,'draw');await c.wait(180);},'received','idle'),
     open:action('拆信阅读',change({open:1,letterOn:1,ly:-12}),'open','received'),
     send:action('寄出信封',async c=>{c.to('open',0,'gentle');c.to('ly',14,'gentle');await c.wait(100);c.to('x',46,'exit');c.to('y',-16,'gentle');c.to('envOn',0,'fade');await c.wait(220);c.set({x:-22,y:0});c.to('x',0,'gentle');c.to('envOn',1,'fade');c.to('stamp',1,'draw');await c.wait(230);},'sent','received'),
     archive:action('存入收纳槽',async c=>{c.to('slot',1,'fade');c.to('open',0,'gentle');c.to('y',46,'gentle');await c.wait(280);c.to('envOn',0,'fade');await c.wait(130);},'archived','received')});

  // Keep a torn receipt as a business result, rather than reconstructing it at rest.
  const receipt=M.recipes.receipt;
  M.define('receipt',{...receipt,poses:{...receipt.poses,torn:{gap:16,ty:-16}},actions:{...receipt.actions,tear:{...receipt.actions.tear,pose:'torn',from:'idle'},print:{...receipt.actions.print,pose:'idle',from:'torn'}}});

  // Targeted corrections preserve the rest of each subject's vocabulary.
  function patch(name,changes){const old=M.recipes[name];const r={...old,...changes,state:{...old.state,...changes.state},poses:{...old.poses,...changes.poses},actions:{...old.actions,...changes.actions}};
    if(changes.afterRender){r.render=(s,p,u)=>{old.render(s,p,u);changes.afterRender(s,p,u);};delete r.afterRender;}M.define(name,r);}
  patch('camera',{state:{focusOn:0,focusGap:1,swap:0},svg:M.recipes.camera.svg+'<path data-part="focusFrame"/><path data-part="swap" d="M37 64A24 24 0 0 1 78 52L71 51M83 72A24 24 0 0 1 43 84L50 85"/>',
    afterRender(s,p){const g=6+8*s.focusGap;attr(p.focusFrame,'d',`M${60-g} ${68-g+5}V${68-g}H${65-g}M${60+g} ${68-g+5}V${68-g}H${55+g}M${60-g} ${68+g-5}V${68+g}H${65-g}M${60+g} ${68+g-5}V${68+g}H${55+g}`);op(p.focusFrame,s.focusOn);op(p.swap,s.swap);ink(p.focusFrame,'connected');ink(p.swap,'connected');},
    actions:{focus:action('对焦目标',async c=>{c.to('focusOn',1,'fade');c.to('focusGap',0,'gentle');await c.wait(320);}),switchCamera:action('切换镜头',async c=>{c.to('swap',1,'draw');await c.wait(280);c.to('swap',0,'fade');await c.wait(140);})}});
  patch('screen-recording',{afterRender(s,p){const t=clamp01(s.bar);const circle='M50 91C50 91 59 91 60 91C61 91 70 91 70 100C70 109 61 109 60 109C59 109 50 109 50 100ZM60 91C60 91 60 91 60 91C60 91 60 91 60 100C60 109 60 109 60 109C60 109 60 109 60 100Z';
    const bars='M44 87C44 87 51 87 51 87C51 87 51 87 51 100C51 113 51 113 51 113C51 113 44 113 44 100ZM69 87C69 87 76 87 76 87C76 87 76 87 76 100C76 113 76 113 76 113C76 113 69 113 69 100Z';attr(p.dot,'d',lerpPath(circle,bars,t));}});
  patch('passcode',{svg:M.recipes.passcode.svg.replace('M36 88H84','M42 87L54 99L79 75'),afterRender(s,p){ink(p.ok,'success',s.ok);}});
  patch('key',{afterRender(s,p){attr(p.hole,'d',`M96 ${46-6*s.gap}V${74+6*s.gap}M${90-10*s.gap} 46H96M${90-10*s.gap} 74H96`);ink(p.hole,'success',s.gap);}});
  patch('share',{svg:M.recipes.share.svg.replace('<rect x="70" y="70" width="22" height="14" rx="7"/>','<path d="M76 81L82 75A5 5 0 0 1 89 82L85 86M78 85L73 89A5 5 0 0 1 66 82L71 77M73 84L82 78"/>'),actions:{share:action('向外分享',async c=>{c.to('ay',-32,'exit');await c.wait(160);c.to('ao',0,'fade');await c.wait(100);c.set({ay:18,ao:0});c.to('ay',0,'gentle');c.to('ao',1,'fade');await c.wait(220);})}});
  patch('copy',{actions:{duplicate:{...M.recipes.copy.actions.duplicate,pose:'copied',from:'idle',run:async c=>{c.set({bo:0,bx:0,by:0});c.to('bo',1,'fade');c.to('bx',10,'gentle');c.to('by',8,'gentle');c.to('fx',-8,'gentle');c.to('fy',-10,'gentle');await c.wait(340);}}}});
  patch('clipboard',{actions:{copy:action('取出副本',async c=>{c.set({gx:0,gy:0,go:0});c.to('go',1,'fade');c.to('gx',22,'gentle');c.to('gy',-12,'gentle');await c.wait(230);c.to('go',0,'fade');await c.wait(120);}),paste:action('接收并粘贴',async c=>{c.set({gx:24,gy:-18,go:0});c.to('go',1,'fade');c.to('gx',0,'gentle');c.to('gy',0,'gentle');await c.wait(190);c.to('draw',1,'draw');c.to('go',0,'fade');await c.wait(180);},'idle','clear')}});
  patch('sort',{poses:{mixed:{y1:48,y2:-24,y3:-24}},afterRender(s,p){for(let i=1;i<=3;i++){const y=s['y'+i];move(p['l'+i],Math.sin(Math.PI*Math.min(1,Math.abs(y)/48))*(i===2?-18:18),y);}}});
  patch('printer',{poses:{done:{feed:28,inOn:0,out:22,outOn:1},jammed:{feed:10,out:8,outOn:1,corner:7}},afterRender(s,p){move(p.output,0,s.out,-s.corner*1.2,60,76);},actions:{complete:action('出纸完成',change({feed:28,inOn:0,out:22,outOn:1,corner:0},380),'done','idle')}});
  patch('bookmark',{actions:{press:{...M.recipes.bookmark.actions.press,internal:true,run:async c=>{await c.press(.96);}}}});

  define('ai-thinking',`<path d="M60 35L30 82H90Z"/><circle data-part="n0" cx="60" cy="30" r="7"/><circle data-part="n1" cx="28" cy="86" r="7"/><circle data-part="n2" cx="92" cy="86" r="7"/><circle data-part="signal" data-fill cx="60" cy="30" r="5"/><path data-part="tick" d="M83 86L90 93L102 77"/>`,
    {route:0,signal:0,done:0},{idle:{},paused:{signal:1},done:{route:2,done:1}},
    (s,p)=>{const nodes=[[60,30],[28,86],[92,86]],v=((s.route%3)+3)%3,i=Math.floor(v),t=v-i,a=nodes[i],b=nodes[(i+1)%3];attr(p.signal,'cx',a[0]+(b[0]-a[0])*t);attr(p.signal,'cy',a[1]+(b[1]-a[1])*t);op(p.signal,s.signal*(1-s.done));ink(p.signal,'connected');draw(p.tick,s.done);ink(p.tick,'success');},
    {think:{label:'信号推理',loop:true,pose:'idle',run(c){c.to('done',0,'fade');c.claim('route');c.to('signal',1,'fade');const start=c.s.route;c.loop(t=>{c.s.route=start+t*1.3;c.setGoal('route',c.s.route);});}},
     pause:action('暂停推理',async c=>{c.setGoal('route',c.s.route);c.to('signal',1,'fade');await c.wait(100);},'paused'),
     finish:action('抵达结论',change({route:2,done:1,signal:0},360),'done','paused')});
  patch('ai-reading',{actions:{read:action('逐行阅读',async c=>{for(let i=0;i<3;i++){c.to('r'+i,1,'draw');await c.wait(150);}c.to('footer',1,'draw');await c.wait(130);},'done','idle'),scan:action('扫描标记',async c=>{c.to('headOn',1,'fade');c.to('headY',40,'gentle');await c.wait(240);for(let i=0;i<3;i++)c.to('r'+i,1,'draw');c.to('headOn',0,'fade');c.to('footer',1,'draw');await c.wait(200);},'done','idle')}});
  patch('ai-writing',{actions:{revise:action('改写末行',async c=>{c.to('c',.2,'draw');c.to('cx',16,'gentle');c.to('cy',36,'gentle');await c.wait(190);c.to('c',1,'draw');c.to('cx',60,'gentle');await c.wait(230);},'writing','writing')}});
  patch('ai-handoff',{state:{tokenOn:1,accepted:0},poses:{acknowledged:{tx:68,wire:1,tokenOn:0,accepted:1}},
    svg:M.recipes['ai-handoff'].svg+'<path data-part="accepted" d="M81 92L90 100L106 83"/>',
    afterRender(s,p){op(p.token,s.tokenOn);draw(p.accepted,s.accepted);ink(p.accepted,'success');},
    actions:{acknowledge:action('接收并确认',async c=>{c.to('tokenOn',0,'fade');c.to('ack',.75,'impact');await c.wait(90);c.to('ack',1,'gentle');c.to('accepted',1,'draw');await c.wait(250);},'acknowledged','sent')}});

  define('ai-queue',`<g data-part="c0"><rect x="29" y="58" width="46" height="18" rx="4"/><path d="M36 67H58"/></g><g data-part="c1"><rect x="29" y="36" width="46" height="18" rx="4"/><path d="M36 45H58"/></g><g data-part="c2"><rect x="29" y="14" width="46" height="18" rx="4"/><path d="M36 23H58"/></g><path data-part="work" d="M88 70V82M82 76H94"/><path data-part="done" d="M80 76L86 82L99 68"/><path data-part="base" d="M22 86V98H82V86"/>`,
    {x0:0,y0:0,y1:0,y2:0,o0:1,o1:1,o2:0,work:0,done:0},{idle:{},queued:{o2:1},claimed:{x0:18,y0:10,o2:1,work:1},processed:{o0:0,y1:22,y2:22,o2:1,done:1},empty:{o0:0,o1:0,o2:0}},
    (s,p)=>{move(p.c0,s.x0,s.y0);move(p.c1,0,s.y1);move(p.c2,0,s.y2);for(let i=0;i<3;i++)op(p['c'+i],s['o'+i]);op(p.work,s.work);draw(p.done,s.done);ink(p.done,'success');},
    {enqueue:action('任务入队',async c=>{c.set({y2:-14,o2:0});c.to('o2',1,'fade');c.to('y2',0,'gentle');await c.wait(300);},'queued','idle'),
     claim:action('取出待处理任务',change({x0:18,y0:10,work:1}),'claimed','queued'),
     process:action('处理取出的任务',async c=>{c.to('work',1,'fade');await c.wait(130);c.to('o0',0,'fade');c.to('work',0,'fade');c.to('done',1,'draw');c.to('y1',22,'gentle');c.to('y2',22,'gentle');await c.wait(280);},'processed','claimed'),
     drain:action('清空任务，保留容器',async c=>{for(let i=0;i<3;i++){c.to('o'+i,0,'fade');await c.wait(90);}c.to('work',0,'fade');c.to('done',0,'fade');await c.wait(100);},'empty','queued')});

  patch('video-call',{state:{joined:0},poses:{joined:{joined:1}},svg:M.recipes['video-call'].svg+'<path data-part="joined" d="M28 59L39 70L60 49"/>',
    afterRender(s,p){draw(p.joined,s.joined);ink(p.joined,'success');},
    actions:{join:action('接入通话',change({joined:1}),'joined','idle'),leave:action('离开通话',change({joined:0}),'idle','joined'),
      cameraOff:{...M.recipes['video-call'].actions.cameraOff,run:async c=>{c.setGoal('joined',c.s.joined);c.to('slash',1,'draw');c.to('dim',.35,'fade');await c.wait(280);}},
      cameraOn:{...M.recipes['video-call'].actions.cameraOn,run:async c=>{c.setGoal('joined',c.s.joined);c.to('slash',0,'draw');c.to('dim',1,'fade');await c.wait(280);}}}});
  patch('archive',{poses:{stored:{fOn:1,fy:8}},actions:{
    archive:action('文件收入盒中',async c=>{c.set({fy:-20,fOn:0});c.to('fOn',1,'fade');c.to('fy',8,'gentle');await c.wait(240);c.to('lid',0,'gentle');await c.wait(160);},'stored','open'),
    restore:{...M.recipes.archive.actions.restore,from:'stored'}}});
  patch('filter',{actions:{adjust:action('调整筛选条件',async c=>{c.to('kx',-16,'gentle');c.to('y0',12,'gentle');c.to('o0',.3,'fade');await c.wait(160);c.to('kx',16,'gentle');c.to('y2',30,'gentle');c.to('o2',.3,'fade');await c.wait(200);})}});

  // Compatibility feedback stays in the API, but is excluded from the primary gallery controls.
  for(const[name,r]of Object.entries(M.recipes)){
    const actions={...r.actions};for(const verb of ['tap','press'])if(actions[verb])actions[verb]={...actions[verb],internal:true};
    M.define(name,{...r,actions});
  }
})(window.MotionIcon);
