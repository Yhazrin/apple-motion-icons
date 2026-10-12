/* Browser-local, dependency-free PNG contact sheets + ZIP. No upload/server capture. */
(function () {
  'use strict';
  const button=document.getElementById('export-review');
  const status=document.getElementById('export-status');
  if(!button)return;
  const encoder=new TextEncoder();
  const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  const crc32=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const utf8=value=>encoder.encode(typeof value==='string'?value:JSON.stringify(value,null,2));
  function header(size){const bytes=new Uint8Array(size);return {bytes,v:new DataView(bytes.buffer)};}
  // Stored entries: PNG is already compressed; UTF-8 names and standard ZIP CRC/offsets.
  function zip(entries){
    const parts=[],central=[];let offset=0;
    for(const {name,data}of entries){
      const path=utf8(name),crc=crc32(data),local=header(30),dir=header(46);
      local.v.setUint32(0,0x04034b50,true);local.v.setUint16(4,20,true);local.v.setUint16(6,0x800,true);
      local.v.setUint16(12,33,true);local.v.setUint32(14,crc,true);local.v.setUint32(18,data.length,true);
      local.v.setUint32(22,data.length,true);local.v.setUint16(26,path.length,true);
      parts.push(local.bytes,path,data);
      dir.v.setUint32(0,0x02014b50,true);dir.v.setUint16(4,20,true);dir.v.setUint16(6,20,true);dir.v.setUint16(8,0x800,true);
      dir.v.setUint16(14,33,true);dir.v.setUint32(16,crc,true);dir.v.setUint32(20,data.length,true);dir.v.setUint32(24,data.length,true);
      dir.v.setUint16(28,path.length,true);dir.v.setUint32(42,offset,true);central.push(dir.bytes,path);
      offset+=30+path.length+data.length;
    }
    const centralSize=central.reduce((s,p)=>s+p.length,0),end=header(22);
    end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,entries.length,true);end.v.setUint16(10,entries.length,true);
    end.v.setUint32(12,centralSize,true);end.v.setUint32(16,offset,true);
    return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
  }
  const png=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?b.arrayBuffer().then(a=>resolve(new Uint8Array(a))):reject(Error('PNG 编码失败')),'image/png'));
  async function drawSvg(context,svg,x,y,size){
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const img=new Image();img.src=url;await img.decode();context.drawImage(img,x,y,size,size);}
    finally{URL.revokeObjectURL(url);}
  }
  function surface(width,height,theme){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const c=canvas.getContext('2d');if(!c)throw Error('浏览器无法创建图片');
    c.fillStyle=theme==='dark'?'#1c1c1e':'#fbfbfc';c.fillRect(0,0,width,height);
    c.fillStyle=theme==='dark'?'#f5f5f7':'#1c1c1e';
    return {canvas,c};
  }
  function caption(c,text,x,y,size=16){c.font=`${size}px system-ui, sans-serif`;c.fillText(text,x,y);}
  let running=false, previousUrl=null;
  button.onclick=async()=>{
    if(running)return;running=true;if(previousUrl){URL.revokeObjectURL(previousUrl);previousUrl=null;}button.disabled=true;button.setAttribute('aria-busy','true');
    const say=text=>{status.textContent=text;};
    let frame,timer,listener,downloadUrl;
    try{
      // Snapshot the page theme, but always export ALL icons regardless of search/filter.
      const theme=document.documentElement.dataset.theme||
        (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
      const token=crypto.randomUUID(),url=new URL('gallery.html',document.baseURI);
      url.search=new URLSearchParams({frames:'1',export:'1',theme,token}).toString();
      frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
      frame.style.cssText='position:fixed;left:-20000px;top:0;width:1280px;height:800px;border:0;pointer-events:none';
      const ready=new Promise((resolve,reject)=>{
        timer=setTimeout(()=>reject(Error('序列帧生成超时，请重试')),240000);
        listener=e=>{
          if(e.source!==frame.contentWindow||e.origin!==location.origin||e.data?.token!==token)return;
          if(e.data.type==='mi:export-progress')say(`正在采样 ${e.data.name} · ${e.data.count} 组`);
          if(e.data.type==='mi:export-ready')resolve(e.data);
          if(e.data.type==='mi:export-error')reject(Error(e.data.message));
        };
        window.addEventListener('message',listener);
      });
      say('正在生成全部图标的序列帧…');frame.src=url.href;document.body.appendChild(frame);
      const capture=await ready;clearTimeout(timer);
      const rows=Array.from(frame.contentDocument.querySelectorAll('#frames .seq'));
      const entries=[],manifest={format:1,generatedAt:new Date().toISOString(),theme,icons:capture.icons,
        sampleClockHz:120,frames:'action: 0/50/120/200/300/450/650/900ms; loops/drives use labelled samples',
        source:location.href,release:null,sequences:[],sheets:[]};
      try{const response=await fetch(new URL('../version.json',document.baseURI));if(response.ok)manifest.release=await response.json();}catch(_){/* local gallery has no release metadata */}
      for(let start=0;start<rows.length;start+=10){
        const group=String(start/10+1).padStart(3,'0'),batch=rows.slice(start,start+10);
        const sheet=surface(1600,160+batch.length*180,theme);
        caption(sheet.c,`Apple Motion Icons · ${theme} · batch ${group}`,32,40,22);
        caption(sheet.c,`${start+1}–${start+batch.length} / ${rows.length} action sequences · labels show actual sample time`,32,72,15);
        for(let j=0;j<batch.length;j++){
          const row=batch[j],title=row.querySelector('b').textContent;
          const shots=Array.from(row.querySelectorAll('figure')).filter(f=>f.querySelector('svg'));
          const seq=surface(1600,230,theme);
          caption(seq.c,title,32,30,20);caption(sheet.c,title,32,126+j*180,18);
          const meta={label:title,frames:shots.map(f=>f.querySelector('figcaption').textContent),file:`sequences/${group}/${String(start+j+1).padStart(3,'0')}-${title.replace(/[^a-zA-Z0-9._-]+/g,'-')}.png`,
            result:row.querySelector('figure:last-child figcaption')?.textContent};
          // Same frame geometry, no resampling from screenshots or page zoom.
          for(let k=0;k<shots.length;k++){
            const svg=shots[k].querySelector('svg');
            svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','120');svg.setAttribute('height','120');
            const xml=new XMLSerializer().serializeToString(svg),x=34+k*166;
            await drawSvg(seq.c,xml,x,45,120);await drawSvg(sheet.c,xml,x,136+j*180,120);
            caption(seq.c,meta.frames[k],x,193,14);caption(sheet.c,meta.frames[k],x,282+j*180,13);
          }
          entries.push({name:meta.file,data:await png(seq.canvas)});manifest.sequences.push(meta);
        }
        const file=`sheets/${group}.png`;entries.push({name:file,data:await png(sheet.canvas)});
        manifest.sheets.push({file,sequences:manifest.sequences.slice(start,start+batch.length).map(s=>s.file)});
        say(`正在打包 ${Math.min(start+10,rows.length)} / ${rows.length} 组 · 每张总览包含 10 组`);
        await new Promise(r=>requestAnimationFrame(r));
      }
      entries.push({name:'manifest.json',data:utf8(manifest)});
      entries.push({name:'README.txt',data:utf8(`Apple Motion Icons review export\n${capture.icons} icons · ${rows.length} sequences · ${theme}\n\nStart with sheets/: each PNG combines up to 10 complete action sequences.\nsequences/: a separate full-resolution PNG for every action, grouped 10 per folder.\nmanifest.json: action labels, exact sampling times, checks and release identity.\nThese are labelled key-frame samples, not every display frame or an overshoot audit.\nGenerated locally in your browser. No files were uploaded.\n`)});
      downloadUrl=URL.createObjectURL(zip(entries));const a=document.createElement('a');
      a.href=downloadUrl;a.download=`motion-icons-review-${theme}-${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(a);a.click();a.remove();
      say(`已导出 ${capture.icons} 个图标 · ${rows.length} 组序列 · ${manifest.sheets.length} 张总览`);
      const retry=document.createElement('a');retry.href=downloadUrl;retry.download=a.download;retry.textContent=' 下载 ZIP';retry.style.textDecoration='underline';status.appendChild(retry);
      previousUrl=downloadUrl;downloadUrl=null;
    }catch(error){say(`导出失败：${error.message}`);if(downloadUrl)URL.revokeObjectURL(downloadUrl);}
    finally{clearTimeout(timer);window.removeEventListener('message',listener);frame?.remove();running=false;button.disabled=false;button.removeAttribute('aria-busy');}
  };
})();
