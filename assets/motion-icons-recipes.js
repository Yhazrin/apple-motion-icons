/*!
 * motion-icons-recipes.js — built-in icons for motion-icons.js.
 * Every icon has its own vocabulary of poses, actions, loops and drives.
 * Copy the icon whose subject moves most like yours when designing a new one.
 *
 * Glyph grid: 120 × 120, centre (60, 60), live area 14–106. Strokes inherit the
 * engine's optical weight; never hard-code stroke-width.
 */
(function (root) {
  'use strict';
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
      tap: {label: '点按', run: c => c.nudge('lift', c.pose === 'locked' ? 3 : -5)},
      lock: {label: '上锁', pose: 'locked', from: 'unlocked', async run(c) {
        c.to('lift', 0, 'snap');                    // shackle drops in
        await c.wait(110);
        c.squash('squash', 0.9);                    // body takes the hit
        await c.wait(260);
      }},
      unlock: {label: '解锁', pose: 'unlocked', from: 'locked', async run(c) {
        c.to('lift', 16, 'pop', 160);               // springs up past its rest height
        await c.wait(340);
      }},
      jiggle: {label: '拽一下', from: 'locked', async run(c) {
        c.to('lift', 5, 'pop', 220);
        c.to('tilt', 0, {stiffness: 700, damping: 14, velocity: 90});
        await c.wait(120);
        c.to('lift', 0, 'snap');
        await c.wait(380);
      }},
      deny: {label: '拒绝', from: 'locked', async run(c) {
        // locked: tries to open and stays stuck; unlocked: tries to close and bounces back out
        const home = c.goal('lift');
        c.error();
        c.to('lift', home === 0 ? 5 : 6, home === 0 ? 'pop' : 'snap', home === 0 ? 220 : undefined);
        await Promise.all([c.shake(), c.wait(120).then(() => c.to('lift', home, home === 0 ? 'snap' : 'pop'))]);
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
        await Promise.all([c.to('rot', Math.round(c.s.rot / 360) * 360 - 30, 'pop'), c.shake()]);
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
        c.nudge('tilt', -4);
        await c.nudge('cx', 6, 110);
      }},
      contactless: {label: '感应', async run(c) {
        c.to('cx', 6, 'snap'); c.to('tilt', -4, 'snap');   // card moves to the reader
        c.set({w1: 0, w2: 0, w3: 0});
        for (const w of WAVES) { c.to(w, 1, 'pop'); await c.wait(70); }
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
        c.to('cy', 0, 'pop');
        await c.wait(300);
      }},
      approve: {label: '支付成功', async run(c) {
        c.to('cx', 6, 'snap');
        for (const w of WAVES) c.to(w, 1, 'fade');
        await c.wait(120);
        c.to('cx', 0, 'rebound');
        for (const w of WAVES) c.to(w, 0, 'fade');
        await c.wait(120);
        await c.confirm();
      }},
      decline: {label: '被拒绝', async run(c) {
        c.error();
        for (const w of WAVES) c.to(w, 0.25, 'fade');
        c.to('cx', -6, 'pop');
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
        c.to('ax', 8, 'pop'); await c.wait(140);
      }},
      knock: {label: '敲门', async run(c) {
        for (let i = 0; i < 2; i++) {
          c.to('ax', 7, 'impact'); await c.wait(70);
          c.to('ax', 0, 'rebound'); c.squash('door', 0.92);
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
        c.squash('door', 0.9);
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
      tap: {label: '点按', run: c => c.nudge('ay', 8)},
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
        c.squash('tray', 0.86);
        c.to('aSquash', 0.8, 'impact');
        c.to('aOpacity', 0, 'fade');
        c.to('bar', 1, 'gentle');
        await c.wait(260);
        c.set({ay: -26, aSquash: 1, aOpacity: 0});    // a fresh arrow falls in from the top
      }},
      cancel: {label: '取消', async run(c) {
        c.to('ay', -16, 'pop', -120);
        c.to('aOpacity', 0, 'fade');
        c.to('bar', 0, 'exit');
        await c.wait(220);
        c.set({ay: -20, aOpacity: 0});
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('ay', -8, 'pop', -120);
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
        c.nudge('px', -4, 110); c.nudge('py', 4, 110);
        await c.nudge('prot', -6, 110);
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
        c.to('prot', 0, 'pop');
        await c.wait(200);
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('prot', 14, 'impact'); c.to('py', 8, 'impact');   // nose-dives
        await c.wait(120);
        c.to('prot', 0, 'rebound'); c.to('py', 0, 'rebound');
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
        c.to('lidRot', c.goal('lidRot') - 16, 'pop'); c.to('lidY', c.goal('lidY') - 4, 'pop');
        await c.wait(160);
      }},
      hover: {label: '等待', loop: true, run(c) {
        c.claim('lidRot', 'lidY');
        c.loop(t => { const w = wave(t, 1.3); c.s.lidRot = -6 * w; c.s.lidY = -2 * w; });
      }},
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('lidRot', -28, 'pop'); c.to('lidY', -6, 'pop');
        await c.wait(260);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        const slam = {stiffness: 900, damping: 30};
        c.to('lidRot', 0, slam); c.to('lidY', 0, slam);
        await c.wait(90);
        c.squash('can', 0.92);
        await c.wait(200);
      }},
      trash: {label: '丢进去', pose: 'closed', async run(c) {
        c.to('lidRot', -30, 'pop'); c.to('lidY', -6, 'pop');
        c.set({itemY: -14, itemRot: -10, itemOpacity: 0});
        c.to('itemOpacity', 1, 'fade'); c.to('itemY', -4, 'gentle');
        await c.wait(170);
        c.to('itemY', 52, {stiffness: 260, damping: 22}); c.to('itemRot', 10, 'gentle');   // falls in
        await c.wait(170);
        c.to('itemOpacity', 0, 'fade');
        const slam = {stiffness: 900, damping: 30};
        c.to('lidRot', 0, slam); c.to('lidY', 0, slam);
        await c.wait(90);
        c.squash('can', 0.9);
        await c.wait(240);
      }},
      restore: {label: '恢复', pose: 'closed', async run(c) {
        c.to('lidRot', -30, 'pop'); c.to('lidY', -6, 'pop');
        c.set({itemY: 48, itemRot: 8, itemOpacity: 0});
        await c.wait(80);
        c.to('itemOpacity', 1, 'fade'); c.to('itemY', -8, 'pop'); c.to('itemRot', 0, 'gentle');   // pops back out
        await c.wait(320);
        c.to('lidRot', 0, 'snap'); c.to('lidY', 0, 'snap');
        c.to('itemY', -22, 'exit'); c.to('itemOpacity', 0, 'fade');
        await c.wait(260);
      }},
      fail: {label: '失败', async run(c) {
        c.error();
        c.to('lidRot', -8, 'pop');
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
        c.to('hs', 1, {...S.pop, velocity: 3});
        c.to('fill', 1, 'pop');
        c.set({burst: 0, burstOpacity: 1});
        c.to('burst', 1, {stiffness: 120, damping: 18});
        await c.wait(160);
        await c.to('burstOpacity', 0, 'fade');
      }},
      unlike: {label: '取消', pose: 'off', from: 'on', async run(c) {
        c.squash('hs', 0.9);
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
        c.to('m2', 1, 'pop'); await c.wait(260);
      }},
      toMenu: {label: '变菜单', pose: 'menu', from: 'close', async run(c) {
        c.to('b', 0, 'snap');
        c.to('m2', 0, 'snap'); await c.wait(90);
        c.to('m1', 0, 'pop'); await c.wait(260);
      }},
      toBack: {label: '变返回', pose: 'back', from: 'menu', async run(c) {
        c.to('m2', 0, 'snap'); c.to('m1', 0, 'snap');
        c.to('b', 1, 'pop'); await c.wait(300);
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
        c.to('badge', 1, {...S.pop, velocity: 6});
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
        c.squash('sq', 0.86);
        c.to('m', 1, {stiffness: 380, damping: 28});
        await c.wait(320);
      }},
      pause: {label: '暂停', pose: 'paused', from: 'playing', async run(c) {
        c.squash('sq', 0.86);
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
      tap: {label: '点按', run: async c => { c.squash('cone', 0.9); await c.wait(200); }},
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
        c.squash('cone', 0.9);
        await c.wait(120);
        c.to('x', 1, 'pop');
        await c.wait(260);
      }},
      unmute: {label: '取消静音', pose: 'on', from: 'muted', async run(c) {
        c.to('x', 0, 'exit');
        await c.wait(80);
        c.to('level', c.goal('level'), 'pop');
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
        c.to('open', 1, 'pop');
        await c.wait(220);
      }},
      look: {label: '左右看', async run(c) {
        c.to('lookX', -9, 'snap'); await c.wait(300);
        c.to('lookX', 9, {stiffness: 380, damping: 28}); await c.wait(340);
      }},
      focus: {label: '聚焦', async run(c) {
        c.to('pupil', 1.3, 'pop'); await c.wait(260);
      }},
      hide: {label: '隐藏', pose: 'hidden', from: 'visible', async run(c) {
        c.to('open', 0.5, 'snap');
        c.to('slash', 1, 'draw');
        await c.wait(120);
        c.to('open', 1, 'pop');
        await c.wait(300);
      }},
      show: {label: '显示', pose: 'visible', from: 'hidden', async run(c) {
        c.to('slash', 0, 'draw');
        c.to('open', 0.5, 'snap');
        await c.wait(100);
        c.to('open', 1, 'pop');
        await c.wait(300);
      }}
    },
    toggle: ['hide', 'show']
  });
})(typeof window !== 'undefined' ? window : globalThis);
