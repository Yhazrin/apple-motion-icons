/* Product recipe refinements. Load LAST. Upstream engine and built-ins remain byte-identical. */
(function (root) {
  'use strict';
  // Recipe-local contact, without a second decorative bounce.
  async function contact(c, key, value) {
    c.to(key, value, 'snap'); await c.wait(100);
    c.to(key, c.goal(key), 'settle'); await c.wait(100);
  }
  async function preview(c, key, delta) {
    c.to(key, c.goal(key) + delta, 'snap'); await c.wait(120);
    c.to(key, c.goal(key), 'settle'); await c.wait(100);
  }

  const M = root.MotionIcon || (typeof require === 'function' ? require('./motion-icons.js') : null);
  const {around, aroundXY, wave, clamp, clamp01, lerpPath, arc} = M.util;
  const S = M.SPRINGS;
  const dash = (el, length, p) => {
    el.setAttribute('stroke-dasharray', `${length * clamp01(p)} ${length + 1}`);
    el.setAttribute('opacity', clamp01(p * 8));      // round caps would leave a dot at 0
  };

  // ---------- lock: a shackle that clicks into a body ----------
  M.define('lock', {
    labels: {busy: '正在加密', done: '已加密', fail: '加密失败'},
    svg: `<path data-part="shackle" d="M42 53V39a18 18 0 0 1 36 0v14"/>
<g data-part="body"><rect x="28" y="53" width="64" height="46" rx="13"/><circle data-fill cx="60" cy="73" r="5"/><path d="M60 75v9"/></g>`,
    state: {lift: 0, squash: 1, tilt: 0},
    poses: {unlocked: {lift: 14}, locked: {lift: 0}},
    render(s, p) {
      const drop = 46 * (1 - s.squash);
      p.shackle.setAttribute('transform', `rotate(${s.tilt} 60 99) translate(0 ${drop - s.lift})`);
      p.body.setAttribute('transform', `rotate(${s.tilt} 60 99) ${aroundXY(1 + (1 - s.squash) * 0.4, s.squash, 60, 99)}`);
    },
    actions: {
      tap: {label: '点按', run: c => preview(c, 'lift', c.pose === 'locked' ? 3 : -5)},
      lock: {label: '上锁', pose: 'locked', from: 'unlocked', async run(c) {
        c.to('lift', 0, 'snap');                    // shackle drops in
        await c.wait(110);
        contact(c, 'squash', 0.9);                    // body takes the hit
        await c.wait(260);
      }},
      unlock: {label: '解锁', pose: 'unlocked', from: 'locked', async run(c) {
        c.to('lift', 16, 'gentle', 160);               // springs up past its rest height
        await c.wait(340);
      }},
      jiggle: {label: '拽一下', from: 'locked', async run(c) {
        c.to('lift', 5, 'gentle', 220);
        c.to('tilt', 0, {stiffness: 700, damping: 14, velocity: 90});
        await c.wait(120);
        c.to('lift', 0, 'snap');
        await c.wait(380);
      }},
      deny: {label: '拒绝', from: 'locked', async run(c) {
        // locked: tries to open and stays stuck; unlocked: tries to close and bounces back out
        const home = c.goal('lift');
        c.error();
        c.to('lift', home === 0 ? 5 : 6, home === 0 ? 'gentle' : 'snap', home === 0 ? 220 : undefined);
        await Promise.all([c.shake(), c.wait(120).then(() => c.to('lift', home, home === 0 ? 'snap' : 'gentle'))]);
        await c.wait(c.timing.holdFail);
      }}
    },
    toggle: ['lock', 'unlock'],
    task: {success: ['lock', 'confirm'], fail: 'deny'}
  });

  // ---------- refresh: an arc that winds, spins and coasts ----------
  const R = 34, C = 2 * Math.PI * R, START = -60;
  const nextTurn = rot => Math.ceil((rot + 90) / 360) * 360;
  M.define('refresh', {
    labels: {busy: '正在刷新', done: '已更新', fail: '刷新失败'},
    svg: `<g data-part="spinner"><circle data-part="arc" cx="60" cy="60" r="${R}"/><path data-part="head" d="M-9 -9L0 0L-9 9"/></g>`,
    state: {rot: 0, frac: 0.83, head: 1},
    periodic: {rot: 360},
    render(s, p) {
      p.spinner.setAttribute('transform', `rotate(${s.rot} 60 60)`);
      p.arc.setAttribute('stroke-dasharray', `${C * clamp(s.frac, 0.02, 1)} ${C}`);
      p.arc.setAttribute('transform', `rotate(${START} 60 60)`);
      p.head.setAttribute('transform', `rotate(${START + 360 * s.frac} 60 60) translate(${60 + R} 60) rotate(90)`);
      p.head.setAttribute('opacity', clamp01(s.head));
    },
    actions: {
      tap: {label: '转一圈', async run(c) {
        c.to('rot', -24, 'snap');                   // anticipation
        await c.wait(100);
        await c.to('rot', 360, {stiffness: 180, damping: 22});
      }},
      pull: {label: '下拉', drive(c, v) {           // pull-to-refresh: the arc winds on as you pull
        c.to('frac', 0.12 + 0.71 * v, 'track');
        c.to('rot', -100 * (1 - v), 'track');
        c.to('head', clamp01((v - 0.75) / 0.25), 'track');
      }},
      spin: {label: '刷新中', loop: true, exit: 'finish', run(c) {
        c.claim('rot', 'frac');
        c.to('head', 1, 'fade');
        c.loop((t, dt) => {
          const omega = 420 * (1 - Math.exp(-t * 4));   // deg/s, eases up to speed
          c.s.rot += omega * dt;
          c.setVelocity('rot', omega);
          c.s.frac = 0.76 + 0.07 * Math.sin(t * 3);
        });
      }},
      finish: {label: '停下', async run(c) {         // keeps its speed and coasts to a whole turn
        c.to('rot', nextTurn(c.s.rot), {stiffness: 120, damping: 18});
        c.to('frac', 0.83, 'gentle');
        c.to('head', 1, 'fade');
        await c.wait(520);
      }},
      complete: {label: '完成', async run(c) {
        c.to('rot', nextTurn(c.s.rot), {stiffness: 120, damping: 18});
        c.to('frac', 0.83, 'gentle');
        await c.wait(420);
        c.to('frac', 1, 'gentle');                  // the arc closes into a ring
        c.to('head', 0, 'fade');
        await c.wait(160);
        await c.check();
        await c.wait(c.timing.hold);
      }},
      error: {label: '失败', async run(c) {
        c.error();
        await Promise.all([c.to('rot', Math.round(c.s.rot / 360) * 360 - 30, 'gentle'), c.shake()]);
        await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'spin', success: 'complete', fail: 'error'}
  });

  // ---------- pay: a card that taps, waits and flips ----------
  const WAVES = ['w1', 'w2', 'w3'];
  M.define('pay', {
    labels: {busy: '正在支付', done: '支付成功', fail: '支付失败'},
    svg: `<g data-part="card"><rect x="14" y="34" width="70" height="52" rx="10"/>
<g data-part="front"><rect x="24" y="47" width="15" height="12" rx="3"/><path d="M24 72H46"/><path d="M54 72H62"/></g>
<g data-part="back"><path d="M14 48H84"/><path d="M42 66H74"/></g></g>
<path data-part="w1" d="${arc(86, 60, 10, -48, 48)}"/><path data-part="w2" d="${arc(86, 60, 18, -48, 48)}"/><path data-part="w3" d="${arc(86, 60, 26, -48, 48)}"/>`,
    state: {cx: 0, cy: 0, tilt: 0, flip: 1, w1: 1, w2: 1, w3: 1},
    poses: {front: {}, back: {flip: -1}},
    render(s, p) {
      const k = Math.abs(s.flip) < 0.02 ? 0.02 * Math.sign(s.flip || 1) : s.flip;
      p.card.setAttribute('transform', `translate(${s.cx} ${s.cy}) rotate(${s.tilt} 49 60) ${aroundXY(k, 1, 49, 60)}`);
      p.front.setAttribute('opacity', clamp01(s.flip * 6));
      p.back.setAttribute('opacity', clamp01(-s.flip * 6));   // drawn mirrored, reads right when flipped
      for (const w of WAVES) p[w].setAttribute('opacity', clamp01(s[w]));
    },
    actions: {
      tap: {label: '点按', async run(c) {
        preview(c, 'tilt', -4);
        await preview(c, 'cx', 6, 110);
      }},
      contactless: {label: '感应', async run(c) {
        c.to('cx', 6, 'snap'); c.to('tilt', -4, 'snap');   // card moves to the reader
        c.set({w1: 0, w2: 0, w3: 0});
        for (const w of WAVES) { c.to(w, 1, 'gentle'); await c.wait(70); }
        await c.wait(120);
        c.to('cx', 0, 'gentle'); c.to('tilt', 0, 'gentle');
        await c.wait(160);
      }},
      waiting: {label: '等待刷卡', loop: true, run(c) {
        c.claim('cy', ...WAVES);
        c.loop(t => {
          WAVES.forEach((w, i) => { c.s[w] = 0.2 + 0.8 * wave(t, 1.4, -i * 0.18) ** 2; });
          c.s.cy = -1.5 * Math.sin(t * Math.PI * 2 * 0.9);
        });
      }},
      flip: {label: '翻面', async run(c) {
        c.setPose(c.pose === 'front' ? 'back' : 'front');
        c.to('flip', c.goal('flip'), {stiffness: 300, damping: 24});   // passes edge-on with its speed
        c.to('cy', -5, 'snap');
        await c.wait(160);
        c.to('cy', 0, 'gentle');
        await c.wait(300);
      }},
      approve: {label: '支付成功', async run(c) {
        c.to('cx', 6, 'snap');
        for (const w of WAVES) c.to(w, 1, 'fade');
        await c.wait(120);
        c.to('cx', 0, 'settle');
        for (const w of WAVES) c.to(w, 0, 'fade');
        await c.wait(120);
        await c.confirm();
      }},
      decline: {label: '被拒绝', async run(c) {
        c.error();
        for (const w of WAVES) c.to(w, 0.25, 'fade');
        c.to('cx', -6, 'gentle');
        await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'waiting', success: 'approve', fail: 'decline'}
  });

  // ---------- enter: an arrow that knocks and passes a door ----------
  M.define('enter', {
    labels: {busy: '正在登录', done: '已登录', fail: '登录失败'},
    svg: `<path data-part="door" d="M68 18H86a12 12 0 0 1 12 12V90a12 12 0 0 1 -12 12H68"/>
<g data-part="arrow"><path d="M20 60H74"/><path d="M58 44L74 60L58 76"/></g>`,
    state: {ax: 0, aOpacity: 1, door: 1},
    render(s, p) {
      p.arrow.setAttribute('transform', `translate(${s.ax} 0)`);
      p.arrow.setAttribute('opacity', clamp01(s.aOpacity));
      p.door.setAttribute('transform', aroundXY(s.door, 1, 98, 60));
    },
    actions: {
      tap: {label: '点按', async run(c) {
        c.to('ax', -5, 'snap'); await c.wait(90);
        c.to('ax', 8, 'gentle'); await c.wait(140);
      }},
      knock: {label: '敲门', async run(c) {
        for (let i = 0; i < 2; i++) {
          c.to('ax', 7, 'impact'); await c.wait(70);
          c.to('ax', 0, 'settle'); contact(c, 'door', 0.92);
          await c.wait(200);
        }
      }},
      waiting: {label: '等待', loop: true, run(c) {
        c.claim('ax');
        c.loop(t => { c.s.ax = 6 * wave(t, 1.2); });
      }},
      enter: {label: '进入', async run(c) {
        c.to('door', 0.55, 'snap');                 // door swings open
        c.to('ax', 34, {stiffness: 300, damping: 26});
        c.to('aOpacity', 0, {stiffness: 260, damping: 30});
        await c.wait(220);
        c.to('door', 1, {stiffness: 900, damping: 30});   // and shuts behind it
        c.set({ax: -22, aOpacity: 0});              // next arrow slides in from the left
        await c.wait(120);
      }},
      denied: {label: '被拒', async run(c) {
        c.error();
        await c.to('ax', 10, 'impact');             // hits the closed door
        c.to('ax', 0, {stiffness: 420, damping: 14, velocity: -260});
        contact(c, 'door', 0.9);
        await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'waiting', success: ['enter', 'confirm'], fail: 'denied'}
  });

  // ---------- download: an arrow that fills and lands in a tray ----------
  M.define('download', {
    labels: {busy: '正在下载', done: '已下载', fail: '下载失败'},
    svg: `<g data-part="arrow"><path d="M60 18V72"/><path d="M40 54L60 74L80 54"/></g>
<path data-part="tray" d="M22 78V92a10 10 0 0 0 10 10H88a10 10 0 0 0 10 -10V78"/><path data-part="bar" d="M38 91H82"/>`,
    state: {ay: 0, aSquash: 1, aOpacity: 1, tray: 1, bar: 0},
    render(s, p) {
      p.arrow.setAttribute('transform', `translate(0 ${s.ay}) ${aroundXY(1, s.aSquash, 60, 74)}`);
      p.arrow.setAttribute('opacity', clamp01(s.aOpacity));
      p.tray.setAttribute('transform', aroundXY(1 + (1 - s.tray) * 0.5, s.tray, 60, 102));
      dash(p.bar, 44, s.bar);
    },
    actions: {
      tap: {label: '点按', run: c => preview(c, 'ay', 8)},
      downloading: {label: '下载中', loop: true, run(c) {
        c.claim('ay');
        c.loop(t => { c.s.ay = 7 * wave(t, 1.1); });
      }},
      progress: {label: '进度', drive(c, v) {       // arrow sinks as the bar fills
        c.to('ay', 4 + 10 * v, 'track');
        c.to('bar', v, 'track');
      }},
      complete: {label: '完成', async run(c) {
        c.to('ay', 22, {stiffness: 700, damping: 34});   // drops into the tray
        await c.wait(110);
        contact(c, 'tray', 0.86);
        c.to('aSquash', 0.8, 'impact');
        c.to('aOpacity', 0, 'fade');
        c.to('bar', 1, 'gentle');
        await c.wait(260);
        c.set({ay: -26, aSquash: 1, aOpacity: 0});    // a fresh arrow falls in from the top
      }},
      cancel: {label: '取消', async run(c) {
        c.to('ay', -16, 'gentle', -120);
        c.to('aOpacity', 0, 'fade');
        c.to('bar', 0, 'exit');
        await c.wait(220);
        c.set({ay: -20, aOpacity: 0});
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('ay', -8, 'gentle', -120);
        await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'downloading', success: ['complete', 'confirm'], fail: 'fail'}
  });

  // ---------- send: a paper plane that launches and comes back ----------
  M.define('send', {
    labels: {busy: '正在发送', done: '已发送', fail: '发送失败'},
    svg: `<g data-part="plane"><path d="M102 18L56 64"/><path d="M102 18L73 102L56 64L18 47Z"/></g>`,
    state: {px: 0, py: 0, prot: 0, pscale: 1, pOpacity: 1},
    render(s, p) {
      p.plane.setAttribute('transform', `translate(${s.px} ${s.py}) rotate(${s.prot} 60 60) ${around(s.pscale)}`);
      p.plane.setAttribute('opacity', clamp01(s.pOpacity));
    },
    actions: {
      tap: {label: '点按', async run(c) {
        preview(c, 'px', -4, 110); preview(c, 'py', 4, 110);
        await preview(c, 'prot', -6, 110);
      }},
      hover: {label: '待发', loop: true, run(c) {
        c.claim('py', 'prot');
        c.loop(t => {
          c.s.py = -3 * Math.sin(t * Math.PI * 2 * 0.9);
          c.s.prot = 2 * Math.sin(t * Math.PI * 2 * 0.9 + 0.6);
        });
      }},
      send: {label: '发送', async run(c) {
        c.to('px', -6, 'snap'); c.to('py', 6, 'snap'); c.to('prot', 0, 'snap');   // anticipation
        await c.wait(90);
        const launch = {stiffness: 160, damping: 16};     // gone before ~40 units out
        c.to('px', 70, launch); c.to('py', -70, launch);
        c.to('pscale', 0.7, 'gentle'); c.to('pOpacity', 0, {stiffness: 300, damping: 30});
        await c.wait(220);
        c.set({px: -36, py: 36, pscale: 0.6, pOpacity: 0});   // a new plane glides in
      }},
      undo: {label: '撤回', async run(c) {
        c.set({px: 60, py: -60, pscale: 0.7, pOpacity: 0, prot: 0});   // flies back from where it went
        c.to('px', 0, {stiffness: 200, damping: 22}); c.to('py', 0, {stiffness: 200, damping: 22});
        c.to('pscale', 1, 'gentle'); c.to('pOpacity', 1, 'fade');
        c.to('prot', -12, 'gentle');
        await c.wait(260);
        c.to('prot', 0, 'gentle');
        await c.wait(200);
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('prot', 14, 'impact'); c.to('py', 8, 'impact');   // nose-dives
        await c.wait(120);
        c.to('prot', 0, 'settle'); c.to('py', 0, 'settle');
        await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'hover', success: ['send', 'confirm'], fail: 'fail'}
  });

  // ---------- delete: a can whose lid opens, swallows and returns things ----------
  M.define('delete', {
    labels: {busy: '正在删除', done: '已删除', fail: '删除失败'},
    svg: `<g data-part="item"><path d="M52 0H63L69 6V18a3 3 0 0 1 -3 3H55a3 3 0 0 1 -3 -3Z"/></g>
<g data-part="lid"><path d="M22 32H98"/><path d="M46 32V26a6 6 0 0 1 6 -6H68a6 6 0 0 1 6 6V32"/></g>
<g data-part="can"><path d="M30 32L35 92a10 10 0 0 0 10 9H75a10 10 0 0 0 10 -9L90 32"/><path d="M50 48V84"/><path d="M70 48V84"/></g>`,
    state: {lidRot: 0, lidY: 0, can: 1, itemY: 0, itemRot: 0, itemOpacity: 0},
    poses: {closed: {}, open: {lidRot: -28, lidY: -6}},
    render(s, p) {
      p.lid.setAttribute('transform', `translate(0 ${s.lidY + 69 * (1 - s.can)}) rotate(${s.lidRot} 22 32)`);
      p.can.setAttribute('transform', aroundXY(1 + (1 - s.can) * 0.4, s.can, 60, 101));
      p.item.setAttribute('transform', `translate(0 ${s.itemY}) rotate(${s.itemRot} 60 10)`);
      const inside = clamp01((s.itemY + 21 - 30) / 14);   // vanishes as it passes the rim
      p.item.setAttribute('opacity', clamp01(s.itemOpacity) * (1 - inside));
    },
    actions: {
      tap: {label: '掀一下', async run(c) {
        c.to('lidRot', c.goal('lidRot') - 16, 'gentle'); c.to('lidY', c.goal('lidY') - 4, 'gentle');
        await c.wait(160);
      }},
      hover: {label: '等待', loop: true, run(c) {
        c.claim('lidRot', 'lidY');
        c.loop(t => { const w = wave(t, 1.3); c.s.lidRot = -6 * w; c.s.lidY = -2 * w; });
      }},
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('lidRot', -28, 'gentle'); c.to('lidY', -6, 'gentle');
        await c.wait(260);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        const slam = {stiffness: 900, damping: 30};
        c.to('lidRot', 0, slam); c.to('lidY', 0, slam);
        await c.wait(90);
        contact(c, 'can', 0.92);
        await c.wait(200);
      }},
      trash: {label: '丢进去', pose: 'closed', async run(c) {
        c.to('lidRot', -30, 'gentle'); c.to('lidY', -6, 'gentle');
        c.set({itemY: -14, itemRot: -10, itemOpacity: 0});
        c.to('itemOpacity', 1, 'fade'); c.to('itemY', -4, 'gentle');
        await c.wait(170);
        c.to('itemY', 52, {stiffness: 260, damping: 22}); c.to('itemRot', 10, 'gentle');   // falls in
        await c.wait(170);
        c.to('itemOpacity', 0, 'fade');
        const slam = {stiffness: 900, damping: 30};
        c.to('lidRot', 0, slam); c.to('lidY', 0, slam);
        await c.wait(90);
        contact(c, 'can', 0.9);
        await c.wait(240);
      }},
      restore: {label: '恢复', pose: 'closed', async run(c) {
        c.to('lidRot', -30, 'gentle'); c.to('lidY', -6, 'gentle');
        c.set({itemY: 48, itemRot: 8, itemOpacity: 0});
        await c.wait(80);
        c.to('itemOpacity', 1, 'fade'); c.to('itemY', -8, 'gentle'); c.to('itemRot', 0, 'gentle');   // pops back out
        await c.wait(320);
        c.to('lidRot', 0, 'snap'); c.to('lidY', 0, 'snap');
        c.to('itemY', -22, 'exit'); c.to('itemOpacity', 0, 'fade');
        await c.wait(260);
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('lidRot', -8, 'gentle');
        await c.wait(120);
        c.to('lidRot', c.goal('lidRot'), 'snap');
        await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    },
    toggle: ['open', 'close'],
    task: {busy: 'hover', success: ['trash', 'confirm'], fail: 'fail'}
  });

  // ---------- heart: squash, fill, burst, beat ----------
  const HEART = 'M60 98C38 82 18 66 18 44C18 31 28 22 40 22C48 22 55 26 60 33C65 26 72 22 80 22C92 22 102 31 102 44C102 66 82 82 60 98Z';
  const BURST = Array.from({length: 6}, (_, i) => i * 60 - 90);
  const bump = (x, at, w = 0.06) => Math.exp(-(((x - at) / w) ** 2));
  M.define('heart', {
    css: '.mi--heart[data-pose="on"]{color:var(--mi-heart,#ff2d55)}',
    svg: `<path data-part="fill" d="${HEART}" style="fill:var(--mi-heart,#ff2d55);stroke:none"/><path data-part="outline" d="${HEART}"/>
${BURST.map((_, i) => `<path data-part="b${i}"/>`).join('')}`,
    state: {hs: 1, beat: 1, fill: 0, burst: 0, burstOpacity: 0},
    poses: {off: {}, on: {fill: 1}},
    render(s, p) {
      const k = s.hs * s.beat;
      p.outline.setAttribute('transform', around(k, 60, 62));
      p.fill.setAttribute('transform', around(k * clamp01(s.fill), 60, 62));   // never past the outline
      p.fill.setAttribute('opacity', clamp01(s.fill * 3));
      BURST.forEach((a, i) => {
        const r1 = 50 + 14 * s.burst, r2 = r1 + 9 * (1 - s.burst) + 0.01;
        const x = Math.cos(a * Math.PI / 180), y = Math.sin(a * Math.PI / 180);
        p['b' + i].setAttribute('d', `M${60 + x * r1} ${62 + y * r1}L${60 + x * r2} ${62 + y * r2}`);
        p['b' + i].setAttribute('opacity', clamp01(s.burstOpacity));
      });
    },
    actions: {
      like: {label: '喜欢', pose: 'on', from: 'off', async run(c) {
        c.to('hs', 0.8, 'impact');
        await c.wait(80);
        c.to('hs', 1, {...S.gentle, velocity: 3});
        c.to('fill', 1, 'gentle');
        c.set({burst: 0, burstOpacity: 1});
        c.to('burst', 1, {stiffness: 120, damping: 18});
        await c.wait(160);
        await c.to('burstOpacity', 0, 'fade');
      }},
      unlike: {label: '取消', pose: 'off', from: 'on', async run(c) {
        contact(c, 'hs', 0.9);
        c.to('fill', 0, 'gentle');
        await c.wait(260);
      }},
      beat: {label: '心跳', loop: true, run(c) {   // lub-dub at ~66 bpm
        c.claim('beat');
        c.loop(t => { const ph = (t * 1.1) % 1; c.s.beat = 1 + 0.09 * bump(ph, 0.1) + 0.05 * bump(ph, 0.32); });
      }}
    },
    toggle: ['like', 'unlike']
  });

  // ---------- menu: three lines that become close or back ----------
  const LINES = {
    top: ['M24 36L96 36', 'M28 60L52 36'],
    mid: ['M24 60L96 60', 'M28 60L92 60'],
    bottom: ['M24 84L96 84', 'M28 60L52 84']
  };
  M.define('menu', {
    svg: Object.keys(LINES).map(k => `<path data-part="${k}"/>`).join(''),
    state: {m1: 0, m2: 0, b: 0},
    poses: {menu: {}, close: {m1: 1, m2: 1}, back: {b: 1}},
    render(s, p) {
      const b = clamp(s.b, -0.1, 1.1);
      for (const k of Object.keys(LINES)) p[k].setAttribute('d', lerpPath(LINES[k][0], LINES[k][1], b));
      p.top.setAttribute('transform', `rotate(${45 * s.m2} 60 60) translate(0 ${24 * s.m1})`);
      p.bottom.setAttribute('transform', `rotate(${-45 * s.m2} 60 60) translate(0 ${-24 * s.m1})`);
      p.mid.setAttribute('transform', aroundXY(Math.max(0.01, 1 - s.m1 * 0.7), 1));
      p.mid.setAttribute('opacity', clamp01(1 - s.m1 * 1.4));
    },
    actions: {
      toClose: {label: '变关闭', pose: 'close', from: 'menu', async run(c) {   // converge, then rotate
        c.to('b', 0, 'snap');
        c.to('m1', 1, 'snap'); await c.wait(90);
        c.to('m2', 1, 'gentle'); await c.wait(260);
      }},
      toMenu: {label: '变菜单', pose: 'menu', from: 'close', async run(c) {
        c.to('b', 0, 'snap');
        c.to('m2', 0, 'snap'); await c.wait(90);
        c.to('m1', 0, 'gentle'); await c.wait(260);
      }},
      toBack: {label: '变返回', pose: 'back', from: 'menu', async run(c) {
        c.to('m2', 0, 'snap'); c.to('m1', 0, 'snap');
        c.to('b', 1, 'gentle'); await c.wait(300);
      }}
    },
    toggle: ['toClose', 'toMenu']
  });

  // ---------- bell: a pendulum with a lagging clapper ----------
  const SLASH = 76 * Math.SQRT2;
  M.define('bell', {
    css: '.mi--bell svg [data-part="badge"]{fill:var(--mi-badge,#ff3b30)}',
    svg: `<g data-part="bell"><path d="M60 22V32"/><path d="M34 84V58a26 26 0 0 1 52 0V84l8 8H26Z"/></g>
<path data-part="clapper" d="M52 100a8 8 0 0 0 16 0"/>
<circle data-part="badge" data-fill cx="90" cy="30" r="11"/><path data-part="slash" d="M22 22L98 98"/>`,
    state: {swing: 0, clap: 0, badge: 0, slash: 0},
    poses: {normal: {}, unread: {badge: 1}, muted: {slash: 1}},
    render(s, p) {
      p.bell.setAttribute('transform', `rotate(${s.swing} 60 22)`);
      p.clapper.setAttribute('transform', `rotate(${s.swing + s.clap} 60 22)`);
      p.badge.setAttribute('transform', around(Math.max(0.001, s.badge), 90, 30));
      p.badge.setAttribute('opacity', clamp01(s.badge * 4));
      dash(p.slash, SLASH, s.slash);
    },
    actions: {
      tap: {label: '点按', async run(c) {
        c.to('swing', 0, {...S.swing, velocity: 140});
        await c.wait(500);
      }},
      ring: {label: '响铃', async run(c) {
        c.to('swing', 0, {...S.swing, velocity: 320});   // ≈ ±20°, decays on its own
        await c.wait(40);
        c.to('clap', 0, {...S.swing, velocity: -260});   // clapper lags behind the body
        await c.wait(900);
      }},
      ringing: {label: '持续响', loop: true, run(c) {
        c.claim('swing', 'clap');
        c.loop(t => {
          const env = Math.min(1, t * 3);
          c.s.swing = 14 * env * Math.sin(t * Math.PI * 2 * 2.2);
          c.s.clap = -8 * env * Math.sin(t * Math.PI * 2 * 2.2 - 0.8);
        });
      }},
      notify: {label: '新通知', pose: 'unread', from: 'normal', async run(c) {
        c.to('swing', 0, {...S.swing, velocity: 260});
        await c.wait(120);
        c.to('badge', 1, {...S.gentle, velocity: 6});
        await c.wait(700);
      }},
      read: {label: '已读', pose: 'normal', from: 'unread', async run(c) {
        c.to('badge', 1.15, 'snap'); await c.wait(80);
        await c.to('badge', 0, 'exit');
      }},
      mute: {label: '静音', pose: 'muted', from: 'normal', async run(c) {
        c.to('swing', 0, {...S.swing, velocity: -110});
        c.to('slash', 1, 'draw');
        await c.wait(420);
      }},
      unmute: {label: '取消静音', pose: 'normal', from: 'muted', async run(c) {
        c.to('slash', 0, 'draw');
        await c.wait(160);
        c.to('swing', 0, {...S.swing, velocity: 220});
        await c.wait(600);
      }}
    },
    toggle: ['mute', 'unmute']
  });

  // ---------- play / pause: one shape morphing between two ----------
  const PLAY = ['M44 26L66 43L66 77L44 94Z', 'M66 43L88 60L88 60L66 77Z'];
  const PAUSE = ['M36 28L52 28L52 92L36 92Z', 'M68 28L84 28L84 92L68 92Z'];
  M.define('play', {
    svg: `<g data-part="shape"><path data-part="a" style="fill:currentColor"/><path data-part="b" style="fill:currentColor"/></g>`,
    state: {m: 0, sq: 1, sx: 0, so: 1},
    poses: {paused: {}, playing: {m: 1}},
    render(s, p) {
      const m = clamp(s.m, -0.08, 1.08);
      p.a.setAttribute('d', lerpPath(PLAY[0], PAUSE[0], m));
      p.b.setAttribute('d', lerpPath(PLAY[1], PAUSE[1], m));
      p.shape.setAttribute('transform', `translate(${s.sx} 0) ${around(s.sq)}`);
      p.shape.setAttribute('opacity', clamp01(s.so));
    },
    actions: {
      play: {label: '播放', pose: 'playing', from: 'paused', async run(c) {
        contact(c, 'sq', 0.86);
        c.to('m', 1, {stiffness: 380, damping: 28});
        await c.wait(320);
      }},
      pause: {label: '暂停', pose: 'paused', from: 'playing', async run(c) {
        contact(c, 'sq', 0.86);
        c.to('m', 0, {stiffness: 380, damping: 28});
        await c.wait(320);
      }},
      skip: {label: '下一首', async run(c) {     // slides out, the next one slides in
        c.to('sx', 18, 'snap'); c.to('so', 0, 'fade');
        await c.wait(140);
        c.set({sx: -18, so: 0});
      }}
    },
    toggle: ['play', 'pause']
  });

  // ---------- volume: a speaker whose waves follow the level ----------
  const VW = ['v1', 'v2', 'v3'], VP = ['p1', 'p2', 'p3'];
  M.define('volume', {
    svg: `<path data-part="cone" d="M22 48H38L58 30V90L38 72H22Z"/>
${[14, 26, 38].map((r, i) => `<path data-part="${VW[i]}" d="${arc(58, 60, r, -42, 42)}"/>`).join('')}
<path data-part="x" d="M78 50L98 70M98 50L78 70"/>`,
    state: {level: 1, x: 0, cone: 1, p1: 0, p2: 0, p3: 0},
    poses: {on: {}, muted: {level: 0, x: 1}},
    render(s, p) {
      VW.forEach((w, i) => {
        const a = clamp01(s.level * 3 - i);
        p[w].setAttribute('opacity', a * (1 - 0.45 * s[VP[i]]));
        p[w].setAttribute('transform', `translate(${-(1 - a) * 8 + s[VP[i]] * 3} 0)`);
      });
      p.cone.setAttribute('transform', aroundXY(1, s.cone, 40, 60));
      p.x.setAttribute('transform', around(0.4 + 0.6 * s.x, 88, 60));
      p.x.setAttribute('opacity', clamp01(s.x * 3));
    },
    actions: {
      tap: {label: '点按', run: async c => { contact(c, 'cone', 0.9); await c.wait(200); }},
      level: {label: '音量', initial: 1, drive(c, v) {
        if (c.pose === 'muted' && v > 0) { c.setPose('on'); c.to('x', 0, 'exit'); }
        c.setGoal('level', v);
        c.to('level', v, 'track');
      }},
      sound: {label: '发声', loop: true, run(c) {
        c.claim('cone', ...VP);
        c.loop(t => {
          VP.forEach((k, i) => { c.s[k] = wave(t, 1.6, -i * 0.15); });
          c.s.cone = 1 - 0.05 * wave(t, 3.2);
        });
      }},
      mute: {label: '静音', pose: 'muted', from: 'on', async run(c) {
        c.to('level', 0, 'snap');                   // waves collapse into the cone
        contact(c, 'cone', 0.9);
        await c.wait(120);
        c.to('x', 1, 'gentle');
        await c.wait(260);
      }},
      unmute: {label: '取消静音', pose: 'on', from: 'muted', async run(c) {
        c.to('x', 0, 'exit');
        await c.wait(80);
        c.to('level', c.goal('level'), 'gentle');
        await c.wait(300);
      }}
    },
    toggle: ['mute', 'unmute']
  });

  // ---------- eye: blinks, looks around, hides ----------
  const EYE_SLASH = 72 * Math.SQRT2;
  M.define('eye', {
    svg: `<g data-part="eye"><path d="M14 60C26 38 42 28 60 28C78 28 94 38 106 60C94 82 78 92 60 92C42 92 26 82 14 60Z"/>
<circle data-part="pupil" cx="60" cy="60" r="13"/></g><path data-part="slash" d="M24 24L96 96"/>`,
    state: {open: 1, lookX: 0, pupil: 1, slash: 0},
    poses: {visible: {}, hidden: {slash: 1}},
    render(s, p) {
      p.eye.setAttribute('transform', aroundXY(1, Math.max(0.04, s.open), 60, 60));
      p.pupil.setAttribute('transform', `translate(${s.lookX} 0) ${around(s.pupil)}`);
      dash(p.slash, EYE_SLASH, s.slash);
    },
    actions: {
      blink: {label: '眨眼', async run(c) {
        c.to('open', 0.06, {stiffness: 1400, damping: 50});
        await c.wait(80);
        c.to('open', 1, 'gentle');
        await c.wait(220);
      }},
      look: {label: '左右看', async run(c) {
        c.to('lookX', -9, 'snap'); await c.wait(300);
        c.to('lookX', 9, {stiffness: 380, damping: 28}); await c.wait(340);
      }},
      focus: {label: '聚焦', async run(c) {
        c.to('pupil', 1.3, 'gentle'); await c.wait(260);
      }},
      hide: {label: '隐藏', pose: 'hidden', from: 'visible', async run(c) {
        c.to('open', 0.5, 'snap');
        c.to('slash', 1, 'draw');
        await c.wait(120);
        c.to('open', 1, 'gentle');
        await c.wait(300);
      }},
      show: {label: '显示', pose: 'visible', from: 'hidden', async run(c) {
        c.to('slash', 0, 'draw');
        c.to('open', 0.5, 'snap');
        await c.wait(100);
        c.to('open', 1, 'gentle');
        await c.wait(300);
      }}
    },
    toggle: ['hide', 'show']
  });
})(typeof window !== 'undefined' ? window : globalThis);

(function (M) {
  'use strict';
  const {aroundXY, around, clamp01, lerpPath, wave} = M.util;
  const attr = (p, key, value) => p.setAttribute(key, value);
  const op = (p, value) => attr(p, 'opacity', clamp01(value));
  const rad = degrees => degrees * Math.PI / 180;
  const squashAt = (k, x, y, axis = 'y') => axis === 'y'
    ? aroundXY(1 / Math.max(.5, k), k, x, y)
    : aroundXY(k, 1 / Math.max(.5, k), x, y);
  const hinge = (degrees, x, y, depth = 10) =>
    `translate(${x} ${y}) skewX(${depth * Math.sin(rad(degrees))}) scale(1 ${Math.cos(rad(degrees))}) translate(${-x} ${-y})`;
  const flipY = (degrees, x, y, depth = 10) =>
    `translate(${x} ${y}) skewY(${depth * Math.sin(rad(degrees))}) scale(${Math.cos(rad(degrees))} 1) translate(${-x} ${-y})`;
  function patch(name, changes) {
    const old = M.recipes[name];
    const recipe = {...old, ...changes, state: {...old.state, ...changes.state},
      poses: {...old.poses, ...changes.poses}, actions: {...old.actions}};
    for (const [verb, action] of Object.entries(changes.actions || {})) {
      recipe.actions[verb] = typeof action === 'function'
        ? {...old.actions[verb], run: action} : {...old.actions[verb], ...action};
    }
    if (changes.afterRender) {
      recipe.render = (s, p, u) => { old.render(s, p, u); changes.afterRender(s, p, u); };
      delete recipe.afterRender;
    }
    M.define(name, recipe);
  }
  const step = (key, value, preset = 'gentle') => async c => {
    c.to(key, value, preset); await c.wait(260);
  };
  const preview = (key, amount, extra) => async c => {
    if (extra) extra(c);
    c.to(key, c.goal(key) + amount, 'snap'); await c.wait(120);
    c.to(key, c.goal(key), 'settle'); await c.wait(100);
  };
  const previewScale = (key, value) => async c => {
    c.to(key, value, 'gentle'); await c.wait(130);
    c.to(key, c.goal(key), 'settle'); await c.wait(100);
  };
  // Tap previews a named component. No shared whole-icon compression.
  const taps = {
    wifi: preview('spread', 14), bluetooth: preview('nudge', 14), cloud: preview('ay', -14),
    sync: preview('ax', 8, c => c.to('bx', c.goal('bx') - 8, 'snap')),
    upload: preview('ay', -14), battery: preview('boltY', -10, c => c.to('bolt', 1, 'fade')),
    power: preview('stem', 8), search: preview('x', -8, c => c.to('mag', 1.18, 'gentle')),
    link: preview('gap', 14), check: previewScale('box', .82), warning: preview('my', 14),
    error: preview('x', 14), loading: preview('x', 16), hourglass: preview('turn', 15),
    clock: preview('minute', 30), fingerprint: preview('scanY', 16, c => c.to('scanOn', 1, 'fade')),
    'face-id': previewScale('open', .2), folder: preview('lid', -32),
    copy: preview('fx', 10, c => c.to('fy', -8, 'gentle')), bookmark: preview('notch', 1),
    cellular: previewScale('b3', .55), hotspot: previewScale('r2', .6), usb: preview('y', 14),
    server: preview('drawer', 12), brightness: preview('reach', .45), storage: preview('ripple', 1),
    printer: preview('feed', 12), archive: preview('lid', -32),
    clipboard: preview('gx', 10, c => {c.to('go', 1, 'fade'); c.to('gy', -8, 'gentle');}),
    filter: preview('kx', 16), sort: preview('y1', 12, c => c.to('y2', -12, 'gentle')),
    star: preview('starTurn', 24), mail: previewScale('flap', .65), phone: preview('angle', 20),
    'video-call': preview('x', -14), share: preview('ay', -14),
    'qr-scan': preview('line', 18, c => c.to('lineOn', 1, 'fade')),
    wallet: preview('flap', -32), cart: preview('roll', 36), calendar: preview('leaf', .35),
    receipt: preview('gap', 15), gift: preview('lid', -32), shield: preview('bulge', 1),
    key: preview('turn', 35), passcode: preview('dy', -8, c => c.to('d0', 1, 'fade')),
    'two-factor': preview('by', -10, c => c.to('bScale', 1, 'gentle')),
    permission: preview('x', 16), 'secure-connection': preview('gap', -14),
    camera: previewScale('blade', .35), 'screen-recording': preview('bar', 1),
    'ai-thinking': preview('n0', -8), 'ai-browsing': preview('x', -12),
    'ai-reading': preview('headY', 20, c => c.to('headOn', 1, 'fade')),
    'ai-writing': preview('cx', 16), 'ai-coding': preview('gap', 14),
    'ai-tool-call': preview('tx', 18), 'ai-agent': previewScale('head', 1.18),
    'ai-handoff': preview('tx', 24), 'ai-generating': preview('assemble', .35),
    'ai-queue': preview('y2', -12, c => c.to('o2', 1, 'fade'))
  };
  for (const [name, tap] of Object.entries(taps)) patch(name, {actions: {tap}});

  // State changes have geometry; draw/opacity channels never carry an overshoot.
  patch('wifi', {actions: {
    connect: async c => {
      c.to('slash', 0, 'fade'); c.to('spread', 8, 'gentle');
      for (let i=1; i<=3; i++) { c.to('a'+i, 1, 'fade'); await c.wait(70); }
      c.to('spread', 0, 'settle'); await c.wait(100);
    }, disconnect: async c => {
      c.to('spread', -8, 'gentle'); c.to('a3', 0, 'fade'); await c.wait(70);
      c.to('a2', 0, 'fade'); await c.wait(70); c.to('a1', 0, 'fade'); c.to('slash', 1, 'draw'); await c.wait(160);
    }
  }});
  patch('sync', {state: {orbit: 0}, periodic: {orbit: 360}, afterRender(s,p) {
    attr(p.body, 'transform', `rotate(${s.orbit} 60 60)`);
  }, actions: {
    start: step('orbit', 180, 'slow'),
    syncing: {loop:true, run(c) { c.claim('orbit'); c.loop(t => {c.s.orbit=180*t; c.setVelocity('orbit',180);}); }},
    retry: step('orbit', 180, 'slow')
  }});
  patch('power', {actions: {press: preview('stem', 8)}});
  patch('search', {actions: {found: async c => {c.to('x', 0, 'settle');c.to('y', 0, 'settle');c.to('mag',1.25,'gentle');await c.wait(280);}}});
  patch('brightness', {afterRender(s,p) {
    attr(p.body,'transform',`rotate(${(s.reach-1)*22.5} 60 60)`);
  }, actions:{brighten:step('reach',1.7), dim:step('reach',.2)}});
  patch('server', {state:{drawer:0}, afterRender(s,p) {
    for(let i=0;i<3;i++) attr(p['l'+i],'transform',`translate(${s.drawer*(1-i*.18)} 0)`);
    const rows=p.stack.querySelectorAll('rect');
    rows.forEach((row,i)=>attr(row,'transform',`translate(${s.drawer*(1-i*.18)} 0)`));
  }, actions:{online:async c=>{c.to('drawer',12,'gentle');for(let i=0;i<3;i++){c.to('l'+i,1,'fade');await c.wait(60);}c.to('drawer',0,'settle');await c.wait(100);},
    restart:preview('drawer',16),
    busy:{loop:true,run(c){c.claim('drawer');c.loop(t=>{c.s.drawer=8*wave(t,.8);});}}
  }});

  // Physical hinges cross the edge-on position. Inner faces remain attached.
  for (const [name,part,key,x,y,factor] of [
    ['folder','lid','lid',60,52,-2.5], ['archive','lid','lid',60,60,-2.5],
    ['wallet','flap','flap',60,50,-2.5], ['gift','lid','lid',60,56,-2.5]
  ]) patch(name,{afterRender(s,p){
    const lift=name==='gift'?s.ly:name==='wallet'?s.fy:0;
    attr(p[part],'transform',`translate(0 ${lift}) ${hinge(s[key]*factor,x,y)}`);
    op(p[part],Math.cos(rad(s[key]*factor))<0?.65:1);
  }});
  patch('mail',{afterRender(s,p){attr(p.flap,'transform',hinge((1-s.flap)*140,60,42));op(p.flap,s.flap<.36?.65:1);},
    actions:{open:async c=>{c.to('flap',0,'gentle');c.to('lOn',1,'fade');c.to('ly',-16,'gentle');await c.wait(320);}}});
  patch('calendar',{afterRender(s,p){
    const a=clamp01(s.leaf)*180;attr(p.page,'transform',hinge(a,60,52));
    op(p.page,s.pageOn*(a>90?.55:1));
  }, actions:{next:async c=>{c.to('leaf',1,'gentle');await c.wait(300);c.to('pageOn',0,'fade');await c.wait(100);c.set({leaf:0});},
    previous:async c=>{c.set({leaf:1,pageOn:0});c.to('pageOn',1,'fade');c.to('leaf',0,'gentle');await c.wait(320);}}});
  patch('camera',{state:{cameraTurn:0}, afterRender(s,p){
    attr(p.body,'transform',flipY(s.cameraTurn,60,64));
    const rear=Math.cos(rad(s.cameraTurn))<0;
    attr(p.lens,'cx',rear?38:60);attr(p.blade,'cx',rear?38:60);
    attr(p.lens,'transform',around(s.lens,rear?38:60,68));
    attr(p.blade,'transform',aroundXY(1,Math.max(.05,s.blade),rear?38:60,68));
  }, actions:{switchCamera:step('cameraTurn',180,'slow')}});
  patch('key',{afterRender(s,p){
    attr(p.key,'transform',`translate(${s.x} 0) ${hinge(s.turn,96,60)}`);
  }});
  patch('copy',{afterRender(s,p){
    attr(p.front,'transform',`translate(${s.fx} ${s.fy}) ${flipY(Math.min(30,Math.abs(s.fx)*1.5),26,98)}`);
  }});
  patch('link',{afterRender(s,p){
    const a=Math.max(-30,Math.min(30,s.gap*2));
    attr(p.a,'transform',`translate(${-s.gap} 0) ${flipY(a,44,60)}`);
    attr(p.b,'transform',`translate(${s.gap} 0) ${flipY(-a,76,60)}`);
  }});
  patch('two-factor',{afterRender(s,p){attr(p.badge,'transform',`translate(0 ${s.by}) ${flipY((1-s.bScale)*70,60,57)}`);}});
  patch('ai-browsing',{afterRender(s,p){
    attr(p.window,'transform',`${flipY((s.z-1)*35,18,96)} ${around(s.z,60,60)}`);
    attr(p.content,'transform',`translate(0 ${s.x})`);
  },actions:{navigate:step('x',-20),inspect:step('z',1.3)}});
  patch('ai-agent',{afterRender(s,p){
    attr(p.head,'transform',flipY((s.head-1)*90,60,42));
    attr(p.halo,'transform',around(.6+.6*clamp01(s.halo),60,42));
  }});
  patch('video-call',{afterRender(s,p){
    attr(p.cam,'transform',`translate(${s.x} 0) ${flipY((1-s.dim)*65,84,62)}`);
  },actions:{join:step('x',-20),leave:step('x',20)}});

  // Path changes keep the same command order and point count.
  patch('storage',{state:{ripple:0},svg:M.recipes.storage.svg.replace('<rect data-part="fill" data-fill x="30" y="40" width="60" height="48"/>',
    '<path data-part="fill" data-fill d="M30 70Q45 70 60 70Q75 70 90 70V88H30Z"/>'),
    afterRender(s,p){const y=88-48*clamp01(s.level),a=s.ripple*6;
      attr(p.fill,'transform','');attr(p.fill,'d',`M30 ${y}Q45 ${y-a} 60 ${y}Q75 ${y+a} 90 ${y}V88H30Z`);},
    actions:{fill:async c=>{c.to('level',.85,'gentle');c.to('ripple',1,'gentle');await c.wait(200);c.to('ripple',0,'settle');await c.wait(140);},
      clear:async c=>{c.to('ripple',-1,'gentle');c.to('level',0,'gentle');await c.wait(300);}}
  });
  patch('bookmark',{state:{notch:0},afterRender(s,p){
    const d=`M38 20H82V100L60 ${82-12*s.notch}L38 100Z`;
    attr(p.edge,'d',d);attr(p.fill,'d',d);
  },actions:{press:preview('notch',1),save:async c=>{c.to('notch',1,'gentle');c.to('fill',1,'fade');await c.wait(260);}}});
  patch('receipt',{afterRender(s,p){
    const a=Math.min(1,Math.abs(s.gap)/16);
    const path=p.bottom.querySelector('path');
    attr(path,'d',`M34 60L42 ${60-4*a}L50 ${60+4*a}L58 ${60-4*a}L66 ${60+4*a}L74 ${60-4*a}L86 60V98H34Z`);
    attr(p.bottom,'transform',`translate(0 ${a*14}) rotate(${a*15} 60 60)`);
  }});
  patch('shield',{state:{bulge:0},afterRender(s,p){
    const d=p.plate.querySelector('path');attr(d,'d',`M60 20L94 35V58C${94+6*s.bulge} 81 77 98 60 103C43 98 ${26-6*s.bulge} 81 26 58V35Z`);
  },actions:{protect:step('bulge',1)}});
  patch('filter',{afterRender(s,p){
    const k=6*Math.sin(Math.PI*clamp01(s.y1/66));
    attr(p.funnel,'d',`M30 34H90L${66-k/2} 60V80H${54+k/2}V60Z`);
  }});
  patch('printer',{afterRender(s,p){
    const a=Math.min(1,Math.abs(s.out)/24);
    attr(p.paper,'d',`M42 50H78V82Q60 ${82+4*a} 42 82Z`);
  },actions:{printing:{loop:true,run(c){c.claim('feed','out','outOn','inOn','corner');c.loop(t=>{
    const v=(t*.65)%1;c.s.feed=28*v;c.s.inOn=1-v;c.s.out=24*v;c.s.outOn=v;c.s.corner=0;
  });}}}});
  patch('sort',{afterRender(s,p){
    for(let i=1;i<=3;i++){const y=s['y'+i],x=Math.sin(Math.PI*Math.min(1,Math.abs(y)/48))*8*(i===2?-1:1);
      attr(p['l'+i],'transform',`translate(${x} ${y}) ${around(i===2?.94:1.06,60,34+(i-1)*24)}`);}
  }});
  patch('star',{state:{starTurn:0},afterRender(s,p){attr(p.body,'transform',`rotate(${s.starTurn} 60 60)`);},
    actions:{favourite:async c=>{c.to('starTurn',72,'snap');c.to('fill',1,'fade');await c.wait(300);},
      unfavourite:async c=>{c.to('starTurn',-36,'gentle');c.to('fill',0,'fade');await c.wait(260);},highlight:step('starTurn',72,'snap')}});
  patch('screen-recording',{svg:M.recipes['screen-recording'].svg.replace('<circle data-part="dot" data-fill cx="60" cy="100" r="8"/>',
    '<path data-part="dot" data-fill d="M52 92H58V108H52ZM62 92H68V108H62Z"/>'),afterRender(s,p){
    const a=clamp01(s.bar);
    attr(p.dot,'d',lerpPath('M52 92Q58 88 58 100Q58 112 52 108ZM62 92Q68 88 68 100Q68 112 62 108Z',
      'M52 92Q58 92 58 100Q58 108 52 108ZM62 92Q68 92 68 100Q68 108 62 108Z',a));
    attr(p.dot,'transform',around(.65+.35*clamp01(s.dot),60,100));
  }});
  patch('fingerprint',{state:{scanY:0,scanOn:0},svg:M.recipes.fingerprint.svg+'<path data-part="scanner" d="M22 28H98"/>',
    afterRender(s,p){attr(p.scanner,'transform',`translate(0 ${s.scanY})`);op(p.scanner,s.scanOn);},
    actions:{scan:async c=>{c.to('scanOn',1,'fade');c.to('scanY',48,'gentle');for(let i=0;i<5;i++){c.to('r'+i,1,'draw');await c.wait(60);}c.to('scanOn',0,'fade');},
      scanning:{loop:true,run(c){c.claim('scanY','scanOn');c.loop(t=>{const v=(t*.8)%1;c.s.scanY=48*v;c.s.scanOn=Math.sin(Math.PI*v);});}}}
  });
  patch('face-id',{state:{smile:0},svg:M.recipes['face-id'].svg+'<path data-part="face" d="M44 50V56M76 50V56M48 72Q60 72 72 72"/>',
    afterRender(s,p){attr(p.face,'d',`M44 50V56M76 50V56M48 72Q60 ${72+12*s.smile} 72 72`);},
    actions:{recognise:async c=>{c.to('open',.2,'snap');c.to('smile',1,'gentle');c.to('lineOn',0,'fade');await c.wait(300);}}
  });
  patch('error',{state:{retryMorph:0},svg:M.recipes.error.svg.replace('<path d="M40 80L80 40"/>',
    '<path data-part="cross" d="M40 80Q60 60 80 40M40 40Q60 60 80 80"/>'),
    afterRender(s,p){attr(p.cross,'d',lerpPath('M40 80Q60 60 80 40M40 40Q60 60 80 80',
      'M34 70Q22 26 76 30M76 30Q88 30 80 44',clamp01(s.retryMorph)));},actions:{retry:step('retryMorph',1)}});
  patch('ai-reading',{state:{summary:0},afterRender(s,p){
    for(let i=0;i<3;i++)attr(p['l'+i],'d',`M40 ${40+20*i*(1-s.summary)}Q60 ${40+20*i*(1-s.summary)} ${86-6*i*s.summary} ${40+20*i*(1-s.summary)}`);
  },actions:{complete:async c=>{c.to('summary',1,'gentle');c.to('footer',1,'draw');await c.wait(320);}}});
  patch('ai-writing',{state:{align:0},afterRender(s,p){
    for(let i=0;i<3;i++)attr(p['l'+i],'d',`M24 ${40+18*i}Q60 ${40+18*i} ${i===2?84+12*s.align:96} ${40+18*i}`);
  },actions:{finish:async c=>{c.to('align',1,'gentle');c.to('caret',0,'fade');await c.wait(260);}}});
  patch('ai-coding',{state:{cursorX:0},afterRender(s,p){attr(p.caret,'transform',`translate(${s.cursorX} 0)`);},
    actions:{type:async c=>{for(const x of [-12,-6,0,6,12]){c.to('cursorX',x,'snap');await c.wait(60);}},
      execute:step('gap',10)}});
  patch('ai-generating',{state:{assemble:0,refineTurn:0,seam:0},afterRender(s,p){
    const t=clamp01(s.assemble);
    for(let i=0;i<4;i++){
      const dx=(i%2?1:-1)*16*t,dy=(i<2?-1:1)*16*t,angle=(i%2?1:-1)*18*t;
      const x=i%2?72:48,y=i<2?48:72;
      attr(p['p'+i],'transform',`translate(${dx} ${dy}) rotate(${angle} ${x} ${y}) ${flipY(i===0?s.refineTurn:0,x,y)} ${around(s['k'+i],x,y)}`);
      attr(p['p'+i],'rx',5+5*s.seam);attr(p['p'+i],'width',20+4*s.seam);attr(p['p'+i],'height',20+4*s.seam);
    }
  },actions:{generate:async c=>{c.to('assemble',1,'gentle');for(let i=0;i<4;i++){c.to('d'+i,1,'draw');await c.wait(65);}c.to('assemble',0,'settle');await c.wait(120);},
    refine:step('refineTurn',180,'slow'),finish:step('seam',1)}});
  patch('ai-handoff',{afterRender(s,p){attr(p.b,'transform',`translate(0 ${(1-s.ack)*20})`);},actions:{acknowledge:previewScale('ack',.6)}});
  patch('permission',{afterRender(s,p){const stretch=1+.25*Math.sin(Math.PI*clamp01(s.x/48));
    attr(p.knob,'transform',`translate(${s.x} 0) ${squashAt(stretch,40,60,'x')}`);
  }});
})(window.MotionIcon);

(function (M) {
  'use strict';
  const {around,aroundXY,clamp01,wave,lerpPath}=M.util;
  const attr=(p,k,v)=>p.setAttribute(k,v);
  const op=(p,v)=>attr(p,'opacity',clamp01(v));
  const hinge=(a,x,y)=>`translate(${x} ${y}) skewX(${10*Math.sin(a*Math.PI/180)}) scale(1 ${Math.cos(a*Math.PI/180)}) translate(${-x} ${-y})`;
  const turn=(a,x,y)=>`translate(${x} ${y}) skewY(${10*Math.sin(a*Math.PI/180)}) scale(${Math.cos(a*Math.PI/180)} 1) translate(${-x} ${-y})`;
  const squash=(k,x,y)=>aroundXY(1/Math.max(.5,k),k,x,y);
  const run=(key,value,spring='gentle')=>async c=>{c.to(key,value,spring);await c.wait(260);};
  const tap=(key,delta)=>async c=>{c.to(key,c.goal(key)+delta,'snap');await c.wait(110);c.to(key,c.goal(key),'settle');await c.wait(100);};
  function patch(name,changes){const old=M.recipes[name];const r={...old,...changes,state:{...old.state,...changes.state},poses:{...old.poses,...changes.poses},actions:{...old.actions}};
    for(const[k,a]of Object.entries(changes.actions||{}))r.actions[k]=typeof a==='function'?{...old.actions[k],run:a}:{...old.actions[k],...a};
    if(changes.afterRender){r.render=(s,p,u)=>{old.render(s,p,u);changes.afterRender(s,p,u);};delete r.afterRender;}
    M.define(name,r);
  }
  patch('lock',{state:{shackleTurn:0},afterRender(s,p){attr(p.shackle,'transform',`translate(0 ${46*(1-s.squash)-s.lift}) ${turn(s.shackleTurn,42,53)}`);},
    actions:{tap:tap('lift',14),jiggle:async c=>{c.to('lift',10,'snap');c.to('tilt',6,'gentle');await c.wait(100);c.to('lift',0,'snap');await c.wait(150);},
      unlock:async c=>{c.to('lift',20,'snap');await c.wait(110);c.to('shackleTurn',115,'gentle');await c.wait(220);},
      deny:async c=>{c.error();c.to('lift',10,'snap');await c.wait(100);c.to('lift',0,'snap');await c.shake();await c.wait(c.timing.holdFail);}}
  });
  patch('refresh',{actions:{error:async c=>{c.error();c.to('rot',300,'snap');await c.wait(100);c.to('rot',260,'snap');await c.wait(220);await c.wait(c.timing.holdFail);}}});
  patch('pay',{state:{waveTravel:0},afterRender(s,p){
    const a=Math.acos(Math.max(-1,Math.min(1,s.flip)))*180/Math.PI;
    attr(p.card,'transform',`translate(${s.cx} ${s.cy}) rotate(${s.tilt} 49 60) ${turn(a,49,60)}`);
    for(let i=1;i<=3;i++)attr(p['w'+i],'transform',`translate(${s.waveTravel*(.6+.2*i)} 0) ${around(.75+.25*clamp01(s['w'+i]),86,60)}`);
  },actions:{tap:tap('tilt',-15),contactless:async c=>{c.to('cx',12,'gentle');c.to('tilt',-15,'gentle');c.to('waveTravel',12,'gentle');for(const k of ['w1','w2','w3']){c.to(k,1,'fade');await c.wait(70);}await c.wait(100);},
    waiting:{loop:true,run(c){c.claim('waveTravel','w1','w2','w3');c.loop(t=>{const v=(t*.9)%1;c.s.waveTravel=12*v;for(let i=1;i<=3;i++)c.s['w'+i]=Math.sin(Math.PI*((v+(3-i)*.15)%1));});}},
    flip:async c=>{c.setPose(c.pose==='front'?'back':'front');c.to('flip',c.goal('flip'),'gentle');await c.wait(360);},
    decline:async c=>{c.error();c.to('cx',8,'snap');await c.wait(90);c.to('cx',-4,'snap');await c.shake();await c.wait(c.timing.holdFail);}}
  });
  patch('enter',{afterRender(s,p){attr(p.door,'transform',turn((1-s.door)*100,98,60));},actions:{tap:tap('ax',14),
    knock:async c=>{for(let i=0;i<2;i++){c.to('ax',10,'snap');c.to('door',.94,'gentle');await c.wait(90);c.to('ax',0,'settle');c.to('door',1,'settle');await c.wait(100);}},
    waiting:{loop:true,run(c){c.claim('ax');c.loop(t=>{c.s.ax=10*wave(t,1);});}},
    denied:async c=>{c.error();c.to('ax',12,'snap');await c.wait(100);c.to('ax',-12,'snap');c.to('door',1,'snap');await c.wait(280);await c.wait(c.timing.holdFail);}}
  });
  patch('download',{svg:M.recipes.download.svg.replace('<g data-part="arrow">','<defs><clipPath id="mi-refined-download"><rect x="12" y="12" width="96" height="66"/></clipPath></defs><g clip-path="url(#mi-refined-download)"><g data-part="arrow">').replace('</g>\n<path data-part="tray"','</g></g>\n<path data-part="tray"'),
    actions:{downloading:{loop:true,run(c){c.claim('ay','aOpacity');c.loop(t=>{const v=(t*.9)%1;c.s.ay=-24+48*v;c.s.aOpacity=Math.sin(Math.PI*v);});}},
      fail:async c=>{c.error();c.to('ay',12,'snap');await c.wait(100);await c.shake();await c.wait(c.timing.holdFail);}}});
  patch('send',{afterRender(s,p){attr(p.plane,'transform',`translate(${s.px} ${s.py}) rotate(${s.prot} 60 60) ${turn(s.prot,60,60)} ${around(s.pscale)}`);},
    actions:{tap:async c=>{c.to('px',-8,'snap');c.to('prot',-12,'gentle');await c.wait(210);},
      hover:{loop:true,run(c){c.claim('py','prot');c.loop(t=>{c.s.py=5*Math.sin(t*Math.PI*1.6);c.s.prot=6*Math.sin(t*Math.PI*1.6+.5);});}},
      fail:async c=>{c.error();c.to('px',20,'snap');await c.wait(100);c.to('pscale',.8,'gentle');c.to('py',10,'gentle');c.to('prot',15,'gentle');await c.wait(240);await c.wait(c.timing.holdFail);}}});
  patch('delete',{afterRender(s,p){attr(p.lid,'transform',`translate(0 ${s.lidY}) ${hinge(-3*s.lidRot,60,32)}`);attr(p.item,'transform',`translate(0 ${s.itemY}) rotate(${s.itemRot} 60 10) ${squash(1.15,60,21)}`);},actions:{tap:tap('lidRot',-15)}});
  patch('heart',{afterRender(s,p){attr(p.outline,'transform',squash(s.hs*s.beat,60,98));attr(p.fill,'transform',`${squash(s.hs*s.beat,60,98)} ${around(clamp01(s.fill),60,62)}`);},
    actions:{like:async c=>{c.to('hs',.85,'snap');await c.wait(80);c.to('hs',1,'pop');c.to('fill',1,'fade');await c.wait(260);},
      beat:{loop:true,run(c){c.claim('beat');c.loop(t=>{const v=(t*1.1)%1;c.s.beat=1+.12*Math.exp(-(((v-.12)/.07)**2))+.10*Math.exp(-(((v-.34)/.09)**2));});}}}});
  patch('menu',{actions:{toClose:async c=>{c.to('b',0,'gentle');c.to('m1',1,'snap');await c.wait(90);c.to('m2',1,'snap');await c.wait(220);},toMenu:async c=>{c.to('b',0,'gentle');c.to('m2',0,'snap');await c.wait(90);c.to('m1',0,'snap');await c.wait(220);},toBack:async c=>{c.to('m1',0,'snap');c.to('m2',0,'snap');c.to('b',1,'gentle');await c.wait(300);}}});
  patch('bell',{actions:{tap:tap('swing',12),notify:async c=>{c.to('swing',0,{...M.SPRINGS.swing,velocity:220});c.to('badge',1,'fade');await c.wait(380);},mute:async c=>{c.to('swing',-12,'snap');c.to('slash',1,'draw');await c.wait(260);},unmute:async c=>{c.to('slash',0,'draw');c.to('swing',14,'snap');await c.wait(260);}}});
  patch('play',{afterRender(s,p){attr(p.shape,'transform',`translate(${s.sx} 0) ${squash(s.sq,60,60)}`);},actions:{play:run('m',1),pause:run('m',0),skip:async c=>{c.to('sq',.84,'gentle');c.to('sx',24,'snap');c.to('so',0,'fade');await c.wait(160);c.set({sx:-24,so:0});}}});
  patch('volume',{state:{speakerX:0},afterRender(s,p){attr(p.cone,'transform',`translate(${s.speakerX} 0)`);for(let i=1;i<=3;i++){attr(p['v'+i],'transform',`translate(${6*s['p'+i]} 0)`);op(p['v'+i],clamp01(s.level*3-i+1)*(1-s['p'+i]));}},
    actions:{tap:tap('speakerX',14),sound:{loop:true,run(c){c.claim('p1','p2','p3','speakerX');c.loop(t=>{for(let i=1;i<=3;i++)c.s['p'+i]=(t*1.2-(i-1)*.16+1)%1;c.s.speakerX=3*wave(t,1.2);});}}}});
  patch('eye',{afterRender(s,p){attr(p.pupil,'transform',`translate(${s.lookX} 0) ${aroundXY(s.pupil*(1-.2*Math.min(1,Math.abs(s.lookX)/14)),s.pupil,60,60)}`);},actions:{look:async c=>{c.to('lookX',-14,'snap');await c.wait(180);c.to('lookX',14,'gentle');await c.wait(240);},focus:run('pupil',.6),blink:async c=>{c.to('open',.06,'snap');await c.wait(100);c.to('open',1,'snap');await c.wait(200);}}});

  patch('lookup',{actions:{tap:async c=>{c.to('lx',-8,'snap');c.to('lensScale',1.2,'gentle');await c.wait(230);},found:async c=>{c.to('ly',-12,'gentle');c.to('lensScale',1.3,'gentle');await c.wait(260);},fail:async c=>{c.error();c.to('lx',18,'snap');c.to('pageTilt',15,'gentle');await c.wait(300);await c.wait(c.timing.holdFail);}}});
  patch('lexicon',{afterRender(s,p){attr(p.paper,'transform',`translate(0 ${s.paperY}) ${squash(1+Math.sin(Math.min(1,Math.max(0,s.paperY/25))*Math.PI)*.15,60,54)}`);attr(p.bookmark,'transform',turn((1-s.mark)*45,77,54));},
    actions:{tap:async c=>{c.to('mark',1,'fade');c.to('compression',.84,'gentle');await c.wait(220);},saving:{loop:true,run(c){c.claim('paperY','paperOpacity');c.loop(t=>{const v=(t*.8)%1;c.s.paperY=-12+24*v;c.s.paperOpacity=Math.sin(Math.PI*v);});}},
      fail:async c=>{c.error();c.to('paperOpacity',1,'fade');c.to('paperY',14,'snap');await c.wait(110);c.to('paperY',-12,'snap');await c.wait(180);c.to('paperOpacity',0,'fade');await c.wait(c.timing.holdFail);}}});
  patch('daylight',{actions:{tap:tap('rise',-8),peek:run('rayAngle',24,'slow'),select:async c=>{c.to('phase',0,'slow');c.to('rise',-14,'gentle');c.to('warmth',1.14,'gentle');await c.wait(300);},selectNight:async c=>{c.to('phase',1,'slow');c.to('rise',-14,'gentle');c.to('warmth',1.14,'gentle');await c.wait(300);}}});
  patch('cards',{state:{cardTurn:0},afterRender(s,p){attr(p.front,'transform',`translate(${s.frontX} ${s.frontY}) rotate(${s.tilt} 61 97) ${turn(s.cardTurn,30,97)}`);},actions:{tap:tap('frontX',14),peek:async c=>{c.to('frontX',c.goal('frontX')+14,'gentle');c.to('tilt',c.goal('tilt')+10,'gentle');c.to('backAngle',c.goal('backAngle')-10,'gentle');await c.wait(240);},remember:run('cardTurn',180,'slow'),revisit:async c=>{c.to('frontY',-14,'gentle');c.to('tilt',-15,'gentle');await c.wait(240);},preparing:{loop:true,run(c){c.claim('frontX','frontY');c.loop(t=>{const a=2*Math.PI*t/1.2;c.s.frontX=16*Math.sin(a);c.s.frontY=-8*(1-Math.cos(a));});}}}});
  patch('book',{afterRender(s,p){attr(p.leaf,'transform',turn(clamp01(s.leaf)*180,60,68));attr(p.cover,'transform',`skewY(${Math.sin(s.opening*Math.PI)*10})`);},actions:{tap:tap('opening',.35)}});
  patch('recall',{afterRender(s,p){attr(p.flap,'transform',hinge(clamp01(s.opening)*132,60,34));attr(p.card,'transform',`translate(${s.cardX} ${s.cardY}) rotate(${s.tilt} 60 96) ${squash(1+Math.min(.15,Math.abs(s.cardX)/320),60,96)}`);},actions:{tap:tap('opening',.35),retry:async c=>{c.to('cardY',-12,'gentle');c.to('tilt',-15,'gentle');await c.wait(160);c.to('opening',0,'gentle');await c.wait(150);}}});
  patch('milestone',{state:{sealY:0,pageTurn:0},afterRender(s,p){attr(p.page,'transform',`translate(0 ${s.pageY}) ${turn(s.pageTurn,36,79)}`);attr(p.seal,'transform',`translate(0 ${s.sealY}) ${squash(s.sealScale,88,100)}`);},
    actions:{tap:tap('pageTurn',35),complete:async c=>{c.to('sealOpacity',1,'fade');c.to('sealY',-20,'snap');c.to('sealScale',1.15,'gentle');await c.wait(100);c.to('sealY',0,'snap');await c.wait(110);c.to('sealScale',.84,'impact');c.to('pageY',0,'gentle');c.to('check',1,'draw');await c.wait(180);},restart:async c=>{c.to('sealOpacity',0,'fade');c.to('pageTurn',180,'slow');await c.wait(300);}}});
  patch('plus',{actions:{tap:tap('turn',15),add:run('hx',1.2,'snap'),confirm:async c=>{c.to('bend',1,'gentle');c.to('turn',0,'snap');await c.wait(280);},reject:async c=>{c.error();c.to('turn',45,'snap');await c.wait(120);c.to('turn',0,'snap');await c.wait(180);}}});
  patch('settings',{actions:{tap:tap('angle',30),select:async c=>{c.to('angle',52,'snap');c.to('thumb',1,'gentle');await c.wait(260);},turn:tap('angle',30)}});
  patch('sentence',{state:{penTilt:0},afterRender(s,p){attr(p.pen,'transform',`translate(${s.penX} ${s.penY}) rotate(${s.penTilt} 70 80)`);},actions:{writing:{loop:true,run(c){c.claim('penX','penY');c.to('penOpacity',1,'fade');c.loop(t=>{const v=(t*.75)%1;c.s.penX=-36+32*v;c.s.penY=-20+4*Math.sin(v*Math.PI*6);});}},reveal:async c=>{c.to('penOpacity',1,'fade');c.to('penX',-36,'snap');c.to('penY',-36,'snap');await c.wait(70);c.to('penX',0,'gentle');c.to('inkA',1,'draw');await c.wait(90);c.to('penY',-22,'gentle');c.to('inkB',1,'draw');await c.wait(90);c.to('penY',-8,'gentle');c.to('inkC',c.goal('inkC'),'draw');await c.wait(140);},fail:async c=>{c.error();c.to('penOpacity',1,'fade');c.to('penTilt',15,'snap');c.to('penY',6,'snap');await c.wait(300);await c.wait(c.timing.holdFail);}}});
  patch('memory',{state:{frameY:0},afterRender(s,p){attr(p.frame,'transform',`translate(0 ${s.frameY}) ${turn(s.frameAngle*2,60,93)}`);},actions:{tap:tap('frameAngle',8),peek:run('frameAngle',15),fail:async c=>{c.error();c.to('frameY',10,'gentle');c.to('frameAngle',8,'gentle');await c.wait(300);await c.wait(c.timing.holdFail);}}});
  patch('pencil',{state:{ink:0},svg:M.recipes.pencil.svg+'<path data-part="written" d="M40 90Q55 88 70 90"/>',afterRender(s,p){attr(p.pen,'transform',`translate(${s.penX} ${s.penY}) rotate(${s.angle} 43 85) ${turn(s.angle,43,85)}`);attr(p.written,'d',`M40 90Q${40+15*s.ink} 88 ${40+30*s.ink} 90`);op(p.written,s.ink);},actions:{tap:tap('penY',14),peek:run('angle',-15),select:async c=>{c.to('angle',-25,'gentle');c.to('penY',8,'snap');await c.wait(260);},write:async c=>{c.to('penX',28,'gentle');c.to('ink',1,'draw');await c.wait(320);}}});
  patch('voice',{state:{waveTravel:0},afterRender(s,p){for(let i=1;i<=3;i++){const part=p[i===1?'wave':'wave'+i];attr(part,'transform',`translate(${s.waveTravel*(.6+.2*i)} 0) ${aroundXY(1,.5+.5*clamp01(s.waveAlpha),90,60)}`);}},actions:{speaking:{loop:true,run(c){c.claim('waveTravel','waveAlpha');c.loop(t=>{const v=(t*1.15)%1;c.s.waveTravel=8*v;c.s.waveAlpha=Math.sin(Math.PI*v);});}}}});

  // Cat: distinct facial shapes, one bodily accent, no synchronized nine-way bounce.
  const expression=(values,ms=300)=>async c=>{for(const[k,v]of Object.entries(values))c.to(k,v,'gentle');await c.wait(ms);};
  patch('conversation',{actions:{
    tap:async c=>{c.to('blinkL',.06,'snap');c.to('blinkR',.06,'snap');await c.wait(90);c.to('blinkL',1,'snap');c.to('blinkR',1,'snap');await c.wait(140);},
    select:expression({bodyY:-6,earL:16,earR:16,grin:.4}),
    reply:expression({bodyY:8,tilt:8,talk:.4}),blink:async c=>{c.to('blinkL',.06,'snap');c.to('blinkR',.06,'snap');await c.wait(120);c.to('blinkL',1,'snap');c.to('blinkR',1,'snap');await c.wait(140);},
    wink:expression({blinkR:.06,grin:.8,tilt:-15}),
    happy:async c=>{c.to('joy',1,'gentle');c.to('soft',1,'gentle');c.to('blush',1,'fade');c.to('bodyY',-12,'snap');await c.wait(120);c.to('bodyY',2,'snap');c.to('squash',.84,'impact');await c.wait(180);},
    squeeze:expression({cross:1,soft:1,blush:1,earL:-18,earR:-18,whisk:1.2}),
    surprised:expression({squash:1.15,eyeScale:1.55,talk:1,bodyY:-8,earL:16,earR:16},220),
    curious:expression({tilt:-15,gazeX:-3,gazeY:-2,earL:-7,earR:11}),
    shy:expression({blush:1,soft:.6,gazeY:2,tilt:7,earL:-16,earR:-16},380),
    blank:expression({flat:1,earL:-16,earR:-16,tail:6}),
    sad:expression({cry:1,frown:1,earL:-20,earR:-20,bodyY:6,tail:18},420),
    wiggle:async c=>{c.to('joy',.7,'gentle');for(const a of [-15,15,-8]){c.to('tilt',a,'snap');await c.wait(110);}},
    pounce:async c=>{c.to('squash',.84,'snap');c.to('bodyY',4,'snap');await c.wait(80);c.to('bodyY',-14,'snap');c.to('squash',1.15,'gentle');await c.wait(140);c.to('bodyY',0,'snap');c.to('squash',.84,'impact');await c.wait(130);},
    talking:{loop:true,run(c){c.claim('talk');c.loop(t=>{const envelope=Math.min(1,t*4);c.s.talk=envelope*(.15+.7*Math.max(0,Math.sin(t*12))*Math.max(.4,Math.sin(t*2.2)));});}}
  }});
})(window.MotionIcon);

(function(M){
  'use strict';
  const {aroundXY,clamp01,lerpPath}=M.util;
  function patch(name,changes){const old=M.recipes[name];const r={...old,...changes,state:{...old.state,...changes.state},poses:{...old.poses,...changes.poses},actions:{...old.actions}};
    for(const[k,a]of Object.entries(changes.actions||{}))r.actions[k]=typeof a==='function'?{...old.actions[k],run:a}:{...old.actions[k],...a};
    if(changes.afterRender){r.render=(s,p,u)=>{old.render(s,p,u);changes.afterRender(s,p,u);};delete r.afterRender;}M.define(name,r);}
  patch('ai-thinking',{state:{route:0,signal:0},svg:M.recipes['ai-thinking'].svg+'<circle data-part="signal" data-fill cx="60" cy="36" r="3"/>',
    afterRender(s,p){const points=[[60,36],[36,76],[84,84],[60,36]],q=((s.route%3)+3)%3,i=Math.floor(q),v=q-i;
      const x=points[i][0]+(points[i+1][0]-points[i][0])*v,y=points[i][1]+(points[i+1][1]-points[i][1])*v;
      p.signal.setAttribute('cx',x);p.signal.setAttribute('cy',y);p.signal.setAttribute('opacity',clamp01(s.signal));
    },actions:{think:{loop:true,run(c){c.claim('route','signal');c.to('e0',1,'draw');c.to('e1',1,'draw');c.to('e2',1,'draw');c.loop(t=>{c.s.route=t*1.5;c.s.signal=Math.min(1,t*5);});}},
      tap:async c=>{c.to('signal',1,'fade');c.to('route',.4,'gentle');await c.wait(220);},finish:async c=>{c.to('route',3,'gentle');c.to('signal',0,'fade');await c.wait(280);}}});
  patch('printer',{afterRender(s,p){const corner=Math.max(0,Math.min(8,s.corner)),curl=Math.min(1,Math.abs(s.out)/24)*4;
    p.paper.setAttribute('d',`M42 50H78V${82-corner}L${78-corner} 82Q60 ${82+curl} 42 82Z`);
  }});
  patch('screen-recording',{afterRender(s,p){const t=clamp01(s.bar);
    p.dot.setAttribute('d',lerpPath(
      'M60 92C49.33 92 49.33 108 60 108C60 104 60 96 60 92ZM60 92C70.67 92 70.67 108 60 108C60 104 60 96 60 92Z',
      'M52 92C52 92 52 108 52 108C58 108 58 92 52 92ZM62 92C62 92 62 108 62 108C68 108 68 92 62 92Z',t));
  }});
  patch('cart',{state:{basketContact:1},afterRender(s,p){
    p.basket.setAttribute('transform',aroundXY(1/Math.max(.5,s.basketContact),s.basketContact,60,78));
    p.item.setAttribute('transform',`translate(0 ${s.iy}) ${aroundXY(1/1.15,1.15,61,42)}`);
  },actions:{add:async c=>{c.to('io',1,'fade');c.to('iy',-18,'snap');await c.wait(80);c.to('iy',24,'snap');await c.wait(120);c.to('basketContact',.84,'impact');c.to('io',0,'fade');await c.wait(160);}}});
  patch('cloud',{afterRender(s,p){p.arrow.setAttribute('transform',`translate(0 ${s.ay}) ${aroundXY(1,s.dir,60,62)}`);},
    actions:{upload:async c=>{c.to('dir',1,'gentle');c.to('ay',-30,'snap');c.to('ao',0,'fade');await c.wait(280);},download:async c=>{c.to('dir',-1,'gentle');c.to('ay',30,'snap');c.to('ao',0,'fade');await c.wait(280);}}});
  patch('phone',{poses:{answered:{angle:135,y:-10}},actions:{answer:async c=>{c.to('angle',135,'gentle');c.to('y',-10,'gentle');await c.wait(320);},hangup:async c=>{c.to('angle',0,'gentle');c.to('y',0,'snap');await c.wait(320);}}});
  patch('gift',{actions:{shake:async c=>{c.to('tilt',0,{...M.SPRINGS.swing,velocity:180});await c.wait(420);}}});
  patch('usb',{actions:{eject:async c=>{c.to('y',-16,'pop');c.to('dot',0,'fade');await c.wait(280);}}});
  patch('secure-connection',{actions:{establish:async c=>{c.to('gap',-8,'gentle');c.to('wire',1,'draw');await c.wait(300);}}});
  patch('loading',{afterRender(s,p){const k=1+.3*Math.sin(Math.PI*clamp01(s.x/48));p.cap.setAttribute('transform',`translate(${s.x} 0) ${aroundXY(k,1/k,38,60)}`);}});
  patch('ai-tool-call',{afterRender(s,p){const k=1+.25*Math.sin(Math.PI*clamp01(s.tx/56));p.packet.setAttribute('transform',`translate(${s.tx} 0) ${aroundXY(k,1/k,28,60)}`);},actions:{invoke:async c=>{c.to('tx',56,'snap');await c.wait(300);}}});
  patch('ai-queue',{afterRender(s,p){const k=1+.15*Math.sin(Math.PI*clamp01(Math.abs(s.y2)/20));p.c2.setAttribute('transform',`translate(${s.x2} ${s.y2}) ${aroundXY(1/k,k,60,38)}`);},actions:{enqueue:async c=>{c.to('o2',1,'fade');c.to('y2',-20,'snap');await c.wait(100);c.to('y2',0,'gentle');await c.wait(220);}}});
})(window.MotionIcon);

(function(M){
  'use strict';
  const {aroundXY}=M.util;
  const modify=(name,verbs)=>{const r=M.recipes[name];for(const[k,run]of Object.entries(verbs))r.actions[k]={...r.actions[k],run};};
  const move=(key,value)=>async c=>{c.to(key,value,'gentle');await c.wait(280);};
  M.recipes.lock.poses.unlocked={lift:20,shackleTurn:115};
  modify('download',{tap:move('ay',14)});
  modify('bell',{tap:move('swing',16),mute:async c=>{c.to('swing',-16,'snap');c.to('slash',1,'draw');await c.wait(280);},unmute:async c=>{c.to('swing',16,'snap');c.to('slash',0,'draw');await c.wait(280);}});
  modify('voice',{peek:async c=>{c.to('waveTravel',12,'gentle');c.to('waveAlpha',1,'fade');await c.wait(260);},select:async c=>{c.to('waveTravel',12,'gentle');c.to('waveAlpha',1,'fade');await c.wait(260);}});
  modify('clipboard',{copy:async c=>{c.to('go',1,'fade');c.to('gx',14,'gentle');c.to('gy',-14,'gentle');await c.wait(280);},clear:async c=>{c.to('go',1,'fade');c.to('gx',14,'gentle');c.to('draw',0,'draw');await c.wait(280);}});
  modify('storage',{full:async c=>{c.to('ripple',1,'gentle');c.to('level',1,'gentle');await c.wait(300);}});
  modify('server',{offline:async c=>{c.to('drawer',-14,'gentle');c.to('dim',.3,'fade');await c.wait(300);}});
  modify('mail',{archive:async c=>{c.to('drop',20,'gentle');await c.wait(280);}});
  modify('check',{draw:async c=>{c.to('box',.84,'gentle');c.to('draw',1,'draw');await c.wait(280);},undo:async c=>{c.to('box',.84,'gentle');c.to('draw',0,'draw');await c.wait(280);}});
  modify('shield',{verified:async c=>{c.to('bulge',1,'gentle');c.to('draw',1,'draw');await c.wait(280);}});
  modify('passcode',{verify:async c=>{c.to('dy',-14,'snap');c.to('ok',1,'draw');await c.wait(280);}});
  modify('two-factor',{verify:async c=>{c.to('by',-14,'gentle');c.to('code',1,'draw');c.to('bScale',1,'gentle');await c.wait(280);}});
  modify('ai-tool-call',{connect:async c=>{c.to('tx',18,'gentle');c.to('wire',1,'draw');await c.wait(280);}});
  modify('ai-agent',{activate:async c=>{c.to('head',1.2,'gentle');c.to('halo',1,'fade');await c.wait(280);},stop:async c=>{c.to('head',.8,'gentle');c.to('halo',0,'fade');await c.wait(280);}});
  // Departure and contact are local to paper, not a whole-row/whole-icon squeeze.
  const q=M.recipes['ai-queue'],render=q.render;
  q.state.slotContact=1;
  q.render=(s,p,u)=>{render(s,p,u);p.slot.setAttribute('transform',aroundXY(1/Math.max(.5,s.slotContact),s.slotContact,60,100));};
  const process=q.actions.process.run;
  q.actions.process={...q.actions.process,async run(c){c.to('slotContact',.84,'snap');await process(c);}};
})(window.MotionIcon);

/* Semantic colour and planar composition. Colour describes a state, never decoration.
 * Genuine front/back turns remain on pay.flip and book.turn; other subjects stay legible. */
(function (M) {
  'use strict';
  const {clamp01, around, aroundXY} = M.util;
  const attr = (p,k,v) => p.setAttribute(k,v);
  function patch(name, changes) {
    const old=M.recipes[name];
    const recipe={...old,...changes,state:{...old.state,...changes.state},poses:{...old.poses,...changes.poses},actions:{...old.actions}};
    for(const [verb,a] of Object.entries(changes.actions||{})) recipe.actions[verb]=typeof a==='function'?{...old.actions[verb],run:a}:{...old.actions[verb],...a};
    if(changes.afterRender){recipe.render=(s,p,u)=>{old.render(s,p,u);changes.afterRender(s,p,u);};delete recipe.afterRender;}
    M.define(name,recipe);
  }
  if (typeof document !== 'undefined' && !document.querySelector('[data-mi-palette]')) {
    const style=document.createElement('style');style.dataset.miPalette='';
    style.textContent=`
      :root{--mi-connected:#0867d1;--mi-success:#218348;--mi-favourite:#aa6700;--mi-warning:#ab6500;--mi-recording:#d82d3d}
      @media(prefers-color-scheme:dark){:root:not([data-theme=light]){--mi-connected:#62abff;--mi-success:#63d58a;--mi-favourite:#ffd15c;--mi-warning:#ffc35c;--mi-recording:#ff6874}}
      :root[data-theme=dark]{--mi-connected:#62abff;--mi-success:#63d58a;--mi-favourite:#ffd15c;--mi-warning:#ffc35c;--mi-recording:#ff6874}
      [data-mi-color=mono] .mi,.mi[data-mi-color=mono]{color:inherit!important}
      [data-mi-color=mono] .mi svg [data-part],.mi[data-mi-color=mono] svg [data-part]{color:inherit!important}
      [data-mi-color=mono] .mi--heart [data-part=fill],.mi--heart[data-mi-color=mono] [data-part=fill]{fill:currentColor!important}
      .mi.is-error{color:var(--mi-error,#ff3b30)!important}
      .mi.is-error svg [data-part]{color:inherit!important}
      @media(forced-colors:active){.mi svg [data-part]{color:inherit!important}}
    `;document.head.appendChild(style);
  }
  function ink(part, role, amount=1) {
    if(!part)return;
    const t=clamp01(amount);
    part.style.color=t===0?'inherit':`color-mix(in srgb, currentColor ${100*(1-t)}%, var(--mi-${role}) ${100*t}%)`;
  }
  // Stable colour follows the same numeric pose values as geometry; it also works
  // during scrubbing, interruption and reduced motion. Never set colour once in an action.
  patch('bluetooth',{afterRender(s,p){ink(p.rune,'connected',s.dot);ink(p.dot,'connected');}});
  patch('wifi',{afterRender(s,p){ink(p.body,'connected',s.a3*(1-s.slash));}});
  patch('star',{afterRender(s,p){ink(p.body,'favourite',s.fill);attr(p.body,'transform',`rotate(${s.starTurn} 60 60)`);},actions:{
    tap:async c=>{c.to('starTurn',8,'gentle');await c.wait(210);},
    favourite:async c=>{c.to('fill',1,'fade');c.to('starTurn',8,'gentle');await c.wait(260);},
    unfavourite:async c=>{c.to('fill',0,'fade');c.to('starTurn',-6,'gentle');await c.wait(240);},
    highlight:async c=>{c.to('fill',1,'fade');await c.wait(280);}
  }});
  patch('bookmark',{afterRender(s,p){ink(p.body,'connected',s.fill);}});
  patch('permission',{afterRender(s,p){ink(p.track,'success',s.x/36);ink(p.knob,'success',s.x/36);}});
  patch('warning',{afterRender(s,p){ink(p.body,'warning');}});
  patch('check',{afterRender(s,p){ink(p.tick||p.body,'success',s.tick??1);}});
  patch('screen-recording',{afterRender(s,p){ink(p.dot,s.bar>.5?'warning':'recording',clamp01((s.dot-.35)/.65));}});
  patch('cloud',{afterRender(s,p){ink(p.tick,'success',s.mark);}});
  patch('server',{afterRender(s,p){for(let i=0;i<3;i++)ink(p['l'+i],'success',s['l'+i]);}});
  patch('shield',{afterRender(s,p){ink(p.tick||p.plate,'success',s.tick??0);}});
  patch('calendar',{afterRender(s,p){ink(p.dot,'connected',s.dot);}});
  patch('milestone',{afterRender(s,p){ink(p.seal,'success',s.check);}});

  // Actual occlusion, not paper-coloured paint. A transparent host must remain transparent.
  // Each instance gets independent defs. Masks are outside moving parts, in their parent's coordinates.
  let serial=0;
  const layers=new WeakMap();
  function mask(part, key, cut) {
    let map=layers.get(part.ownerSVGElement);
    if(!map){map={};layers.set(part.ownerSVGElement,map);}
    if(map[key])return map[key];
    const doc=part.ownerDocument, ns='http://www.w3.org/2000/svg';
    const defs=doc.createElementNS(ns,'defs'), m=doc.createElementNS(ns,'mask');
    const id='mi-layer-'+(++serial);m.id=id;
    for(const [k,v]of Object.entries({maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:-100,y:-100,width:320,height:320}))attr(m,k,v);
    const white=doc.createElementNS(ns,'rect');
    for(const [k,v]of Object.entries({x:-100,y:-100,width:320,height:320}))attr(white,k,v);
    white.style.cssText='fill:white;stroke:none';m.appendChild(white);
    const black=doc.createElementNS(ns,cut.tag||'rect');
    for(const [k,v]of Object.entries(cut))if(k!=='tag')attr(black,k,v);
    black.style.cssText='fill:black;stroke:none';m.appendChild(black);defs.appendChild(m);
    part.ownerSVGElement.insertBefore(defs,part.ownerSVGElement.firstChild);
    const wrapper=doc.createElementNS(ns,'g');attr(wrapper,'mask',`url(#${id})`);
    part.parentNode.insertBefore(wrapper,part);wrapper.appendChild(part);
    return map[key]=black;
  }
  // Back lid → inserted paper → front wall. Paper disappears into the pocket rather than drawing on it.
  for(const[name,part,front,y]of [['folder','sheet','pocket',52],['archive','file','box',60],['wallet','card','purse',50],['mail','letter','body2',42]]){
    patch(name,{afterRender(s,p){
      mask(p[part],name+'-pocket',{x:12,y,width:96,height:120});
      const frontPart=p[front];if(frontPart!==frontPart.parentNode.lastElementChild)frontPart.parentNode.appendChild(frontPart);
    }});
  }
  for(const[name,rect]of [['cards',{x:30,y:35,width:63,height:62,rx:11}],['copy',{x:26,y:40,width:48,height:58,rx:8}]]){
    patch(name,{afterRender(s,p){const cut=mask(p.back,name+'-front',rect);attr(cut,'transform',p.front.getAttribute('transform')||'');}});
  }
  patch('book',{afterRender(s,p){
    attr(p.cover,'transform','');attr(p.leaf,'transform','');
    const cut=mask(p.lines,'turning-page',{tag:'path',d:p.turning.getAttribute('d')});
    attr(cut,'d',p.turning.getAttribute('d'));attr(cut,'opacity',clamp01(s.leafOpacity)*clamp01(s.opening));
  }});
  patch('recall',{afterRender(s,p){
    // Revealing an answer is a flat slide, not a reverse-facing question mark.
    const opening=clamp01(s.opening);
    attr(p.flap,'transform',`translate(0 ${-44*opening})`);attr(p.flap,'opacity',1-opening);
    const cut=mask(p.answer,'recall-cover',{x:24,y:34,width:72,height:46,rx:8});
    attr(cut,'transform',p.flap.getAttribute('transform'));attr(cut,'opacity',1-opening);
  }});

  patch('battery',{afterRender(s,p){
    ink(p.fill,s.low>.5||s.fill<.2?'recording':s.bolt>.05||s.fill>.97?'success':'connected',s.low>.5||s.fill<.2||s.bolt>.05||s.fill>.97?1:0);
    ink(p.bolt,'success');
    // Cut a matching lightning silhouette out of the level, so the two never merge into a blob.
    const cut=mask(p.fill,'charging-bolt',{tag:'path',d:'M62 48L50 62H60L54 76L72 58H60Z'});
    attr(cut,'transform',p.bolt.getAttribute('transform'));
    cut.style.stroke='black';cut.style.strokeWidth='9';cut.style.strokeLinejoin='round';attr(cut,'opacity',clamp01(s.bolt));
    p.bolt.querySelector('path').style.cssText='fill:currentColor;stroke:none';
  }});

  // Planar meanings: translation, local path changes, ordinary 2D rotation.
  patch('copy',{afterRender(s,p){attr(p.front,'transform',`translate(${s.fx} ${s.fy})`);
    // Update after the final front transform, not the earlier perspective render.
    attr(mask(p.back,'copy-front',{x:26,y:40,width:48,height:58,rx:8}),'transform',p.front.getAttribute('transform'));}});
  patch('link',{afterRender(s,p){attr(p.a,'transform',`translate(${-s.gap} 0)`);attr(p.b,'transform',`translate(${s.gap} 0)`);}});
  patch('key',{afterRender(s,p){attr(p.key,'transform',`translate(${s.x} 0) rotate(${s.turn} 96 60)`);}});
  patch('two-factor',{afterRender(s,p){attr(p.badge,'transform',`translate(0 ${s.by})`);}});
  patch('ai-browsing',{afterRender(s,p){attr(p.window,'transform',around(s.z,60,60));}});
  patch('ai-agent',{afterRender(s,p){attr(p.head,'transform',around(s.head,60,42));}});
  patch('video-call',{afterRender(s,p){attr(p.cam,'transform',`translate(${s.x} 0)`);}});
  patch('send',{afterRender(s,p){attr(p.plane,'transform',`translate(${s.px} ${s.py}) rotate(${s.prot} 60 60) ${around(s.pscale)}`);}});
  patch('lexicon',{afterRender(s,p){attr(p.bookmark,'transform',`translate(0 ${-12*(1-s.mark)})`);}});
  patch('memory',{afterRender(s,p){attr(p.frame,'transform',`translate(0 ${s.frameY}) rotate(${s.frameAngle} 60 93)`);}});
  patch('pencil',{afterRender(s,p){attr(p.pen,'transform',`translate(${s.penX} ${s.penY}) rotate(${s.angle} 43 85)`);}});
  patch('milestone',{afterRender(s,p){attr(p.page,'transform',`translate(0 ${s.pageY}) rotate(${s.pageTurn*.08+s.pageAngle} 36 79)`);}});
  patch('cards',{afterRender(s,p){attr(p.front,'transform',`translate(${s.frontX} ${s.frontY}) rotate(${s.tilt} 61 97)`);
    attr(mask(p.back,'cards-front',{x:30,y:35,width:63,height:62,rx:11}),'transform',p.front.getAttribute('transform'));},actions:{
    remember:async c=>{c.to('frontY',-14,'gentle');c.to('tilt',-8,'gentle');await c.wait(280);}
  }});
  for(const[name,part,key]of [['folder','lid','lid'],['archive','lid','lid'],['wallet','flap','flap'],['gift','lid','lid']]){
    patch(name,{afterRender(s,p){const lift=name==='gift'?s.ly:name==='wallet'?s.fy:0;
      attr(p[part],'transform',`translate(0 ${s[key]*.45+lift})`);attr(p[part],'opacity',1);}});
  }
  patch('mail',{afterRender(s,p){const t=clamp01(1-s.flap);
    attr(p.flap,'d',`M22 42L60 ${68-48*t}L98 42`);attr(p.flap,'transform','');attr(p.flap,'opacity',1);}});
  patch('delete',{afterRender(s,p){attr(p.lid,'transform',`translate(0 ${s.lidY}) rotate(${s.lidRot} 60 32)`);}});
  patch('calendar',{afterRender(s,p){attr(p.page,'transform',`translate(0 ${-44*clamp01(s.leaf)})`);attr(p.page,'opacity',s.pageOn*(1-clamp01(s.leaf)));}});
  patch('camera',{afterRender(s,p){attr(p.body,'transform','');attr(p.lens,'cx',60);attr(p.blade,'cx',60);
    attr(p.lens,'transform',around(s.lens,60,68));attr(p.blade,'transform',aroundXY(1,Math.max(.05,s.blade),60,68));},actions:{
    switchCamera:async c=>{c.to('lens',.55,'gentle');c.to('blade',.2,'gentle');await c.wait(120);c.to('lens',1,'gentle');c.to('blade',1,'gentle');await c.wait(200);}
  }});
  patch('ai-generating',{afterRender(s,p){const t=clamp01(s.assemble);
    for(let i=0;i<4;i++){const x=i%2?72:48,y=i<2?48:72;
      attr(p['p'+i],'transform',`translate(${(i%2?1:-1)*16*t} ${(i<2?-1:1)*16*t}) rotate(${(i%2?1:-1)*18*t+(i===0?s.refineTurn*.1:0)} ${x} ${y}) ${around(s['k'+i],x,y)}`);}}});
})(window.MotionIcon);

(function(M){
  function colour(name, paint){const r=M.recipes[name],old=r.render;M.define(name,{...r,render(s,p,u){old(s,p,u);paint(s,p);}});}
  const ink=(p,role,t=1)=>{if(p)p.style.color=`color-mix(in srgb, currentColor ${100*(1-Math.max(0,Math.min(1,t)))}%, var(--mi-${role}) ${100*Math.max(0,Math.min(1,t))}%)`;};
  colour('bluetooth',(s,p)=>ink(p.rune,'connected',s.stem*(1-s.slash)));
  colour('check',(s,p)=>ink(p.tick||p.body,'success',s.draw));
  colour('error',(s,p)=>ink(p.body,'recording',1-s.retryMorph));
  colour('shield',(s,p)=>ink(p.tick||p.plate,'success',s.draw));
  colour('power',(s,p)=>ink(p.body,'success',-s.stem/12));
  colour('cellular',(s,p)=>ink(p.body,'connected',s.b3));
  colour('hotspot',(s,p)=>ink(p.body,'connected',s.r2));
  colour('usb',(s,p)=>ink(p.dot,'success',s.dot));
  colour('secure-connection',(s,p)=>ink(p.body,'success',s.lock*s.wire));
  colour('ai-agent',(s,p)=>ink(p.halo,'connected',s.halo));
  const lock=M.recipes.lock,render=lock.render;
  M.define('lock',{...lock,render(s,p,u){render(s,p,u);p.shackle.setAttribute('transform',`translate(0 ${46*(1-s.squash)-s.lift}) rotate(${-s.shackleTurn*.3} 42 53)`);}});
})(window.MotionIcon);
