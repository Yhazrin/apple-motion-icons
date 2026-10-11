/*!
 * motion-icons.js — Apple-style animated SVG icons. Spring physics on
 * requestAnimationFrame (runs at the display refresh rate), no dependencies.
 *
 * An icon is a subject with its own motion vocabulary:
 *   poses    stable states it can rest in      (heart: off / on, lock: locked / unlocked)
 *   actions  one-shot journeys between/at poses (bell.ring, delete.trash, pay.flip)
 *   loops    ongoing activity until stopped    (refresh.spin, heart.beat, volume.sound)
 *   drives   follow a continuous input 0..1    (refresh.pull, volume.level)
 *
 *   const bell = MotionIcon.create(container, 'bell', options?)
 *   bell.play('ring')            one-shot action (returns a promise)
 *   bell.play('ringing')         loop action, until bell.stop()
 *   volume.drive('level', 0.4)   continuous input
 *   heart.toggle()               switch between the recipe's two toggle actions
 *   icon.tap()                   press feedback
 *
 * Optional async-task adapter (any icon): icon.busy() → icon.success() / fail()
 * and icon.progress(p). Recipes map it onto their own actions via `task`.
 * MotionIcon.hud(name) wraps that adapter in a frosted Face ID-style panel.
 *
 * Recipes live in motion-icons-recipes.js and register with
 * MotionIcon.define(name, recipe). The engine owns springs, timing, stroke
 * weight, cancellation and the return to the current pose.
 */
(function (root) {
  'use strict';

  // Semantic spring presets (mass 1). ζ = damping / (2·√stiffness).
  const SPRINGS = {
    snap:    {stiffness: 620, damping: 30},   // ζ .60  mechanical contact, small rebound
    pop:     {stiffness: 420, damping: 16},   // ζ .39  emphasis, visible overshoot
    gentle:  {stiffness: 230, damping: 26},   // ζ .86  shape morphs
    slow:    {stiffness: 140, damping: 20},   // ζ .85  large rotations
    settle:  {stiffness: 300, damping: 26},   // ζ .75  back to the pose
    draw:    {stiffness: 200, damping: 24},   // ζ .85  stroke drawing
    fade:    {stiffness: 300, damping: 30},   // ζ .87  opacity
    exit:    {stiffness: 400, damping: 40},   // ζ 1.0  leaves without bounce
    impact:  {stiffness: 1200, damping: 40},  // ζ .58  fast squash in
    rebound: {stiffness: 420, damping: 14},   // ζ .34  squash out
    swing:   {stiffness: 260, damping: 6, precision: 0.05},   // ζ .19  free pendulum (bells, tags), degrees
    track:   {stiffness: 900, damping: 60},   // ζ 1.0  follows a finger / slider
    shake:   {stiffness: 900, damping: 15}    // ζ .25  failure
  };
  const TIMING = {minBusy: 600, minBusyFail: 420, hold: 900, holdFail: 700};
  const WEIGHTS = {light: 0.8, regular: 1, medium: 1.1, semibold: 1.2, bold: 1.4};
  const recipes = {};

  const CSS = `
.mi{display:inline-block;width:var(--mi-size,24px);height:var(--mi-size,24px);line-height:0;vertical-align:middle;flex:none;
  transition:color .2s cubic-bezier(.22,.72,.18,1)}
.mi svg{display:block;width:100%;height:100%;overflow:visible}
.mi svg *{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}
.mi svg [data-fill]{fill:currentColor;stroke:none}
.mi.is-error{color:var(--mi-error,#ff3b30)}
.mi-hud{--mi-hud-size:156px;position:fixed;left:50%;top:50%;z-index:2147483000;box-sizing:border-box;
  width:var(--mi-hud-size);height:var(--mi-hud-size);border-radius:calc(var(--mi-hud-size) * .245);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--mi-hud-size) * .03);padding-top:calc(var(--mi-hud-size) * .04);
  background:var(--mi-hud-bg,rgb(250 250 252 / .72));-webkit-backdrop-filter:blur(26px) saturate(1.8);backdrop-filter:blur(26px) saturate(1.8);
  box-shadow:0 0 0 .5px rgb(0 0 0 / .08),0 24px 60px -18px rgb(0 0 0 / .24);color:var(--mi-hud-ink,#1d1d1f);
  pointer-events:none;user-select:none;transform:translate(-50%,-50%);will-change:transform,opacity}
.mi-hud[hidden]{display:none!important}
@supports (corner-shape:squircle){.mi-hud{corner-shape:squircle;border-radius:calc(var(--mi-hud-size) * .34)}}
.mi-hud .mi{--mi-size:calc(var(--mi-hud-size) * .59)}
.mi-hud__label{font:600 calc(var(--mi-hud-size) * .08)/1.2 -apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Microsoft YaHei",system-ui,sans-serif;
  letter-spacing:.02em;color:var(--mi-hud-muted,#6e6e73);white-space:nowrap;transition:color .2s}
.mi-hud.is-error .mi-hud__label{color:var(--mi-error,#ff3b30)}
@media (prefers-color-scheme:dark){.mi-hud{--mi-hud-bg:rgb(44 44 46 / .72);--mi-hud-ink:#f5f5f7;--mi-hud-muted:#a1a1a6;
  box-shadow:0 0 0 .5px rgb(255 255 255 / .1),0 24px 60px -18px rgb(0 0 0 / .6)}.mi{--mi-error:#ff453a}}
@media (forced-colors:active){.mi-hud{background:Canvas;color:CanvasText;border:1px solid CanvasText}}`;

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const clamp01 = x => clamp(x, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const around = (k, cx = 60, cy = 60) => `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
  const aroundXY = (kx, ky, cx = 60, cy = 60) => `translate(${cx} ${cy}) scale(${kx} ${ky}) translate(${-cx} ${-cy})`;
  const wave = (t, hz, phase = 0) => (1 - Math.cos((t * hz + phase) * Math.PI * 2)) / 2;   // 0..1 smooth pulse
  const polar = (cx, cy, r, deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
  const arc = (cx, cy, r, from, to) => {
    const [x0, y0] = polar(cx, cy, r, from), [x1, y1] = polar(cx, cy, r, to);
    return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(to - from) > 180 ? 1 : 0} ${to > from ? 1 : 0} ${x1} ${y1}`;
  };

  // Interpolate two path strings that share the same command structure.
  const NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
  function lerpPath(a, b, t) {
    const na = a.match(NUM), nb = b.match(NUM);
    if (!na || !nb || na.length !== nb.length) throw new Error('lerpPath: paths must have the same structure');
    let i = 0;
    return a.replace(NUM, () => { const v = lerp(+na[i], +nb[i], t); i++; return +v.toFixed(3); });
  }

  // Face ID corner brackets around a square (centre 60, half-size 42).
  // t = 0 brackets; gaps close by t = .55 (rounded square); t = 1 circle.
  function framePath(t, legScale = 1) {
    t = clamp01(t);
    const c = 60, h = 42, r = 13 + (h - 13) * t;
    const k = Math.min(1, t / 0.55), close = k * k * (3 - 2 * k);
    const leg = (h - r) * Math.min(1, (0.36 + 0.64 * close) * legScale);
    const L = c - h, R = c + h, a = (x, y) => `A${r} ${r} 0 0 1 ${x} ${y}`;
    return `M${L} ${L + r + leg}V${L + r}${a(L + r, L)}H${L + r + leg}`
      + `M${R - r - leg} ${L}H${R - r}${a(R, L + r)}V${L + r + leg}`
      + `M${R} ${R - r - leg}V${R - r}${a(R - r, R)}H${R - r - leg}`
      + `M${L + r + leg} ${R}H${L + r}${a(L, R - r)}V${R - r - leg}`;
  }

  function injectStyles(doc) {
    if (doc.querySelector('style[data-motion-icons]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-motion-icons', '');
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  // One ticker per instance: every spring and loop advances in the same frame,
  // then the icon renders once. Springs keep per-key velocity, so a new target
  // on a moving key continues from the current speed instead of restarting.
  function createAnimator(win, state, render, reduced) {
    const vel = {}, springs = new Map(), loops = new Set();
    let ticking = false, last = null;
    const frame = cb => win.requestAnimationFrame(cb);

    function tick(t) {
      const dt = last === null ? 0 : clamp((t - last) / 1000, 0, 1 / 30);
      last = t;
      const n = Math.ceil(dt * 480), h = n ? dt / n : 0;
      for (const [key, sp] of springs) {
        let x = state[key], v = vel[key] || 0;
        for (let i = 0; i < n; i++) {
          v += (-sp.k * (x - sp.target) - sp.c * v) * h;
          x += v * h;
        }
        if (dt > 0 && Math.abs(x - sp.target) < sp.eps && Math.abs(v) < sp.eps * 10) {
          state[key] = sp.target; vel[key] = 0; springs.delete(key); sp.resolve(true);
        } else {
          state[key] = x; vel[key] = v;
        }
      }
      for (const lp of loops) {
        if (!lp.alive()) { loops.delete(lp); continue; }
        lp.time += dt;
        lp.fn(lp.time, dt);
      }
      render();
      if (springs.size || loops.size) frame(tick);
      else { ticking = false; last = null; }
    }
    function kick() { if (!ticking) { ticking = true; last = null; frame(tick); } }

    function to(key, target, preset = 'settle', velocity) {
      const p = typeof preset === 'string' ? SPRINGS[preset] : preset;
      const prev = springs.get(key);
      if (prev) { springs.delete(key); prev.resolve(false); }
      if (reduced.matches) { state[key] = target; vel[key] = 0; render(); return Promise.resolve(true); }
      if (velocity !== undefined) vel[key] = velocity;
      else if (p.velocity !== undefined) vel[key] = p.velocity;
      const eps = p.precision ?? Math.max((Math.abs(target - state[key]) || 1) * 0.001, 1e-4);
      return new Promise(resolve => {
        springs.set(key, {target, k: p.stiffness, c: p.damping, eps, resolve});
        kick();
      });
    }
    function set(values) {
      for (const key of Object.keys(values)) {
        const sp = springs.get(key);
        if (sp) { springs.delete(key); sp.resolve(false); }
        state[key] = values[key];
        vel[key] = 0;
      }
      render();
    }
    function loop(fn, alive) {
      if (reduced.matches) return () => {};
      const lp = {fn, alive, time: 0};
      loops.add(lp);
      kick();
      return () => loops.delete(lp);
    }
    function claim(key) {              // stop a spring but keep its velocity (loops take over)
      const sp = springs.get(key);
      if (sp) { springs.delete(key); sp.resolve(false); }
    }
    function shift(key, d) {           // move a wrapping value by whole periods, spring included
      state[key] += d;
      const sp = springs.get(key);
      if (sp) sp.target += d;
    }
    function stop() {
      for (const sp of springs.values()) sp.resolve(false);
      springs.clear(); loops.clear();
    }
    return {
      to, set, loop, claim, shift, stop, vel,
      setVelocity: (k, v) => { vel[k] = v; },
      target: k => springs.get(k)?.target,
      active: () => springs.size > 0 || loops.size > 0
    };
  }

  const SHARED = {shake: 0, pop: 1, glyphOpacity: 1, glyphScale: 1, ring: 0, check: 0, morph: 0, spin: 0, breath: 1, leg: 1};
  const SHARED_PERIODIC = {spin: 90};

  // Generic actions every icon has; a recipe may override any of them.
  const BUILTIN = {
    press: {run: async c => { c.press(); await c.wait(220); }},
    pulse: {loop: true, run(c) { c.claim('glyphScale'); c.loop(t => { c.s.glyphScale = 1 - 0.05 * wave(t, 1.2); }); }},
    progress: {drive(c, v) {
      if (c.framed) return;
      c.to('glyphScale', 0.55, 'gentle'); c.to('glyphOpacity', 0.35, 'fade');
      c.to('ring', Math.min(v, 0.999), 'gentle');
    }},
    confirm: {run: c => c.confirm()},
    fail: {run: async c => { c.error(); await c.shake(); await c.wait(c.timing.holdFail); }}
  };

  function create(container, name, options = {}) {
    const recipe = recipes[name];
    if (!recipe) throw new Error('MotionIcon: unknown icon "' + name + '"');
    const doc = container.ownerDocument || document, win = doc.defaultView;
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    const timing = {...TIMING, ...options.timing};
    const framed = !!options.frame;
    const base = framed ? 0.58 : 1;
    const autoReset = options.autoReset ?? true;
    const weight = typeof options.weight === 'number' ? options.weight : (WEIGHTS[options.weight] || 1);
    injectStyles(doc);
    if (recipe.css && !doc.querySelector(`style[data-motion-icon="${name}"]`)) {
      const style = doc.createElement('style');
      style.setAttribute('data-motion-icon', name);
      style.textContent = recipe.css;
      doc.head.appendChild(style);
    }

    const el = doc.createElement('span');
    el.className = 'mi mi--' + name + (options.className ? ' ' + options.className : '');
    el.setAttribute('aria-hidden', 'true');
    if (options.size) el.style.setProperty('--mi-size', typeof options.size === 'number' ? options.size + 'px' : options.size);
    el.innerHTML = '<svg viewBox="0 0 120 120"><g data-mi="root">'
      + (framed ? '<path data-mi="frame"/>' : '')
      + '<g data-mi="glyph">' + recipe.svg + '</g>'
      + '<circle data-mi="ring" cx="60" cy="60" r="42" transform="rotate(-90 60 60)"/>'
      + '<path data-mi="check" d="M41 61l13 13 26-27"/></g></svg>';
    container.appendChild(el);

    const svg = el.firstElementChild;
    const $ = k => svg.querySelector('[data-mi="' + k + '"]');
    const rootG = $('root'), glyph = $('glyph'), frameEl = $('frame'), ring = $('ring'), check = $('check');
    const parts = {};
    glyph.querySelectorAll('[data-part]').forEach(p => { parts[p.dataset.part] = p; });
    const ringLength = 2 * Math.PI * 42, checkLength = check.getTotalLength();
    ring.style.strokeDasharray = ringLength;
    check.style.strokeDasharray = checkLength;

    const poseNames = Object.keys(recipe.poses);
    const initialPose = options.pose ?? poseNames[0];
    const defaults = {...SHARED, ...recipe.state};
    const overrides = {};
    const goalOf = p => ({...defaults, ...recipe.poses[p], ...overrides[p]});
    let pose = initialPose;
    const state = goalOf(pose);
    const periodic = {...SHARED_PERIODIC, ...recipe.periodic};
    const actions = {...BUILTIN, ...recipe.actions};
    const task = {busy: 'pulse', success: 'confirm', fail: 'fail', ...recipe.task, ...options.task};
    const mem = {};
    let run = 0, mode = 'rest', current = null, busySince = 0, busyRun = -1, driveCtx = null;
    el.dataset.pose = pose;

    function render() {
      const s = state;
      rootG.setAttribute('transform', `translate(${s.shake} 0) ${around(s.pop)}`);
      glyph.setAttribute('opacity', clamp01(s.glyphOpacity));
      glyph.setAttribute('transform', around(s.glyphScale * base));
      if (frameEl) {
        frameEl.setAttribute('d', framePath(s.morph, s.leg));
        frameEl.setAttribute('transform', `rotate(${s.spin} 60 60) ${around(s.breath)}`);
      }
      ring.style.strokeDashoffset = ringLength * (1 - clamp01(s.ring));
      ring.style.opacity = frameEl ? 0 : clamp01(s.ring * 8);   // round caps would show a dot at 0
      check.style.strokeDashoffset = checkLength * (1 - clamp01(s.check));
      check.style.opacity = clamp01(s.check * 8);
      recipe.render(s, parts, util);
    }

    const A = createAnimator(win, state, render, reduced);
    const now = () => win.performance.now();
    const wait = ms => new Promise(r => win.setTimeout(r, ms));
    const emit = (type, detail) => el.dispatchEvent(new CustomEvent('mi:' + type, {detail}));

    // Optical stroke weight: constant on-screen thickness at any icon size.
    function updateStroke() {
      const px = el.getBoundingClientRect().width || 24;
      const strokePx = Math.max(1.6, px * 0.046) * weight;
      const units = strokePx * 120 / px;
      svg.style.strokeWidth = units.toFixed(3);
      glyph.style.strokeWidth = (units / base).toFixed(3);
    }
    const ro = win.ResizeObserver ? new win.ResizeObserver(updateStroke) : null;
    ro ? ro.observe(el) : updateStroke();
    updateStroke();

    function applyPose(p) {
      if (!recipe.poses[p]) throw new Error(`MotionIcon: "${name}" has no pose "${p}"`);
      if (p === pose) return;
      pose = p;
      el.dataset.pose = p;
      emit('pose', {pose: p});
    }

    // Spring every value back to the current pose. Wrapping values first jump
    // by whole periods so a spinner never unwinds extra turns.
    function settle(preset = 'settle') {
      const goal = goalOf(pose);
      el.classList.remove('is-error');
      for (const [k, period] of Object.entries(periodic)) {
        const n = Math.round((state[k] - goal[k]) / period);
        if (n) A.shift(k, -n * period);
      }
      for (const k of Object.keys(goal)) {
        const t = A.target(k);
        if (t !== undefined ? t !== goal[k] : state[k] !== goal[k]) A.to(k, goal[k], preset);
      }
    }

    function ctx(id, arg) {
      let done = false;
      const alive = () => id === run && !done;
      const goal = k => goalOf(pose)[k];
      const to = (k, t, p, v) => alive() ? A.to(k, t, p, v) : Promise.resolve(false);
      return {
        s: state, parts, mem, util, arg, timing, framed,
        get pose() { return pose; },
        goal,
        setGoal(k, v) { (overrides[pose] ||= {})[k] = v; },
        setPose(p) { if (alive()) applyPose(p); },
        to,
        set(values) { if (alive()) A.set(values); },
        setVelocity(k, v) { if (alive()) A.setVelocity(k, v); },
        vel: A.vel,
        wait, alive,
        loop: fn => alive() ? A.loop(fn, alive) : () => {},
        claim(...keys) { if (alive()) keys.forEach(A.claim); },
        async nudge(k, delta, ms = 100) {         // push away from the pose value, spring back
          to(k, goal(k) + delta, 'snap');
          await wait(ms);
          return to(k, goal(k), 'pop');
        },
        squash(k, amount = 0.9, home = 1) {        // impact in, rebound out
          return to(k, amount, 'impact').then(ok => ok && to(k, home, 'rebound'));
        },
        press: (k = 0.88) => press(alive, k),
        shake: () => alive() ? shake() : Promise.resolve(false),
        error(on = true) { if (alive()) el.classList.toggle('is-error', on); },
        confirm: o => confirm(alive, o),
        check: () => checkOnly(alive),
        size: () => el.getBoundingClientRect().width,
        _finish() { done = true; }
      };
    }

    async function press(alive, k) {
      if (!alive()) return false;
      A.to('pop', k, 'impact');
      await wait(90);
      if (alive()) A.to('pop', 1, 'rebound');
      return alive();
    }

    async function confirm(alive, {hold = timing.hold} = {}) {
      if (!alive()) return false;
      if (frameEl) { A.to('spin', 90, 'slow'); A.to('morph', 1, 'gentle'); }
      else A.to('ring', 1, 'draw');
      A.to('glyphOpacity', 0, 'fade');
      A.to('glyphScale', 0.55, 'gentle');
      await wait(frameEl ? 140 : 180);
      if (!(await checkOnly(alive))) return false;
      await wait(hold);
      return alive();
    }

    async function checkOnly(alive) {
      if (!alive()) return false;
      A.to('check', 1, 'draw');
      await wait(240);
      if (!alive()) return false;
      A.to('pop', 1, 'pop', 0.9);           // small bounce as the check lands
      await wait(140);
      return alive();
    }

    function shake() {
      return A.to('shake', 0, {...SPRINGS.shake, velocity: -270, precision: 0.15});
    }

    function action(actionName) {
      const a = actions[actionName];
      if (!a) throw new Error(`MotionIcon: "${name}" has no action "${actionName}"`);
      return a;
    }

    async function play(actionName, arg, {settle: settleAfter = true} = {}) {
      const a = action(actionName);
      const id = ++run;
      mode = a.loop ? 'loop' : 'action';
      current = actionName;
      el.classList.remove('is-error');
      const c = ctx(id, arg);
      if (a.pose) applyPose(a.pose);
      emit('action', {action: actionName});
      if (a.run) await a.run(c, arg);
      if (id !== run) return false;
      if (a.loop) return true;
      c._finish();
      mode = 'rest'; current = null;
      if (settleAfter) settle();
      emit('end', {action: actionName});
      return true;
    }

    function stop() {
      if (mode === 'loop' && actions[current].exit) return play(actions[current].exit);
      ++run;
      const was = current;
      mode = 'rest'; current = null; busySince = 0;
      settle();
      emit('end', {action: was});
      return Promise.resolve(true);
    }

    function drive(actionName, value) {
      const a = action(actionName);
      if (!a.drive) throw new Error(`MotionIcon: action "${actionName}" is not a drive`);
      if (!(mode === 'drive' && current === actionName)) {
        const id = ++run;
        mode = 'drive'; current = actionName;
        el.classList.remove('is-error');
        driveCtx = ctx(id);
        if (a.pose) applyPose(a.pose);
        emit('action', {action: actionName});
      }
      a.drive(driveCtx, clamp01(value));
    }

    function busy() {
      play(task.busy);
      busyRun = run;
      busySince = now();
      if (frameEl) {
        const id = run;
        A.loop(t => { state.breath = 1 - 0.035 * wave(t, 1.1); state.leg = 1 + 0.25 * Math.sin(t * 1.1 * Math.PI * 2); },
          () => id === run);
      }
    }

    async function resolveTask(result) {
      const id = run;
      if (busySince && id === busyRun) {
        await wait(Math.max(0, (result === 'success' ? timing.minBusy : timing.minBusyFail) - (now() - busySince)));
        if (id !== run) return false;
      }
      busySince = 0;
      if (frameEl) { A.to('breath', 1, 'settle'); A.to('leg', 1, 'settle'); }
      emit('resolve', {result});
      const seq = [].concat(task[result]);
      for (let i = 0; i < seq.length; i++) {
        const last = i === seq.length - 1;
        if (!(await play(seq[i], undefined, {settle: !last || autoReset}))) return false;
      }
      emit('done', {result});
      return true;
    }

    const api = {
      element: el, name,
      get pose() { return pose; },
      get mode() { return mode; },
      get action() { return current; },
      get idle() { return mode === 'rest' && !A.active(); },
      poses: poseNames,
      actions: Object.keys(recipe.actions || {}),
      play, stop, drive,
      toggle() {
        const [a, b] = recipe.toggle || [];
        if (!a) throw new Error(`MotionIcon: "${name}" defines no toggle`);
        return play(pose === actions[a].pose ? b : a);
      },
      tap() {
        if (mode === 'loop' || mode === 'drive') return Promise.resolve(false);
        return play(actions.tap ? 'tap' : 'press');
      },
      setPose(p, {instant = false} = {}) {
        ++run; mode = 'rest'; current = null;
        applyPose(p);
        if (instant) { el.classList.remove('is-error'); A.set(goalOf(pose)); } else settle('gentle');
      },
      busy,
      progress(p) {
        if (!busySince) busySince = now();
        drive('progress', p);
        busyRun = run;
      },
      success() { return resolveTask('success'); },
      fail() { return resolveTask('fail'); },
      reset(opts = {}) {
        ++run; mode = 'rest'; current = null; busySince = 0;
        if (opts.pose) applyPose(opts.pose);
        if (opts.instant) { el.classList.remove('is-error'); A.set(goalOf(pose)); } else settle();
        emit('rest');
      },
      values: () => ({...state}),
      goal: () => goalOf(pose),
      destroy() {
        ++run;
        A.stop();
        ro?.disconnect();
        el.remove();
      }
    };
    render();
    return api;
  }

  // Frosted, centred panel around a framed icon (Face ID prompt style).
  // Drives the icon's async-task adapter; labels come from recipe.labels.
  function hud(name, options = {}) {
    const doc = options.document || document, win = doc.defaultView;
    const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
    injectStyles(doc);
    const panel = doc.createElement('div');
    panel.className = 'mi-hud' + (options.className ? ' ' + options.className : '');
    panel.setAttribute('aria-hidden', 'true');
    panel.hidden = true;
    (options.container || doc.body).appendChild(panel);
    const icon = create(panel, name, {frame: true, ...options, autoReset: false, size: undefined});
    const startPose = icon.pose;
    const label = doc.createElement('span');
    label.className = 'mi-hud__label';
    panel.appendChild(label);

    const recipe = recipes[name];
    let copy = {busy: '', done: '', fail: '', ...recipe.labels, ...options.labels};
    const st = {opacity: 0, scale: 0.82};
    const A = createAnimator(win, st, () => {
      panel.style.opacity = clamp01(st.opacity);
      panel.style.transform = `translate(-50%,-50%) scale(${st.scale})`;
    }, reduced);
    let run = 0;

    icon.element.addEventListener('mi:resolve', e => {
      label.textContent = e.detail.result === 'success' ? copy.done : copy.fail;
      panel.classList.toggle('is-error', e.detail.result !== 'success');
    });
    icon.element.addEventListener('mi:done', () => hide(run));

    async function hide(id) {
      await Promise.all([A.to('opacity', 0, 'exit'), A.to('scale', 0.94, 'exit')]);
      if (id !== run) return;
      panel.hidden = true;
      icon.reset({instant: true, pose: startPose});
    }

    return {
      element: panel, icon,
      busy(labels) {
        const id = ++run;
        copy = {busy: '', done: '', fail: '', ...recipe.labels, ...options.labels, ...labels};
        panel.classList.remove('is-error');
        label.textContent = copy.busy;
        if (panel.hidden) { A.set({opacity: 0, scale: 0.82}); panel.hidden = false; }
        A.to('opacity', 1, {stiffness: 380, damping: 34});
        A.to('scale', 1, {stiffness: 320, damping: 20});
        icon.busy();
        return id;
      },
      progress(p) { icon.progress(p); },
      success() { return icon.success(); },
      fail() { return icon.fail(); },
      dismiss() { hide(++run); },
      destroy() { ++run; icon.destroy(); panel.remove(); }
    };
  }

  function define(name, recipe) {
    if (!recipe.svg || !recipe.render) throw new Error('MotionIcon.define: recipe needs svg and render');
    recipes[name] = {state: {}, poses: {rest: {}}, actions: {}, ...recipe};
  }

  const util = {clamp, clamp01, lerp, lerpPath, around, aroundXY, wave, polar, arc, framePath};
  const api = {create, hud, define, recipes, SPRINGS, TIMING, util};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MotionIcon = api;
})(typeof window !== 'undefined' ? window : globalThis);
