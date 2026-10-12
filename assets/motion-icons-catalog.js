/* Catalog recipes. Loaded after motion-icons-learning.js. Defines subjects only. */
(function (M) {
  'use strict';
  const {around, aroundXY, clamp01, arc, polar, wave} = M.util;
  const dash = (part, length, progress) => {
    const value = Math.max(0, Math.min(1, progress));
    part.setAttribute('stroke-dasharray', `${length * value} ${length + 1}`);
    part.setAttribute('opacity', clamp01(value * 8));
  };
  const op = (part, value) => part.setAttribute('opacity', clamp01(value));
  const tapSq = (label = '点按') => ({label, async run(c) {
    c.to('sq', 0.94, 'impact');
    await c.wait(90);
    c.to('sq', c.goal('sq'), 'rebound');
    await c.wait(100);
  }});
  function add(name, svg, state, poses, render, actions, extra) {
    M.define(name, Object.assign({
      svg: `<g data-part="body">${svg}</g>`,
      state: Object.assign({sq: 1}, state),
      poses,
      render(s, p) {
        p.body.setAttribute('transform', around(s.sq));
        render(s, p);
      },
      actions
    }, extra || {}));
  }
  const bodyAt = (p, s, cx, cy) => {
    p.body.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.42, s.sq, cx, cy));
  };

  add('wifi',
    `<circle data-part="dot" data-fill cx="60" cy="96" r="5"/>
<path data-part="a1" d="${arc(60, 92, 18, 208, 332)}"/>
<path data-part="a2" d="${arc(60, 92, 32, 208, 332)}"/>
<path data-part="a3" d="${arc(60, 92, 46, 206, 334)}"/>
<path data-part="slash" d="M34 36L88 90"/>`,
    {a1: 1, a2: 1, a3: 1, spread: 0, slash: 0, tilt: 0},
    {connected: {}, weak: {a2: 0, a3: 0}, off: {a1: 0, a2: 0, a3: 0, slash: 1}},
    (s, p) => {
      p.body.setAttribute('transform', `rotate(${s.tilt} 60 80) ${around(s.sq)}`);
      op(p.dot, 1 - s.slash * 0.65);
      [1, 2, 3].forEach(i => {
        const part = p['a' + i];
        const v = clamp01(s['a' + i]);
        op(part, v);
        part.setAttribute('transform', `translate(0 ${(-s.spread * i).toFixed(2)}) ${around(0.64 + 0.36 * v, 60, 92)}`);
      });
      dash(p.slash, 78, s.slash);
    },
    {
      tap: tapSq('点按'),
      search: {label: '搜索', async run(c) {
        c.to('spread', 8, 'snap');
        c.to('a3', 0, 'snap');
        await c.wait(80);
        c.to('a1', 1, 'pop');
        await c.wait(70);
        c.to('a2', 1, 'pop');
        c.to('a3', 1, 'pop');
        c.to('spread', 0, 'pop');
        await c.wait(160);
      }},
      searching: {label: '搜索中', loop: true, run(c) {
        c.claim('a1', 'a2', 'a3', 'spread');
        c.loop(t => {
          const phase = (t * 1.05) % 3;
          c.s.a1 = clamp01(1.15 - Math.abs(phase));
          c.s.a2 = clamp01(1.15 - Math.abs(phase - 1));
          c.s.a3 = clamp01(1.15 - Math.abs(phase - 2));
          c.s.spread = 8 * Math.sin(t * Math.PI * 2 * 0.75);
        });
      }},
      connect: {label: '连接', pose: 'connected', from: 'off', async run(c) {
        c.to('slash', 0, 'fade');
        c.to('a1', 1, 'pop');
        await c.wait(70);
        c.to('a2', 1, 'pop');
        await c.wait(70);
        c.to('a3', 1, 'pop');
        c.to('spread', 7, 'pop');
        await c.wait(160);
      }},
      disconnect: {label: '断开', pose: 'off', from: 'connected', async run(c) {
        c.to('a3', 0, 'snap');
        c.to('tilt', -8, 'snap');
        await c.wait(70);
        c.to('a2', 0, 'snap');
        c.to('a1', 0, 'snap');
        c.to('slash', 1, 'draw');
        await c.wait(160);
      }},
      reconnect: {label: '重新连接', pose: 'connected', from: 'off', async run(c) {
        c.to('slash', 0, 'exit');
        c.to('spread', -4, 'snap');
        await c.wait(70);
        c.to('a1', 1, 'pop');
        await c.wait(60);
        c.to('a2', 1, 'pop');
        c.to('a3', 1, 'pop');
        c.to('spread', 6, 'rebound');
        await c.wait(160);
      }},
      loseSignal: {label: '信号丢失', pose: 'weak', from: 'connected', async run(c) {
        c.to('tilt', 10, 'snap');
        c.to('a3', 0, 'snap');
        c.to('spread', 8, 'snap');
        await c.wait(100);
        c.to('a2', 0, 'pop');
        c.to('tilt', -4, 'rebound');
        await c.wait(160);
      }},
      signal: {label: '信号', drive(c, v) {
        c.to('slash', 0, 'track');
        c.to('a1', v >= 0.08 ? 1 : 0, 'track');
        c.to('a2', v >= 0.4 ? 1 : 0, 'track');
        c.to('a3', v >= 0.72 ? 1 : 0, 'track');
      }}
    });

  add('bluetooth',
    `<g data-part="rune">
<path data-part="stem" d="M60 20V100"/>
<path data-part="up" d="M60 20L86 46L60 60"/>
<path data-part="dn" d="M60 60L86 84L60 100"/>
<path data-part="side" d="M38 46L60 60L38 84"/>
</g>
<circle data-part="dot" data-fill cx="92" cy="86" r="5"/>
<path data-part="slash" d="M30 30L90 90"/>`,
    {stem: 1, up: 1, dn: 1, side: 1, slash: 0, dot: 0, nudge: 0},
    {on: {}, off: {stem: 0, up: 0, dn: 0, side: 0, slash: 1}, connected: {dot: 1}},
    (s, p) => {
      p.rune.setAttribute('transform', `translate(${s.nudge} 0)`);
      op(p.stem, s.stem); op(p.up, s.up); op(p.dn, s.dn); op(p.side, s.side);
      op(p.dot, s.dot);
      p.dot.setAttribute('transform', around(0.4 + 0.6 * clamp01(s.dot), 92, 86));
      dash(p.slash, 86, s.slash);
    },
    {
      tap: tapSq('点按'),
      enable: {label: '打开', pose: 'on', from: 'off', async run(c) {
        c.to('slash', 0, 'fade');
        c.to('stem', 1, 'pop');
        c.to('nudge', -16, 'snap');
        await c.wait(80);
        c.to('up', 1, 'pop');
        c.to('side', 1, 'pop');
        await c.wait(70);
        c.to('dn', 1, 'pop');
        c.to('nudge', 0, 'rebound');
        await c.wait(160);
      }},
      disable: {label: '关闭', pose: 'off', from: 'on', async run(c) {
        c.to('nudge', 14, 'snap');
        c.to('dn', 0, 'fade');
        await c.wait(60);
        c.to('up', 0, 'fade');
        c.to('side', 0, 'fade');
        c.to('stem', 0, 'fade');
        c.to('slash', 1, 'draw');
        await c.wait(160);
      }},
      pair: {label: '配对', async run(c) {
        c.to('stem', 0.2, 'snap');
        c.to('up', 0.2, 'snap');
        c.to('dn', 0.2, 'snap');
        c.to('side', 0.2, 'snap');
        await c.wait(50);
        c.to('stem', 1, 'pop');
        c.to('nudge', -18, 'snap');
        await c.wait(80);
        c.to('up', 1, 'pop');
        c.to('nudge', 18, 'pop');
        await c.wait(80);
        c.to('side', 1, 'pop');
        await c.wait(70);
        c.to('dn', 1, 'pop');
        c.to('nudge', 0, 'rebound');
        await c.wait(150);
      }},
      pairing: {label: '配对中', loop: true, run(c) {
        c.claim('stem', 'up', 'dn', 'side', 'nudge');
        c.loop(t => {
          const phase = (t * 1.15) % 4;
          const glow = i => clamp01(1.15 - Math.min(Math.abs(phase - i), 4 - Math.abs(phase - i)));
          c.s.stem = 0.2 + 0.8 * glow(0);
          c.s.up = 0.2 + 0.8 * glow(1);
          c.s.side = 0.2 + 0.8 * glow(2);
          c.s.dn = 0.2 + 0.8 * glow(3);
          c.s.nudge = 16 * Math.sin(t * Math.PI * 2 * 0.8);
        });
      }},
      connect: {label: '连上', pose: 'connected', from: 'on', async run(c) {
        c.to('nudge', -10, 'snap');
        c.to('dot', 1, 'pop');
        await c.wait(90);
        c.to('nudge', 0, 'rebound');
        await c.wait(150);
      }},
      disconnect: {label: '断开', pose: 'on', from: 'connected', async run(c) {
        c.to('dot', 0, 'fade');
        c.to('nudge', 16, 'snap');
        await c.wait(120);
        c.to('nudge', 0, 'rebound');
        await c.wait(140);
      }}
    });

  add('cloud',
    `<path data-part="cloud" d="M34 80h48a14 14 0 0 0 3-28 20 20 0 0 0-38-6 16 16 0 0 0-13 34z"/>
<g data-part="arrow"><path d="M60 76V52"/><path d="M48 62L60 48L72 62"/></g>
<path data-part="tick" d="M48 66L58 76L76 56"/>
<path data-part="slash" d="M32 42L90 86"/>`,
    {ay: 0, ao: 1, dir: 1, mark: 0, slash: 0},
    {idle: {}, synced: {ao: 0, mark: 1}, offline: {ao: 0, slash: 1}},
    (s, p) => {
      p.arrow.setAttribute('transform', `translate(0 ${s.ay}) ${aroundXY(1, s.dir, 60, 62)}`);
      op(p.arrow, s.ao);
      dash(p.tick, 42, s.mark);
      dash(p.slash, 86, s.slash);
    },
    {
      tap: tapSq('点按'),
      upload: {label: '上传', async run(c) {
        c.to('ay', 12, 'snap');
        await c.wait(80);
        c.to('ay', -34, 'pop');
        await c.wait(150);
        c.to('ao', 0, 'fade');
        await c.wait(90);
        c.set({ay: 18, ao: 0});
      }},
      download: {label: '下载', async run(c) {
        c.to('dir', -1, 'snap');
        c.to('ay', -10, 'snap');
        await c.wait(90);
        c.to('ay', 28, 'pop');
        await c.wait(150);
        c.to('ao', 0, 'fade');
        await c.wait(80);
        c.set({ay: -18, ao: 0, dir: 1});
      }},
      sync: {label: '同步', async run(c) {
        c.to('ay', -22, 'snap');
        await c.wait(120);
        c.to('ay', 20, 'pop');
        c.to('dir', -1, 'snap');
        await c.wait(140);
        c.to('dir', 1, 'pop');
        await c.wait(120);
      }},
      syncing: {label: '同步中', loop: true, run(c) {
        c.claim('ay');
        c.loop(t => { c.s.ay = 20 * Math.sin(t * Math.PI * 2 * 0.85); });
      }},
      complete: {label: '完成', pose: 'synced', from: 'idle', async run(c) {
        c.to('ay', -18, 'snap');
        await c.wait(100);
        c.to('ao', 0, 'fade');
        c.to('sq', 0.84, 'impact');
        await c.wait(80);
        c.to('mark', 1, 'pop');
        c.to('sq', 1, 'rebound');
        await c.wait(160);
      }},
      disconnect: {label: '断开', pose: 'offline', from: 'idle', async run(c) {
        c.to('ay', 14, 'impact');
        c.to('ao', 0, 'fade');
        await c.wait(80);
        c.to('slash', 1, 'draw');
        c.to('mark', 0, 'fade');
        await c.wait(160);
      }}
    });

  add('sync',
    `<g data-part="top"><path d="M34 42H78"/><path d="M64 30L82 42L64 54"/></g>
<g data-part="bot"><path d="M86 78H42"/><path d="M56 66L38 78L56 90"/></g>`,
    {ax: 0, bx: 0, hit: 1},
    {idle: {}, synced: {ax: 8, bx: -8}, conflict: {ax: -16, bx: 16}},
    (s, p) => {
      p.top.setAttribute('transform', `translate(${s.ax} 0) ${aroundXY(1, s.hit, 70, 42)}`);
      p.bot.setAttribute('transform', `translate(${s.bx} 0) ${aroundXY(1, s.hit, 50, 78)}`);
    },
    {
      tap: tapSq('点按'),
      start: {label: '开始', async run(c) {
        c.to('ax', -18, 'snap');
        c.to('bx', 18, 'snap');
        await c.wait(90);
        c.to('ax', 18, 'pop');
        c.to('bx', -18, 'pop');
        await c.wait(150);
      }},
      syncing: {label: '同步中', loop: true, run(c) {
        c.claim('ax', 'bx');
        c.loop(t => {
          const w = Math.sin(t * Math.PI * 2 * 0.8);
          c.s.ax = 16 * w;
          c.s.bx = -16 * w;
        });
      }},
      complete: {label: '完成', pose: 'synced', from: 'idle', async run(c) {
        c.to('ax', 20, 'snap');
        c.to('bx', -20, 'snap');
        await c.wait(140);
        c.to('hit', 0.84, 'impact');
        await c.wait(80);
        c.to('hit', 1, 'rebound');
        c.to('ax', 8, 'pop');
        c.to('bx', -8, 'pop');
        await c.wait(160);
      }},
      conflict: {label: '冲突', pose: 'conflict', from: 'idle', async run(c) {
        c.to('ax', -20, 'impact');
        c.to('bx', 20, 'impact');
        await c.wait(110);
        c.to('hit', 0.76, 'impact');
        c.error();
        await c.wait(120);
        c.to('hit', 1, 'rebound');
        await c.wait(160);
      }},
      retry: {label: '重试', pose: 'idle', from: 'conflict', async run(c) {
        c.to('ax', -22, 'snap');
        c.to('bx', 22, 'snap');
        await c.wait(80);
        c.to('ax', 16, 'pop');
        c.to('bx', -16, 'pop');
        c.to('hit', 0.86, 'impact');
        await c.wait(140);
      }}
    },
    {task: {busy: 'syncing', success: 'complete', fail: 'conflict'}});

  add('upload',
    `<g data-part="arrow"><path d="M60 78V40"/><path d="M42 54L60 36L78 54"/></g>
<path data-part="tray" d="M26 70V90a10 10 0 0 0 10 10H84a10 10 0 0 0 10-10V70"/>
<path data-part="bar" d="M40 90H80"/>`,
    {ay: 0, ao: 1, bar: 0},
    {idle: {}, paused: {ay: 16}, completed: {bar: 1}},
    (s, p) => {
      p.arrow.setAttribute('transform', `translate(0 ${s.ay})`);
      op(p.arrow, s.ao);
      p.tray.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.4, s.sq, 60, 100));
      p.body.setAttribute('transform', '');
      dash(p.bar, 40, s.bar);
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('sq', 0.78, 'impact');
        c.to('ay', 8, 'snap');
        await c.wait(110);
        c.to('sq', 1, 'rebound');
        await c.wait(140);
      }},
      start: {label: '开始', async run(c) {
        c.to('ay', 14, 'snap');
        await c.wait(80);
        c.to('ay', -26, 'pop');
        await c.wait(150);
        c.to('ao', 0, 'fade');
        await c.wait(90);
        c.set({ay: 20, ao: 0});
      }},
      uploading: {label: '上传中', loop: true, run(c) {
        c.claim('ay', 'ao');
        c.loop(t => {
          const w = (t * 0.85) % 1;
          c.s.ay = 12 - w * 38;
          c.s.ao = w < 0.72 ? 1 : (1 - w) / 0.28;
        });
      }},
      progress: {label: '进度', drive(c, v) {
        c.to('ay', -24 * v, 'track');
        c.to('bar', v, 'track');
        c.to('ao', 1, 'track');
      }},
      pause: {label: '暂停', pose: 'paused', from: 'idle', async run(c) {
        c.to('ay', -18, 'snap');
        await c.wait(90);
        c.to('ay', 16, 'impact');
        c.to('sq', 0.86, 'impact');
        await c.wait(140);
      }},
      resume: {label: '继续', pose: 'idle', from: 'paused', async run(c) {
        c.to('ay', -26, 'pop');
        await c.wait(150);
        c.to('ao', 0, 'fade');
        await c.wait(90);
        c.set({ay: 18, ao: 0});
      }},
      cancel: {label: '取消', pose: 'idle', async run(c) {
        c.to('ay', 22, 'snap');
        c.to('bar', 0, 'fade');
        await c.wait(120);
        c.to('ao', 1, 'fade');
        await c.wait(120);
      }},
      complete: {label: '完成', pose: 'completed', from: 'idle', async run(c) {
        c.to('ay', -26, 'pop');
        c.to('bar', 1, 'draw');
        await c.wait(140);
        c.to('sq', 0.84, 'impact');
        c.to('ao', 0, 'fade');
        await c.wait(100);
        c.set({ay: 16, ao: 0});
      }},
      fail: {label: '失败', async run(c) {
        c.to('ay', -16, 'snap');
        c.error();
        await c.wait(90);
        c.to('ay', 20, 'impact');
        c.to('sq', 0.8, 'impact');
        await c.wait(140);
      }}
    },
    {task: {busy: 'uploading', success: 'complete', fail: 'fail'}});

  add('battery',
    `<rect data-part="shell" x="16" y="40" width="78" height="40" rx="10"/>
<rect data-part="nub" x="96" y="52" width="8" height="16" rx="3"/>
<rect data-part="fill" data-fill x="24" y="48" width="60" height="24" rx="5"/>
<g data-part="bolt"><path d="M62 48L50 62H60L54 76L72 58H60Z"/></g>`,
    {fill: 0.62, bolt: 0, boltY: 0, low: 0},
    {normal: {}, low: {fill: 0.16, low: 1}, charging: {bolt: 1}, full: {fill: 1}},
    (s, p) => {
      bodyAt(p, s, 60, 80);
      const width = Math.max(0.01, 60 * clamp01(s.fill));
      p.fill.setAttribute('width', width.toFixed(2));
      op(p.fill, s.fill < 0.03 ? 0 : 1);
      op(p.bolt, s.bolt);
      p.bolt.setAttribute('transform', `translate(0 ${s.boltY}) ${around(0.7 + 0.5 * clamp01(s.bolt), 61, 62)}`);
      p.shell.setAttribute('opacity', String(s.low > 0.5 ? 1 : 1));
    },
    {
      tap: tapSq('点按'),
      charge: {label: '充电', pose: 'charging', from: 'normal', async run(c) {
        c.to('bolt', 1, 'pop');
        c.to('boltY', -16, 'snap');
        await c.wait(110);
        c.to('boltY', 0, 'rebound');
        await c.wait(150);
      }},
      charging: {label: '充电中', loop: true, pose: 'charging', run(c) {
        c.claim('boltY', 'bolt');
        c.loop(t => {
          const w = wave(t, 1.05);
          c.s.bolt = 0.35 + 0.65 * w;
          c.s.boltY = -16 * w;
        });
      }},
      level: {label: '电量', drive(c, v) {
        c.to('fill', v, 'track');
      }},
      discharge: {label: '耗电', pose: 'low', from: 'normal', async run(c) {
        c.to('fill', 0.16, 'snap');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }},
      full: {label: '充满', pose: 'full', from: 'charging', async run(c) {
        c.to('fill', 1, 'gentle');
        c.to('boltY', -18, 'snap');
        await c.wait(120);
        c.to('bolt', 0, 'fade');
        c.to('sq', 0.84, 'impact');
        await c.wait(140);
      }},
      lowBattery: {label: '电量低', pose: 'low', from: 'normal', async run(c) {
        c.to('fill', 0.16, 'impact');
        c.error();
        c.to('sq', 0.78, 'impact');
        await c.wait(120);
        c.to('sq', 1, 'rebound');
        await c.wait(160);
      }}
    });

  add('power',
    `<g data-part="mark"><path data-part="arc" d="M78 36A30 30 0 1 1 42 36"/><path data-part="stem" d="M60 22V62"/></g>`,
    {stem: 0, wide: 1, turn: 0},
    {off: {}, on: {stem: -12, wide: 0.86}},
    (s, p) => {
      p.mark.setAttribute('transform', `rotate(${s.turn} 60 60) ${aroundXY(s.wide, s.sq, 60, 64)}`);
      p.body.setAttribute('transform', '');
      p.stem.setAttribute('transform', `translate(0 ${s.stem})`);
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('sq', 0.76, 'impact');
        c.to('stem', 10, 'impact');
        await c.wait(120);
        c.to('sq', c.goal('sq'), 'rebound');
        c.to('stem', c.goal('stem'), 'rebound');
        await c.wait(150);
      }},
      press: {label: '按下', async run(c) {
        c.to('sq', 0.7, 'impact');
        c.to('stem', 18, 'impact');
        await c.wait(140);
        c.to('sq', c.goal('sq'), 'rebound');
        c.to('stem', c.goal('stem'), 'rebound');
        await c.wait(160);
      }},
      powerOn: {label: '开机', pose: 'on', from: 'off', async run(c) {
        c.to('sq', 0.72, 'impact');
        c.to('stem', 12, 'snap');
        await c.wait(90);
        c.to('stem', -16, 'pop');
        c.to('wide', 0.82, 'pop');
        await c.wait(160);
      }},
      powerOff: {label: '关机', pose: 'off', from: 'on', async run(c) {
        c.to('stem', -16, 'snap');
        await c.wait(80);
        c.to('stem', 8, 'impact');
        c.to('wide', 1, 'gentle');
        c.to('sq', 0.8, 'impact');
        await c.wait(150);
      }},
      restart: {label: '重启', pose: 'on', from: 'on', async run(c) {
        c.to('sq', 0.74, 'impact');
        c.to('turn', -36, 'snap');
        c.to('stem', 16, 'snap');
        await c.wait(120);
        c.to('turn', 18, 'pop');
        c.to('stem', -16, 'pop');
        await c.wait(160);
      }}
    });

  add('search',
    `<g data-part="glass"><circle cx="50" cy="50" r="24"/><path d="M68 68L92 92"/></g>`,
    {x: 0, y: 0, tilt: 0, mag: 1},
    {idle: {}, found: {x: 12, y: 8, tilt: -10, mag: 1.12}, empty: {tilt: 8, mag: 0.92}},
    (s, p) => {
      p.glass.setAttribute('transform', `translate(${s.x} ${s.y}) rotate(${s.tilt} 50 50) ${around(s.mag, 50, 50)}`);
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('mag', 0.82, 'impact');
        c.to('y', 8, 'snap');
        await c.wait(110);
        c.to('mag', c.goal('mag'), 'rebound');
        c.to('y', c.goal('y'), 'rebound');
        await c.wait(140);
      }},
      start: {label: '开始找', async run(c) {
        c.to('x', -16, 'snap');
        c.to('tilt', 16, 'snap');
        await c.wait(110);
        c.to('x', 16, 'pop');
        c.to('y', -14, 'pop');
        c.to('tilt', -14, 'pop');
        await c.wait(150);
      }},
      searching: {label: '搜索中', loop: true, run(c) {
        c.claim('x', 'y', 'tilt');
        c.loop(t => {
          c.s.x = 16 * Math.sin(t * Math.PI * 2 * 0.7);
          c.s.y = 12 * Math.sin(t * Math.PI * 2 * 1.15);
          c.s.tilt = 18 * Math.sin(t * Math.PI * 2 * 0.7);
        });
      }},
      found: {label: '找到', pose: 'found', from: 'idle', async run(c) {
        c.to('x', -16, 'snap');
        c.to('tilt', 14, 'snap');
        await c.wait(90);
        c.to('x', 18, 'pop');
        c.to('y', -12, 'pop');
        c.to('mag', 1.24, 'pop');
        c.to('tilt', -16, 'pop');
        await c.wait(170);
      }},
      empty: {label: '没有', pose: 'empty', from: 'idle', async run(c) {
        c.to('x', -16, 'snap');
        c.to('tilt', -12, 'snap');
        await c.wait(100);
        c.to('x', 16, 'pop');
        c.to('y', 10, 'pop');
        c.to('mag', 0.84, 'impact');
        await c.wait(160);
      }},
      reset: {label: '复位', pose: 'idle', from: 'found', async run(c) {
        c.to('x', -16, 'snap');
        c.to('mag', 0.9, 'snap');
        await c.wait(100);
        c.to('x', 0, 'pop');
        c.to('y', 0, 'pop');
        c.to('tilt', 0, 'rebound');
        c.to('mag', 1, 'pop');
        await c.wait(150);
      }}
    });

  add('link',
    `<g data-part="a"><rect x="22" y="46" width="44" height="28" rx="14"/></g>
<g data-part="b"><rect x="54" y="46" width="44" height="28" rx="14"/></g>
<g data-part="ghost"><rect x="38" y="46" width="44" height="28" rx="14"/></g>`,
    {gap: 0, gy: 0, go: 0, hit: 1},
    {linked: {}, broken: {gap: 14}},
    (s, p) => {
      p.a.setAttribute('transform', `translate(${-s.gap} 0) ${aroundXY(1, s.hit, 40, 74)}`);
      p.b.setAttribute('transform', `translate(${s.gap} 0) ${aroundXY(1, s.hit, 80, 74)}`);
      p.ghost.setAttribute('transform', `translate(0 ${s.gy})`);
      op(p.ghost, s.go);
    },
    {
      tap: tapSq('点按'),
      connect: {label: '扣上', pose: 'linked', from: 'broken', async run(c) {
        c.to('gap', 14, 'snap');
        await c.wait(70);
        c.to('gap', -4, 'impact');
        await c.wait(110);
        c.to('hit', 0.82, 'impact');
        await c.wait(140);
      }},
      disconnect: {label: '分开', pose: 'broken', from: 'linked', async run(c) {
        c.to('gap', -4, 'snap');
        await c.wait(80);
        c.to('gap', 16, 'pop');
        c.to('hit', 0.9, 'impact');
        await c.wait(160);
      }},
      reconnect: {label: '重新连接', pose: 'linked', from: 'broken', async run(c) {
        c.to('gap', 14, 'snap');
        await c.wait(70);
        c.to('gap', -5, 'impact');
        c.to('hit', 0.8, 'impact');
        await c.wait(140);
      }},
      copyLink: {label: '复制链接', async run(c) {
        c.to('hit', 0.86, 'impact');
        c.set({gy: 0, go: 0});
        c.to('go', 1, 'fade');
        await c.wait(70);
        c.to('gy', -26, 'pop');
        await c.wait(150);
        c.to('go', 0, 'fade');
        await c.wait(100);
      }}
    });

  add('check',
    `<rect data-part="box" x="24" y="24" width="72" height="72" rx="16"/>
<path data-part="mark" d="M38 62L54 78L86 42"/>`,
    {draw: 1, box: 1},
    {checked: {draw: 1}, empty: {draw: 0}},
    (s, p) => {
      p.box.setAttribute('transform', aroundXY(1 + (1 - s.box) * 0.2, s.box, 60, 96));
      dash(p.mark, 74, s.draw);
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('box', 0.84, 'impact');
        await c.wait(110);
        c.to('box', 1, 'rebound');
        await c.wait(140);
      }},
      draw: {label: '画出', pose: 'checked', from: 'empty', async run(c) {
        c.to('draw', 1, 'draw');
        c.to('box', 0.9, 'snap');
        await c.wait(160);
        c.to('box', 1, 'pop');
        await c.wait(140);
      }},
      confirm: {label: '确认', pose: 'checked', from: 'empty', async run(c) {
        c.to('box', 0.78, 'impact');
        c.to('draw', 0.2, 'snap');
        await c.wait(70);
        c.to('draw', 1, 'draw');
        await c.wait(120);
        c.to('box', 1.06, 'pop');
        await c.wait(150);
      }},
      undo: {label: '撤销', pose: 'empty', from: 'checked', async run(c) {
        c.to('box', 0.88, 'snap');
        c.to('draw', 0, 'fade');
        await c.wait(160);
        c.to('box', 1, 'rebound');
        await c.wait(140);
      }},
      reset: {label: '清空', pose: 'empty', from: 'checked', async run(c) {
        c.to('draw', 1.08, 'snap');
        await c.wait(70);
        c.to('draw', 0, 'exit');
        c.to('box', 0.86, 'impact');
        await c.wait(150);
      }}
    });
  add('warning',
    `<path data-part="tri" d="M60 22L100 96H20Z"/>
<path data-part="bang" d="M60 46V70"/>
<circle data-part="dot" data-fill cx="60" cy="82" r="4"/>`,
    {tilt: 0, my: 0, dot: 1},
    {idle: {}, active: {tilt: -6}},
    (s, p) => {
      p.tri.setAttribute('transform', `rotate(${s.tilt} 60 96)`);
      p.bang.setAttribute('transform', `translate(0 ${s.my})`);
      p.dot.setAttribute('transform', `translate(0 ${s.my * 0.6}) ${around(0.7 + 0.3 * s.dot, 60, 82)}`);
      op(p.dot, s.dot);
    },
    {
      tap: tapSq('点按'),
      alert: {label: '警报', pose: 'active', from: 'idle', async run(c) {
        c.to('tilt', -14, 'snap');
        c.to('my', -24, 'snap');
        c.to('dot', 0.2, 'fade');
        await c.wait(110);
        c.to('my', 4, 'pop');
        c.to('dot', 1, 'pop');
        c.to('tilt', 6, 'rebound');
        await c.wait(160);
      }},
      acknowledge: {label: '知道了', pose: 'idle', from: 'active', async run(c) {
        c.to('sq', 0.8, 'impact');
        c.to('my', 8, 'impact');
        await c.wait(120);
        c.to('my', 0, 'rebound');
        c.to('tilt', 0, 'rebound');
        await c.wait(150);
      }},
      dismiss: {label: '收起', pose: 'idle', async run(c) {
        c.to('tilt', 10, 'snap');
        c.to('my', 18, 'snap');
        await c.wait(120);
        c.to('sq', 0.84, 'impact');
        await c.wait(140);
      }}
    });

  add('error',
    `<g data-part="badge"><circle cx="60" cy="60" r="34"/><path d="M40 80L80 40"/></g>`,
    {x: 0, ao: 1},
    {idle: {}, active: {x: 0}},
    (s, p) => {
      p.badge.setAttribute('transform', `translate(${s.x} 0)`);
      op(p.badge, s.ao);
    },
    {
      tap: tapSq('点按'),
      appear: {label: '出现', async run(c) {
        c.set({sq: 0.45, ao: 0});
        c.to('ao', 1, 'fade');
        c.to('sq', 1.12, 'pop');
        await c.wait(170);
      }},
      reject: {label: '拒绝', pose: 'active', from: 'idle', async run(c) {
        c.to('x', 16, 'impact');
        c.error();
        await c.wait(120);
        c.to('x', -10, 'rebound');
        c.to('sq', 0.78, 'impact');
        await c.wait(160);
      }},
      dismiss: {label: '收起', pose: 'idle', async run(c) {
        c.to('x', -18, 'snap');
        c.to('sq', 0.7, 'snap');
        await c.wait(120);
        c.to('ao', 0, 'fade');
        await c.wait(100);
        c.set({ao: 0, sq: 0.7, x: 0});
      }},
      retry: {label: '重试', pose: 'idle', from: 'active', async run(c) {
        c.to('x', 16, 'snap');
        await c.wait(90);
        c.to('x', -8, 'rebound');
        c.to('sq', 1.08, 'pop');
        await c.wait(160);
      }}
    });

  add('loading',
    `<rect data-part="track" x="16" y="44" width="88" height="32" rx="16"/>
<rect data-part="cap" data-fill x="22" y="50" width="32" height="20" rx="10"/>`,
    {x: 0},
    {idle: {}, loading: {}},
    (s, p) => {
      p.body.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.2, s.sq, 60, 60));
      p.cap.setAttribute('transform', `translate(${s.x} 0)`);
    },
    {
      tap: tapSq('点按'),
      start: {label: '开始', pose: 'loading', from: 'idle', async run(c) {
        c.to('x', 46, 'snap');
        await c.wait(140);
        c.to('x', 8, 'pop');
        await c.wait(140);
      }},
      loading: {label: '加载中', loop: true, pose: 'loading', run(c) {
        c.claim('x');
        c.loop(t => { c.s.x = 46 * wave(t, 0.75); });
      }},
      finish: {label: '完成', pose: 'idle', from: 'loading', async run(c) {
        c.to('x', 48, 'snap');
        await c.wait(120);
        c.to('sq', 0.82, 'impact');
        await c.wait(100);
        c.to('x', 0, 'pop');
        await c.wait(140);
      }},
      cancel: {label: '取消', pose: 'idle', async run(c) {
        c.to('x', -6, 'snap');
        await c.wait(80);
        c.to('x', 0, 'rebound');
        c.to('sq', 0.86, 'impact');
        await c.wait(140);
      }}
    });

  add('hourglass',
    `<defs><clipPath id="mi-catalog-hourglass"><path d="M36 22H84L62 60L84 98H36L58 60Z"/></clipPath></defs>
<g data-part="glass">
<g clip-path="url(#mi-catalog-hourglass)">
<rect data-part="topSand" data-fill x="36" y="22" width="48" height="26"/>
<rect data-part="botSand" data-fill x="36" y="72" width="48" height="26"/>
<circle data-part="grain" data-fill cx="60" cy="42" r="3"/>
</g>
<path data-part="outline" d="M36 22H84L62 60L84 98H36L58 60Z"/>
</g>`,
    {sand: 0, turn: 0, grain: 0, trickle: 0},
    {ready: {}, running: {}, finished: {sand: 1}},
    (s, p) => {
      const sand = clamp01(s.sand);
      const topH = (1 - sand) * 26;
      const botH = sand * 26;
      p.topSand.setAttribute('y', (22 + (26 - topH)).toFixed(2));
      p.topSand.setAttribute('height', Math.max(0.01, topH).toFixed(2));
      op(p.topSand, topH < 0.6 ? 0 : 1);
      p.botSand.setAttribute('y', (98 - botH).toFixed(2));
      p.botSand.setAttribute('height', Math.max(0.01, botH).toFixed(2));
      op(p.botSand, botH < 0.6 ? 0 : 1);
      p.glass.setAttribute('transform', `rotate(${s.turn} 60 60)`);
      p.grain.setAttribute('transform', `translate(0 ${s.grain})`);
      op(p.grain, s.trickle);
    },
    {
      tap: tapSq('点按'),
      start: {label: '开始', pose: 'running', from: 'ready', async run(c) {
        c.to('trickle', 1, 'fade');
        c.to('grain', 0, 'snap');
        await c.wait(40);
        c.to('grain', 28, 'snap');
        await c.wait(160);
        c.to('trickle', 0, 'fade');
        await c.wait(80);
        c.set({grain: 0});
      }},
      running: {label: '流沙', loop: true, pose: 'running', run(c) {
        c.claim('grain', 'trickle');
        c.loop(t => {
          const w = (t * 1.05) % 1;
          c.s.grain = w * 30;
          c.s.trickle = w < 0.82 ? 1 : (1 - w) / 0.18;
        });
      }},
      progress: {label: '进度', drive(c, v) {
        c.to('sand', v, 'track');
      }},
      flip: {label: '翻转', from: 'ready', async run(c) {
        c.to('turn', 180, 'slow');
        const toFinished = c.goal('sand') <= 0.5;
        await c.wait(560);
        if (!c.alive()) return;
        c.setPose(toFinished ? 'finished' : 'ready');
        c.set({turn: 0, sand: toFinished ? 1 : 0});
      }},
      finish: {label: '流完', pose: 'finished', from: 'running', async run(c) {
        c.to('sand', 1, 'gentle');
        c.to('trickle', 1, 'fade');
        c.to('grain', 26, 'snap');
        await c.wait(180);
        c.to('trickle', 0, 'fade');
        await c.wait(120);
      }},
      reset: {label: '复位', pose: 'ready', from: 'finished', async run(c) {
        c.to('turn', 180, 'slow');
        await c.wait(520);
        if (!c.alive()) return;
        c.set({turn: 0, sand: 0, grain: 0, trickle: 0});
      }}
    });

  add('clock',
    `<circle data-part="face" cx="60" cy="60" r="38"/>
<path data-part="hour" d="M60 60V38"/>
<path data-part="minute" d="M60 60V26"/>
<g data-part="flag"><path d="M78 72V90M90 72V90"/></g>
<circle data-fill cx="60" cy="60" r="3"/>`,
    {hour: 40, minute: -55, flag: 0},
    {idle: {}, running: {}, paused: {flag: 1}},
    (s, p) => {
      p.hour.setAttribute('transform', `rotate(${s.hour} 60 60)`);
      p.minute.setAttribute('transform', `rotate(${s.minute} 60 60)`);
      op(p.flag, s.flag);
    },
    {
      tap: tapSq('点按'),
      start: {label: '开始', pose: 'running', from: 'idle', async run(c) {
        c.to('minute', c.goal('minute') + 150, 'snap');
        c.to('flag', 0, 'fade');
        await c.wait(160);
      }},
      running: {label: '走动', loop: true, pose: 'running', run(c) {
        c.claim('minute', 'hour');
        c.loop((t, dt) => {
          c.s.minute += 150 * dt;
          c.s.hour += 12 * dt;
        });
      }},
      progress: {label: '进度', drive(c, v) {
        c.to('minute', -55 + v * 360, 'track');
        c.to('hour', 40 + v * 30, 'track');
      }},
      pause: {label: '暂停', pose: 'paused', from: 'running', async run(c) {
        c.to('minute', c.s.minute - 50, 'snap');
        c.to('flag', 1, 'pop');
        await c.wait(150);
      }},
      resume: {label: '继续', pose: 'running', from: 'paused', async run(c) {
        c.to('flag', 0, 'fade');
        c.to('minute', c.s.minute + 80, 'pop');
        await c.wait(160);
      }},
      reset: {label: '归零', pose: 'idle', async run(c) {
        c.to('minute', c.goal('minute') + 180, 'snap');
        c.to('flag', 0, 'fade');
        await c.wait(160);
      }}
    },
    {periodic: {hour: 360, minute: 360}});

  add('fingerprint',
    [12, 22, 32, 42, 50].map((r, i) => `<path data-part="r${i}" d="${arc(60, 78, r, 200, 340)}"/>`).join('') +
    `<circle data-part="core" data-fill cx="60" cy="86" r="4"/>`,
    {r0: 1, r1: 1, r2: 1, r3: 1, r4: 1, core: 0},
    {idle: {}, scanning: {}, recognised: {core: 1}},
    (s, p) => {
      for (let i = 0; i < 5; i++) {
        const v = clamp01(s['r' + i]);
        const part = p['r' + i];
        op(part, v);
        part.setAttribute('transform', around(0.5 + 0.5 * v, 60, 78));
      }
      op(p.core, s.core);
      p.core.setAttribute('transform', around(0.4 + 0.6 * clamp01(s.core), 60, 86));
    },
    {
      tap: tapSq('点按'),
      scan: {label: '扫描', pose: 'scanning', from: 'idle', async run(c) {
        c.set({r0: 0, r1: 0, r2: 0, r3: 0, r4: 0});
        c.to('r0', 1, 'pop');
        await c.wait(60);
        c.to('r1', 1, 'pop');
        await c.wait(60);
        c.to('r2', 1, 'pop');
        await c.wait(60);
        c.to('r3', 1, 'pop');
        await c.wait(60);
        c.to('r4', 1, 'pop');
        await c.wait(150);
      }},
      scanning: {label: '扫描中', loop: true, pose: 'scanning', run(c) {
        c.claim('r0', 'r1', 'r2', 'r3', 'r4');
        c.loop(t => {
          const phase = (t * 1.1) % 5;
          for (let i = 0; i < 5; i++) {
            const d = Math.min(Math.abs(phase - i), 5 - Math.abs(phase - i));
            c.s['r' + i] = clamp01(1.15 - d);
          }
        });
      }},
      accept: {label: '对上', pose: 'recognised', from: 'scanning', async run(c) {
        c.to('r0', 1, 'pop');
        c.to('r1', 1, 'pop');
        c.to('r2', 1, 'pop');
        c.to('r3', 1, 'pop');
        c.to('r4', 1, 'pop');
        c.to('sq', 0.86, 'impact');
        await c.wait(100);
        c.to('core', 1, 'pop');
        c.to('sq', 1, 'rebound');
        await c.wait(160);
      }},
      reject: {label: '没对上', pose: 'idle', from: 'scanning', async run(c) {
        c.to('r4', 0.2, 'impact');
        c.to('r3', 0.2, 'impact');
        c.error();
        await c.wait(80);
        c.to('r2', 0.3, 'snap');
        c.to('sq', 0.8, 'impact');
        await c.wait(100);
        c.to('r0', 1, 'rebound');
        c.to('r1', 1, 'rebound');
        c.to('r2', 1, 'rebound');
        c.to('r3', 1, 'rebound');
        c.to('r4', 1, 'rebound');
        await c.wait(160);
      }},
      reset: {label: '复位', pose: 'idle', from: 'recognised', async run(c) {
        c.to('core', 0, 'fade');
        c.to('r4', 0.4, 'snap');
        await c.wait(80);
        c.to('r4', 1, 'pop');
        c.to('r3', 1, 'pop');
        c.to('r2', 1, 'pop');
        await c.wait(150);
      }}
    },
    {task: {busy: 'scanning', success: 'accept', fail: 'reject'}});

  add('face-id',
    `<path data-part="corners" d="M30 46V30H46M90 46V30H74M30 74V90H46M90 74V90H74"/>
<path data-part="line" d="M36 34H84"/>`,
    {open: 1, line: 0, lineOn: 0},
    {idle: {}, scanning: {lineOn: 1}, recognised: {open: 1}},
    (s, p) => {
      p.corners.setAttribute('transform', around(0.78 + 0.22 * clamp01(s.open), 60, 60));
      p.line.setAttribute('transform', `translate(0 ${s.line})`);
      op(p.line, s.lineOn);
    },
    {
      tap: tapSq('点按'),
      scan: {label: '扫过', pose: 'scanning', from: 'idle', async run(c) {
        c.to('lineOn', 1, 'fade');
        c.to('line', 0, 'snap');
        c.to('open', 0.72, 'snap');
        await c.wait(60);
        c.to('line', 48, 'snap');
        await c.wait(160);
        c.to('open', 1, 'pop');
        await c.wait(120);
      }},
      scanning: {label: '扫描中', loop: true, pose: 'scanning', run(c) {
        c.claim('line', 'lineOn', 'open');
        c.loop(t => {
          const w = (t * 0.8) % 1;
          c.s.line = w * 50;
          c.s.lineOn = w < 0.88 ? 1 : (1 - w) / 0.12;
          c.s.open = 0.78 + 0.22 * Math.sin(t * Math.PI * 2 * 0.7);
        });
      }},
      recognise: {label: '对上轮廓', pose: 'recognised', from: 'scanning', async run(c) {
        c.to('line', 24, 'snap');
        c.to('open', 0.7, 'impact');
        await c.wait(120);
        c.to('lineOn', 0, 'fade');
        c.to('open', 1.08, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }},
      reject: {label: '没对上', pose: 'idle', from: 'scanning', async run(c) {
        c.to('line', 20, 'impact');
        c.error();
        await c.wait(90);
        c.to('line', 4, 'rebound');
        c.to('open', 0.8, 'snap');
        await c.wait(120);
        c.to('lineOn', 0, 'fade');
        await c.wait(100);
      }},
      reset: {label: '复位', pose: 'idle', from: 'recognised', async run(c) {
        c.to('open', 0.75, 'snap');
        c.to('line', 0, 'snap');
        c.to('lineOn', 0, 'fade');
        await c.wait(120);
        c.to('open', 1, 'pop');
        await c.wait(140);
      }}
    });

  add('folder',
    `<path data-part="pocket" d="M24 52H98V94A8 8 0 0 1 90 102H32A8 8 0 0 1 24 94Z"/>
<path data-part="lid" d="M24 52H58L68 38H90A8 8 0 0 1 98 46V52"/>
<g data-part="sheet"><rect x="38" y="48" width="44" height="32" rx="4"/><path d="M46 60H74M46 70H66"/></g>`,
    {lid: 0, sheet: 8, sheetOn: 0},
    {closed: {}, open: {lid: -32}},
    (s, p) => {
      bodyAt(p, s, 60, 102);
      p.lid.setAttribute('transform', `rotate(${s.lid} 24 52)`);
      p.sheet.setAttribute('transform', `translate(0 ${s.sheet})`);
      op(p.sheet, s.sheetOn);
    },
    {
      tap: tapSq('点按'),
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('lid', 8, 'snap');
        await c.wait(80);
        c.to('lid', -36, 'pop');
        await c.wait(170);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        c.to('lid', -36, 'snap');
        await c.wait(70);
        c.to('lid', 4, 'impact');
        c.to('sq', 0.84, 'impact');
        await c.wait(150);
      }},
      insert: {label: '放入', pose: 'closed', from: 'open', async run(c) {
        c.set({sheet: -28, sheetOn: 0});
        c.to('sheetOn', 1, 'fade');
        c.to('sheet', -22, 'snap');
        await c.wait(80);
        c.to('sheet', 14, 'impact');
        c.to('sq', 0.8, 'impact');
        await c.wait(110);
        c.to('lid', 0, 'snap');
        c.to('sheetOn', 0, 'fade');
        await c.wait(140);
      }},
      remove: {label: '取出', pose: 'open', from: 'closed', async run(c) {
        c.to('lid', -36, 'snap');
        c.set({sheet: 12, sheetOn: 0});
        await c.wait(70);
        c.to('sheetOn', 1, 'fade');
        c.to('sheet', -26, 'pop');
        await c.wait(150);
        c.to('sheetOn', 0, 'fade');
        await c.wait(90);
      }}
    });

  add('copy',
    `<g data-part="back"><rect x="38" y="26" width="48" height="58" rx="8"/></g>
<g data-part="front"><rect x="26" y="40" width="48" height="58" rx="8"/><path d="M36 58H62M36 70H56M36 82H50"/></g>`,
    {fx: 0, fy: 0, bx: 0, by: 0, bo: 1},
    {idle: {}, copied: {fx: -8, fy: -10, bx: 10, by: 8}},
    (s, p) => {
      p.back.setAttribute('transform', `translate(${s.bx} ${s.by})`);
      op(p.back, s.bo);
      p.front.setAttribute('transform', `translate(${s.fx} ${s.fy}) ${aroundXY(1, s.sq, 50, 98)}`);
      p.body.setAttribute('transform', '');
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('sq', 0.86, 'impact');
        c.to('fy', 6, 'snap');
        await c.wait(110);
        c.to('sq', 1, 'rebound');
        await c.wait(130);
      }},
      copy: {label: '复制', pose: 'copied', from: 'idle', async run(c) {
        c.to('fy', 8, 'snap');
        c.to('fx', 6, 'snap');
        await c.wait(80);
        c.to('fx', -14, 'pop');
        c.to('fy', -16, 'pop');
        c.to('bx', 12, 'gentle');
        c.to('by', 10, 'gentle');
        await c.wait(170);
      }},
      duplicate: {label: '再制一份', async run(c) {
        c.to('bx', 22, 'snap');
        c.to('by', -18, 'snap');
        c.to('bo', 1, 'fade');
        await c.wait(140);
        c.to('bo', 0, 'fade');
        await c.wait(100);
        c.set({bx: -10, by: 8, bo: 0});
      }},
      copied: {label: '已复制', pose: 'copied', from: 'idle', async run(c) {
        c.to('sq', 0.82, 'impact');
        c.to('fx', -16, 'pop');
        c.to('fy', -12, 'pop');
        await c.wait(140);
        c.to('bx', 10, 'rebound');
        c.to('by', 8, 'rebound');
        await c.wait(140);
      }},
      reset: {label: '复位', pose: 'idle', from: 'copied', async run(c) {
        c.to('fx', 8, 'snap');
        c.to('fy', 8, 'snap');
        await c.wait(90);
        c.to('fx', 0, 'pop');
        c.to('fy', 0, 'pop');
        c.to('bx', 0, 'gentle');
        c.to('by', 0, 'gentle');
        c.to('bo', 1, 'fade');
        await c.wait(160);
      }}
    });

  add('bookmark',
    `<path data-part="fill" data-fill d="M38 20H82V100L60 82L38 100Z"/>
<path data-part="edge" d="M38 20H82V100L60 82L38 100Z"/>`,
    {fill: 0, sink: 0},
    {off: {}, on: {fill: 1}},
    (s, p) => {
      bodyAt(p, s, 60, 100);
      op(p.fill, s.fill);
      p.fill.setAttribute('transform', `translate(0 ${s.sink}) ${around(0.7 + 0.3 * clamp01(s.fill), 60, 20)}`);
      p.edge.setAttribute('transform', `translate(0 ${s.sink})`);
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('sq', 0.78, 'impact');
        c.to('sink', 8, 'impact');
        await c.wait(120);
        c.to('sq', 1, 'rebound');
        c.to('sink', 0, 'rebound');
        await c.wait(140);
      }},
      press: {label: '按下', async run(c) {
        c.to('sq', 0.68, 'impact');
        c.to('sink', 10, 'impact');
        await c.wait(140);
        c.to('sq', 1, 'rebound');
        c.to('sink', 0, 'rebound');
        await c.wait(160);
      }},
      save: {label: '保存', pose: 'on', from: 'off', async run(c) {
        c.to('sq', 0.74, 'impact');
        c.to('sink', 10, 'snap');
        await c.wait(80);
        c.to('fill', 1, 'pop');
        c.to('sink', -8, 'pop');
        await c.wait(160);
      }},
      unsave: {label: '取消保存', pose: 'off', from: 'on', async run(c) {
        c.to('sink', -12, 'snap');
        c.to('fill', 0, 'fade');
        await c.wait(100);
        c.to('sq', 0.84, 'impact');
        c.to('sink', 6, 'rebound');
        await c.wait(150);
      }}
    });

  add('cellular',
    `<g data-part="b0"><rect x="22" y="68" width="14" height="24" rx="3"/></g>
<g data-part="b1"><rect x="42" y="54" width="14" height="38" rx="3"/></g>
<g data-part="b2"><rect x="62" y="40" width="14" height="52" rx="3"/></g>
<g data-part="b3"><rect x="82" y="26" width="14" height="66" rx="3"/></g>`,
    {b0: 1, b1: 1, b2: 1, b3: 1},
    {full: {}, weak: {b2: 0, b3: 0}, off: {b0: 0, b1: 0, b2: 0, b3: 0}},
    (s, p) => {
      [0, 1, 2, 3].forEach(i => {
        const v = clamp01(s['b' + i]);
        const part = p['b' + i];
        part.setAttribute('transform', aroundXY(1, Math.max(0.05, v), 29 + i * 20, 92));
        op(part, v < 0.08 ? 0 : 1);
      });
    },
    {
      tap: tapSq('点按'),
      connect: {label: '连接', pose: 'full', from: 'off', async run(c) {
        c.to('b0', 1, 'pop');
        await c.wait(60);
        c.to('b1', 1, 'pop');
        await c.wait(60);
        c.to('b2', 1, 'pop');
        await c.wait(60);
        c.to('b3', 1, 'pop');
        await c.wait(140);
      }},
      weaken: {label: '变弱', pose: 'weak', from: 'full', async run(c) {
        c.to('b3', 0, 'snap');
        c.to('sq', 0.9, 'impact');
        await c.wait(80);
        c.to('b2', 0, 'snap');
        await c.wait(140);
      }},
      disconnect: {label: '断开', pose: 'off', from: 'full', async run(c) {
        c.to('b3', 0, 'snap');
        await c.wait(50);
        c.to('b2', 0, 'snap');
        c.to('b1', 0, 'snap');
        c.to('b0', 0, 'snap');
        await c.wait(150);
      }},
      strength: {label: '强度', drive(c, v) {
        c.to('b0', v >= 0.08 ? 1 : 0, 'track');
        c.to('b1', v >= 0.3 ? 1 : 0, 'track');
        c.to('b2', v >= 0.55 ? 1 : 0, 'track');
        c.to('b3', v >= 0.78 ? 1 : 0, 'track');
      }}
    });

  add('hotspot',
    `<circle data-part="core" data-fill cx="60" cy="62" r="6"/>
<circle data-part="r0" cx="60" cy="62" r="16"/>
<circle data-part="r1" cx="60" cy="62" r="28"/>
<circle data-part="r2" cx="60" cy="62" r="40"/>
<rect data-part="device" x="70" y="78" width="16" height="12" rx="3"/>`,
    {r0: 1, r1: 1, r2: 1, dx: 0, dOn: 0},
    {on: {}, off: {r0: 0, r1: 0, r2: 0}, connected: {dOn: 1, dx: 0}},
    (s, p) => {
      [0, 1, 2].forEach(i => {
        const v = clamp01(s['r' + i]);
        const part = p['r' + i];
        op(part, v);
        part.setAttribute('transform', around(0.35 + 0.65 * v, 60, 62));
      });
      p.device.setAttribute('transform', `translate(${s.dx} 0)`);
      op(p.device, s.dOn);
    },
    {
      tap: tapSq('点按'),
      enable: {label: '打开', pose: 'on', from: 'off', async run(c) {
        c.to('r0', 1, 'pop');
        await c.wait(70);
        c.to('r1', 1, 'pop');
        await c.wait(70);
        c.to('r2', 1, 'pop');
        await c.wait(150);
      }},
      connectDevice: {label: '设备接入', pose: 'connected', from: 'on', async run(c) {
        c.set({dx: 22, dOn: 0});
        c.to('dOn', 1, 'fade');
        c.to('dx', 22, 'snap');
        await c.wait(60);
        c.to('dx', -2, 'impact');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }},
      disconnect: {label: '断开', pose: 'on', from: 'connected', async run(c) {
        c.to('dx', 20, 'snap');
        c.to('dOn', 0, 'fade');
        await c.wait(140);
        c.set({dx: 0, dOn: 0});
      }}
    });

  add('usb',
    `<g data-part="plug"><rect x="44" y="28" width="32" height="34" rx="6"/><path d="M53 28V20H67V28M53 42H67M60 62V72"/></g>
<g data-part="port"><path d="M38 100V86A6 6 0 0 1 44 80H76A6 6 0 0 1 82 86V100"/><path d="M44 88H76"/>
<circle data-part="dot" data-fill cx="88" cy="94" r="3.5"/></g>`,
    {y: 0, dot: 0},
    {idle: {}, in: {y: 16}, ready: {y: 16, dot: 1}},
    (s, p) => {
      p.body.setAttribute('transform', '');
      p.plug.setAttribute('transform', `translate(0 ${s.y})`);
      p.port.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.2, s.sq, 60, 100));
      op(p.dot, s.dot);
      p.dot.setAttribute('transform', around(0.6 + 0.4 * clamp01(s.dot), 88, 94));
    },
    {
      tap: tapSq('点按'),
      plug: {label: '插入', pose: 'in', from: 'idle', async run(c) {
        c.to('y', -4, 'snap');
        await c.wait(80);
        c.to('y', 18, 'impact');
        await c.wait(100);
        c.to('sq', 0.94, 'impact');
        c.to('y', 16, 'rebound');
        await c.wait(150);
      }},
      recognise: {label: '认出', pose: 'ready', from: 'in', async run(c) {
        c.to('dot', 1, 'pop');
        await c.wait(180);
      }},
      eject: {label: '弹出', pose: 'idle', from: 'ready', async run(c) {
        c.to('dot', 0, 'fade');
        c.to('y', 18, 'snap');
        await c.wait(70);
        c.to('y', -4, 'pop');
        await c.wait(150);
      }}
    });

  add('server',
    `<g data-part="stack">
<rect x="26" y="20" width="68" height="22" rx="5"/>
<rect x="26" y="48" width="68" height="22" rx="5"/>
<rect x="26" y="76" width="68" height="22" rx="5"/>
<circle data-part="l0" data-fill cx="40" cy="31" r="3.5"/>
<circle data-part="l1" data-fill cx="40" cy="59" r="3.5"/>
<circle data-part="l2" data-fill cx="40" cy="87" r="3.5"/>
</g>`,
    {l0: 1, l1: 1, l2: 1, dim: 1},
    {online: {}, busy: {}, offline: {l0: 0.15, l1: 0.15, l2: 0.15, dim: 0.45}},
    (s, p) => {
      bodyAt(p, s, 60, 98);
      op(p.stack, s.dim);
      op(p.l0, s.l0); op(p.l1, s.l1); op(p.l2, s.l2);
    },
    {
      tap: tapSq('点按'),
      online: {label: '在线', pose: 'online', from: 'offline', async run(c) {
        c.to('dim', 1, 'fade');
        c.to('l0', 1, 'pop');
        await c.wait(70);
        c.to('l1', 1, 'pop');
        await c.wait(70);
        c.to('l2', 1, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(140);
      }},
      busy: {label: '忙碌', loop: true, pose: 'busy', run(c) {
        c.claim('l0', 'l1', 'l2');
        c.loop(t => {
          const phase = (t * 1.3) % 3;
          const glow = i => clamp01(1.2 - Math.min(Math.abs(phase - i), 3 - Math.abs(phase - i)));
          c.s.l0 = 0.25 + 0.75 * glow(0);
          c.s.l1 = 0.25 + 0.75 * glow(1);
          c.s.l2 = 0.25 + 0.75 * glow(2);
        });
      }},
      offline: {label: '离线', pose: 'offline', from: 'online', async run(c) {
        c.to('l2', 0.15, 'fade');
        c.to('l1', 0.15, 'fade');
        c.to('l0', 0.15, 'fade');
        c.to('dim', 0.45, 'fade');
        c.to('sq', 0.92, 'gentle');
        await c.wait(180);
      }},
      restart: {label: '重启', pose: 'online', from: 'online', async run(c) {
        c.to('sq', 0.78, 'impact');
        c.to('l0', 0.2, 'snap');
        c.to('l1', 0.2, 'snap');
        c.to('l2', 0.2, 'snap');
        await c.wait(90);
        c.to('l0', 1, 'pop');
        await c.wait(60);
        c.to('l1', 1, 'pop');
        await c.wait(60);
        c.to('l2', 1, 'pop');
        c.to('sq', 1, 'rebound');
        await c.wait(140);
      }}
    });

  add('brightness',
    `<circle data-part="sun" cx="60" cy="60" r="16"/>
<path data-part="rays" d="M60 28V18"/>`,
    {reach: 1},
    {bright: {}, dim: {reach: 0.2}},
    (s, p) => {
      const reach = clamp01(s.reach);
      let d = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45;
        const inner = 26;
        const outer = 26 + 22 * reach;
        const [x0, y0] = polar(60, 60, inner, a);
        const [x1, y1] = polar(60, 60, outer, a);
        d += `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`;
      }
      p.rays.setAttribute('d', d);
      op(p.rays, reach < 0.04 ? 0 : 1);
      p.sun.setAttribute('transform', around(0.82 + 0.18 * reach, 60, 60));
    },
    {
      tap: tapSq('点按'),
      brighten: {label: '变亮', pose: 'bright', from: 'dim', async run(c) {
        c.to('reach', 0.15, 'snap');
        await c.wait(70);
        c.to('reach', 1.08, 'pop');
        await c.wait(160);
      }},
      dim: {label: '变暗', pose: 'dim', from: 'bright', async run(c) {
        c.to('reach', 1.05, 'snap');
        await c.wait(60);
        c.to('reach', 0.2, 'gentle');
        await c.wait(180);
      }},
      level: {label: '亮度', drive(c, v) {
        c.to('reach', 0.15 + 0.85 * v, 'track');
      }}
    });

  add('storage',
    `<ellipse cx="60" cy="34" rx="30" ry="12"/>
<path d="M30 34V82C30 94 90 94 90 82V34"/>
<ellipse cx="60" cy="82" rx="30" ry="12"/>
<defs><clipPath id="mi-catalog-storage"><path d="M30 40V82C30 94 90 94 90 82V40Z"/></clipPath></defs>
<g clip-path="url(#mi-catalog-storage)"><rect data-part="fill" data-fill x="30" y="40" width="60" height="48"/></g>`,
    {level: 0.45},
    {normal: {level: 0.45}, loaded: {level: 0.75}, full: {level: 1}, empty: {level: 0}},
    (s, p) => {
      const h = 48 * clamp01(s.level);
      p.fill.setAttribute('y', (88 - h).toFixed(2));
      p.fill.setAttribute('height', Math.max(0.01, h).toFixed(2));
      op(p.fill, h < 0.8 ? 0 : 1);
    },
    {
      tap: tapSq('点按'),
      fill: {label: '写入', pose: 'loaded', from: 'normal', async run(c) {
        c.to('level', 0.75, 'gentle');
        c.to('sq', 0.9, 'impact');
        await c.wait(180);
      }},
      clear: {label: '清空', pose: 'empty', from: 'loaded', async run(c) {
        c.to('level', 0, 'snap');
        await c.wait(160);
        c.to('sq', 0.92, 'rebound');
        await c.wait(120);
      }},
      full: {label: '已满', pose: 'full', from: 'loaded', async run(c) {
        c.to('level', 1, 'gentle');
        await c.wait(120);
        c.to('sq', 0.8, 'impact');
        await c.wait(140);
      }},
      level: {label: '容量', drive(c, v) {
        c.to('level', v, 'track');
      }}
    });

  add('printer',
    `<defs><clipPath id="mi-catalog-printer-in"><rect x="36" y="16" width="48" height="30"/></clipPath><clipPath id="mi-catalog-printer-out"><rect x="36" y="76" width="48" height="28"/></clipPath></defs>
<g clip-path="url(#mi-catalog-printer-in)"><g data-part="input"><rect x="42" y="20" width="36" height="34" rx="3"/><path d="M50 30H70M50 38H66"/></g></g>
<g data-part="machine"><path d="M30 46H90Q96 46 96 52V70Q96 76 90 76H30Q24 76 24 70V52Q24 46 30 46Z"/><path d="M32 46V40H88V46M36 70H84"/><circle data-fill cx="84" cy="56" r="3"/></g>
<g clip-path="url(#mi-catalog-printer-out)"><g data-part="output"><path data-part="paper" d="M42 50H78V82H42Z"/><path d="M50 60H70M50 68H66"/><path data-part="fold" d="M72 82V76H78"/></g></g>`,
    {feed: 0, inOn: 1, out: 0, outOn: 0, corner: 0},
    {idle: {}, done: {feed: 24, inOn: 0, out: 18, outOn: 1}, jammed: {feed: 10, out: 8, outOn: 1, corner: 7}},
    (s, p) => {
      p.body.setAttribute('transform', '');
      p.input.setAttribute('transform', `translate(0 ${s.feed})`);
      op(p.input, s.inOn);
      p.output.setAttribute('transform', `translate(0 ${s.out})`);
      op(p.output, s.outOn);
      p.machine.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.2, s.sq, 60, 76));
      const corner = Math.max(0, Math.min(8, s.corner));
      p.paper.setAttribute('d', `M42 50H78V${82 - corner}L${78 - corner} 82H42Z`);
      p.fold.setAttribute('d', `M${78 - corner} 82V${82 - corner}H78`);
      op(p.fold, corner / 7);
    },
    {
      tap: tapSq('点按'),
      print: {label: '打印', pose: 'done', from: 'idle', async run(c) {
        c.to('feed', 24, 'gentle');
        await c.wait(100);
        c.to('inOn', 0, 'fade');
        c.to('outOn', 1, 'fade');
        c.to('out', 18, 'gentle');
        await c.wait(190);
        c.to('sq', 0.95, 'impact');
        await c.wait(100);
      }},
      printing: {label: '出纸', loop: true, run(c) {
        c.claim('feed', 'inOn', 'out', 'outOn');
        c.loop(t => {
          const phase = (t * 0.55) % 1;
          c.s.feed = 24 * clamp01(phase / 0.48);
          c.s.inOn = clamp01(phase / 0.08) * (1 - clamp01((phase - 0.24) / 0.27));
          c.s.out = 18 * clamp01((phase - 0.35) / 0.45);
          c.s.outOn = clamp01((phase - 0.34) / 0.1) * (1 - clamp01((phase - 0.88) / 0.12));
        });
      }},
      complete: {label: '完成', pose: 'done', from: 'idle', async run(c) {
        c.to('feed', 24, 'gentle');
        c.to('inOn', 0, 'fade');
        c.to('outOn', 1, 'fade');
        c.to('out', 18, 'gentle');
        c.to('corner', 0, 'gentle');
        await c.wait(190);
        c.to('sq', 0.95, 'impact');
        await c.wait(110);
      }},
      jam: {label: '卡纸', pose: 'jammed', from: 'idle', async run(c) {
        c.to('feed', 10, 'snap');
        c.to('outOn', 1, 'fade');
        c.to('out', 8, 'snap');
        await c.wait(120);
        c.to('corner', 7, 'impact');
        c.error();
        await c.wait(160);
      }}
    },
    {task: {busy: 'printing', success: 'complete', fail: 'jam'}});

  add('archive',
    `<path data-part="box" d="M26 60H94V98H26Z"/>
<path data-part="lid" d="M22 60H98V48H22Z"/>
<g data-part="file"><rect x="42" y="40" width="36" height="26" rx="3"/><path d="M50 50H70M50 58H64"/></g>`,
    {lid: 0, fy: 0, fOn: 0},
    {closed: {}, open: {lid: -28}},
    (s, p) => {
      bodyAt(p, s, 60, 98);
      p.lid.setAttribute('transform', `translate(0 ${s.lid * 0.15}) rotate(${s.lid} 22 60)`);
      p.file.setAttribute('transform', `translate(0 ${s.fy})`);
      op(p.file, s.fOn);
    },
    {
      tap: tapSq('点按'),
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('lid', 6, 'snap');
        await c.wait(70);
        c.to('lid', -34, 'pop');
        await c.wait(160);
      }},
      archive: {label: '归档', pose: 'closed', from: 'open', async run(c) {
        c.set({fy: -26, fOn: 0});
        c.to('fOn', 1, 'fade');
        c.to('fy', -20, 'snap');
        await c.wait(80);
        c.to('fy', 12, 'impact');
        c.to('sq', 0.82, 'impact');
        await c.wait(110);
        c.to('lid', 0, 'snap');
        c.to('fOn', 0, 'fade');
        await c.wait(130);
      }},
      restore: {label: '取出', pose: 'open', from: 'closed', async run(c) {
        c.to('lid', -32, 'snap');
        c.set({fy: 10, fOn: 0});
        await c.wait(70);
        c.to('fOn', 1, 'fade');
        c.to('fy', -24, 'pop');
        await c.wait(150);
        c.to('fOn', 0, 'fade');
        await c.wait(90);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        c.to('lid', -36, 'snap');
        await c.wait(70);
        c.to('lid', 3, 'impact');
        c.to('sq', 0.86, 'impact');
        await c.wait(150);
      }}
    });

  add('clipboard',
    `<rect data-part="board" x="30" y="26" width="60" height="74" rx="8"/>
<rect x="46" y="16" width="28" height="16" rx="4"/>
<path data-part="lines" d="M42 48H78M42 60H72M42 72H64"/>
<g data-part="ghost"><rect x="38" y="32" width="48" height="58" rx="6"/></g>`,
    {draw: 1, gx: 0, gy: 0, go: 0},
    {idle: {draw: 1}, clear: {draw: 0}},
    (s, p) => {
      dash(p.lines, 96, s.draw);
      p.ghost.setAttribute('transform', `translate(${s.gx} ${s.gy})`);
      op(p.ghost, s.go);
    },
    {
      tap: tapSq('点按'),
      copy: {label: '复制', async run(c) {
        c.to('draw', 0, 'snap');
        await c.wait(60);
        c.to('draw', 1, 'draw');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }},
      paste: {label: '粘贴', async run(c) {
        c.set({gx: 0, gy: 0, go: 0});
        c.to('go', 0.9, 'fade');
        await c.wait(60);
        c.to('gx', 16, 'pop');
        c.to('gy', -18, 'pop');
        await c.wait(150);
        c.to('go', 0, 'fade');
        await c.wait(90);
      }},
      clear: {label: '清空', pose: 'clear', from: 'idle', async run(c) {
        c.to('draw', 0, 'fade');
        c.to('sq', 0.86, 'impact');
        await c.wait(160);
      }}
    });

  add('filter',
    `<path data-part="funnel" d="M30 34H90L66 60V80H54V60Z"/>
<circle data-part="b0" data-fill cx="40" cy="22" r="3.5"/>
<circle data-part="b1" data-fill cx="60" cy="22" r="3.5"/>
<circle data-part="b2" data-fill cx="80" cy="22" r="3.5"/>
<path d="M38 98H82"/><circle data-part="knob" data-fill cx="60" cy="98" r="4"/>`,
    {y0: 0, y1: 0, y2: 0, o0: 1, o1: 1, o2: 1, kx: 0},
    {idle: {}, applied: {y0: 28, y1: 66, y2: 28, o0: 0.22, o2: 0.22}},
    (s, p) => {
      p.body.setAttribute('transform', '');
      p.funnel.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.15, s.sq, 60, 80));
      const half = 6 + Math.max(-12, Math.min(12, s.kx)) * 0.18;
      p.funnel.setAttribute('d', `M30 34H90L${60 + half} 60V80H${60 - half}V60Z`);
      [0, 1, 2].forEach(i => {
        p['b' + i].setAttribute('transform', `translate(0 ${s['y' + i]})`);
        op(p['b' + i], s['o' + i]);
      });
      p.knob.setAttribute('transform', `translate(${s.kx} 0)`);
    },
    {
      tap: tapSq('点按'),
      apply: {label: '筛选', pose: 'applied', from: 'idle', async run(c) {
        c.to('y0', 28, 'gentle');
        await c.wait(65);
        c.to('y1', 66, 'gentle');
        c.to('o0', 0.22, 'fade');
        await c.wait(65);
        c.to('y2', 28, 'gentle');
        c.to('o2', 0.22, 'fade');
        await c.wait(150);
        c.to('sq', 0.95, 'impact');
        await c.wait(100);
      }},
      adjust: {label: '调节', async run(c) {
        c.to('kx', -10, 'snap');
        await c.wait(110);
        c.to('kx', 10, 'gentle');
        await c.wait(130);
        c.to('kx', c.goal('kx'), 'gentle');
        await c.wait(100);
      }},
      clear: {label: '清除', pose: 'idle', from: 'applied', async run(c) {
        c.to('y1', 0, 'gentle');
        await c.wait(60);
        c.to('y0', 0, 'gentle');
        c.to('o0', 1, 'fade');
        await c.wait(60);
        c.to('y2', 0, 'gentle');
        c.to('o2', 1, 'fade');
        c.to('kx', 0, 'gentle');
        await c.wait(150);
      }}
    });

  add('sort',
    `<path data-part="l1" d="M30 34H64"/>
<path data-part="l2" d="M30 58H86"/>
<path data-part="l3" d="M30 82H102"/>`,
    {y1: 0, y2: 0, y3: 0},
    {ascending: {}, descending: {y1: 48, y3: -48}, mixed: {y1: 24, y2: -24, y3: 12}},
    (s, p) => {
      p.l1.setAttribute('transform', `translate(0 ${s.y1})`);
      p.l2.setAttribute('transform', `translate(0 ${s.y2})`);
      p.l3.setAttribute('transform', `translate(0 ${s.y3})`);
    },
    {
      tap: tapSq('点按'),
      ascending: {label: '升序', pose: 'ascending', from: 'descending', async run(c) {
        c.to('y2', -10, 'snap');
        c.to('y1', 0, 'snap');
        c.to('y3', 0, 'snap');
        await c.wait(80);
        c.to('y2', 0, 'pop');
        await c.wait(150);
      }},
      descending: {label: '降序', pose: 'descending', from: 'ascending', async run(c) {
        c.to('y1', 52, 'snap');
        c.to('y3', -52, 'snap');
        c.to('y2', 8, 'snap');
        await c.wait(140);
        c.to('y2', 0, 'rebound');
        await c.wait(140);
      }},
      reorder: {label: '重排', pose: 'mixed', from: 'ascending', async run(c) {
        c.to('y1', 28, 'snap');
        c.to('y2', -28, 'snap');
        c.to('y3', 16, 'snap');
        await c.wait(160);
      }}
    });

  add('star',
    `<path data-part="fill" data-fill d="M60 20L73 48H102L78 66L86 96L60 80L34 96L42 66L18 48H47Z"/>
<path data-part="edge" d="M60 20L73 48H102L78 66L86 96L60 80L34 96L42 66L18 48H47Z"/>`,
    {fill: 0},
    {off: {}, on: {fill: 1}},
    (s, p) => {
      p.body.setAttribute('transform', around(s.sq));
      op(p.fill, s.fill);
    },
    {
      tap: tapSq('点按'),
      favourite: {label: '收藏', pose: 'on', from: 'off', async run(c) {
        c.to('sq', 0.72, 'impact');
        c.to('fill', 0, 'snap');
        await c.wait(80);
        c.to('fill', 1, 'pop');
        c.to('sq', 1.12, 'pop');
        await c.wait(170);
      }},
      unfavourite: {label: '取消收藏', pose: 'off', from: 'on', async run(c) {
        c.to('sq', 1.08, 'snap');
        await c.wait(70);
        c.to('fill', 0, 'fade');
        c.to('sq', 0.84, 'impact');
        await c.wait(150);
      }},
      highlight: {label: '强调', async run(c) {
        c.to('sq', 1.16, 'pop');
        await c.wait(140);
        c.to('sq', 0.9, 'rebound');
        await c.wait(140);
      }}
    });

  add('mail',
    `<path data-part="body2" d="M22 42H98V90H22Z"/>
<path data-part="flap" d="M22 42L60 68L98 42"/>
<g data-part="letter"><rect x="36" y="28" width="48" height="28" rx="4"/><path d="M44 40H76M44 48H68"/></g>`,
    {flap: 1, ly: 0, lOn: 0, drop: 0},
    {idle: {}, open: {flap: 0.15}, sent: {}},
    (s, p) => {
      p.flap.setAttribute('transform', aroundXY(1, Math.max(0.08, s.flap), 60, 42));
      p.letter.setAttribute('transform', `translate(${s.drop} ${s.ly})`);
      op(p.letter, s.lOn);
    },
    {
      tap: tapSq('点按'),
      receive: {label: '收信', async run(c) {
        c.set({ly: -22, lOn: 0, flap: 1});
        c.to('flap', 0.2, 'snap');
        c.to('lOn', 1, 'fade');
        await c.wait(70);
        c.to('ly', 16, 'impact');
        c.to('sq', 0.84, 'impact');
        await c.wait(120);
        c.to('flap', 1, 'snap');
        c.to('lOn', 0, 'fade');
        await c.wait(140);
      }},
      open: {label: '拆开', pose: 'open', from: 'idle', async run(c) {
        c.to('flap', 1.05, 'snap');
        await c.wait(60);
        c.to('flap', 0.12, 'pop');
        c.set({ly: 8, lOn: 0});
        c.to('lOn', 1, 'fade');
        c.to('ly', -8, 'pop');
        await c.wait(170);
      }},
      send: {label: '寄出', async run(c) {
        c.to('flap', 0.2, 'snap');
        c.set({ly: 6, lOn: 0, drop: 0});
        c.to('lOn', 1, 'fade');
        await c.wait(60);
        c.to('ly', -24, 'pop');
        c.to('drop', 18, 'snap');
        await c.wait(140);
        c.to('lOn', 0, 'fade');
        c.to('flap', 1, 'snap');
        await c.wait(100);
        c.set({ly: 10, drop: -12, lOn: 0});
      }},
      archive: {label: '归档', async run(c) {
        c.to('drop', 0, 'snap');
        c.to('ly', 8, 'snap');
        await c.wait(70);
        c.to('ly', 22, 'impact');
        c.to('sq', 0.8, 'impact');
        await c.wait(150);
      }}
    });

  add('phone',
    `<g data-part="hand"><rect x="44" y="18" width="32" height="84" rx="16"/></g>`,
    {angle: 0, y: 0},
    {idle: {}, answered: {angle: 26}},
    (s, p) => {
      p.hand.setAttribute('transform', `translate(0 ${s.y}) rotate(${-30 + s.angle} 60 60)`);
    },
    {
      tap: tapSq('点按'),
      ring: {label: '响铃', async run(c) {
        c.to('angle', -18, 'snap');
        await c.wait(80);
        c.to('angle', 16, 'pop');
        await c.wait(90);
        c.to('angle', -12, 'snap');
        await c.wait(80);
        c.to('angle', 0, 'rebound');
        await c.wait(120);
      }},
      ringing: {label: '响铃中', loop: true, run(c) {
        c.claim('angle');
        c.loop(t => { c.s.angle = 16 * Math.sin(t * Math.PI * 2 * 2); });
      }},
      answer: {label: '接听', pose: 'answered', from: 'idle', async run(c) {
        c.to('angle', 8, 'snap');
        c.to('y', 6, 'snap');
        await c.wait(80);
        c.to('angle', 30, 'pop');
        c.to('y', -4, 'rebound');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }},
      hangup: {label: '挂断', pose: 'idle', from: 'answered', async run(c) {
        c.to('y', -8, 'snap');
        await c.wait(70);
        c.to('angle', -8, 'impact');
        c.to('y', 10, 'impact');
        await c.wait(150);
      }},
      reject: {label: '拒接', pose: 'idle', async run(c) {
        c.to('angle', 18, 'impact');
        c.error();
        await c.wait(90);
        c.to('angle', -14, 'rebound');
        c.to('y', 8, 'snap');
        await c.wait(150);
      }}
    });

  add('video-call',
    `<g data-part="cam"><rect x="16" y="38" width="68" height="46" rx="10"/><path d="M84 50L98 42V80L84 72Z"/></g>
<path data-part="slash" d="M28 32L96 96"/>`,
    {slash: 0, x: 0, dim: 1},
    {idle: {}, off: {slash: 1, dim: 0.35}},
    (s, p) => {
      p.cam.setAttribute('transform', `translate(${s.x} 0)`);
      op(p.cam, s.dim);
      dash(p.slash, 100, s.slash);
    },
    {
      tap: tapSq('点按'),
      join: {label: '加入', async run(c) {
        c.set({sq: 0.6, dim: 0});
        c.to('dim', 1, 'fade');
        c.to('sq', 1.08, 'pop');
        await c.wait(170);
      }},
      leave: {label: '离开', async run(c) {
        c.to('x', -12, 'snap');
        await c.wait(70);
        c.to('x', 14, 'snap');
        c.to('dim', 0, 'fade');
        await c.wait(140);
        c.set({x: -20, dim: 0});
      }},
      cameraOff: {label: '关闭镜头', pose: 'off', from: 'idle', async run(c) {
        c.to('slash', 1, 'draw');
        c.to('dim', 0.35, 'fade');
        c.to('sq', 0.9, 'impact');
        await c.wait(170);
      }},
      cameraOn: {label: '打开镜头', pose: 'idle', from: 'off', async run(c) {
        c.to('slash', 0, 'fade');
        c.to('dim', 1, 'pop');
        c.to('sq', 1.06, 'pop');
        await c.wait(160);
      }}
    });

  add('share',
    `<path data-part="box" d="M42 50H30A8 8 0 0 0 22 58V92A8 8 0 0 0 30 100H90A8 8 0 0 0 98 92V58A8 8 0 0 0 90 50H78"/>
<g data-part="arrow"><path d="M60 78V34"/><path d="M44 48L60 32L76 48"/></g>
<g data-part="mini"><rect x="70" y="70" width="22" height="14" rx="7"/></g>`,
    {ay: 0, ao: 1, mo: 0, my: 0},
    {idle: {}, open: {ay: -8}},
    (s, p) => {
      p.arrow.setAttribute('transform', `translate(0 ${s.ay})`);
      op(p.arrow, s.ao);
      p.mini.setAttribute('transform', `translate(0 ${s.my})`);
      op(p.mini, s.mo);
    },
    {
      tap: tapSq('点按'),
      open: {label: '展开', pose: 'open', from: 'idle', async run(c) {
        c.to('ay', 8, 'snap');
        await c.wait(70);
        c.to('ay', -18, 'pop');
        await c.wait(150);
      }},
      share: {label: '分享', async run(c) {
        c.to('ay', 10, 'snap');
        await c.wait(70);
        c.to('ay', -24, 'pop');
        await c.wait(140);
        c.to('ao', 0, 'fade');
        await c.wait(80);
        c.set({ay: 16, ao: 0});
      }},
      copyLink: {label: '复制链接', async run(c) {
        c.set({mo: 0, my: 0});
        c.to('mo', 1, 'fade');
        c.to('sq', 0.9, 'impact');
        await c.wait(70);
        c.to('my', -22, 'pop');
        await c.wait(140);
        c.to('mo', 0, 'fade');
        await c.wait(90);
      }},
      close: {label: '收起', pose: 'idle', from: 'open', async run(c) {
        c.to('ay', -16, 'snap');
        await c.wait(70);
        c.to('ay', 6, 'impact');
        c.to('sq', 0.88, 'impact');
        await c.wait(140);
      }}
    });

  add('qr-scan',
    `<path data-part="corners" d="M24 40V24H40M96 40V24H80M24 80V96H40M96 80V96H80"/>
<g data-part="code"><rect data-fill x="40" y="40" width="8" height="8"/><rect data-fill x="54" y="40" width="8" height="8"/><rect data-fill x="72" y="44" width="8" height="8"/><rect data-fill x="42" y="56" width="8" height="8"/><rect data-fill x="60" y="58" width="10" height="10"/><rect data-fill x="74" y="70" width="8" height="8"/><rect data-fill x="46" y="74" width="8" height="8"/></g>
<path data-part="line" d="M30 36H90"/>`,
    {line: 0, lineOn: 0, code: 1},
    {idle: {}, found: {code: 1}, rejected: {}},
    (s, p) => {
      p.line.setAttribute('transform', `translate(0 ${s.line})`);
      op(p.line, s.lineOn);
      op(p.code, s.code);
      p.code.setAttribute('transform', around(0.86 + 0.14 * clamp01(s.code), 60, 60));
    },
    {
      tap: tapSq('点按'),
      scan: {label: '扫描', async run(c) {
        c.to('lineOn', 1, 'fade');
        c.to('line', 0, 'snap');
        await c.wait(50);
        c.to('line', 52, 'snap');
        await c.wait(160);
        c.to('lineOn', 0, 'fade');
        await c.wait(80);
      }},
      scanning: {label: '扫描中', loop: true, run(c) {
        c.claim('line', 'lineOn');
        c.loop(t => {
          const w = (t * 0.85) % 1;
          c.s.line = 8 + w * 48;
          c.s.lineOn = w < 0.9 ? 1 : (1 - w) / 0.1;
        });
      }},
      detected: {label: '认出', pose: 'found', async run(c) {
        c.to('lineOn', 1, 'fade');
        c.to('line', 28, 'snap');
        await c.wait(100);
        c.to('code', 1.2, 'pop');
        c.to('sq', 0.9, 'impact');
        c.to('lineOn', 0, 'fade');
        await c.wait(160);
      }},
      rejected: {label: '没认出', async run(c) {
        c.to('line', 22, 'impact');
        c.error();
        c.to('lineOn', 1, 'fade');
        await c.wait(90);
        c.to('line', 6, 'rebound');
        c.to('code', 0.7, 'snap');
        await c.wait(140);
        c.to('lineOn', 0, 'fade');
        await c.wait(80);
      }}
    },
    {task: {busy: 'scanning', success: 'detected', fail: 'rejected'}});

  add('wallet',
    `<path data-part="purse" d="M22 50H98V94A8 8 0 0 1 90 102H30A8 8 0 0 1 22 94Z"/>
<path data-part="flap" d="M22 50H98V36A8 8 0 0 0 90 28H30A8 8 0 0 0 22 36Z"/>
<g data-part="card"><rect x="34" y="46" width="52" height="24" rx="4"/><path d="M42 56H70"/></g>`,
    {flap: 0, fy: 0, cy: 0, cOn: 0},
    {closed: {}, open: {flap: -34, fy: -10, cOn: 1, cy: -12}},
    (s, p) => {
      bodyAt(p, s, 60, 102);
      p.flap.setAttribute('transform', `translate(0 ${s.fy}) rotate(${s.flap} 60 50)`);
      p.card.setAttribute('transform', `translate(0 ${s.cy})`);
      op(p.card, s.cOn);
    },
    {
      tap: tapSq('点按'),
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('flap', 6, 'snap');
        await c.wait(70);
        c.to('flap', -36, 'pop');
        c.to('fy', -12, 'pop');
        c.set({cy: 8, cOn: 0});
        c.to('cOn', 1, 'fade');
        c.to('cy', -16, 'pop');
        await c.wait(170);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        c.to('cy', 8, 'snap');
        c.to('cOn', 0, 'fade');
        await c.wait(70);
        c.to('flap', 4, 'impact');
        c.to('fy', 0, 'impact');
        c.to('sq', 0.86, 'impact');
        await c.wait(150);
      }},
      insertCard: {label: '放入卡片', pose: 'closed', from: 'open', async run(c) {
        c.set({cy: -28, cOn: 0});
        c.to('cOn', 1, 'fade');
        c.to('cy', -24, 'snap');
        await c.wait(70);
        c.to('cy', 10, 'impact');
        c.to('sq', 0.8, 'impact');
        await c.wait(110);
        c.to('cOn', 0, 'fade');
        c.to('flap', 0, 'snap');
        c.to('fy', 0, 'snap');
        await c.wait(140);
      }},
      takeCard: {label: '取出卡片', pose: 'open', from: 'closed', async run(c) {
        c.to('flap', -36, 'snap');
        c.to('fy', -12, 'snap');
        c.set({cy: 6, cOn: 0});
        await c.wait(70);
        c.to('cOn', 1, 'fade');
        c.to('cy', -22, 'pop');
        await c.wait(160);
      }}
    });

  add('cart',
    `<g data-part="rig">
<path data-part="basket" d="M30 44H96L88 78H38Z"/>
<path d="M38 44L30 30H20"/>
<g data-part="item"><rect x="50" y="26" width="22" height="16" rx="3"/></g>
<g data-part="w1"><circle cx="46" cy="90" r="7"/><path d="M46 84V96M40 90H52"/></g>
<g data-part="w2"><circle cx="78" cy="90" r="7"/><path d="M78 84V96M72 90H84"/></g>
</g>`,
    {x: 0, roll: 0, iy: 0, io: 0},
    {idle: {}},
    (s, p) => {
      p.body.setAttribute('transform', '');
      p.rig.setAttribute('transform', `translate(${s.x} 0) ${aroundXY(1 + (1 - s.sq) * 0.45, s.sq, 60, 96)}`);
      p.item.setAttribute('transform', `translate(0 ${s.iy})`);
      op(p.item, s.io);
      p.w1.setAttribute('transform', `rotate(${s.roll} 46 90)`);
      p.w2.setAttribute('transform', `rotate(${s.roll} 78 90)`);
    },
    {
      tap: tapSq('点按'),
      add: {label: '放入', async run(c) {
        c.set({iy: -22, io: 0});
        c.to('io', 1, 'fade');
        c.to('iy', -24, 'snap');
        await c.wait(60);
        c.to('iy', 6, 'impact');
        c.to('sq', 0.76, 'impact');
        c.to('x', 12, 'snap');
        c.to('roll', 42, 'snap');
        await c.wait(150);
        c.to('io', 0, 'fade');
        await c.wait(80);
      }},
      remove: {label: '取出', async run(c) {
        c.set({iy: 4, io: 0});
        c.to('io', 1, 'fade');
        c.to('iy', 0, 'snap');
        await c.wait(60);
        c.to('iy', -20, 'pop');
        c.to('sq', 0.9, 'snap');
        await c.wait(140);
        c.to('io', 0, 'fade');
        await c.wait(80);
      }},
      checkout: {label: '结账', async run(c) {
        c.to('x', -6, 'snap');
        c.to('roll', -12, 'snap');
        await c.wait(70);
        c.to('x', 16, 'pop');
        c.to('roll', 50, 'pop');
        c.to('sq', 0.82, 'impact');
        await c.wait(160);
      }}
    });

  add('calendar',
    `<rect data-part="board" x="22" y="26" width="76" height="74" rx="10"/>
<path d="M22 44H98M40 18V34M80 18V34"/>
<g data-part="page"><rect x="32" y="52" width="56" height="38" rx="4"/><path d="M40 64H78M40 74H70M40 84H60"/></g>
<circle data-part="dot" data-fill cx="48" cy="66" r="4"/>`,
    {leaf: 0, pageOn: 1, dot: 0},
    {idle: {}, marked: {dot: 1}},
    (s, p) => {
      const scale = Math.max(0.08, 1 - clamp01(s.leaf));
      p.page.setAttribute('transform', aroundXY(scale, 1, 32, 70));
      op(p.page, s.pageOn);
      op(p.dot, s.dot * s.pageOn);
      p.dot.setAttribute('transform', around(0.4 + 0.6 * clamp01(s.dot), 48, 66));
    },
    {
      tap: tapSq('点按'),
      next: {label: '下个月', async run(c) {
        c.to('leaf', 1, 'snap');
        c.to('pageOn', 1, 'fade');
        await c.wait(140);
        c.set({leaf: 1, pageOn: 0});
        c.set({leaf: 0});
        c.to('pageOn', 1, 'fade');
        await c.wait(120);
      }},
      previous: {label: '上个月', async run(c) {
        c.set({leaf: 1, pageOn: 0});
        c.to('pageOn', 1, 'fade');
        c.to('leaf', 0, 'pop');
        await c.wait(180);
      }},
      addEvent: {label: '添加', pose: 'marked', from: 'idle', async run(c) {
        c.to('dot', 1, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }},
      removeEvent: {label: '移除', pose: 'idle', from: 'marked', async run(c) {
        c.to('dot', 0, 'fade');
        c.to('leaf', 0.35, 'snap');
        await c.wait(100);
        c.to('leaf', 0, 'rebound');
        await c.wait(140);
      }}
    });

  add('receipt',
    `<g data-part="slip">
<g data-part="top"><path d="M34 26H86V58H34Z"/></g>
<g data-part="bottom"><path d="M34 60H86V98H34Z"/><path d="M42 72H78M42 82H70"/></g>
</g>`,
    {y: 0, ty: 0, tilt: 0, gap: 0},
    {idle: {}},
    (s, p) => {
      p.slip.setAttribute('transform', `translate(0 ${s.y}) rotate(${s.tilt} 60 70)`);
      p.top.setAttribute('transform', `translate(0 ${s.ty}) rotate(${s.gap} 60 58)`);
    },
    {
      tap: tapSq('点按'),
      print: {label: '出纸', async run(c) {
        c.set({y: 22});
        c.to('y', 18, 'snap');
        await c.wait(60);
        c.to('y', -8, 'pop');
        await c.wait(160);
      }},
      tear: {label: '撕开', async run(c) {
        c.to('ty', 4, 'snap');
        await c.wait(70);
        c.to('ty', -16, 'pop');
        c.to('gap', 16, 'snap');
        await c.wait(160);
      }},
      jam: {label: '卡住', async run(c) {
        c.to('y', -10, 'impact');
        c.to('tilt', 10, 'snap');
        c.error();
        await c.wait(100);
        c.to('y', 8, 'rebound');
        c.to('sq', 0.84, 'impact');
        await c.wait(150);
      }}
    });

  add('gift',
    `<g data-part="box"><rect x="28" y="54" width="64" height="42" rx="6"/><path d="M60 54V96M28 72H92"/></g>
<g data-part="lid"><rect x="22" y="40" width="76" height="16" rx="4"/><path d="M60 40C60 26 44 24 46 36M60 40C60 26 76 24 74 36"/></g>`,
    {tilt: 0, y: 0, lid: 0, ly: 0},
    {closed: {}, open: {lid: -30, ly: -12}},
    (s, p) => {
      p.body.setAttribute('transform', `translate(0 ${s.y}) rotate(${s.tilt} 60 96) ${aroundXY(1 + (1 - s.sq) * 0.3, s.sq, 60, 96)}`);
      p.lid.setAttribute('transform', `translate(0 ${s.ly}) rotate(${s.lid} 22 48)`);
    },
    {
      tap: tapSq('点按'),
      shake: {label: '摇一摇', async run(c) {
        c.to('tilt', -16, 'snap');
        c.to('y', -8, 'snap');
        await c.wait(90);
        c.to('tilt', 18, 'pop');
        c.to('y', 4, 'pop');
        await c.wait(110);
        c.to('tilt', -12, 'snap');
        await c.wait(90);
        c.to('tilt', 0, 'rebound');
        c.to('y', 0, 'rebound');
        await c.wait(140);
      }},
      open: {label: '打开', pose: 'open', from: 'closed', async run(c) {
        c.to('lid', 6, 'snap');
        c.to('y', 4, 'snap');
        await c.wait(80);
        c.to('lid', -34, 'pop');
        c.to('ly', -14, 'pop');
        await c.wait(170);
      }},
      close: {label: '合上', pose: 'closed', from: 'open', async run(c) {
        c.to('ly', -22, 'snap');
        await c.wait(60);
        c.to('lid', 4, 'impact');
        c.to('ly', 0, 'impact');
        c.to('sq', 0.82, 'impact');
        await c.wait(150);
      }}
    });

  add('shield',
    `<g data-part="plate"><path d="M60 20L94 35V58C94 81 77 98 60 103C43 98 26 81 26 58V35Z"/>
<path data-part="mark" d="M44 60L56 72L78 48"/></g>`,
    {draw: 0, tilt: 0},
    {idle: {}, verified: {draw: 1}, alerted: {tilt: -8}},
    (s, p) => {
      p.plate.setAttribute('transform', `rotate(${s.tilt} 60 103) ${aroundXY(1 + (1 - s.sq) * 0.2, s.sq, 60, 103)}`);
      p.body.setAttribute('transform', '');
      dash(p.mark, 52, s.draw);
    },
    {
      tap: tapSq('点按'),
      protect: {label: '护住', async run(c) {
        c.set({sq: 0.72});
        c.to('sq', 1.1, 'pop');
        c.to('tilt', -6, 'snap');
        await c.wait(150);
        c.to('tilt', 0, 'rebound');
        await c.wait(120);
      }},
      alert: {label: '警示', pose: 'alerted', from: 'idle', async run(c) {
        c.to('tilt', -14, 'snap');
        await c.wait(90);
        c.to('tilt', 6, 'rebound');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }},
      verified: {label: '核验', pose: 'verified', from: 'idle', async run(c) {
        c.to('sq', 0.86, 'impact');
        c.to('draw', 0, 'snap');
        await c.wait(60);
        c.to('draw', 1, 'draw');
        c.to('sq', 1.06, 'pop');
        await c.wait(170);
      }}
    });

  add('key',
    `<g data-part="key"><circle cx="30" cy="60" r="14"/><path d="M44 60H82"/><path d="M68 60V72M78 60V68"/></g>
<path data-part="hole" d="M96 46V74"/>`,
    {x: 0, turn: 0, gap: 0},
    {idle: {}, in: {x: 14}, open: {x: 14, turn: -42, gap: 1}},
    (s, p) => {
      const depth = Math.max(0.32, Math.cos(s.turn * Math.PI / 180));
      p.key.setAttribute('transform', `translate(${s.x} 0) ${aroundXY(1, depth, 82, 60)}`);
      p.hole.setAttribute('transform', aroundXY(1, 1 + s.gap * 0.35, 96, 60));
    },
    {
      tap: tapSq('点按'),
      insert: {label: '插入', pose: 'in', from: 'idle', async run(c) {
        c.to('x', -8, 'snap');
        await c.wait(70);
        c.to('x', 16, 'impact');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }},
      turn: {label: '转动', from: 'in', async run(c) {
        c.to('turn', -62, 'snap');
        await c.wait(140);
        c.to('turn', 0, 'rebound');
        await c.wait(150);
      }},
      unlock: {label: '打开', pose: 'open', from: 'in', async run(c) {
        c.to('turn', -58, 'snap');
        await c.wait(120);
        c.to('gap', 1, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }}
    });

  add('passcode',
    `<g data-part="row">
<circle cx="24" cy="60" r="8"/><circle data-part="f0" data-fill cx="24" cy="60" r="5"/>
<circle cx="48" cy="60" r="8"/><circle data-part="f1" data-fill cx="48" cy="60" r="5"/>
<circle cx="72" cy="60" r="8"/><circle data-part="f2" data-fill cx="72" cy="60" r="5"/>
<circle cx="96" cy="60" r="8"/><circle data-part="f3" data-fill cx="96" cy="60" r="5"/>
</g>
<path data-part="ok" d="M36 88H84"/>`,
    {d0: 0, d1: 0, d2: 0, d3: 0, dy: 0, ok: 0},
    {empty: {}, entered: {d0: 1, d1: 1, d2: 1, d3: 1}, verified: {d0: 1, d1: 1, d2: 1, d3: 1, ok: 1}},
    (s, p) => {
      p.row.setAttribute('transform', `translate(0 ${s.dy})`);
      [0, 1, 2, 3].forEach(i => {
        const v = clamp01(s['d' + i]);
        op(p['f' + i], v);
        p['f' + i].setAttribute('transform', around(0.3 + 0.7 * v, 24 + i * 24, 60));
      });
      dash(p.ok, 48, s.ok);
    },
    {
      tap: tapSq('点按'),
      input: {label: '输入', pose: 'entered', from: 'empty', async run(c) {
        c.to('d0', 1, 'pop');
        await c.wait(70);
        c.to('d1', 1, 'pop');
        await c.wait(70);
        c.to('d2', 1, 'pop');
        await c.wait(70);
        c.to('d3', 1, 'pop');
        c.to('sq', 0.92, 'impact');
        await c.wait(140);
      }},
      verify: {label: '核对', pose: 'verified', from: 'entered', async run(c) {
        c.to('d0', 1, 'snap');
        c.to('d1', 1, 'snap');
        c.to('d2', 1, 'snap');
        c.to('d3', 1, 'snap');
        c.to('sq', 0.84, 'impact');
        await c.wait(90);
        c.to('ok', 1, 'draw');
        c.to('sq', 1.04, 'pop');
        await c.wait(170);
      }},
      reject: {label: '拒绝', pose: 'empty', from: 'entered', async run(c) {
        c.to('dy', -16, 'impact');
        c.error();
        await c.wait(100);
        c.to('dy', 8, 'rebound');
        c.to('d0', 0, 'fade');
        c.to('d1', 0, 'fade');
        c.to('d2', 0, 'fade');
        c.to('d3', 0, 'fade');
        c.to('ok', 0, 'fade');
        await c.wait(160);
      }},
      clear: {label: '清除', pose: 'empty', from: 'entered', async run(c) {
        c.to('d3', 0, 'fade');
        await c.wait(50);
        c.to('d2', 0, 'fade');
        c.to('d1', 0, 'fade');
        c.to('d0', 0, 'fade');
        c.to('ok', 0, 'fade');
        await c.wait(140);
      }}
    });

  add('two-factor',
    `<rect data-part="phone" x="36" y="16" width="48" height="88" rx="10"/>
<g data-part="badge"><rect x="46" y="40" width="28" height="34" rx="6"/><path data-part="code" d="M52 52H68M52 62H66"/></g>`,
    {by: 0, bScale: 0, code: 0, dim: 1},
    {idle: {}, shown: {bScale: 1, by: 0, code: 1}, expired: {dim: 0.4, bScale: 0, code: 0}},
    (s, p) => {
      op(p.phone, s.dim);
      p.badge.setAttribute('transform', `translate(0 ${s.by}) ${around(Math.max(0.05, s.bScale), 60, 57)}`);
      op(p.badge, s.bScale);
      dash(p.code, 32, s.code);
    },
    {
      tap: tapSq('点按'),
      request: {label: '请求', pose: 'shown', from: 'idle', async run(c) {
        c.set({by: -20, bScale: 0.2});
        c.to('bScale', 1, 'pop');
        c.to('by', 6, 'impact');
        await c.wait(120);
        c.to('by', 0, 'rebound');
        c.to('code', 1, 'draw');
        await c.wait(150);
      }},
      verify: {label: '核对', pose: 'shown', from: 'shown', async run(c) {
        c.to('code', 1, 'draw');
        c.to('bScale', 0.84, 'impact');
        await c.wait(100);
        c.to('bScale', 1.08, 'pop');
        c.to('sq', 0.92, 'impact');
        await c.wait(150);
      }},
      expire: {label: '过期', pose: 'expired', from: 'shown', async run(c) {
        c.to('by', 18, 'snap');
        c.to('bScale', 0.4, 'fade');
        c.to('code', 0, 'fade');
        c.to('dim', 0.4, 'fade');
        await c.wait(170);
      }}
    });

  add('permission',
    `<rect data-part="track" x="18" y="40" width="84" height="40" rx="20"/>
<circle data-part="knob" data-fill cx="40" cy="60" r="12"/>`,
    {x: 0},
    {idle: {}, granted: {x: 36}},
    (s, p) => {
      p.knob.setAttribute('transform', `translate(${s.x} 0)`);
      p.track.setAttribute('transform', aroundXY(1, s.sq, 60, 60));
      p.body.setAttribute('transform', '');
    },
    {
      tap: {label: '点按', async run(c) {
        c.to('sq', 0.86, 'impact');
        c.to('x', c.goal('x') + 6, 'snap');
        await c.wait(100);
        c.to('x', c.goal('x'), 'rebound');
        await c.wait(130);
      }},
      request: {label: '请求', async run(c) {
        c.to('x', c.goal('x') - 8, 'snap');
        await c.wait(80);
        c.to('x', c.goal('x') + 14, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(140);
      }},
      grant: {label: '允许', pose: 'granted', from: 'idle', async run(c) {
        c.to('x', -6, 'snap');
        await c.wait(70);
        c.to('x', 40, 'pop');
        c.to('sq', 0.88, 'impact');
        await c.wait(160);
      }},
      deny: {label: '拒绝', pose: 'idle', from: 'idle', async run(c) {
        c.to('x', 18, 'impact');
        c.error();
        await c.wait(100);
        c.to('x', -6, 'rebound');
        c.to('sq', 0.86, 'impact');
        await c.wait(150);
      }},
      revoke: {label: '收回', pose: 'idle', from: 'granted', async run(c) {
        c.to('x', 42, 'snap');
        await c.wait(60);
        c.to('x', 0, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }}
    });

  add('secure-connection',
    `<circle data-part="left" cx="26" cy="60" r="12"/>
<circle data-part="right" cx="94" cy="60" r="12"/>
<path data-part="wire" d="M38 60H82"/>
<g data-part="lock"><rect x="50" y="50" width="20" height="16" rx="3"/><path d="M54 50V44A6 6 0 0 1 66 44V50"/></g>`,
    {wire: 1, lock: 1, ly: 0, gap: 0},
    {secured: {}, open: {lock: 0}, lost: {wire: 0.2, lock: 0, ly: 16, gap: 1}},
    (s, p) => {
      dash(p.wire, 44, s.wire * (1 - s.gap * 0.65));
      p.lock.setAttribute('transform', `translate(0 ${s.ly}) ${around(0.4 + 0.6 * clamp01(s.lock), 60, 54)}`);
      op(p.lock, s.lock);
    },
    {
      tap: tapSq('点按'),
      establish: {label: '建立', pose: 'open', from: 'lost', async run(c) {
        c.to('ly', 0, 'snap');
        c.to('gap', 0, 'snap');
        c.to('wire', 1, 'draw');
        await c.wait(170);
      }},
      secure: {label: '锁上', pose: 'secured', from: 'open', async run(c) {
        c.to('wire', 1, 'draw');
        c.set({lock: 0.2, ly: -16});
        c.to('lock', 1, 'pop');
        c.to('ly', 4, 'impact');
        await c.wait(120);
        c.to('ly', 0, 'rebound');
        c.to('sq', 0.9, 'impact');
        await c.wait(140);
      }},
      lost: {label: '断开', pose: 'lost', from: 'secured', async run(c) {
        c.to('gap', 1, 'snap');
        c.to('ly', -8, 'snap');
        c.error();
        await c.wait(80);
        c.to('ly', 18, 'impact');
        c.to('lock', 0, 'fade');
        c.to('wire', 0.2, 'fade');
        await c.wait(160);
      }}
    });

  add('camera',
    `<g data-part="cam"><rect x="16" y="40" width="88" height="52" rx="12"/><path d="M40 40L48 26H72L80 40"/></g>
<circle data-part="lens" cx="60" cy="68" r="16"/>
<circle data-part="blade" cx="60" cy="68" r="14"/>`,
    {wide: 1, blade: 1, lens: 1},
    {idle: {}},
    (s, p) => {
      p.body.setAttribute('transform', aroundXY(s.wide, s.sq, 60, 64));
      p.blade.setAttribute('transform', aroundXY(1, Math.max(0.05, s.blade), 60, 68));
      p.lens.setAttribute('transform', around(s.lens, 60, 68));
    },
    {
      tap: tapSq('点按'),
      shutter: {label: '快门', async run(c) {
        c.to('blade', 0.06, 'snap');
        await c.wait(120);
        c.to('blade', 1, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(150);
      }},
      focus: {label: '对焦', async run(c) {
        c.to('lens', 1.35, 'snap');
        await c.wait(120);
        c.to('lens', 0.9, 'rebound');
        await c.wait(140);
      }},
      switchCamera: {label: '切换', async run(c) {
        c.to('wide', 0.06, 'snap');
        await c.wait(130);
        c.to('wide', 1, 'pop');
        await c.wait(160);
      }}
    });

  add('screen-recording',
    `<rect data-part="screen" x="20" y="22" width="80" height="58" rx="8"/>
<circle data-part="dot" data-fill cx="60" cy="100" r="8"/>`,
    {dot: 0.35, wide: 1, bar: 0},
    {idle: {dot: 0.35}, recording: {dot: 1}, paused: {dot: 1, bar: 1}},
    (s, p) => {
      const scale = 0.55 + 0.45 * clamp01(s.dot);
      p.dot.setAttribute('transform', aroundXY(s.bar ? 1.5 : scale, s.bar ? 0.45 : scale, 60, 100));
      op(p.dot, 0.25 + 0.75 * clamp01(s.dot));
      p.screen.setAttribute('transform', aroundXY(s.wide, 1, 60, 50));
    },
    {
      tap: tapSq('点按'),
      start: {label: '开始', pose: 'recording', from: 'idle', async run(c) {
        c.to('dot', 1, 'pop');
        c.to('wide', 0.92, 'impact');
        await c.wait(140);
        c.to('wide', 1, 'rebound');
        await c.wait(120);
      }},
      recording: {label: '录制中', loop: true, pose: 'recording', run(c) {
        c.claim('dot');
        c.loop(t => { c.s.dot = 0.55 + 0.45 * wave(t, 1.1); });
      }},
      pause: {label: '暂停', pose: 'paused', from: 'recording', async run(c) {
        c.to('bar', 1, 'snap');
        c.to('dot', 1, 'snap');
        await c.wait(150);
      }},
      resume: {label: '继续', pose: 'recording', from: 'paused', async run(c) {
        c.to('bar', 0, 'snap');
        c.to('dot', 1.2, 'pop');
        await c.wait(140);
      }},
      stop: {label: '停止', pose: 'idle', from: 'recording', async run(c) {
        c.to('dot', 0.2, 'fade');
        c.to('bar', 0, 'fade');
        c.to('sq', 0.88, 'impact');
        await c.wait(160);
      }}
    });

  add('ai-thinking',
    `<circle data-part="n0" cx="60" cy="28" r="8"/>
<circle data-part="n1" cx="28" cy="84" r="8"/>
<circle data-part="n2" cx="92" cy="84" r="8"/>
<path data-part="e0" d="M60 36L34 76"/>
<path data-part="e1" d="M60 36L86 76"/>
<path data-part="e2" d="M36 84H84"/>`,
    {e0: 1, e1: 1, e2: 1, n0: 0, n1: 0, n2: 0},
    {idle: {}, paused: {e0: 0.25, e1: 0.25, e2: 0.25, n0: 6, n1: -5, n2: 5}},
    (s, p) => {
      p.n0.setAttribute('transform', `translate(0 ${s.n0})`);
      p.n1.setAttribute('transform', `translate(${s.n1} 0)`);
      p.n2.setAttribute('transform', `translate(${s.n2} 0)`);
      const nodes = [[60, 28 + s.n0], [28 + s.n1, 84], [92 + s.n2, 84]];
      [[0, 1], [0, 2], [1, 2]].forEach(([a, b], i) => {
        const dx = nodes[b][0] - nodes[a][0], dy = nodes[b][1] - nodes[a][1];
        const length = Math.max(0.01, Math.hypot(dx, dy));
        const ux = dx / length, uy = dy / length;
        const x0 = nodes[a][0] + ux * 8, y0 = nodes[a][1] + uy * 8;
        const x1 = nodes[b][0] - ux * 8, y1 = nodes[b][1] - uy * 8;
        p['e' + i].setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`);
        dash(p['e' + i], Math.max(0.01, length - 16), s['e' + i]);
      });
    },
    {
      tap: tapSq('点按'),
      think: {label: '思考', async run(c) {
        c.set({e0: 0, e1: 0, e2: 0});
        c.to('n0', 9, 'snap');
        await c.wait(70);
        c.to('e0', 1, 'draw');
        c.to('n1', 7, 'snap');
        await c.wait(80);
        c.to('e1', 1, 'draw');
        c.to('n2', -7, 'snap');
        await c.wait(80);
        c.to('e2', 1, 'draw');
        c.to('n0', 0, 'pop');
        c.to('n1', 0, 'pop');
        c.to('n2', 0, 'pop');
        await c.wait(160);
      }},
      pause: {label: '暂停', pose: 'paused', from: 'idle', async run(c) {
        c.to('n0', 6, 'snap');
        c.to('n1', -5, 'snap');
        c.to('n2', 5, 'snap');
        c.to('e0', 0.25, 'fade');
        c.to('e1', 0.25, 'fade');
        c.to('e2', 0.25, 'fade');
        await c.wait(180);
      }},
      finish: {label: '完成', pose: 'idle', from: 'paused', async run(c) {
        c.to('e0', 1, 'draw');
        c.to('e1', 1, 'draw');
        c.to('e2', 1, 'draw');
        c.to('n0', 0, 'pop');
        c.to('n1', 0, 'pop');
        c.to('n2', 0, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(180);
      }}
    });

  add('ai-browsing',
    `<defs><clipPath id="mi-catalog-browser"><rect x="24" y="46" width="72" height="44" rx="3"/></clipPath></defs>
<g data-part="window"><rect x="18" y="24" width="84" height="72" rx="10"/><path d="M18 42H102"/><circle data-fill cx="30" cy="33" r="3"/>
<g clip-path="url(#mi-catalog-browser)"><g data-part="content"><path d="M30 56H90"/><path d="M30 70H78"/><path d="M30 84H86"/></g></g></g>`,
    {x: 0, cOn: 1, z: 1},
    {idle: {}},
    (s, p) => {
      p.window.setAttribute('transform', around(s.z, 60, 60));
      p.content.setAttribute('transform', `translate(${s.x} 0)`);
      op(p.content, s.cOn);
    },
    {
      tap: tapSq('点按'),
      navigate: {label: '前往', async run(c) {
        c.to('x', 10, 'snap');
        await c.wait(60);
        c.to('x', -20, 'snap');
        c.to('cOn', 0, 'fade');
        await c.wait(120);
        c.set({x: 16, cOn: 0});
        c.to('cOn', 1, 'fade');
        c.to('x', 0, 'pop');
        await c.wait(150);
      }},
      inspect: {label: '查看', async run(c) {
        c.to('z', 1.045, 'pop');
        c.to('x', -12, 'gentle');
        await c.wait(160);
        c.to('x', 0, 'rebound');
        await c.wait(120);
      }},
      return: {label: '返回', async run(c) {
        c.to('x', 22, 'snap');
        await c.wait(90);
        c.to('x', -8, 'pop');
        c.to('z', 0.94, 'impact');
        await c.wait(150);
      }}
    });

  add('ai-reading',
    `<rect x="22" y="22" width="76" height="76" rx="8"/>
<g opacity="0.28"><path d="M40 40H86M40 60H80M40 80H84"/></g>
<path data-part="l0" d="M40 40H86"/><path data-part="l1" d="M40 60H80"/><path data-part="l2" d="M40 80H84"/>
<path data-part="head" d="M28 36L32 40L28 44"/>
<path data-part="footer" d="M44 91H76"/>`,
    {headY: 0, headOn: 0, r0: 0, r1: 0, r2: 0, footer: 0},
    {idle: {}, done: {r0: 1, r1: 1, r2: 1, footer: 1}},
    (s, p) => {
      p.head.setAttribute('transform', `translate(0 ${s.headY})`);
      op(p.head, s.headOn);
      [46, 40, 44].forEach((length, i) => dash(p['l' + i], length, s['r' + i]));
      dash(p.footer, 32, s.footer);
    },
    {
      tap: tapSq('点按'),
      read: {label: '阅读', pose: 'done', from: 'idle', async run(c) {
        c.to('headOn', 1, 'fade');
        c.to('r0', 1, 'draw');
        await c.wait(130);
        c.to('headY', 20, 'snap');
        c.to('r1', 1, 'draw');
        await c.wait(130);
        c.to('headY', 40, 'snap');
        c.to('r2', 1, 'draw');
        await c.wait(130);
        c.to('headOn', 0, 'fade');
        c.to('footer', 1, 'draw');
        await c.wait(100);
      }},
      scan: {label: '扫读', pose: 'done', from: 'idle', async run(c) {
        c.to('headOn', 1, 'fade');
        c.to('r0', 1, 'snap');
        await c.wait(60);
        c.to('headY', 20, 'snap');
        c.to('r1', 1, 'snap');
        await c.wait(60);
        c.to('headY', 40, 'snap');
        c.to('r2', 1, 'snap');
        await c.wait(100);
        c.to('headOn', 0, 'fade');
        c.to('footer', 1, 'draw');
        await c.wait(100);
      }},
      complete: {label: '读完', pose: 'done', from: 'idle', async run(c) {
        c.to('r0', 1, 'draw');
        await c.wait(60);
        c.to('r1', 1, 'draw');
        await c.wait(60);
        c.to('r2', 1, 'draw');
        c.to('headOn', 0, 'fade');
        c.to('footer', 1, 'draw');
        await c.wait(140);
      }}
    });

  add('ai-writing',
    `<path data-part="l0" d="M24 40H96"/>
<path data-part="l1" d="M24 58H96"/>
<path data-part="l2" d="M24 76H84"/>
<rect data-part="caret" data-fill x="24" y="32" width="3" height="16"/>`,
    {a: 0, b: 0, c: 0, cx: 0, cy: 0, caret: 1},
    {idle: {a: 1, b: 1, c: 0.4}, writing: {a: 1, b: 1, c: 1}},
    (s, p) => {
      dash(p.l0, 72, s.a);
      dash(p.l1, 72, s.b);
      dash(p.l2, 60, s.c);
      p.caret.setAttribute('transform', `translate(${s.cx} ${s.cy})`);
      op(p.caret, s.caret);
    },
    {
      tap: tapSq('点按'),
      write: {label: '书写', pose: 'writing', from: 'idle', async run(c) {
        c.set({a: 0.2, b: 0, c: 0, cx: 0, cy: 0, caret: 1});
        c.to('a', 1, 'draw');
        c.to('cx', 68, 'gentle');
        await c.wait(120);
        c.to('cy', 18, 'snap');
        c.to('cx', 4, 'snap');
        await c.wait(50);
        c.to('b', 1, 'draw');
        c.to('cx', 70, 'gentle');
        await c.wait(140);
        c.to('c', 1, 'draw');
        await c.wait(120);
      }},
      revise: {label: '修改', async run(c) {
        c.to('cy', 18, 'snap');
        c.to('b', 0.2, 'fade');
        c.to('cx', 10, 'snap');
        await c.wait(90);
        c.to('b', 1, 'draw');
        c.to('cx', 64, 'pop');
        await c.wait(160);
      }},
      finish: {label: '写完', pose: 'writing', async run(c) {
        c.to('a', 1, 'draw');
        c.to('b', 1, 'draw');
        c.to('c', 1, 'draw');
        c.to('caret', 0, 'fade');
        c.to('sq', 0.9, 'impact');
        await c.wait(170);
      }}
    });

  const repairCode = async c => {
    c.to('gap', 6, 'snap');
    c.to('caret', 0, 'fade');
    await c.wait(100);
    c.to('fracture', 0, 'draw');
    c.to('gap', 0, 'gentle');
    await c.wait(150);
    c.to('caret', 1, 'fade');
    await c.wait(100);
  };
  add('ai-coding',
    `<path data-part="l" d="M46 30L26 60L46 90"/>
<path data-part="upper" d="M74 30L90 54"/><path data-part="joint" d="M90 54L94 60L90 66"/><path data-part="lower" d="M90 66L74 90"/>
<path data-part="caret" d="M60 48V72"/>`,
    {gap: 0, caret: 1, fracture: 0},
    {idle: {}, failed: {fracture: 1, gap: 4, caret: 0}},
    (s, p) => {
      p.l.setAttribute('transform', `translate(${-s.gap} 0)`);
      p.upper.setAttribute('transform', `translate(${s.gap} ${-s.fracture * 5})`);
      p.lower.setAttribute('transform', `translate(${s.gap} ${s.fracture * 5})`);
      p.joint.setAttribute('transform', `translate(${s.gap} 0)`);
      dash(p.joint, 14.5, 1 - clamp01(s.fracture));
      op(p.caret, s.caret);
    },
    {
      tap: tapSq('点按'),
      type: {label: '输入', async run(c) {
        c.to('caret', 0.15, 'fade');
        await c.wait(80);
        c.to('caret', c.goal('caret'), 'fade');
        c.to('gap', c.goal('gap') + 3, 'snap');
        await c.wait(100);
        c.to('gap', c.goal('gap'), 'gentle');
        await c.wait(100);
      }},
      execute: {label: '运行', async run(c) {
        c.to('gap', c.goal('gap') + 5, 'snap');
        await c.wait(80);
        if (c.pose === 'failed') {
          c.error();
          c.to('fracture', 1.12, 'impact');
        } else {
          c.to('gap', -2, 'impact');
        }
        await c.wait(160);
      }},
      debug: {label: '排错', pose: 'idle', from: 'failed', run: repairCode},
      repair: {label: '修复', pose: 'idle', from: 'failed', run: repairCode}
    });

  add('ai-tool-call',
    `<rect data-part="a" x="14" y="42" width="28" height="36" rx="8"/>
<rect data-part="b" x="78" y="42" width="28" height="36" rx="8"/>
<path data-part="wire" d="M42 60H78"/>
<circle data-part="packet" data-fill cx="28" cy="60" r="5"/>`,
    {tx: 0, wire: 1, po: 1},
    {idle: {}},
    (s, p) => {
      dash(p.wire, 36, s.wire);
      p.packet.setAttribute('transform', `translate(${s.tx} 0)`);
      op(p.packet, s.po);
    },
    {
      tap: tapSq('点按'),
      connect: {label: '接上', async run(c) {
        c.to('wire', 0, 'snap');
        await c.wait(50);
        c.to('wire', 1, 'draw');
        c.to('sq', 0.92, 'impact');
        await c.wait(160);
      }},
      invoke: {label: '调用', async run(c) {
        c.to('tx', 8, 'snap');
        await c.wait(50);
        c.to('tx', 56, 'pop');
        await c.wait(150);
        c.to('tx', 0, 'rebound');
        await c.wait(140);
      }},
      return: {label: '返回', async run(c) {
        c.set({tx: 56});
        c.to('tx', 52, 'snap');
        await c.wait(50);
        c.to('tx', 0, 'pop');
        c.to('sq', 0.9, 'impact');
        await c.wait(160);
      }},
      fail: {label: '失败', async run(c) {
        c.to('tx', 30, 'impact');
        c.error();
        await c.wait(90);
        c.to('tx', 4, 'rebound');
        c.to('po', 0.3, 'fade');
        await c.wait(140);
      }}
    });

  add('ai-agent',
    `<circle data-part="head" cx="60" cy="42" r="16"/>
<path data-part="shoulders" d="M32 98C32 74 88 74 88 98"/>
<circle data-part="halo" cx="60" cy="42" r="26"/>
<circle data-part="orb" data-fill cx="60" cy="42" r="4"/>`,
    {halo: 0, ox: 0, oy: 0, oo: 0, head: 1},
    {idle: {}, active: {halo: 1}},
    (s, p) => {
      op(p.halo, s.halo);
      p.head.setAttribute('transform', around(s.head, 60, 42));
      p.orb.setAttribute('transform', `translate(${s.ox} ${s.oy})`);
      op(p.orb, s.oo);
    },
    {
      tap: tapSq('点按'),
      activate: {label: '激活', pose: 'active', from: 'idle', async run(c) {
        c.to('head', 0.82, 'impact');
        c.to('halo', 1, 'pop');
        await c.wait(120);
        c.to('head', 1, 'rebound');
        await c.wait(140);
      }},
      work: {label: '工作', loop: true, pose: 'active', run(c) {
        c.claim('ox', 'oy');
        c.to('oo', 1, 'fade');
        c.to('halo', 1, 'fade');
        c.loop(t => {
          c.s.ox = 22 * Math.sin(t * Math.PI * 2 * 0.8);
          c.s.oy = 16 * Math.cos(t * Math.PI * 2 * 0.8);
        });
      }},
      stop: {label: '停止', pose: 'idle', from: 'active', async run(c) {
        c.to('oo', 0, 'fade');
        c.to('halo', 0, 'fade');
        c.to('head', 0.88, 'snap');
        c.to('ox', 0, 'snap');
        c.to('oy', 0, 'snap');
        await c.wait(150);
      }}
    });

  add('ai-handoff',
    `<g data-part="a"><circle cx="26" cy="44" r="8"/><path d="M14 80V74C14 60 38 60 38 74V80"/></g>
<g data-part="b"><circle cx="94" cy="44" r="8"/><path d="M82 80V74C82 60 106 60 106 74V80"/></g>
<path data-part="link" d="M40 72H80"/>
<g data-part="token"><rect x="19" y="65" width="14" height="18" rx="3"/><path d="M23 71H29M23 76H27"/></g>`,
    {tx: 0, ty: 0, wire: 0.35, ack: 1, tilt: 0},
    {idle: {}, sent: {tx: 68}},
    (s, p) => {
      dash(p.link, 40, s.wire);
      p.token.setAttribute('transform', `translate(${s.tx} ${s.ty}) rotate(${s.tilt} 26 74)`);
      p.b.setAttribute('transform', aroundXY(1 + (1 - s.ack) * 0.2, s.ack, 94, 80));
    },
    {
      tap: tapSq('点按'),
      prepare: {label: '准备', async run(c) {
        c.to('tx', -3, 'snap');
        c.to('tilt', -7, 'snap');
        await c.wait(70);
        c.to('ty', -4, 'gentle');
        c.to('wire', 1, 'draw');
        await c.wait(150);
      }},
      transfer: {label: '移交', pose: 'sent', from: 'idle', async run(c) {
        c.to('tx', -3, 'snap');
        c.to('tilt', -7, 'snap');
        await c.wait(70);
        c.to('tx', 34, 'gentle');
        c.to('ty', -18, 'snap');
        c.to('tilt', 7, 'gentle');
        c.to('wire', 1, 'draw');
        await c.wait(150);
        c.to('tx', 68, 'snap');
        c.to('ty', 0, 'impact');
        c.to('tilt', 0, 'gentle');
        await c.wait(110);
        c.to('ack', 0.94, 'impact');
        await c.wait(140);
      }},
      acknowledge: {label: '确认', pose: 'sent', from: 'sent', async run(c) {
        c.to('ack', 0.93, 'impact');
        c.to('ty', 2, 'snap');
        await c.wait(90);
        c.to('ack', 1, 'rebound');
        c.to('ty', 0, 'rebound');
        await c.wait(140);
      }}
    });

  add('ai-generating',
    `<path opacity="0.25" d="M32 48V32H48M72 32H88V48M88 72V88H72M48 88H32V72"/>
<rect data-part="p0" x="38" y="38" width="20" height="20" rx="5"/>
<rect data-part="p1" x="62" y="38" width="20" height="20" rx="5"/>
<rect data-part="p2" x="38" y="62" width="20" height="20" rx="5"/>
<rect data-part="p3" x="62" y="62" width="20" height="20" rx="5"/>`,
    {d0: 1, d1: 1, d2: 1, d3: 1, k0: 1, k1: 1, k2: 1, k3: 1},
    {idle: {}, draft: {d0: 0.35, d1: 0, d2: 0, d3: 0}, generated: {}},
    (s, p) => {
      [[48, 48], [72, 48], [48, 72], [72, 72]].forEach(([x, y], i) => {
        p['p' + i].setAttribute('transform', around(s['k' + i], x, y));
        dash(p['p' + i], 72, s['d' + i]);
      });
    },
    {
      tap: tapSq('点按'),
      generate: {label: '生成', pose: 'generated', from: 'draft', async run(c) {
        if (c.pose !== 'draft') {
          [0, 1, 2, 3].forEach(i => {
            c.to('d' + i, 0, 'fade');
            c.to('k' + i, 0.88, 'gentle');
          });
          await c.wait(130);
        }
        for (let i = 0; i < 4; i++) {
          c.to('d' + i, 1, 'draw');
          c.to('k' + i, 1, 'gentle');
          await c.wait(75);
        }
        await c.wait(100);
      }},
      refine: {label: '打磨', pose: 'generated', from: 'generated', async run(c) {
        c.to('d1', 0.3, 'draw');
        c.to('k1', 0.88, 'gentle');
        await c.wait(130);
        c.to('d1', 1, 'draw');
        c.to('k1', 1, 'gentle');
        await c.wait(160);
      }},
      finish: {label: '完成', pose: 'generated', from: 'draft', async run(c) {
        for (let i = 0; i < 4; i++) {
          c.to('d' + i, 1, 'draw');
          c.to('k' + i, 1, 'gentle');
          await c.wait(60);
        }
        await c.wait(100);
      }}
    });

  add('ai-queue',
    `<path data-part="slot" d="M30 88H90V100H30Z"/>
<g data-part="c0"><rect x="34" y="62" width="52" height="16" rx="4"/><path d="M44 70H67"/></g>
<g data-part="c1"><rect x="34" y="42" width="52" height="16" rx="4"/><path d="M44 50H67"/></g>
<g data-part="c2"><rect x="34" y="22" width="52" height="16" rx="4"/><path d="M44 30H67"/></g>`,
    {x0: 0, y0: 0, o0: 1, x1: 0, y1: 0, o1: 1, x2: 0, y2: 0, o2: 0},
    {idle: {}, queued: {o2: 1}, claimed: {o2: 1, y0: 22, o0: 0.45}, processed: {o0: 0, y1: 20, y2: 20, o2: 1}, empty: {o0: 0, o1: 0, o2: 0}},
    (s, p) => {
      p.body.setAttribute('transform', '');
      p.slot.setAttribute('transform', aroundXY(1 + (1 - s.sq) * 0.2, s.sq, 60, 100));
      [0, 1, 2].forEach(i => {
        p['c' + i].setAttribute('transform', `translate(${s['x' + i]} ${s['y' + i]})`);
        op(p['c' + i], s['o' + i]);
      });
    },
    {
      tap: tapSq('点按'),
      enqueue: {label: '入队', pose: 'queued', from: 'idle', async run(c) {
        c.set({x2: 8, y2: -5, o2: 0});
        c.to('o2', 1, 'fade');
        c.to('x2', 0, 'snap');
        c.to('y2', 0, 'gentle');
        await c.wait(220);
      }},
      claim: {label: '取走', pose: 'claimed', from: 'queued', async run(c) {
        c.to('y0', -3, 'snap');
        await c.wait(70);
        c.to('y0', 22, 'snap');
        await c.wait(120);
        c.to('o0', 0.45, 'fade');
        c.to('sq', 0.94, 'impact');
        await c.wait(140);
      }},
      process: {label: '处理', pose: 'processed', from: 'claimed', async run(c) {
        c.to('o0', 0, 'fade');
        await c.wait(80);
        c.to('y1', 20, 'gentle');
        await c.wait(60);
        c.to('y2', 20, 'gentle');
        await c.wait(150);
      }},
      drain: {label: '排空', pose: 'empty', from: 'queued', async run(c) {
        c.to('y0', 22, 'snap');
        c.to('o0', 0, 'fade');
        await c.wait(90);
        c.to('y1', 42, 'snap');
        c.to('o1', 0, 'fade');
        await c.wait(90);
        c.to('y2', 62, 'snap');
        c.to('o2', 0, 'fade');
        await c.wait(150);
      }}
    });
})(window.MotionIcon);
