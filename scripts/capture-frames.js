/*
 * capture-frames.js — deterministic key-frame sheet for motion-icons.js.
 * Loaded by assets/gallery.html?frames. Replaces rAF / setTimeout /
 * performance.now with a virtual 120 Hz clock and plays, for every icon:
 *   each one-shot action (starting from its `from` pose),
 *   each loop (start, then stop()),
 *   each drive (0 → 1, then stop()),
 *   and, if the recipe maps it, the async task (busy → success / fail).
 *
 * Checks per sequence:
 *   - no NaN / Infinity reaches the DOM
 *   - an action with `pose` ends in that pose
 *   - the icon comes to rest at exactly its pose values, without the error
 *     colour, within LIMIT_MS
 * window.__motionIconFrames resolves to [{label, ok, ms}] for scripted checks.
 */
(function () {
  'use strict';
  const LIMIT_MS = 4000;
  const STEP = 1000 / 120;
  const channel = new MessageChannel();
  let wake = null;
  channel.port1.onmessage = () => wake();
  const yieldToBrowser = () => new Promise(r => { wake = r; channel.port2.postMessage(0); });

  let clock = performance.now();
  const frames = [], timers = [];
  performance.now = () => clock;
  window.requestAnimationFrame = cb => { frames.push(cb); return frames.length; };
  window.setTimeout = (cb, ms = 0) => { timers.push({at: clock + ms, cb}); return timers.length; };

  async function advance(ms) {
    const end = clock + ms;
    while (clock < end - 1e-6) {
      clock += STEP;
      for (const t of timers.filter(t => t.at <= clock)) { timers.splice(timers.indexOf(t), 1); t.cb(); }
      for (const cb of frames.splice(0)) cb(clock);
      await yieldToBrowser();                        // a macrotask: every awaiting action catches up
    }
  }

  const sheet = document.createElement('div');
  sheet.id = 'frames';
  document.body.appendChild(sheet);
  const report = [];

  function row(title) {
    const seq = document.createElement('div');
    seq.className = 'seq';
    seq.innerHTML = `<b>${title}</b>`;
    sheet.appendChild(seq);
    return seq;
  }
  function note(seq, text, ok, ms) {
    const fig = document.createElement('figure');
    fig.innerHTML = `<figcaption class="${ok ? '' : 'err'}">${text}</figcaption>`;
    seq.appendChild(fig);
    report.push({label: seq.firstChild.textContent + ' ' + text, ok, ms});
  }
  function shot(seq, icon, caption) {
    const fig = document.createElement('figure');
    fig.innerHTML = icon.element.outerHTML + `<figcaption>${caption}</figcaption>`;
    seq.appendChild(fig);
    if (/NaN|Infinity/.test(icon.element.innerHTML)) note(seq, `NaN @ ${caption}`, false);
  }
  async function marks(seq, icon, list, prefix = '+') {
    let t = 0;
    for (const m of list) { await advance(m - t); t = m; shot(seq, icon, prefix + m); }
    return t;
  }

  const atGoal = icon => {
    const v = icon.values(), g = icon.goal();
    return Object.keys(g).every(k => v[k] === g[k]) && !icon.element.classList.contains('is-error');
  };
  async function settle(seq, icon, t) {
    while (t < LIMIT_MS + 1500 && !(icon.idle && atGoal(icon))) { await advance(STEP); t += STEP; }
    const ms = Math.round(t), ok = icon.idle && atGoal(icon) && ms <= LIMIT_MS;
    note(seq, ok ? `OK ${ms}ms → ${icon.pose}` : `ERROR ${ms}ms 未回到姿态`, ok, ms);
  }
  async function begin(icon, pose, title) {
    icon.reset({instant: true, pose});
    await advance(STEP);
    return row(title);
  }

  async function oneShot(name, icon, action, a) {
    const seq = await begin(icon, a.from ?? icon.poses[0], `${name}.${action}`);
    icon.play(action);
    const t = await marks(seq, icon, [0, 50, 120, 200, 300, 450, 650, 900]);
    if (a.pose && icon.pose !== a.pose) note(seq, `ERROR 姿态应为 ${a.pose}`, false);
    await settle(seq, icon, t);
  }
  async function loop(name, icon, action, a) {
    const seq = await begin(icon, a.from ?? icon.poses[0], `${name}.${action} ↻`);
    icon.play(action);
    await marks(seq, icon, [150, 400, 700, 1000]);
    icon.stop();
    const t = await marks(seq, icon, [80, 250], 'stop+');
    await settle(seq, icon, t);
  }
  async function drive(name, icon, action, a) {
    const seq = await begin(icon, a.from ?? icon.poses[0], `${name}.${action} ⇆`);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) { icon.drive(action, v); await advance(150); shot(seq, icon, `v=${v}`); }
    icon.stop();
    const t = await marks(seq, icon, [200], 'stop+');
    await settle(seq, icon, t);
  }
  async function task(name, icon, result) {
    const seq = await begin(icon, icon.poses[0], `${name} 任务 ${result}`);
    icon.busy();
    await advance(300); shot(seq, icon, 'busy 300');
    await advance(350); shot(seq, icon, 'busy 650');
    icon[result]();
    const t = await marks(seq, icon, [60, 160, 300, 500, 800, 1200]);
    await settle(seq, icon, t);
  }

  async function main() {
    await advance(50);
    for (const [name, icon] of Object.entries(window.galleryIcons)) {
      const recipe = MotionIcon.recipes[name];
      for (const [action, a] of Object.entries(recipe.actions)) {
        if (a.drive) await drive(name, icon, action, a);
        else if (a.loop) await loop(name, icon, action, a);
        else await oneShot(name, icon, action, a);
      }
      if (recipe.task) { await task(name, icon, 'success'); await task(name, icon, 'fail'); }
    }
    await task('lock (frame)', window.galleryFramed, 'success');

    const bad = report.filter(r => !r.ok);
    const head = document.createElement('h3');
    head.textContent = bad.length ? `ERROR ${bad.length} 项未通过` : `全部 ${report.length} 项通过`;
    head.className = bad.length ? 'err' : '';
    sheet.prepend(head);
    sheet.style.zoom = String(Math.min(1, innerWidth / 980));   // one screenshot per screen of rows
    document.body.classList.add('frames-ready');
    return report;
  }

  window.__motionIconFrames = main();
})();
