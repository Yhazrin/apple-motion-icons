/**
 * Lay out every gallery action sequence from the current recipes.
 * Serves nothing itself: open the already-running source gallery on :8765.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'review');
const PAGE = 'http://127.0.0.1:8765/assets/gallery.html?frames';
const PORT = 9334;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join('/tmp', 'motion-frame-board')}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function ready() {
  for (let i = 0; i < 40; i++) {
    try {
      const version = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (version.ok) return;
    } catch {}
    await sleep(150);
  }
  throw new Error('Chrome did not open a debugging port');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    ws.send(JSON.stringify({ id: next, method, params }));
  });
}

try {
  await ready();
  const target = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(PAGE)}`, { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  const send = cdp(ws);
  await send('Runtime.enable');
  const started = Date.now();
  let report = null;
  while (Date.now() - started < 12 * 60 * 1000) {
    const result = await send('Runtime.evaluate', {
      expression: `document.body.classList.contains('frames-ready') ? JSON.stringify(window.__frameDump || (window.__frameDump = [...document.querySelectorAll('#frames .seq')].map(seq => ({title: seq.querySelector('b').textContent, html: seq.innerHTML})))) : ''`,
      returnByValue: true,
    });
    if (result.result.value) { report = JSON.parse(result.result.value); break; }
    await sleep(2000);
  }
  ws.close();
  if (!report) throw new Error('Frame sheet did not finish');

  const commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  const groups = new Map();
  for (const row of report) {
    const name = row.title.split('.')[0].replace(/ 任务.*/, '').replace(/ \(frame\)/, '');
    const key = name === 'lock (frame)' ? 'lock' : name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  await mkdir(OUT, { recursive: true });
  const style = `<style>
    body{margin:0;background:#f4f1ea;color:#1c1c1c;font:14px -apple-system,sans-serif}
    header{position:sticky;top:0;background:#f4f1eaee;padding:16px 20px;border-bottom:1px solid #ddd}
    a{color:inherit} .seq{display:flex;gap:6px;align-items:flex-start;margin:0 0 8px;padding:0 16px}
    .seq>b{width:190px;flex:none;font:600 11px ui-monospace,Menlo,monospace;padding-top:18px}
    figure{margin:0;width:72px;display:flex;flex-direction:column;align-items:center;gap:2px}
    figcaption{font:10px ui-monospace,Menlo,monospace;color:#666;text-align:center}
    .err{color:#ff3b30} .mi{width:60px;height:60px;color:#1c1c1c}
    .mi svg{width:60px;height:60px;display:block}
    .mi svg *{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round}
    .mi svg [data-fill]{fill:currentColor;stroke:none}
    nav{display:flex;flex-wrap:wrap;gap:8px 14px;padding:8px 0}
  </style>`;
  const names = [...groups.keys()];
  const chunks = [];
  let bucket = [];
  let weight = 0;
  for (const name of names) {
    const html = groups.get(name).map(row => `<div class="seq">${row.html}</div>`).join('\n');
    if (weight > 1_600_000 && bucket.length) { chunks.push(bucket); bucket = []; weight = 0; }
    bucket.push({ name, html });
    weight += html.length;
  }
  if (bucket.length) chunks.push(bucket);

  const pages = [];
  for (let i = 0; i < chunks.length; i++) {
    const file = `board-${String(i + 1).padStart(2, '0')}.html`;
    const body = chunks[i].map(item => `<section id="${item.name}"><h2>${item.name}</h2>${item.html}</section>`).join('\n');
    await writeFile(path.join(OUT, file), `<!doctype html><meta charset="utf-8"><title>Motion frames ${i + 1}</title>${style}<header><a href="index.html">全部帧板</a> · ${commit.slice(0, 12)}</header>${body}`);
    pages.push({ file, names: chunks[i].map(item => item.name) });
  }
  const index = `<!doctype html><meta charset="utf-8"><title>87 motion frame boards</title>${style}
<header><h1>动作序列帧</h1><p>${names.length} 个主体 · ${report.length} 条序列 · <code>${commit}</code></p>
<p>每一行是一个动作在 0 / 50 / 120 / 200 / 300 / 450 / 650 / 900 毫秒的姿态，末格是归位结果。循环和进度条用自己的采样点。</p>
<nav>${pages.map((page, i) => `<a href="${page.file}">第 ${i + 1} 板</a>`).join('')}</nav></header>
<main>${pages.map(page => `<section><h2><a href="${page.file}">${page.file}</a></h2><p>${page.names.map(name => `<a href="${page.file}#${name}">${name}</a>`).join(' · ')}</p></section>`).join('')}</main>`;
  await writeFile(path.join(OUT, 'index.html'), index);
  await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify({ commit, subjects: names.length, sequences: report.length, pages: pages.map(page => page.file) }, null, 2));
  console.log(`wrote ${names.length} subjects, ${report.length} sequences, ${pages.length} boards`);
} finally {
  chrome.kill();
}
