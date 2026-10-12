/*!
 * motion-icons-signature.js — the Apple motion contract and the signature redraws.
 * Load LAST, after motion-icons-semantics.js. The engine file stays byte-identical.
 *
 * 1. Contract    every spring any recipe asks for is held to Apple's damping range
 *                (SwiftUI .smooth / .snappy / .bouncy); a request below the floor
 *                is raised to it and counted in MotionIcon.apple.audit.
 * 2. Effects     SF Symbols-style bounce, wiggle and breathe on every subject.
 * 3. Redraws     subjects that were illegible at rest or that told no story,
 *                with the same verb and pose names as before.
 */
(function (root) {
  'use strict';
  const M = root.MotionIcon;
  if (!M) throw new Error('motion-icons-signature.js must load after motion-icons.js');
  const {clamp, clamp01, lerp, lerpPath, around, aroundXY, arc, wave} = M.util;
  const S = M.SPRINGS;

  // ---------------------------------------------------------------------------
  // 1. Apple motion contract
  // ---------------------------------------------------------------------------

  // SwiftUI parameters: response in seconds, damping fraction (1 = no overshoot).
  // Overshoot of a step: ζ 1 → 0 %, .85 → 0.6 %, .72 → 4 %, .3 → 37 % per swing.
  const spring = (response, dampingFraction = 1) => {
    const w = 2 * Math.PI / response;
    return {stiffness: +(w * w).toFixed(2), damping: +(2 * dampingFraction * w).toFixed(2)};
  };
  const FLOOR = 0.7;
  const RETUNED = {snap: 0.82, pop: 0.72, impact: 0.86, rebound: 0.72, settle: 0.88, swing: 0.3, shake: 0.38};
  for (const [name, zeta] of Object.entries(RETUNED)) {
    S[name].damping = +(2 * zeta * Math.sqrt(S[name].stiffness)).toFixed(2);
  }
  Object.assign(S, {
    smooth: spring(0.42, 1),      // state changes, morphs, colour
    snappy: spring(0.3, 0.86),    // direct response: taps, clicks, slides
    bouncy: spring(0.4, 0.72),    // the single emphasis an action may have
    quick: spring(0.16, 1),       // the compress-in half of a bounce
    glide: spring(0.55, 1)        // long travel, large rotations
  });
  const FLIP = spring(0.5, 0.92);

  const audit = {floor: FLOOR, clamped: 0, subjects: {}};
  function governed(name, preset) {
    if (!preset || typeof preset !== 'object') return preset;
    const zeta = preset.damping / (2 * Math.sqrt(preset.stiffness));
    if (zeta >= FLOOR - 1e-6) return preset;
    audit.clamped++;
    audit.subjects[name] = (audit.subjects[name] || 0) + 1;
    return {...preset, damping: 2 * FLOOR * Math.sqrt(preset.stiffness)};
  }
  function governCtx(name, c) {
    const g = Object.create(c);
    g.to = (key, target, preset, velocity) => c.to(key, target, governed(name, preset), velocity);
    return g;
  }

  // SF Symbols effects. They act on one wrapper group, so they work on any glyph.
  const FX = {fxX: 0, fxY: 0, fxRot: 0, fxScale: 1, fxSquash: 1};
  const fxTransform = s => `translate(${s.fxX} ${s.fxY}) rotate(${s.fxRot} 60 60) ${around(s.fxScale)} `
    + aroundXY(1 + (1 - s.fxSquash) * 0.5, s.fxSquash, 60, 104);
  const bounce = async c => {
    c.to('fxSquash', 0.86, 'quick');
    await c.wait(90);
    c.to('fxSquash', 1, 'bouncy');
    await c.wait(240);
  };
  const EFFECTS = {
    bounce: {label: '弹跳', effect: true, run: bounce},
    wiggle: {label: '摆动', effect: true, async run(c) {
      for (const deg of [8, -6, 3]) { c.to('fxRot', deg, 'snappy'); await c.wait(95); }
      c.to('fxRot', 0, 'smooth');
      await c.wait(180);
    }},
    breathe: {label: '呼吸', effect: true, loop: true, run(c) {
      c.claim('fxScale');
      c.loop(t => { c.s.fxScale = 1 + 0.05 * wave(t, 0.5); });
    }}
  };

  const FX_SVG = '<g data-part="mi-fx">';
  function finalize(name, recipe) {
    const r = {...recipe};
    if (!r.svg.startsWith(FX_SVG)) r.svg = FX_SVG + r.svg + '</g>';
    r.state = {...FX, ...r.state};
    if (!r.render.fx) {
      const base = r.render;
      r.render = (s, p, u) => { base(s, p, u); p['mi-fx'].setAttribute('transform', fxTransform(s)); };
      r.render.fx = true;
    }
    const actions = {};
    for (const [verb, a] of Object.entries({...EFFECTS, ...r.actions})) {
      if (!a || a.governed) { actions[verb] = a; continue; }
      const w = {...a, governed: true};
      if (a.run) w.run = (c, arg) => a.run.call(a, governCtx(name, c), arg);
      if (a.drive) w.drive = (c, v) => a.drive.call(a, governCtx(name, c), v);
      actions[verb] = w;
    }
    r.actions = actions;
    return r;
  }
  for (const name of Object.keys(M.recipes)) M.recipes[name] = finalize(name, M.recipes[name]);
  const baseDefine = M.define;
  M.define = (name, recipe) => { baseDefine(name, recipe); M.recipes[name] = finalize(name, M.recipes[name]); };

  M.apple = {spring, audit, floor: FLOOR, effects: Object.keys(EFFECTS)};

  // ---------------------------------------------------------------------------
  // 2. Drawing helpers for the redraws
  // ---------------------------------------------------------------------------

  const attr = (el, k, v) => el.setAttribute(k, v);
  const fade = (el, v) => attr(el, 'opacity', +clamp01(v).toFixed(3));
  const lengths = new WeakMap();
  function drawOn(el, t) {
    let length = lengths.get(el);
    if (length === undefined) { length = el.getTotalLength(); lengths.set(el, length); }
    t = clamp01(t);
    attr(el, 'stroke-dasharray', `${(length * t).toFixed(2)} ${(length + 1).toFixed(2)}`);
    fade(el, t * 8);                       // round caps would leave a dot at zero length
  }
  function ink(el, role, t) {
    t = clamp01(t);
    el.style.color = t < 0.002 ? '' : `color-mix(in srgb, var(--mi-${role}) ${(t * 100).toFixed(1)}%, currentColor)`;
  }
  function fill(el, t) { el.style.fill = 'currentColor'; attr(el, 'fill-opacity', +clamp01(t).toFixed(3)); }

  // A knockout (SF badge gap, or a part hidden inside a slot). One mask per element.
  let serial = 0;
  const cuts = new WeakMap();
  function knockout(el, d) {
    let cut = cuts.get(el);
    if (!cut) {
      const doc = el.ownerDocument, ns = 'http://www.w3.org/2000/svg';
      const defs = doc.createElementNS(ns, 'defs'), mask = doc.createElementNS(ns, 'mask');
      mask.id = 'mi-signature-cut-' + (++serial);
      for (const [k, v] of Object.entries({maskUnits: 'userSpaceOnUse', x: -60, y: -60, width: 240, height: 240})) attr(mask, k, v);
      const keep = doc.createElementNS(ns, 'rect');
      for (const [k, v] of Object.entries({x: -60, y: -60, width: 240, height: 240})) attr(keep, k, v);
      keep.style.cssText = 'fill:white;stroke:none';
      cut = doc.createElementNS(ns, 'path');
      cut.style.cssText = 'fill:black;stroke:none';
      mask.append(keep, cut);
      defs.appendChild(mask);
      el.ownerSVGElement.prepend(defs);
      attr(el, 'mask', `url(#${mask.id})`);
      cuts.set(el, cut);
    }
    if (cut.getAttribute('d') !== d) attr(cut, 'd', d);
    return cut;
  }

  // Four-point sparkle; k pinches the sides (0 = thin star, .2 = plump).
  const sparkle = (cx, cy, r, k = 0.1) => {
    const c = r * k;
    return `M${cx} ${cy - r}Q${cx + c} ${cy - c} ${cx + r} ${cy}Q${cx + c} ${cy + c} ${cx} ${cy + r}`
      + `Q${cx - c} ${cy + c} ${cx - r} ${cy}Q${cx - c} ${cy - c} ${cx} ${cy - r}Z`;
  };
  // Rounded rectangle with a fixed command list, so any two can be morphed.
  const K = 0.5523;
  const rr = (x, y, w, h, r) => {
    const k = r * K, R = x + w, B = y + h;
    return `M${x + r} ${y}H${R - r}C${R - r + k} ${y} ${R} ${y + r - k} ${R} ${y + r}V${B - r}`
      + `C${R} ${B - r + k} ${R - r + k} ${B} ${R - r} ${B}H${x + r}C${x + r - k} ${B} ${x} ${B - r + k} ${x} ${B - r}`
      + `V${y + r}C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`;
  };
  const rot = (deg, cx, cy) => `rotate(${deg} ${cx} ${cy})`;
  const pinchAt = (k, cx, cy) => aroundXY(1 + (1 - k) * 0.5, k, cx, cy);
  const tap = run => ({label: '按下反馈', internal: true, run});

  // ---------------------------------------------------------------------------
  // 3. Redraws
  // ---------------------------------------------------------------------------

  // ---------- clock: a dial whose hands sweep, freeze and rewind ----------
  function sweep(c) {
    for (const k of ['minute', 'hour']) c.setGoal(k, c.s[k]);
    c.claim('minute', 'hour');
    c.loop((t, dt) => {
      const w = 132 * (1 - Math.exp(-t * 6));          // deg/s, spins up without a jolt
      c.s.minute += w * dt;
      c.s.hour += w / 12 * dt;
      c.setVelocity('minute', w);
      c.setVelocity('hour', w / 12);
      c.setGoal('minute', c.s.minute);
      c.setGoal('hour', c.s.hour);
    });
  }
  M.define('clock', {
    svg: `<circle data-part="face" cx="60" cy="60" r="42"/><path data-part="track"/>
<path data-part="hour" d="M60 60V41"/><path data-part="minute" d="M60 60V29"/><circle data-fill cx="60" cy="60" r="4.5"/>`,
    state: {minute: 0, hour: 120, prog: 0, timer: 0},
    poses: {idle: {}, running: {}, paused: {}},
    periodic: {minute: 360, hour: 360},
    render(s, p) {
      attr(p.minute, 'transform', rot(s.minute, 60, 60));
      attr(p.hour, 'transform', rot(s.hour, 60, 60));
      const t = clamp01(s.timer), v = clamp01(s.prog);
      fade(p.face, 1 - 0.7 * t);
      attr(p.track, 'd', arc(60, 60, 42, -90, -90 + 359.8 * Math.max(v, 0.002)));
      fade(p.track, Math.min(t, v * 12));
      ink(p.track, 'connected', 1);
    },
    actions: {
      tap: tap(async c => { c.to('minute', c.goal('minute') + 30, 'snappy'); await c.wait(220); }),
      start: {label: '开始计时', loop: true, pose: 'running', from: 'idle', run: sweep},
      running: {label: '走动', loop: true, pose: 'running', run: sweep},
      progress: {label: '计时进度', drive(c, v) {
        c.to('prog', v, 'track');
        c.to('timer', v > 0 ? 1 : 0, 'smooth');
        c.setGoal('prog', v);
        c.setGoal('timer', v > 0 ? 1 : 0);
      }},
      pause: {label: '冻结表针', pose: 'paused', from: 'running', async run(c) {
        const m = c.s.minute + 4, h = c.s.hour + 0.4;   // inertia carries the hands a hair past
        c.setGoal('minute', m); c.setGoal('hour', h);
        c.to('minute', m, 'snappy'); c.to('hour', h, 'snappy');
        await c.wait(260);
      }},
      resume: {label: '继续计时', loop: true, pose: 'running', from: 'paused', run: sweep},
      reset: {label: '归零', pose: 'idle', async run(c) {
        const m = Math.round(c.s.minute / 360) * 360, h = 120 + Math.round((c.s.hour - 120) / 360) * 360;
        for (const [k, v] of [['minute', 0], ['hour', 120], ['prog', 0], ['timer', 0]]) c.setGoal(k, v);
        c.to('minute', m, 'glide'); c.to('hour', h, 'glide');
        c.to('prog', 0, 'smooth'); c.to('timer', 0, 'smooth');
        await c.wait(420);
      }}
    }
  });

  // ---------- hourglass: sand that flows, a glass that turns over ----------
  const BULB = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, u = 1 - t;
    BULB.push([u * u * u * 38 + 3 * u * u * t * 38 + 3 * u * t * t * 57 + t * t * t * 57,
      u * u * u * 16 + 3 * u * u * t * 42 + 3 * u * t * t * 48 + t * t * t * 60]);
  }
  const bulbX = y => {
    for (let i = 1; i < BULB.length; i++) {
      const [x0, y0] = BULB[i - 1], [x1, y1] = BULB[i];
      if (y <= y1) return x0 + (x1 - x0) * ((y - y0) / (y1 - y0 || 1));
    }
    return BULB[BULB.length - 1][0];
  };
  function sand(amount, bottom) {
    if (amount < 0.015) return 'M60 58Z';
    const level = lerp(57, 27, Math.min(1, amount)), inset = x => Math.min(59, x + 6.5);
    const pts = [[inset(bulbX(level)), level]];
    for (const [x, y] of BULB) if (y > level && y < 58) pts.push([inset(x), y]);
    pts.push([60, 58]);
    const side = pts.concat(pts.slice(0, -1).reverse().map(([x, y]) => [120 - x, y]));
    return 'M' + side.map(([x, y]) => `${x.toFixed(2)} ${(bottom ? 120 - y : y).toFixed(2)}`).join('L') + 'Z';
  }
  const flowGrains = c => { c.claim('grain'); c.loop((t, dt) => { c.s.grain += 64 * dt; }); };
  M.define('hourglass', {
    svg: `<g data-part="glass"><path d="M32 16H88M32 104H88"/>
<path d="M38 16C38 42 57 48 57 60C57 72 38 78 38 104M82 16C82 42 63 48 63 60C63 72 82 78 82 104"/>
<path data-part="top" data-fill/><path data-part="bottom" data-fill/><path data-part="stream" d="M60 60V96" stroke-dasharray="3 7"/></g>`,
    state: {sand: 1, flow: 0, grain: 0, turn: 0, sandOn: 1},
    poses: {ready: {}, running: {sand: 0.55, flow: 1}, finished: {sand: 0}},
    periodic: {grain: 10},
    render(s, p) {
      const a = clamp01(s.sand);
      attr(p.glass, 'transform', rot(s.turn, 60, 60));
      attr(p.top, 'd', sand(a, false));
      attr(p.bottom, 'd', sand(1 - a, true));
      fade(p.top, s.sandOn); fade(p.bottom, s.sandOn);
      attr(p.stream, 'stroke-dashoffset', -s.grain);
      fade(p.stream, clamp01(s.flow) * clamp01(a * 20) * s.sandOn);
    },
    actions: {
      tap: tap(async c => { c.to('turn', 14, 'snappy'); await c.wait(150); }),
      start: {label: '开始流沙', pose: 'running', from: 'ready', async run(c) {
        flowGrains(c);
        c.to('flow', 1, 'smooth');
        c.to('sand', 0.55, 'glide');
        await c.wait(560);
      }},
      running: {label: '流沙中', loop: true, pose: 'running', run(c) {
        const from = c.s.sand;
        c.to('flow', 1, 'smooth');
        c.claim('grain', 'sand');
        c.loop((t, dt) => {
          c.s.grain += 64 * dt;
          c.s.sand = Math.max(0.04, from - 0.06 * t);
          c.setGoal('sand', c.s.sand);
        });
      }},
      progress: {label: '剩余时间', drive(c, v) {
        c.to('sand', 1 - v, 'track');
        c.to('flow', v > 0 && v < 1 ? 1 : 0, 'smooth');
        c.setGoal('sand', 1 - v);
        c.setGoal('flow', v > 0 && v < 1 ? 1 : 0);
      }},
      flip: {label: '倒转沙漏', pose: 'ready', from: 'finished', async run(c) {
        c.to('flow', 0, 'quick');
        await Promise.race([c.to('turn', 180, FLIP), c.wait(720)]);
        c.set({turn: 0, sand: 1 - c.s.sand});           // the glass is symmetric: swap seamlessly
      }},
      finish: {label: '流尽', pose: 'finished', from: 'running', async run(c) {
        flowGrains(c);
        c.to('sand', 0, spring(0.45, 1));
        await c.wait(320);
        c.to('flow', 0, 'smooth');
        await c.wait(160);
      }},
      reset: {label: '重新装沙', pose: 'ready', from: 'finished', async run(c) {
        c.to('sandOn', 0, 'quick');
        await c.wait(120);
        c.set({sand: 1});
        c.to('sandOn', 1, 'smooth');
        await c.wait(220);
      }}
    }
  });

  // ---------- ai-generating: sparkles that grow, fill and twinkle ----------
  M.define('ai-generating', {
    svg: `<path data-part="big" d="${sparkle(50, 64, 34)}"/><path data-part="mid" d="${sparkle(90, 28, 14)}"/>`,
    state: {bk: 1, br: 0, bf: 0, mk: 1, mr: 0, mf: 0, mo: 1},
    poses: {idle: {}, draft: {bk: 0.62, mk: 0.4, mo: 0}, generated: {bf: 1}, refined: {bf: 1, mf: 1}},
    periodic: {br: 90, mr: 90},
    render(s, p) {
      attr(p.big, 'transform', `${rot(s.br, 50, 64)} ${around(s.bk, 50, 64)}`);
      fill(p.big, s.bf);
      attr(p.mid, 'transform', `${rot(s.mr, 90, 28)} ${around(s.mk, 90, 28)}`);
      fill(p.mid, s.mf);
      fade(p.mid, s.mo);
    },
    actions: {
      tap: tap(bounce),
      generate: {label: '星芒长出', pose: 'generated', from: 'draft', async run(c) {
        c.to('bk', 0.54, 'quick'); c.to('br', -24, 'quick');
        await c.wait(90);
        c.to('bk', 1, 'bouncy'); c.to('br', 0, 'snappy');
        c.to('bf', 1, 'smooth');
        await c.wait(110);
        c.to('mo', 1, 'smooth'); c.to('mk', 1, 'snappy');
        await c.wait(300);
      }},
      refine: {label: '细化成品', pose: 'refined', from: 'generated', async run(c) {
        c.to('mr', 90, 'snappy'); c.to('mf', 1, 'smooth');
        c.to('bk', 1.05, 'snappy');
        await c.wait(150);
        c.to('bk', 1, 'smooth');
        await c.wait(220);
      }},
      finish: {label: '直接成形', pose: 'generated', from: 'draft', async run(c) {
        c.to('bk', 1, 'smooth'); c.to('bf', 1, 'smooth');
        c.to('mo', 1, 'smooth'); c.to('mk', 1, 'smooth');
        await c.wait(320);
      }},
      generating: {label: '生成中', loop: true, run(c) {
        c.claim('mk', 'mo', 'bk');
        c.loop(t => {
          c.s.mk = 0.8 + 0.2 * wave(t, 1.1);
          c.s.mo = 0.45 + 0.55 * wave(t, 1.1);
          c.s.bk = 1 - 0.04 * wave(t, 0.55, 0.5);
        });
      }}
    }
  });

  // ---------- ai-tool-call: a wrench that grips and turns a nut ----------
  const hexagon = (cx, cy, r) => 'M' + [0, 1, 2, 3, 4, 5].map(i => {
    const a = (i * 60 + 30) * Math.PI / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join('L') + 'Z';
  // Drawn upright (jaw at the top), then laid at 45°; the nut sits in the jaw.
  const NUT = [83.33, 36.67];
  const LAY = 'rotate(45 60 60)';
  M.define('ai-tool-call', {
    svg: `<g data-part="wrench"><path d="M49.1 23A17 17 0 1 0 70.9 23H67V34H53V23Z"/><path d="M60 53V98"/></g>
<path data-part="nut" d="${hexagon(60, 27, 7.5)}"/>
<circle data-part="d0" data-fill cx="80" cy="97" r="3.8"/><circle data-part="d1" data-fill cx="91" cy="97" r="3.8"/><circle data-part="d2" data-fill cx="102" cy="97" r="3.8"/>
<path data-part="ok" d="M80 94L88 102L104 84"/><path data-part="warn" d="M96 76V90"/><circle data-part="warnDot" data-fill cx="96" cy="101" r="3.6"/>`,
    state: {wr: 0, nutOn: 0, nx: 0, d0: 0, d1: 0, d2: 0, ok: 0, warn: 0},
    poses: {idle: {}, connected: {nutOn: 1}, sent: {nutOn: 1, d0: 1, d1: 1, d2: 1},
      returned: {nutOn: 1, ok: 1}, blocked: {nutOn: 1, warn: 1}},
    render(s, p) {
      attr(p.wrench, 'transform', `${rot(s.wr, ...NUT)} ${LAY}`);
      attr(p.nut, 'transform', `translate(${s.nx} ${-s.nx}) ${rot(s.wr, ...NUT)} ${LAY}`);
      fade(p.nut, s.nutOn);
      for (const k of ['d0', 'd1', 'd2']) fade(p[k], s[k]);
      drawOn(p.ok, s.ok); ink(p.ok, 'success', 1);
      drawOn(p.warn, s.warn); fade(p.warnDot, s.warn * 2 - 1);
      ink(p.warn, 'recording', 1); ink(p.warnDot, 'recording', 1);
    },
    actions: {
      tap: tap(async c => { c.to('wr', c.goal('wr') + 12, 'snappy'); await c.wait(150); }),
      connect: {label: '卡住螺母', pose: 'connected', from: 'idle', async run(c) {
        c.set({nx: 16});
        c.to('nutOn', 1, 'smooth'); c.to('nx', 0, 'snappy');
        await c.wait(170);
        c.to('wr', -8, 'snappy');
        await c.wait(140);
      }},
      invoke: {label: '拧动调用', pose: 'sent', from: 'idle', async run(c) {
        c.set({nx: 12});
        c.to('nutOn', 1, 'smooth'); c.to('nx', 0, 'snappy');
        await c.wait(120);
        c.to('wr', 34, 'snappy');
        await c.wait(210);
        c.to('wr', 0, 'smooth');
        for (const k of ['d0', 'd1', 'd2']) { c.to(k, 1, 'smooth'); await c.wait(80); }
        await c.wait(120);
      }},
      return: {label: '返回结果', pose: 'returned', from: 'sent', async run(c) {
        for (const k of ['d2', 'd1', 'd0']) { c.to(k, 0, 'smooth'); await c.wait(50); }
        c.to('ok', 1, 'draw');
        await c.wait(300);
      }},
      fail: {label: '拧不动', pose: 'blocked', from: 'idle', async run(c) {
        c.set({nx: 12});
        c.to('nutOn', 1, 'smooth'); c.to('nx', 0, 'snappy');
        await c.wait(110);
        c.error();
        for (const deg of [9, -4, 2]) { c.to('wr', deg, 'snappy'); await c.wait(95); }
        c.to('warn', 1, 'draw');
        await c.wait(c.timing.holdFail * 0.4);
      }}
    }
  });

  // ---------- ai-handoff: a token passed from one agent to the next ----------
  M.define('ai-handoff', {
    svg: `<rect data-part="a" x="14" y="44" width="34" height="34" rx="11"/><path d="M57 53L63 61L57 69"/>
<rect data-part="b" x="72" y="44" width="34" height="34" rx="11"/><circle data-part="token" data-fill cx="0" cy="0" r="7"/>
<path data-part="ok" d="M80 61L86 67L98 55"/>`,
    state: {tx: 0, lift: 0, tokenOn: 1, bk: 1, ack: 0},
    poses: {idle: {}, sent: {tx: 1}, acknowledged: {tx: 1, tokenOn: 0, ack: 1}},
    render(s, p) {
      const t = clamp(s.tx, -0.05, 1.05);
      attr(p.token, 'cx', +lerp(31, 89, t).toFixed(2));
      attr(p.token, 'cy', +(61 - Math.sin(Math.PI * clamp01(t)) * 30 - s.lift).toFixed(2));
      fade(p.token, s.tokenOn);
      attr(p.b, 'transform', around(s.bk, 89, 61));
      drawOn(p.ok, s.ack);
      ink(p.ok, 'success', 1); ink(p.b, 'success', s.ack);
    },
    actions: {
      tap: tap(async c => { c.to('lift', 6, 'snappy'); await c.wait(140); }),
      prepare: {label: '备好交接', async run(c) {
        c.to('lift', 10, 'snappy');
        await c.wait(200);
        c.to('lift', 0, 'bouncy');
        await c.wait(200);
      }},
      transfer: {label: '交给下一位', pose: 'sent', from: 'idle', async run(c) {
        c.to('lift', -3, 'quick');
        await c.wait(70);
        c.to('lift', 0, 'smooth');
        c.to('tx', 1, spring(0.42, 1));
        await c.wait(330);
        c.to('bk', 0.92, 'quick');
        await c.wait(70);
        c.to('bk', 1, 'bouncy');
        await c.wait(200);
      }},
      acknowledge: {label: '接收并确认', pose: 'acknowledged', from: 'sent', async run(c) {
        c.to('tokenOn', 0, 'smooth');
        await c.wait(90);
        c.to('ack', 1, 'draw');
        await c.wait(320);
      }}
    }
  });

  // ---------- ai-writing: lines written out behind a caret ----------
  const LINES = [[34, 72], [54, 62], [74, 38]];
  M.define('ai-writing', {
    svg: LINES.map(([y, w], i) => `<path data-part="l${i}" d="M24 ${y}H${24 + w}"/>`).join('')
      + '<path data-part="caret" d="M0 -11V11"/>',
    state: {l0: 1, l1: 1, l2: 1, caretOn: 0},
    poses: {idle: {}, writing: {caretOn: 1}},
    render(s, p) {
      for (let i = 0; i < 3; i++) drawOn(p['l' + i], s['l' + i]);
      const unfinished = [0, 1, 2].find(i => s['l' + i] < 0.999);
      const active = unfinished === undefined ? 2 : unfinished;
      const [y, w] = LINES[active];
      attr(p.caret, 'transform', `translate(${(24 + w * clamp01(s['l' + active]) + 8).toFixed(2)} ${y})`);
      fade(p.caret, s.caretOn);
      ink(p.caret, 'connected', 1);
    },
    actions: {
      tap: tap(bounce),
      write: {label: '逐行写出', pose: 'writing', from: 'idle', async run(c) {
        for (const k of ['l2', 'l1', 'l0']) c.to(k, 0, 'quick');
        await c.wait(110);
        c.to('caretOn', 1, 'smooth');
        for (const k of ['l0', 'l1', 'l2']) { c.to(k, 1, spring(0.3, 1)); await c.wait(150); }
        await c.wait(160);
      }},
      revise: {label: '改写末行', pose: 'writing', from: 'writing', async run(c) {
        c.to('l2', 0.25, 'snappy');
        await c.wait(220);
        c.to('l2', 1, spring(0.34, 1));
        await c.wait(300);
      }},
      finish: {label: '收笔', pose: 'idle', from: 'writing', async run(c) {
        c.to('caretOn', 0, 'smooth');
        await c.wait(200);
      }},
      typing: {label: '书写中', loop: true, pose: 'writing', run(c) {
        c.claim('l2', 'caretOn');
        c.loop(t => {
          const phase = (t * 0.8) % 1;
          c.s.l2 = 0.2 + 0.8 * Math.min(1, phase / 0.8);
          c.s.caretOn = phase < 0.8 ? 1 : 0.4 + 0.6 * Math.abs(Math.cos((phase - 0.8) * Math.PI * 5));
        });
      }}
    }
  });

  // ---------- ai-queue: cards that line up over a tray and get taken ----------
  const ROW = [62, 38, 14];
  M.define('ai-queue', {
    svg: ROW.map((y, i) => `<rect data-part="r${i}" x="30" y="${y}" width="60" height="12" rx="6"/>`).join('')
      + '<path d="M20 80V92Q20 100 28 100H92Q100 100 100 92V80"/><path data-part="done" d="M49 90L56 96L71 83"/>',
    state: {x0: 0, x1: 0, x2: 0, y0: 0, y1: 0, y2: 0, o0: 1, o1: 1, o2: 0, k0: 1, work: 0, done: 0},
    poses: {idle: {}, queued: {o2: 1}, claimed: {o2: 1, y0: 18, work: 1},
      processed: {o0: 0, o2: 1, y1: 24, y2: 24, done: 1}, empty: {o0: 0, o1: 0, o2: 0}},
    render(s, p) {
      for (let i = 0; i < 3; i++) {
        const k = i === 0 ? s.k0 : 1;
        attr(p['r' + i], 'transform', `translate(${s['x' + i]} ${s['y' + i]}) ${around(k, 60, ROW[i] + 6)}`);
        fade(p['r' + i], s['o' + i]);
      }
      ink(p.r0, 'connected', s.work);
      drawOn(p.done, s.done); ink(p.done, 'success', 1);
    },
    actions: {
      tap: tap(bounce),
      enqueue: {label: '任务入队', pose: 'queued', from: 'idle', async run(c) {
        c.set({y2: -16});
        c.to('o2', 1, 'smooth'); c.to('y2', 0, 'snappy');
        await c.wait(150);
        c.to('y1', 2.5, 'snappy');                    // the stack takes the weight
        await c.wait(90);
        c.to('y1', 0, 'smooth');
        await c.wait(160);
      }},
      claim: {label: '取出待处理任务', pose: 'claimed', from: 'queued', async run(c) {
        c.to('y0', 18, 'snappy'); c.to('work', 1, 'smooth');
        await c.wait(300);
      }},
      process: {label: '处理取出的任务', pose: 'processed', from: 'claimed', async run(c) {
        c.to('k0', 0.7, 'smooth'); c.to('o0', 0, 'smooth');
        await c.wait(120);
        c.to('done', 1, 'draw');
        c.to('y1', 24, 'snappy');
        await c.wait(70);
        c.to('y2', 24, 'snappy');
        await c.wait(260);
      }},
      drain: {label: '清空任务，保留容器', pose: 'empty', from: 'queued', async run(c) {
        for (const i of [2, 1, 0]) { c.to('x' + i, 30, 'smooth'); c.to('o' + i, 0, 'smooth'); await c.wait(70); }
        await c.wait(220);
      }}
    }
  });

  // ---------- ai-agent: a person with a sparkle that wakes up ----------
  M.define('ai-agent', {
    svg: `<g data-part="person"><circle cx="54" cy="44" r="16"/><path d="M24 100V96C24 81 37 72 54 72C71 72 84 81 84 96V100"/></g>
<path data-part="spark" d="${sparkle(92, 27, 13)}"/>`,
    state: {sk: 1, sr: 0, sf: 0, hy: 0},
    poses: {idle: {}, active: {sf: 1}},
    periodic: {sr: 90},
    render(s, p) {
      attr(p.person, 'transform', `translate(0 ${s.hy})`);
      attr(p.spark, 'transform', `${rot(s.sr, 92, 27)} ${around(s.sk, 92, 27)}`);
      fill(p.spark, s.sf);
      ink(p.spark, 'connected', s.sf);
    },
    actions: {
      tap: tap(async c => { c.to('sr', 45, 'snappy'); await c.wait(160); }),
      activate: {label: '唤醒', pose: 'active', from: 'idle', async run(c) {
        c.to('sk', 0.6, 'quick');
        await c.wait(80);
        c.to('sr', 90, 'snappy'); c.to('sk', 1, 'bouncy'); c.to('sf', 1, 'smooth');
        await c.wait(60);
        c.to('hy', -4, 'snappy');
        await c.wait(150);
        c.to('hy', 0, 'smooth');
        await c.wait(160);
      }},
      work: {label: '工作中', loop: true, pose: 'active', run(c) {
        c.to('sf', 1, 'smooth');
        c.claim('sk', 'sr');
        const from = c.s.sr;
        c.loop(t => {
          c.s.sk = 1 - 0.16 * wave(t, 1.2);
          c.s.sr = from + 8 * Math.sin(t * 1.2 * Math.PI * 2);
        });
      }},
      stop: {label: '休息', pose: 'idle', from: 'active', async run(c) {
        c.to('sf', 0, 'smooth'); c.to('sr', 0, 'smooth');
        await c.wait(260);
      }}
    }
  });

  // ---------- secure-connection: a globe with a lock badge ----------
  const BADGE_GAP = 'M82 76H98Q110 76 110 88V100Q110 110 100 110H80Q70 110 70 100V88Q70 76 82 76Z'
    + 'M90 63A14 14 0 1 1 89.99 63Z';
  M.define('secure-connection', {
    svg: `<g data-part="world"><circle cx="54" cy="56" r="34"/><path d="M20 56H88"/>
<ellipse data-part="meridian" cx="54" cy="56" rx="14" ry="34"/><path data-part="slash" d="M24 26L84 86"/></g>
<g data-part="lock"><path data-part="shackle" d="M82 82V77A8 8 0 0 1 98 77V82"/><rect data-part="body" x="76" y="82" width="28" height="21" rx="6"/></g>`,
    state: {turn: 0, lockOn: 1, lk: 1, shackle: 0, slash: 0, dim: 0, ok: 1},
    poses: {secured: {}, open: {shackle: 1, ok: 0}, lost: {lockOn: 0, lk: 0.6, shackle: 1, slash: 1, dim: 1, ok: 0}},
    periodic: {turn: 180},
    render(s, p) {
      attr(p.meridian, 'rx', +(34 * Math.abs(Math.sin((24.3 + s.turn) * Math.PI / 180))).toFixed(2));
      fade(p.world, 1 - 0.5 * clamp01(s.dim));
      drawOn(p.slash, s.slash);
      fade(knockout(p.world, BADGE_GAP), s.lockOn);
      attr(p.lock, 'transform', around(s.lk, 90, 92));
      fade(p.lock, s.lockOn);
      attr(p.shackle, 'transform', `translate(0 ${-6 * s.shackle})`);
      ink(p.shackle, 'success', s.ok); ink(p.body, 'success', s.ok);
    },
    actions: {
      tap: tap(async c => { c.to('turn', c.s.turn + 180, 'glide'); await c.wait(420); }),
      establish: {label: '建立连接', pose: 'open', from: 'lost', async run(c) {
        c.to('slash', 0, 'smooth'); c.to('dim', 0, 'smooth');
        c.to('turn', 180, 'glide');
        await c.wait(220);
        c.to('lockOn', 1, 'smooth'); c.to('lk', 1, 'bouncy');
        await c.wait(300);
      }},
      secure: {label: '加密锁定', pose: 'secured', from: 'open', async run(c) {
        c.to('shackle', 0, 'snappy');
        await c.wait(120);
        c.to('ok', 1, 'smooth');
        c.to('lk', 0.94, 'quick');
        await c.wait(70);
        c.to('lk', 1, 'bouncy');
        await c.wait(220);
      }},
      lost: {label: '连接中断', pose: 'lost', from: 'secured', async run(c) {
        c.to('ok', 0, 'smooth'); c.to('shackle', 1, 'snappy');
        await c.wait(110);
        c.to('lockOn', 0, 'smooth'); c.to('lk', 0.6, 'smooth');
        c.to('slash', 1, 'draw'); c.to('dim', 1, 'smooth');
        await c.wait(320);
      }}
    }
  });

  // ---------- screen-recording: a record dot that splits, stops and breathes ----------
  const DOT = rr(51, 43, 18, 18, 9), DOTS = DOT + DOT;
  const BARS = rr(48.5, 42, 8, 20, 3) + rr(63.5, 42, 8, 20, 3);
  const SQUARE = rr(51, 43, 13, 18, 3.5) + rr(56, 43, 13, 18, 3.5);
  M.define('screen-recording', {
    svg: `<rect x="14" y="20" width="92" height="64" rx="13"/><path d="M60 84V97M42 99H78"/>
<circle cx="60" cy="52" r="18"/><path data-part="dot" data-fill/>`,
    state: {bar: 0, sq: 0, dk: 1, rec: 0, dotOn: 1},
    poses: {idle: {}, recording: {rec: 1, dk: 1.15}, paused: {rec: 1, bar: 1}},
    render(s, p) {
      const shape = lerpPath(lerpPath(DOTS, BARS, clamp(s.bar, -0.1, 1.1)), SQUARE, clamp(s.sq, -0.1, 1.1));
      attr(p.dot, 'd', shape);
      attr(p.dot, 'transform', around(s.dk, 60, 52));
      fade(p.dot, s.dotOn);
      ink(p.dot, 'recording', s.rec);
    },
    actions: {
      tap: tap(bounce),
      start: {label: '开始录制', pose: 'recording', from: 'idle', async run(c) {
        c.to('dk', 0.78, 'quick');
        await c.wait(80);
        c.to('dk', 1.15, 'bouncy'); c.to('rec', 1, 'smooth');
        await c.wait(300);
      }},
      recording: {label: '录制中', loop: true, pose: 'recording', run(c) {
        c.to('rec', 1, 'smooth'); c.to('dk', 1.15, 'smooth');
        c.claim('dotOn');
        c.loop(t => { c.s.dotOn = 1 - 0.42 * wave(t, 0.75); });
      }},
      pause: {label: '暂停录制', pose: 'paused', from: 'recording', async run(c) {
        c.to('bar', 1, 'snappy'); c.to('dk', 1, 'snappy');
        await c.wait(280);
      }},
      resume: {label: '继续录制', pose: 'recording', from: 'paused', async run(c) {
        c.to('bar', 0, 'snappy'); c.to('dk', 1.15, 'snappy');
        await c.wait(280);
      }},
      stop: {label: '停止录制', pose: 'idle', from: 'recording', async run(c) {
        c.to('sq', 1, 'snappy'); c.to('dk', 1.05, 'snappy');
        await c.wait(220);
        c.to('rec', 0, 'smooth');
        await c.wait(140);
      }}
    }
  });

  // ---------- two-factor: a code that arrives on the phone and resolves ----------
  const CODE_X = [46, 60, 74];
  M.define('two-factor', {
    svg: `<g data-part="phone"><rect x="34" y="14" width="52" height="92" rx="13"/><path d="M54 24H66"/></g>`
      + CODE_X.map((x, i) => `<circle data-part="d${i}" data-fill cx="${x}" cy="60" r="5"/>`).join('')
      + '<path data-part="ok" d="M45 60L55 70L76 49"/><path data-part="strike" d="M40 60H80"/>',
    state: {d0: 0.32, d1: 0.32, d2: 0.32, conv: 0, ok: 0, strike: 0, bump: 0},
    poses: {idle: {}, shown: {d0: 1, d1: 1, d2: 1}, verified: {d0: 0, d1: 0, d2: 0, conv: 1, ok: 1}, expired: {strike: 1}},
    render(s, p) {
      attr(p.phone, 'transform', `translate(0 ${s.bump})`);
      CODE_X.forEach((x, i) => {
        const d = p['d' + i];
        attr(d, 'cx', +lerp(x, 60, clamp01(s.conv)).toFixed(2));
        attr(d, 'r', +(5 * (1 - 0.4 * clamp01(s.conv))).toFixed(2));
        fade(d, s['d' + i]);
      });
      drawOn(p.ok, s.ok); ink(p.ok, 'success', 1);
      drawOn(p.strike, s.strike); ink(p.strike, 'warning', 1);
    },
    actions: {
      tap: tap(bounce),
      request: {label: '收到验证码', pose: 'shown', from: 'idle', async run(c) {
        c.to('bump', -6, 'quick');
        await c.wait(80);
        c.to('bump', 0, 'bouncy');
        for (const k of ['d0', 'd1', 'd2']) { c.to(k, 1, 'smooth'); await c.wait(80); }
        await c.wait(140);
      }},
      verify: {label: '验证码通过', pose: 'verified', from: 'shown', async run(c) {
        c.to('conv', 1, 'snappy');
        for (const k of ['d0', 'd1', 'd2']) c.to(k, 0, 'smooth');
        await c.wait(130);
        c.to('ok', 1, 'draw');
        await c.wait(300);
      }},
      expire: {label: '验证码过期', pose: 'expired', from: 'shown', async run(c) {
        for (const k of ['d2', 'd1', 'd0']) { c.to(k, 0.32, 'smooth'); await c.wait(60); }
        c.to('strike', 1, 'draw');
        await c.wait(260);
      }}
    }
  });

  // ---------- usb: a USB-A plug that seats in a port and is recognised ----------
  // The metal shell slides under the port's lip, so everything below y 75 is hidden.
  M.define('usb', {
    svg: `<g data-part="sheath"><g data-part="plug"><path d="M60 8V22"/><rect x="43" y="22" width="34" height="26" rx="7"/>
<rect x="47" y="48" width="26" height="20" rx="2"/><rect data-fill x="52.5" y="54" width="5" height="5" rx="1"/><rect data-fill x="62.5" y="54" width="5" height="5" rx="1"/></g></g>
<path data-part="port" d="M32 78V90Q32 100 42 100H78Q88 100 88 90V78"/><path data-part="led" d="M53 90H67"/>`,
    state: {py: 0, portK: 1, led: 0, ok: 0},
    poses: {idle: {}, in: {py: 20}, ready: {py: 20, led: 1, ok: 1}},
    render(s, p) {
      attr(p.plug, 'transform', `translate(0 ${s.py})`);
      knockout(p.sheath, 'M0 75H120V120H0Z');
      attr(p.port, 'transform', pinchAt(s.portK, 60, 100));
      drawOn(p.led, s.led);
      ink(p.port, 'connected', s.ok); ink(p.led, 'connected', 1);
    },
    actions: {
      tap: tap(async c => { c.to('py', c.goal('py') + 6, 'snappy'); await c.wait(140); }),
      plug: {label: '插入', pose: 'in', from: 'idle', async run(c) {
        c.to('py', 20, 'snappy');
        await c.wait(150);
        c.to('portK', 0.94, 'quick');
        await c.wait(60);
        c.to('portK', 1, 'bouncy');
        await c.wait(200);
      }},
      recognise: {label: '识别设备', pose: 'ready', from: 'in', async run(c) {
        c.to('ok', 1, 'smooth'); c.to('led', 1, 'draw');
        await c.wait(320);
      }},
      eject: {label: '弹出', pose: 'idle', from: 'ready', async run(c) {
        c.to('ok', 0, 'smooth'); c.to('led', 0, 'smooth');
        c.to('py', 0, 'bouncy', -320);
        await c.wait(300);
      }}
    }
  });

  // ---------- sort: an arrow that turns over and bars that re-rank ----------
  const BAR_Y = [34, 60, 86];
  const reorder = async (c, turn) => {
    if (turn !== undefined) c.to('rot', turn, spring(0.38, 0.88));
    c.to('ao', c.goal('ao'), 'smooth');
    for (let i = 0; i < 3; i++) { c.to('b' + i, c.goal('b' + i), 'snappy'); await c.wait(60); }
    await c.wait(260);
  };
  M.define('sort', {
    svg: `<g data-part="arrow"><path d="M30 24V96"/><path d="M17 37L30 24L43 37"/></g>`
      + BAR_Y.map((y, i) => `<path data-part="b${i}"/>`).join(''),
    state: {rot: 0, ao: 1, b0: 16, b1: 30, b2: 44},
    poses: {ascending: {}, descending: {rot: 180, b0: 44, b2: 16}, mixed: {ao: 0.35, b0: 30, b1: 44, b2: 16}},
    periodic: {rot: 360},
    render(s, p) {
      attr(p.arrow, 'transform', rot(s.rot, 30, 60));
      fade(p.arrow, s.ao);
      BAR_Y.forEach((y, i) => attr(p['b' + i], 'd', `M56 ${y}H${(56 + Math.max(0, s['b' + i])).toFixed(2)}`));
    },
    actions: {
      tap: tap(bounce),
      ascending: {label: '升序', pose: 'ascending', from: 'descending', run: c => reorder(c, 360)},
      descending: {label: '降序', pose: 'descending', from: 'ascending', run: c => reorder(c, 180)},
      reorder: {label: '自定义排序', pose: 'mixed', from: 'ascending', run: c => reorder(c)}
    }
  });

  // ---------- receipt: paper that feeds out and tears along its teeth ----------
  const teeth = (B, fromLeft) => {
    let d = '';
    for (let i = 0; i <= 8; i++) {
      const x = fromLeft ? 30 + i * 7.5 : 90 - i * 7.5;
      d += `L${x} ${B - (i % 2 ? 6 : 0)}`;
    }
    return d;
  };
  const TEAR = 72;
  const STRIP = `M30 ${TEAR}` + teeth(TEAR, true).slice(1 + `30 ${TEAR}`.length) + 'V100' + teeth(100, false) + 'Z';
  M.define('receipt', {
    svg: `<g data-part="paper"><path data-part="sheet"/><path d="M42 32H78M42 46H78M42 60H64"/><path data-part="l3" d="M42 84H72"/></g>
<g data-part="strip"><path d="${STRIP}"/><path d="M42 84H72"/></g>`,
    state: {B: 100, sy: 0, sr: 0, so: 0, l3: 1, jx: 0},
    poses: {idle: {}, torn: {B: TEAR, l3: 0}},
    render(s, p) {
      const B = s.B.toFixed(2);
      attr(p.sheet, 'd', `M30 ${B}V20Q30 14 36 14H84Q90 14 90 20V${B}` + teeth(s.B, false) + 'Z');
      attr(p.paper, 'transform', `translate(${s.jx} 0)`);
      fade(p.l3, s.l3);
      attr(p.strip, 'transform', `translate(${s.jx} ${s.sy}) ${rot(s.sr, 36, TEAR)}`);
      fade(p.strip, s.so);
    },
    actions: {
      tap: tap(async c => { c.to('B', c.goal('B') + 5, 'snappy'); await c.wait(140); }),
      print: {label: '送出小票', pose: 'idle', from: 'torn', async run(c) {
        c.to('B', 100, spring(0.45, 1));
        await c.wait(220);
        c.to('l3', 1, 'smooth');
        await c.wait(220);
      }},
      tear: {label: '撕下', pose: 'torn', from: 'idle', async run(c) {
        c.to('B', 103, 'quick');
        await c.wait(80);
        c.set({B: TEAR, l3: 0, so: 1, sy: 3, sr: 0});
        c.to('sr', 16, spring(0.5, 1)); c.to('sy', 30, spring(0.45, 1));
        await c.wait(130);
        c.to('so', 0, 'smooth');
        await c.wait(260);
      }},
      jam: {label: '卡纸', from: 'idle', async run(c) {
        c.error();
        c.to('B', 104, 'snappy');
        await c.wait(120);
        for (const x of [3, -2.5, 1.5]) { c.to('jx', x, 'snappy'); await c.wait(75); }
        c.to('jx', 0, 'smooth');
        await c.wait(c.timing.holdFail * 0.4);
      }}
    }
  });

  // ---------- key: a key that slides into a slot and turns over ----------
  M.define('key', {
    svg: `<g data-part="sheath"><g data-part="key"><ellipse data-part="bow" cx="32" cy="60" rx="17" ry="17"/>
<path d="M49 60H92"/><path data-part="teeth"/></g></g><path data-part="slot"/>`,
    state: {kx: 0, turn: 0, gap: 0, ok: 0},
    poses: {idle: {}, in: {kx: 14}, open: {kx: 14, turn: 180, gap: 1, ok: 1}},
    periodic: {turn: 360},
    render(s, p) {
      const cos = Math.cos(s.turn * Math.PI / 180);
      attr(p.key, 'transform', `translate(${s.kx} 0)`);
      attr(p.bow, 'ry', +(17 * Math.max(0.1, Math.abs(cos))).toFixed(2));
      attr(p.teeth, 'd', `M76 60V${(60 + 12 * cos).toFixed(2)}M86 60V${(60 + 8 * cos).toFixed(2)}`);
      knockout(p.sheath, 'M103 0H140V120H103Z');
      const g = 4 * clamp01(s.gap);
      attr(p.slot, 'd', `M${103 - g} 44V76M${103 + g} 44V76`);
      ink(p.slot, 'success', s.ok);
    },
    actions: {
      tap: tap(async c => { c.to('kx', c.goal('kx') + 5, 'snappy'); await c.wait(140); }),
      insert: {label: '插入锁孔', pose: 'in', from: 'idle', async run(c) {
        c.to('kx', 14, 'snappy');
        await c.wait(280);
      }},
      turn: {label: '试转', from: 'in', async run(c) {
        c.to('turn', 70, 'snappy');
        await c.wait(200);
        c.to('turn', 0, 'smooth');
        await c.wait(200);
      }},
      unlock: {label: '转开', pose: 'open', from: 'in', async run(c) {
        c.to('turn', 180, FLIP);
        await c.wait(380);
        c.to('gap', 1, 'snappy'); c.to('ok', 1, 'smooth');
        await c.wait(220);
      }}
    }
  });

  // ---------- filter: items drop in, one passes, the funnel fills as "on" ----------
  const funnel = h => `M24 28H96L${(60 + h).toFixed(2)} 62V90L${(60 - h).toFixed(2)} 98V62Z`;
  const DROP_X = [40, 60, 80];
  M.define('filter', {
    svg: `<path data-part="funnel" d="${funnel(8)}"/>`
      + DROP_X.map((x, i) => `<circle data-part="d${i}" data-fill cx="${x}" cy="12" r="4.5"/>`).join(''),
    state: {neck: 8, on: 0, y0: 0, y1: 0, y2: 0, o0: 0, o1: 0, o2: 0},
    poses: {idle: {}, applied: {on: 1}},
    render(s, p) {
      attr(p.funnel, 'd', funnel(Math.max(3, s.neck)));
      fill(p.funnel, s.on); ink(p.funnel, 'connected', s.on);
      for (let i = 0; i < 3; i++) {
        attr(p['d' + i], 'transform', `translate(0 ${s['y' + i]})`);
        fade(p['d' + i], s['o' + i]);
      }
    },
    actions: {
      tap: tap(bounce),
      apply: {label: '筛选', pose: 'applied', from: 'idle', async run(c) {
        c.set({y0: -6, y1: -6, y2: -6});
        for (let i = 0; i < 3; i++) { c.to('o' + i, 1, 'quick'); c.to('y' + i, 0, 'snappy'); await c.wait(45); }
        await c.wait(110);
        c.to('y0', 16, 'snappy'); c.to('y2', 16, 'snappy');      // caught on the rim
        c.to('o0', 0, 'smooth'); c.to('o2', 0, 'smooth');
        c.to('y1', 76, spring(0.34, 1));                          // the match falls through
        await c.wait(170);
        c.to('o1', 0, 'quick'); c.to('on', 1, 'smooth');
        await c.wait(260);
        c.set({y0: 0, y1: 0, y2: 0});
      }},
      adjust: {label: '调整筛选条件', async run(c) {
        c.to('neck', 4, 'snappy');
        await c.wait(160);
        c.to('neck', 8, 'smooth');
        await c.wait(240);
      }},
      clear: {label: '清除', pose: 'idle', from: 'applied', async run(c) {
        c.to('on', 0, 'smooth'); c.to('neck', 10, 'snappy');
        await c.wait(140);
        c.to('neck', 8, 'smooth');
        await c.wait(240);
      }}
    }
  });

  // Catalog subjects keep their own verbs; their feedback tap becomes the SF bounce
  // instead of a uniform 4 % shrink that reads as nothing at 24 px.
  const CATALOG = ['wifi', 'bluetooth', 'cloud', 'sync', 'upload', 'battery', 'power', 'search', 'link',
    'cellular', 'hotspot', 'server', 'brightness', 'storage', 'check', 'warning', 'error', 'loading',
    'folder', 'copy', 'bookmark', 'printer', 'archive', 'clipboard', 'mail', 'phone',
    'video-call', 'share', 'qr-scan', 'wallet', 'cart', 'calendar', 'gift', 'star', 'shield',
    'passcode', 'permission', 'camera', 'face-id', 'fingerprint', 'ai-thinking', 'ai-browsing',
    'ai-reading', 'ai-coding'];
  for (const name of CATALOG) {
    const r = M.recipes[name];
    if (r) M.define(name, {...r, actions: {...r.actions, tap: tap(bounce)}});
  }
})(typeof window !== 'undefined' ? window : globalThis);
