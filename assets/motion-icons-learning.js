/* Learning recipes: additive subjects; the animator and built-ins remain unchanged. */
(function (M) {
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

  const {around, aroundXY, clamp01} = M.util;
  M.define('lookup', {
    svg: `<g data-part="page"><path d="M28 24h46a9 9 0 0 1 9 9v59a9 9 0 0 1-9 9H28a9 9 0 0 1-9-9V33a9 9 0 0 1 9-9Z"/><path d="M32 40h29M32 53h21M32 66h16"/></g>
<g data-part="lens"><circle cx="68" cy="70" r="19"/><path d="m82 84 17 17"/></g>`,
    state: {lx: 0, ly: 0, lensScale: 1, pageTilt: 0},
    poses: {idle: {}},
    render(s, p) {
      p.page.setAttribute('transform', `rotate(${s.pageTilt} 51 101)`);
      p.lens.setAttribute('transform', `translate(${s.lx} ${s.ly}) ${around(s.lensScale, 68, 70)}`);
    },
    actions: {
      tap: {label: '轻触词页', run: c => preview(c, 'lensScale', 0.08)},
      searching: {label: '检索词页', loop: true, run(c) {
        c.claim('lx', 'ly');
        c.loop(t => { c.s.lx = 16 * Math.sin(t * Math.PI * 2); c.s.ly = -10 * (1 - Math.cos(t * Math.PI * 2)); });
      }},
      found: {label: '聚焦词义', async run(c) {
        c.to('lensScale', 0.82, 'snap'); c.to('ly', 4, 'snap');
        await c.wait(80);
        c.to('lx', 0, 'track'); c.to('ly', -12, 'gentle'); c.to('lensScale', 1.38, 'gentle');
        await c.wait(260);
      }},
      empty: {label: '继续寻找', async run(c) {
        c.to('lx', -18, 'snap'); c.to('lensScale', 1.08, 'snap'); await c.wait(120);
        c.to('lx', 18, 'gentle'); await c.wait(160);
      }},
      fail: {label: '词页卡住', async run(c) {
        c.error(); c.to('pageTilt', -4, 'snap');
        c.to('ly', 5, 'impact'); await c.wait(100);
        c.to('ly', -2, 'settle'); await c.shake();
        await c.wait(c.timing.holdFail);
      }}
    }
  });
  M.define('lexicon', {
    svg: `<defs><clipPath id="mi-lexicon-slot"><rect x="14" y="14" width="92" height="40"/></clipPath></defs>
<g clip-path="url(#mi-lexicon-slot)"><g data-part="paper"><rect x="39" y="23" width="42" height="31" rx="7"/><path d="M48 34h24M48 43h16"/></g></g>
<g data-part="book"><path d="M31 54h57a9 9 0 0 1 9 9v34H31a10 10 0 0 1-10-10V64a10 10 0 0 1 10-10Z"/><path d="M32 54v32M31 87h66"/><path data-part="bookmark" d="M70 54v20l7-5 7 5V54"/></g>`,
    state: {paperY: 0, paperOpacity: 0, compression: 1, mark: 0},
    poses: {empty: {}, saved: {mark: 1}},
    render(s, p) {
      p.paper.setAttribute('transform', `translate(0 ${s.paperY})`);
      p.paper.setAttribute('opacity', clamp01(s.paperOpacity));
      p.book.setAttribute('transform', aroundXY(1 + (1-s.compression)*0.4, s.compression, 60, 97));
      p.bookmark.setAttribute('opacity', clamp01(s.mark));
      p.bookmark.setAttribute('transform', around(0.6 + 0.4*s.mark, 77, 54));
    },
    actions: {
      tap: {label: '轻触词本', run: c => contact(c, 'compression', 0.95)},
      saving: {label: '词卡就位', loop: true, run(c) {
        c.claim('paperY'); c.to('paperOpacity', 1, 'fade');
        c.loop(t => { c.s.paperY = -4 - 2*Math.sin(t*Math.PI*2); });
      }},
      save: {label: '收入词本', pose: 'saved', from: 'empty', async run(c) {
        c.set({paperY: -3, paperOpacity: 0, mark: 0});
        c.to('paperOpacity', 1, 'fade'); c.to('paperY', -8, 'snap');
        await c.wait(100);
        c.to('paperY', 25, 'snap'); await c.wait(140);
        contact(c, 'compression', 0.90); c.to('paperOpacity', 0, 'fade');
        await c.wait(70); c.to('mark', 1, 'gentle'); await c.wait(240);
      }},
      reopen: {label: '取出词卡', pose: 'empty', from: 'saved', async run(c) {
        c.set({paperY: 25, paperOpacity: 0}); c.to('mark', 0, 'fade');
        c.to('paperOpacity', 1, 'fade'); c.to('paperY', -6, 'gentle');
        await c.wait(320); c.to('paperOpacity', 0, 'fade'); await c.wait(180);
      }},
      fail: {label: '词卡退回', from: 'empty', async run(c) {
        c.error(); c.set({paperY: -4, paperOpacity: 0}); c.to('paperOpacity', 1, 'fade');
        c.to('paperY', 8, 'snap'); await c.wait(100);
        c.to('paperY', -8, 'settle'); contact(c, 'compression', 0.95);
        await c.shake(); await c.wait(c.timing.holdFail); c.to('paperOpacity', 0, 'fade');
      }}
    }
  });
})(window.MotionIcon);

(function (M) {
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

  const {around, aroundXY, clamp01, lerpPath} = M.util;
  const attr = (part, name, value) => part.setAttribute(name, value);
  const dash = (part, length, progress) => {
    const value = Math.max(0, Math.min(1, progress));
    attr(part, 'stroke-dasharray', `${length * value} ${length + 1}`);
    attr(part, 'opacity', clamp01(value * 8));
  };

  const sunOutline = 'M60 40C48.95 40 40 48.95 40 60C40 71.05 48.95 80 60 80C71.05 80 80 71.05 80 60C80 48.95 71.05 40 60 40Z';
  const moonOutline = 'M73 32C49 24 31 43 33 63C35 86 59 98 80 82C61 84 45 66 47 50C49 41 58 34 73 32Z';
  const rayOutline = 'M60 18L60 28M60 92L60 102M18 60L28 60M92 60L102 60M30 30L37 37M83 83L90 90M30 90L37 83M83 37L90 30';
  const starOutline = 'M86 34L86 44M81 39L91 39M92 58L92 64M89 61L95 61';
  const PATH_NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
  function turnPath(d, angle, spin, warmth) {
    const nums = d.match(PATH_NUM);
    if (!nums || nums.length % 2) return d;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const cosS = Math.cos(spin), sinS = Math.sin(spin);
    const out = [];
    for (let i = 0; i < nums.length; i += 2) {
      const x0 = (+nums[i] - 60) * warmth, y0 = (+nums[i + 1] - 60) * warmth;
      const x = x0 * cosS - y0 * sinS, y = x0 * sinS + y0 * cosS;
      // Planar turn: width follows the axis. The near side stays its drawn size.
      const yScale = 1 - Math.min(0.28, Math.max(0, -x * sinA) / 22 * 0.28);
      const span = Math.abs(cosA) < .5 ? (cosA < 0 ? -.5 : .5) : cosA;
      out.push((60 + x * span).toFixed(2), (60 + y * yScale).toFixed(2));
    }
    let n = 0;
    return d.replace(PATH_NUM, () => out[n++]);
  }
  M.define('daylight', {
    svg: `<g data-part="sun"><path data-part="outline" d="${sunOutline}"/></g><path data-part="rays" d="${rayOutline}"/><path data-part="stars" d="${starOutline}"/>`,
    state: {phase: 0, rise: 0, warmth: 1, rayAngle: 0},
    poses: {idle: {}, selected: {rayAngle: 36, warmth: 1.14}, night: {phase: 1}, nightSelected: {phase: 1, rayAngle: 36, warmth: 1.14}},
    periodic: {rayAngle: 360},
    render(s, p) {
      const phase = clamp01(s.phase);
      const moon = phase >= 0.5;
      const angle = (moon ? phase - 1 : phase) * Math.PI;
      const lift = `translate(0 ${s.rise})`;
      const facing = Math.cos(phase * Math.PI);
      const day = clamp01((facing - 0.12) / 0.7);
      const night = clamp01((-facing - 0.12) / 0.7);
      attr(p.sun, 'transform', lift);
      attr(p.outline, 'd', turnPath(moon ? moonOutline : sunOutline, angle, 0, s.warmth));
      attr(p.rays, 'transform', lift);
      attr(p.rays, 'opacity', day);
      attr(p.rays, 'd', turnPath(rayOutline, Math.min(phase, 0.48) * Math.PI, s.rayAngle * Math.PI / 180, s.warmth));
      attr(p.stars, 'transform', lift);
      attr(p.stars, 'opacity', night);
      attr(p.stars, 'd', turnPath(starOutline, angle, 0, 0.62 + 0.38 * night));
    },
    actions: {
      tap: {label: '轻触天光', run: c => preview(c, 'warmth', .06)},
      peek: {label: '天光舒展', async run(c) {
        c.to('warmth', 1.04, 'gentle'); c.to('rayAngle', c.goal('rayAngle') + 9, 'slow');
        await c.wait(220);
      }},
      select: {label: '迎接白昼', pose: 'selected', async run(c) {
        c.to('phase', 0, 'slow');
        c.to('rayAngle', -16, 'snap'); c.to('rise', -6, 'snap'); await c.wait(90);
        c.to('rayAngle', 36, 'gentle'); c.to('warmth', 1.14, 'gentle'); c.to('rise', 0, 'settle'); await c.wait(240);
      }},
      selectNight: {label: '迎接夜晚', pose: 'nightSelected', from: 'night', async run(c) {
        c.to('phase', 1, 'slow');
        c.to('rayAngle', -16, 'snap'); c.to('rise', -6, 'snap'); await c.wait(90);
        c.to('rayAngle', 36, 'gentle'); c.to('warmth', 1.14, 'gentle'); c.to('rise', 0, 'settle'); await c.wait(240);
      }},
      toNight: {label: '太阳变月亮', pose: 'night', from: 'idle', async run(c) {
        c.to('phase', 1, 'slow'); c.to('rise', -3, 'snap');
        await c.wait(150);
        c.to('rise', 1, 'gentle'); await c.wait(320);
      }},
      toDay: {label: '月亮变太阳', pose: 'idle', from: 'night', async run(c) {
        c.to('phase', 0, 'slow'); c.to('rise', -3, 'snap');
        await c.wait(150);
        c.to('rise', 1, 'gentle'); await c.wait(320);
      }}
    }
  });

  M.define('cards', {
    svg: `<g data-part="back"><rect x="23" y="25" width="63" height="62" rx="11"/></g><g data-part="front"><rect x="30" y="35" width="63" height="62" rx="11"/><path d="M43 54h37M43 67h28M43 80h19"/></g>`,
    state: {frontX: 0, frontY: 0, tilt: 0, backAngle: 0, contact: 1},
    poses: {idle: {}, selected: {frontX: 14, frontY: -8, tilt: -8, backAngle: -18}},
    render(s, p) {
      attr(p.back, 'transform', `rotate(${s.backAngle} 55 90)`);
      attr(p.front, 'transform', `translate(${s.frontX} ${s.frontY}) rotate(${s.tilt} 61 97) ${aroundXY(1 + (1-s.contact)*.4, s.contact, 61, 97)}`);
    },
    actions: {
      tap: {label: '轻触词卡', run: c => contact(c, 'contact', .94)},
      peek: {label: '错开卡片', async run(c) {
        c.to('frontX', 4, 'gentle'); c.to('tilt', 4, 'gentle'); await c.wait(45);
        c.to('backAngle', c.goal('backAngle') - 6, 'swing'); await c.wait(200);
      }},
      select: {label: '抽出一张', pose: 'selected', async run(c) {
        c.to('frontY', 6, 'snap'); c.to('frontX', -4, 'snap'); await c.wait(80);
        c.to('frontY', -16, 'gentle'); c.to('frontX', 18, 'gentle'); c.to('tilt', -12, 'gentle');
        c.to('backAngle', -18, 'gentle'); await c.wait(160);
        c.to('frontY', -8, 'settle'); c.to('frontX', 14, 'settle'); c.to('tilt', -8, 'settle'); await c.wait(160);
      }},
      remember: {label: '词卡归位', async run(c) {
        c.to('frontY', -5, 'snap'); await c.wait(95);
        c.to('frontY', 0, 'impact'); await c.wait(80);
        contact(c, 'contact', .90); c.to('backAngle', c.goal('backAngle') - 3, 'swing'); await c.wait(220);
      }},
      revisit: {label: '留待再看', async run(c) {
        c.to('frontX', -5, 'gentle'); c.to('tilt', -5, 'gentle'); await c.wait(230);
      }},
      preparing: {label: '整理卡片', loop: true, run(c) {
        c.claim('frontY'); c.loop(t => { c.s.frontY = -3 * M.util.wave(t, 1); });
      }}
    }
  });

  const closedCover = 'M38 28C53 28 69 28 80 28Q84 28 84 32L84 88Q84 92 80 92C65 92 53 92 38 92L38 28Z';
  const openCover = 'M60 34C72 26 88 26 98 29Q102 30 102 34L102 86Q102 90 98 89C84 87 73 89 60 96L60 34Z';
  M.define('book', {
    svg: `<g data-part="body"><path data-part="left"/><path data-part="cover" d="${closedCover}"/><path data-part="spine"/><path data-part="mark" d="M69 29v22l-5-4-5 4V29"/><g data-part="lines"><path d="M72 44c7-2 13-2 20-1M72 57c7-2 13-2 20-1M72 70c7-2 13-2 20-1M28 44c8-1 14 0 21 2M28 57c8-1 14 0 21 2M28 70c8-1 14 0 21 2"/></g><g data-part="leaf"><path data-part="turning"/></g></g>`,
    state: {opening: 0, bodyAngle: 0, leafWidth: 1, leafOpacity: 0, leaf: 0},
    poses: {idle: {}, open: {opening: 1}, selected: {opening: 1}},
    render(s, p) {
      const opening = clamp01(s.opening), hinge = 38 + 22 * opening;
      const top = 28 + 6 * opening, bottom = 92 + 4 * opening;
      const left = hinge - 42 * opening;
      const cover = M.util.lerpPath(closedCover, openCover, opening);
      attr(p.body, 'transform', `rotate(${s.bodyAngle} 60 92)`);
      attr(p.cover, 'd', cover);
      attr(p.left, 'd', `M${hinge} ${top}C${hinge-12*opening} ${top-8*opening} ${left+14*opening} ${top-8*opening} ${left} ${top-4*opening}V${bottom-9*opening}C${left+15*opening} ${bottom-13*opening} ${hinge-13*opening} ${bottom-11*opening} ${hinge} ${bottom}Z`);
      attr(p.left, 'opacity', opening);
      attr(p.spine, 'd', `M38 28C30 28 30 31 30 36V84Q30 92 38 92M38 84h46`);
      attr(p.spine, 'opacity', clamp01(1-opening*2));
      attr(p.mark, 'opacity', clamp01(1-opening*2.5));
      attr(p.lines, 'opacity', clamp01((opening-.35)/.65));
      const sweep = clamp01(s.leaf);
      const pageRight = 96 - sweep * 54, pageLeft = pageRight - 34;
      const bow = Math.sin(sweep * Math.PI) * 10, mid = (pageLeft + pageRight) / 2;
      attr(p.turning, 'd', `M${pageLeft.toFixed(1)} 38C${mid.toFixed(1)} ${(30 - bow).toFixed(1)} ${pageRight.toFixed(1)} 34 ${pageRight.toFixed(1)} 44L${pageRight.toFixed(1)} 82C${pageRight.toFixed(1)} ${(94 + bow).toFixed(1)} ${mid.toFixed(1)} 92 ${pageLeft.toFixed(1)} 88Z`);
      attr(p.leaf, 'transform', '');
      attr(p.leaf, 'opacity', clamp01(s.leafOpacity) * opening);
    },
    actions: {
      tap: {label: '轻触词本', run: c => preview(c, 'bodyAngle', -3)},
      peek: {label: '展开词本', pose: 'open', from: 'idle', async run(c) {
        c.to('opening', 1, 'gentle'); c.to('bodyAngle', 2, 'snap');
        await c.wait(85);
        c.to('bodyAngle', -2, 'gentle'); await c.wait(260);
      }},
      select: {label: '选中词本', pose: 'selected', async run(c) {
        c.to('opening', 1, 'gentle'); c.to('bodyAngle', 3, 'snap');
        await c.wait(90);
        c.to('bodyAngle', -2, 'gentle'); await c.wait(260);
      }},
      close: {label: '合上词本', pose: 'idle', from: 'open', async run(c) {
        c.to('opening', 0, 'gentle'); c.to('bodyAngle', -2, 'snap');
        await c.wait(85);
        c.to('bodyAngle', 0, 'gentle'); await c.wait(260);
      }},
      turn: {label: '翻过一页', pose: 'open', from: 'open', async run(c) {
        c.to('leafOpacity', 1, 'fade'); c.to('leaf', .12, 'snap'); await c.wait(70);
        c.to('leaf', 1, 'gentle'); await c.wait(260);
        c.to('leafOpacity', 0, 'fade'); await c.wait(120);
        c.set({leaf: 0});
      }}
    }
  });

  M.define('recall', {
    svg: `<g data-part="card"><rect x="24" y="24" width="72" height="72" rx="12"/><g data-part="answer"><path d="M37 61h46M37 73h34M37 85h24"/></g><g data-part="flap"><path d="M24 34h72v38a8 8 0 0 1-8 8H32a8 8 0 0 1-8-8Z"/><path d="M53 47c0-9 15-9 15-1 0 6-8 5-8 12M60 67v1"/></g></g>`,
    state: {opening: 0, cardX: 0, cardY: 0, tilt: 0, opacity: 1},
    poses: {idle: {}, revealed: {opening: 1}},
    render(s, p) {
      const opening = clamp01(s.opening);
      attr(p.card, 'transform', `translate(${s.cardX} ${s.cardY}) rotate(${s.tilt} 60 96)`);
      attr(p.card, 'opacity', clamp01(s.opacity));
      attr(p.flap, 'transform', aroundXY(1, 1-opening*.86, 60, 34));
      attr(p.answer, 'opacity', clamp01((opening-.2)/.8));
    },
    actions: {
      tap: {label: '轻触回忆卡', run: c => preview(c, 'tilt', -3)},
      reveal: {label: '展开答案', pose: 'revealed', from: 'idle', async run(c) {
        c.to('cardY', 3, 'snap'); await c.wait(90);
        c.to('opening', 1, 'gentle'); c.to('cardY', -2, 'gentle'); await c.wait(260);
      }},
      close: {label: '收起答案', pose: 'idle', from: 'revealed', async run(c) {
        c.to('opening', 0, 'gentle'); await c.wait(240);
      }},
      next: {label: '记住 · 过一词', pose: 'idle', from: 'revealed', async run(c) {
        c.to('cardX', -6, 'snap'); await c.wait(60);
        c.to('cardX', 48, 'snap'); c.to('cardY', -6, 'gentle');
        c.to('opacity', 0, 'fade'); await c.wait(130);
        c.set({cardX: -36, cardY: 0, opening: 0, opacity: 0});
        c.to('opacity', 1, 'fade'); c.to('cardX', 0, 'gentle'); await c.wait(180);
      }},
      retry: {label: '留待重温', pose: 'idle', from: 'revealed', async run(c) {
        c.to('cardY', -4, 'gentle'); c.to('tilt', -6, 'gentle'); await c.wait(180);
        c.to('opening', 0, 'gentle'); c.to('tilt', 0, 'gentle'); await c.wait(180);
      }}
    }
  });

  M.define('milestone', {
    svg: `<g data-part="book"><path d="M30 34h42a8 8 0 0 1 8 8v47H34a8 8 0 0 1-8-8V42a8 8 0 0 1 4-8ZM26 79h54M36 35v42"/><path data-part="page" d="M40 24h40a8 8 0 0 1 8 8v47H44a8 8 0 0 1-8-8V32a8 8 0 0 1 4-8ZM48 40h28M48 53h20M48 66h25"/></g><g data-part="seal"><circle cx="88" cy="86" r="14"/><path data-part="check" d="M81 86l5 5 10-11"/></g>`,
    state: {pageY: -5, pageAngle: 5, contact: 1, sealScale: .72, sealOpacity: 0, check: 0},
    poses: {idle: {}, complete: {pageY: 0, pageAngle: 0, sealScale: 1, sealOpacity: 1, check: 1}},
    render(s, p) {
      attr(p.book, 'transform', aroundXY(1+(1-s.contact)*.4, s.contact, 60, 89));
      attr(p.page, 'transform', `translate(0 ${s.pageY}) rotate(${s.pageAngle} 36 79)`);
      attr(p.seal, 'transform', around(s.sealScale, 88, 86));
      attr(p.seal, 'opacity', clamp01(s.sealOpacity));
      dash(p.check, 24, s.check);
    },
    actions: {
      tap: {label: '轻触整轮词本', run: c => preview(c, 'pageAngle', 3)},
      complete: {label: '背完一轮', pose: 'complete', from: 'idle', async run(c) {
        c.to('pageY', -8, 'snap'); await c.wait(100);
        c.to('pageY', 0, 'impact'); c.to('pageAngle', 0, 'gentle'); await c.wait(100);
        contact(c, 'contact', .92); c.to('sealOpacity', 1, 'fade'); c.to('sealScale', 1, 'gentle');
        await c.wait(85); c.to('check', 1, 'draw'); await c.wait(240);
      }},
      restart: {label: '开始新一轮', pose: 'idle', from: 'complete', async run(c) {
        c.to('sealOpacity', 0, 'fade'); await c.wait(90);
        c.to('pageY', -5, 'gentle'); c.to('pageAngle', 5, 'gentle'); await c.wait(240);
      }}
    }
  });

  const PLUS_H = 'M30 60L90 60';
  const PLUS_V = 'M60 30L60 90';
  const CHECK_LONG = 'M56 76L88 44';
  const CHECK_SHORT = 'M40 60L56 76';
  const MID_H = 'M46 72L86 52';
  const MID_V = 'M50 50L56 78';
  function foldPath(from, mid, to, t) {
    const u = Math.max(0, Math.min(1, t));
    return u < .5 ? lerpPath(from, mid, u * 2) : lerpPath(mid, to, (u - .5) * 2);
  }
  async function magnetic(c, k) {
    c.to('vy', 1 - .48 * k, 'snap');
    c.to('hx', 1 + .42 * k, 'snap');
    await c.wait(90);
    c.to('vy', 1 + .32 * k, 'gentle');
    await c.wait(40);
    c.to('hx', 1 - .18 * k, 'gentle');
    await c.wait(100);
    c.to('vy', 1, 'settle');
    c.to('hx', 1, 'settle');
    await c.wait(180);
  }

  M.define('plus', {
    svg: `<g data-part="mark"><path data-part="h" d="${PLUS_H}"/><path data-part="v" d="${PLUS_V}"/></g>`,
    state: {hx: 1, vy: 1, bend: 0, turn: 0},
    poses: {idle: {}, confirmed: {bend: 1}, closed: {turn: 45}},
    periodic: {turn: 360},
    render(s, p) {
      const t = Math.max(-.12, Math.min(1.12, s.bend));
      p.h.setAttribute('d', foldPath(PLUS_H, MID_H, CHECK_LONG, t));
      p.v.setAttribute('d', foldPath(PLUS_V, MID_V, CHECK_SHORT, t));
      const turn = `rotate(${s.turn} 60 60)`;
      attr(p.h, 'transform', `${turn} ${aroundXY(s.hx, 1, 60, 60)}`);
      attr(p.v, 'transform', `${turn} ${aroundXY(1, s.vy, 60, 60)}`);
    },
    actions: {
      tap: {label: '磁吸', async run(c) { await magnetic(c, 1); }},
      add: {label: '添加', async run(c) { await magnetic(c, 1.2); }},
      confirm: {label: '添加成功', pose: 'confirmed', from: 'idle', async run(c) {
        c.to('vy', .86, 'snap'); c.to('hx', 1.06, 'snap'); await c.wait(70);
        c.to('bend', 1, 'gentle'); c.to('vy', 1, 'settle'); c.to('hx', 1, 'settle');
        await c.wait(320);
      }},
      reject: {label: '没加上', async run(c) {
        c.to('vy', .5, 'impact'); c.to('hx', 1.28, 'snap'); await c.wait(80);
        c.to('vy', 1.18, 'settle'); await c.wait(40);
        c.to('hx', .86, 'gentle'); await c.wait(80);
        c.to('vy', 1, 'settle'); c.to('hx', 1, 'settle'); await c.wait(150);
      }},
      reset: {label: '回到加号', pose: 'idle', from: 'confirmed', async run(c) {
        c.to('bend', 0, 'gentle'); c.to('turn', 0, 'gentle'); await c.wait(150);
        c.to('vy', 1.08, 'gentle'); await c.wait(30);
        c.to('hx', .97, 'gentle'); await c.wait(80);
        c.to('vy', 1, 'settle'); c.to('hx', 1, 'settle'); await c.wait(140);
      }},
      toClose: {label: '变成关闭', pose: 'closed', from: 'idle', async run(c) {
        c.to('turn', -8, 'snap'); c.to('bend', 0, 'gentle'); await c.wait(70);
        c.to('turn', 45, 'gentle'); await c.wait(220);
      }}
    }
  });

  // The cat is traced from its reference drawing in source pixels. Each weight
  // group thins the engine's optical stroke by the reference line ratio.
  const CAT_K = .214, CAT_X = 520.5, CAT_Y = 338.5;
  const catPt = (x, y) => [60 + (x - CAT_X) * CAT_K, 60 + (y - CAT_Y) * CAT_K];
  const catAt = (x, y) => catPt(x, y).map(n => n.toFixed(2)).join(' ');
  const catInk = (w, d) => { let i = 0; return d.replace(PATH_NUM, v => (60 + (+v - (i++ % 2 ? CAT_Y : CAT_X)) * CAT_K / w).toFixed(2)); };
  const weigh = (w, body) => `<g transform="${around(w)}">${body}</g>`;
  const INK = {line: .66, tail: .85, eye: .6, mouth: .42, whisker: .44};
  const CAT_HEAD = 'M333 551L689 551Q718.5 551 718.5 521L718.5 400C718.5 255 642 212 511 212C380 212 303.5 255 303.5 400L303.5 521Q303.5 551 333 551Z';
  const CAT_MOUTH = {
    smile: 'M484 408Q511 426 538 408Q511 426 484 408',
    open: 'M496 407Q511 440 526 407Q511 396 496 407',
    grin: 'M478 403Q511 446 544 403Q511 411 478 403',
    frown: 'M490 419Q511 402 532 419Q511 402 490 419',
    omega: 'M470 406Q492 388 511 408Q530 388 552 406'
  };
  const mouthBase = catInk(INK.mouth, CAT_MOUTH.smile);
  const mouthNums = {};
  for (const k of Object.keys(CAT_MOUTH)) mouthNums[k] = catInk(INK.mouth, CAT_MOUTH[k]).match(PATH_NUM).map(Number);
  function mouthPath(open, grin, frown, soft) {
    const B = mouthNums.smile, O = mouthNums.open, G = mouthNums.grin, F = mouthNums.frown, W = mouthNums.omega;
    let i = 0;
    return mouthBase.replace(PATH_NUM, () => {
      const v = B[i] + open * (O[i] - B[i]) + grin * (G[i] - B[i]) + frown * (F[i] - B[i]) + soft * (W[i] - B[i]);
      i++;
      return v.toFixed(2);
    });
  }
  const mark = (part, d) => `<g data-part="${part}">${weigh(INK.eye, `<path d="${catInk(INK.eye, d)}"/>`)}</g>`;
  const catEar = (w, a, b, c) => `<path data-part="${w}" d="${catInk(INK.line, `M${a}L${b}L${c}Z`)}"/><path d="${catInk(INK.line, `M${a}L${b}L${c}`)}"/>`;
  const [eyeLX, eyeLY] = catPt(421.5, 354), [eyeRX, eyeRY] = catPt(600.5, 354);
  const EYE_R = (17.5 * CAT_K).toFixed(2);
  const [blushLX, blushY] = catPt(392, 393), [blushRX] = catPt(630, 393);
  const PIVOT = {
    head: catAt(511, 400), earL: catAt(373, 207), earR: catAt(649, 207),
    tail: catAt(720, 486), whiskL: catPt(331, 408), whiskR: catPt(691, 408)
  };
  const BODY_BASE = catPt(511, 551);
  const lidSpring = {stiffness: 1400, damping: 50};
  const shut = (c, v = .06) => { c.to('blinkL', v, lidSpring); c.to('blinkR', v, lidSpring); };
  const open = c => { c.to('blinkL', 1, 'snap'); c.to('blinkR', 1, 'snap'); };
  const ease = t => 1 - Math.pow(1 - Math.min(1, t / .4), 3);
  const blinkAt = (t, period) => 1 - .94 * Math.exp(-Math.pow(((t % period) - (period - .25)) / .05, 2));

  M.define('conversation', {
    svg: `<g data-part="cat">
<g data-part="tail">${weigh(INK.tail, `<path d="${catInk(INK.tail, 'M747 353C762 380 762 440 718 488')}"/>`)}</g>
${weigh(INK.line, `<path d="${catInk(INK.line, CAT_HEAD)}"/>`)}
<g data-part="earL">${weigh(INK.line, catEar('innerL', '414 181', '309 130', '333 234'))}</g>
<g data-part="earR">${weigh(INK.line, catEar('innerR', '608 181', '713 130', '689 234'))}</g>
<ellipse data-part="blushL" cx="${blushLX.toFixed(2)}" cy="${blushY.toFixed(2)}" rx="3.3" ry="1.8"/>
<ellipse data-part="blushR" cx="${blushRX.toFixed(2)}" cy="${blushY.toFixed(2)}" rx="3.3" ry="1.8"/>
<circle data-part="eyeL" data-fill cx="${eyeLX.toFixed(2)}" cy="${eyeLY.toFixed(2)}" r="${EYE_R}"/>
<circle data-part="eyeR" data-fill cx="${eyeRX.toFixed(2)}" cy="${eyeRY.toFixed(2)}" r="${EYE_R}"/>
<g data-part="joyL">${weigh(INK.eye, `<path d="${catInk(INK.eye, 'M403 362Q421.5 334 440 362')}"/>`)}</g>
<g data-part="joyR">${weigh(INK.eye, `<path d="${catInk(INK.eye, 'M582 362Q600.5 334 619 362')}"/>`)}</g>
${mark('flatL', 'M404 354L439 354')}${mark('flatR', 'M583 354L618 354')}
${mark('crossL', 'M406 340L428 354L406 368')}${mark('crossR', 'M616 340L594 354L616 368')}
${mark('cryL', 'M406 340L437 340M421.5 340L421.5 368')}${mark('cryR', 'M585 340L616 340M600.5 340L600.5 368')}
${mark('tearL', 'M421.5 372L421.5 390')}${mark('tearR', 'M600.5 372L600.5 390')}
${weigh(INK.mouth, `<path data-part="mouth" d="${mouthBase}"/>`)}
<g data-part="whiskL">${weigh(INK.whisker, `<path d="${catInk(INK.whisker, 'M279 389L331 400M279 416.5L331 416.5')}"/>`)}</g>
<g data-part="whiskR">${weigh(INK.whisker, `<path d="${catInk(INK.whisker, 'M743 389L691 400M743 416.5L691 416.5')}"/>`)}</g>
</g>`,
    css: '.mi--conversation svg [data-part^="inner"],.mi--conversation svg [data-part^="blush"]{fill:var(--mi-cat-ear,#f65a7d);stroke:none}',
    state: {bodyY: 0, squash: 1, tilt: 0, gazeX: 0, gazeY: 0, blinkL: 1, blinkR: 1, eyeScale: 1,
      joy: 0, flat: 0, cross: 0, cry: 0, talk: 0, grin: 0, frown: 0, soft: 0, blush: 0, earL: 0, earR: 0, tail: 0, whisk: 1},
    poses: {idle: {}, selected: {bodyY: -1.5, earL: 4, earR: 4, tail: -8}},
    render(s, p) {
      const sx = 1 / Math.max(.5, s.squash);
      attr(p.cat, 'transform', `translate(0 ${s.bodyY}) rotate(${s.tilt} ${PIVOT.head}) ${aroundXY(sx, s.squash, ...BODY_BASE)}`);
      attr(p.earL, 'transform', `rotate(${s.earL} ${PIVOT.earL})`);
      attr(p.earR, 'transform', `rotate(${-s.earR} ${PIVOT.earR})`);
      attr(p.tail, 'transform', `rotate(${s.tail} ${PIVOT.tail})`);
      const gaze = `translate(${s.gazeX} ${s.gazeY})`;
      const cover = clamp01(Math.max(s.joy, s.flat, s.cross, s.cry));
      attr(p.eyeL, 'transform', `${gaze} ${aroundXY(s.eyeScale, Math.max(.06, s.blinkL) * s.eyeScale, eyeLX, eyeLY)}`);
      attr(p.eyeR, 'transform', `${gaze} ${aroundXY(s.eyeScale, Math.max(.06, s.blinkR) * s.eyeScale, eyeRX, eyeRY)}`);
      attr(p.eyeL, 'opacity', 1 - cover);
      attr(p.eyeR, 'opacity', 1 - cover);
      const show = (part, amount) => {
        attr(part, 'opacity', clamp01(amount));
        attr(part, 'transform', `${gaze} translate(0 ${(1 - clamp01(amount)) * 1.5})`);
      };
      show(p.joyL, s.joy); show(p.joyR, s.joy);
      show(p.flatL, s.flat); show(p.flatR, s.flat);
      show(p.crossL, s.cross); show(p.crossR, s.cross);
      show(p.cryL, s.cry); show(p.cryR, s.cry);
      attr(p.tearL, 'opacity', clamp01(s.cry));
      attr(p.tearR, 'opacity', clamp01(s.cry));
      attr(p.tearL, 'transform', `${gaze} translate(0 ${clamp01(s.cry) * 3.5})`);
      attr(p.tearR, 'transform', `${gaze} translate(0 ${clamp01(s.cry) * 3.5})`);
      attr(p.blushL, 'opacity', clamp01(s.blush));
      attr(p.blushR, 'opacity', clamp01(s.blush));
      const k = v => Math.max(-.15, Math.min(1.15, v));
      p.mouth.setAttribute('d', mouthPath(k(s.talk), k(s.grin), k(s.frown), k(s.soft)));
      attr(p.whiskL, 'transform', aroundXY(s.whisk, 1, ...PIVOT.whiskL));
      attr(p.whiskR, 'transform', aroundXY(s.whisk, 1, ...PIVOT.whiskR));
    },
    actions: {
      tap: {label: '轻触', async run(c) {
        c.to('squash', .9, 'snap'); c.to('bodyY', c.goal('bodyY') + 2, 'snap'); shut(c); await c.wait(70);
        open(c); c.to('squash', 1.04, 'gentle'); c.to('bodyY', c.goal('bodyY') - 3, 'gentle');
        c.to('earL', c.goal('earL') + 8, 'gentle'); c.to('earR', c.goal('earR') + 8, 'gentle');
        c.to('whisk', 1.12, 'gentle'); await c.wait(120);
      }},
      peek: {label: '看过来', async run(c) {
        c.to('gazeX', 8, 'snap'); c.to('earL', c.goal('earL') + 16, 'snap');
        c.to('tilt', -6, 'snap'); c.to('tail', c.goal('tail') - 24, 'snap'); await c.wait(90);
        shut(c, .1); await c.wait(70);
        open(c); c.to('gazeX', 3, 'gentle'); await c.wait(140);
      }},
      select: {label: '醒过来', pose: 'selected', from: 'idle', async run(c) {
        c.to('bodyY', 3, 'snap'); c.to('squash', .93, 'snap'); shut(c);
        c.to('earL', -4, 'snap'); c.to('earR', -4, 'snap'); await c.wait(80);
        open(c); c.to('squash', 1.05, 'gentle'); c.to('bodyY', -5, 'gentle');
        c.to('earL', 12, 'gentle'); c.to('earR', 12, 'gentle'); c.to('tail', -16, 'gentle');
        c.to('whisk', 1.16, 'gentle'); c.to('grin', .35, 'gentle'); await c.wait(160);
        c.to('squash', 1, 'gentle'); c.to('bodyY', -1.5, 'gentle'); c.to('earL', 4, 'gentle');
        c.to('earR', 4, 'gentle'); c.to('tail', -8, 'gentle'); c.to('whisk', 1, 'gentle');
        c.to('grin', 0, 'gentle'); await c.wait(200);
      }},
      reply: {label: '点头', async run(c) {
        c.to('tilt', 5, 'snap'); shut(c, .1); c.to('bodyY', c.goal('bodyY') + 3, 'impact'); await c.wait(80);
        open(c); c.to('tilt', -2, 'gentle'); c.to('bodyY', c.goal('bodyY') - 2, 'settle');
        c.to('talk', .35, 'gentle'); await c.wait(110);
        c.to('talk', 0, 'gentle'); await c.wait(120);
      }},
      blink: {label: '眨眼', async run(c) {
        c.to('bodyY', c.goal('bodyY') + 4, 'snap');
        c.to('earL', c.goal('earL') - 12, 'snap'); c.to('earR', c.goal('earR') - 12, 'snap');
        shut(c); await c.wait(160);
        open(c); c.to('bodyY', c.goal('bodyY') - 3, 'gentle');
        c.to('earL', c.goal('earL'), 'gentle'); c.to('earR', c.goal('earR'), 'gentle'); await c.wait(110);
      }},
      wink: {label: '眨一只眼', async run(c) {
        c.to('blinkR', .06, lidSpring); c.to('tilt', -4, 'snap'); c.to('grin', .5, 'gentle');
        c.to('earR', c.goal('earR') - 5, 'snap'); await c.wait(220);
        c.to('blinkR', 1, 'snap'); await c.wait(120);
      }},
      happy: {label: '开心 ^_^', async run(c) {
        c.to('squash', .78, 'snap'); c.to('bodyY', c.goal('bodyY') + 6, 'snap');
        c.to('joy', 1, {stiffness: 700, damping: 40}); c.to('soft', 1, 'gentle'); await c.wait(80);
        c.to('squash', .98, 'gentle'); c.to('bodyY', c.goal('bodyY') - 14, 'gentle');
        c.to('blush', 1, 'fade'); c.to('earL', 18, 'gentle'); c.to('earR', 18, 'gentle'); c.to('whisk', 1.28, 'gentle');
        c.to('tail', 28, 'snap'); await c.wait(100);
        c.to('squash', .7, 'impact'); c.to('bodyY', c.goal('bodyY') + 4, 'impact'); c.to('tail', -26, 'snap'); await c.wait(90);
        c.to('squash', 1.08, 'gentle'); c.to('bodyY', c.goal('bodyY') - 6, 'settle'); c.to('tail', 12, 'gentle'); await c.wait(80);
        c.to('bodyY', c.goal('bodyY'), 'settle'); c.to('squash', 1, 'settle'); c.to('tail', c.goal('tail'), 'gentle');
        await c.wait(240);
      }},
      squeeze: {label: '>_<', async run(c) {
        c.to('cross', 1, 'snap'); c.to('squash', .82, 'impact'); c.to('bodyY', c.goal('bodyY') + 3, 'impact');
        c.to('blush', 1, 'fade'); c.to('soft', 1, 'gentle'); c.to('earL', -10, 'snap'); c.to('earR', -10, 'snap');
        c.to('whisk', 1.3, 'gentle'); await c.wait(90);
        c.to('tilt', 6, 'snap'); await c.wait(60);
        c.to('tilt', -6, 'snap'); c.to('squash', .78, 'snap'); await c.wait(70);
        c.to('tilt', 0, 'gentle'); c.to('squash', 1.06, 'gentle'); c.to('bodyY', c.goal('bodyY') - 4, 'gentle'); await c.wait(200);
      }},
      surprised: {label: '惊讶 O_O', async run(c) {
        c.to('squash', 1.02, 'snap'); c.to('bodyY', c.goal('bodyY') + 1, 'snap'); await c.wait(50);
        c.to('earL', 16, 'snap'); c.to('earR', 16, 'snap'); c.to('eyeScale', 1.55, 'gentle');
        c.to('talk', 1, 'gentle'); c.to('whisk', 1.3, 'gentle'); c.to('bodyY', c.goal('bodyY') - 7, 'gentle');
        c.to('squash', 1.08, 'gentle'); c.to('tail', -20, 'snap'); await c.wait(140);
        c.to('bodyY', c.goal('bodyY') + 2, 'impact'); c.to('squash', .94, 'impact'); await c.wait(70);
        c.to('bodyY', c.goal('bodyY'), 'settle'); c.to('squash', 1, 'settle'); await c.wait(280);
      }},
      curious: {label: '歪头', async run(c) {
        c.to('tilt', -9, 'gentle'); c.to('earL', -7, 'gentle'); c.to('earR', 11, 'snap');
        c.to('gazeX', -3, 'gentle'); c.to('gazeY', -2, 'gentle'); c.to('tail', 10, 'gentle'); await c.wait(220);
        shut(c, .1); await c.wait(70);
        open(c); await c.wait(300);
      }},
      shy: {label: '害羞', async run(c) {
        c.to('blush', 1, 'fade'); c.to('cross', .85, 'gentle'); c.to('soft', .6, 'gentle');
        c.to('gazeY', 1.6, 'gentle'); c.to('tilt', 7, 'gentle'); c.to('squash', .95, 'gentle');
        c.to('earL', -6, 'gentle'); c.to('earR', -6, 'gentle'); c.to('bodyY', c.goal('bodyY') + 1, 'gentle');
        await c.wait(160);
        c.to('tilt', -4, 'gentle'); await c.wait(280);
      }},
      blank: {label: '-_-', async run(c) {
        c.to('flat', 1, 'snap'); c.to('earL', -6, 'gentle'); c.to('earR', -6, 'gentle');
        c.to('squash', .98, 'gentle'); c.to('tail', 6, 'gentle'); await c.wait(120);
        c.to('tilt', 3, 'gentle'); await c.wait(260);
      }},
      sad: {label: '委屈 T_T', async run(c) {
        c.to('cry', 1, 'gentle'); c.to('frown', 1, 'gentle');
        c.to('earL', -16, 'gentle'); c.to('earR', -16, 'gentle');
        c.to('bodyY', c.goal('bodyY') + 3, 'gentle'); c.to('squash', .95, 'gentle');
        c.to('tail', 18, 'slow'); await c.wait(200);
        c.to('bodyY', c.goal('bodyY') + 1, 'gentle'); await c.wait(240);
      }},
      wiggle: {label: '扭一扭', async run(c) {
        c.to('squash', .9, 'snap'); c.to('joy', .7, 'snap'); c.to('tail', 12, 'snap'); await c.wait(60);
        for (const angle of [-8, 9, -7, 6, -3]) {
          c.to('tilt', angle, 'snap'); c.to('tail', -angle * 1.6, 'gentle'); await c.wait(65);
        }
        c.to('squash', 1, 'settle'); await c.wait(140);
      }},
      pounce: {label: '扑一下', async run(c) {
        c.to('squash', .8, 'snap'); c.to('bodyY', c.goal('bodyY') + 4, 'snap');
        c.to('cross', 1, 'snap'); c.to('tail', 14, 'snap'); c.to('earL', -6, 'snap'); c.to('earR', -6, 'snap');
        await c.wait(90);
        c.to('cross', 0, 'fade'); c.to('joy', 1, 'snap'); c.to('squash', 1.1, 'gentle');
        c.to('bodyY', c.goal('bodyY') - 9, 'gentle'); c.to('earL', 16, 'gentle'); c.to('earR', 16, 'gentle');
        c.to('tail', -18, 'snap'); await c.wait(110);
        c.to('bodyY', c.goal('bodyY') + 3, 'impact'); c.to('squash', .86, 'impact'); c.to('joy', 0, 'fade');
        await c.wait(70);
        c.to('bodyY', c.goal('bodyY'), 'settle'); c.to('squash', 1, 'settle'); c.to('tail', c.goal('tail'), 'gentle');
        await c.wait(180);
      }},
      wag: {label: '摇尾巴', async run(c) {
        const flick = {stiffness: 1100, damping: 34};
        for (const angle of [34, -30, 22]) {
          c.to('tail', angle, flick);
          c.to('tilt', angle * -.2, 'gentle');
          await c.wait(150);
        }
      }},
      ears: {label: '动耳朵', async run(c) {
        c.to('earR', c.goal('earR') + 24, 'snap'); c.to('earL', c.goal('earL') - 8, 'snap'); await c.wait(70);
        c.to('earL', c.goal('earL') + 22, 'snap'); c.to('earR', c.goal('earR') - 6, 'gentle'); await c.wait(70);
        c.to('earR', c.goal('earR') + 10, 'gentle'); c.to('earL', c.goal('earL') + 6, 'gentle'); await c.wait(120);
      }},
      talking: {label: '说话', loop: true, run(c) {
        c.claim('talk', 'blinkL', 'blinkR', 'bodyY');
        c.loop(t => {
          const e = ease(t), w = M.util.wave(t, 3.2);
          c.s.talk = e * (.15 + .4 * w);
          c.s.bodyY = c.goal('bodyY') - e * .6 * w;
          c.s.blinkL = c.s.blinkR = blinkAt(t, 2.6);
        });
      }},
      thinking: {label: '想一想', loop: true, run(c) {
        c.claim('gazeX', 'gazeY', 'tail', 'earL', 'blinkL', 'blinkR');
        c.loop(t => {
          const e = ease(t);
          c.s.gazeX = c.goal('gazeX') + e * 3.5 * Math.sin(t * 1.3);
          c.s.gazeY = c.goal('gazeY') - e * (1.8 + .6 * Math.sin(t * 2.1));
          c.s.tail = c.goal('tail') + e * 9 * Math.sin(t * 1.6);
          c.s.earL = c.goal('earL') + e * 7 * Math.pow(Math.max(0, Math.sin(t * 2.7)), 4);
          c.s.blinkL = c.s.blinkR = blinkAt(t, 2.8);
        });
      }},
      dozing: {label: '打盹', loop: true, run(c) {
        c.claim('blinkL', 'blinkR', 'squash', 'earL', 'earR', 'gazeY', 'flat');
        c.loop(t => {
          const e = Math.min(1, t / .6), lid = 1 - .94 * e * e * (3 - 2 * e);
          c.s.blinkL = c.s.blinkR = lid;
          c.s.flat = e;
          c.s.earL = c.goal('earL') - 7 * e;
          c.s.earR = c.goal('earR') - 7 * e;
          c.s.squash = 1 - e * (.015 + .02 * M.util.wave(t, .45));
          c.s.gazeY = c.goal('gazeY') + 1.2 * e;
        });
      }}
    },
    task: {busy: 'thinking', success: 'happy', fail: 'sad'}
  });

  M.define('settings', {
    svg: `<rect x="22" y="22" width="76" height="76" rx="16"/><path d="M34 36h52"/><g data-part="thumb"><circle cx="40" cy="36" r="7"/></g><g data-part="dial"><circle cx="60" cy="72" r="18"/><path d="M60 56v16"/><circle cx="60" cy="72" r="3.5"/></g>`,
    state: {angle: 0, dialScale: 1, thumb: 0, press: 1},
    poses: {idle: {}, selected: {angle: 52, thumb: 1}},
    periodic: {angle: 360},
    render(s, p) {
      attr(p.dial, 'transform', `rotate(${s.angle} 60 72) ${around(s.dialScale, 60, 72)}`);
      const x = 40 + s.thumb * 40;
      attr(p.thumb, 'transform', aroundXY(Math.max(.72, 1.4 - s.press * .4), s.press, x, 36));
    },
    actions: {
      tap: {label: '轻触旋钮', async run(c) {
        c.to('press', .68, 'snap'); c.to('thumb', .12, 'snap'); await c.wait(80);
        c.to('press', 1, 'gentle'); c.to('dialScale', 1.1, 'gentle'); c.to('thumb', c.goal('thumb'), 'settle'); await c.wait(110);
      }},
      peek: {label: '旋钮预览', async run(c) {
        c.to('thumb', c.goal('thumb') + .42, 'snap'); c.to('angle', c.goal('angle') + 24, 'snap'); await c.wait(200);
      }},
      select: {label: '调到设置', pose: 'selected', async run(c) {
        c.to('thumb', -.08, 'snap'); c.to('angle', -14, 'snap'); c.to('press', .8, 'snap'); await c.wait(80);
        c.to('thumb', 1.06, 'gentle'); c.to('angle', 52, 'gentle'); c.to('press', 1, 'gentle'); c.to('dialScale', 1.08, 'gentle');
        await c.wait(180);
        c.to('thumb', 1, 'settle'); await c.wait(120);
      }},
      turn: {label: '转过一格', async run(c) {
        c.to('angle', c.goal('angle') - 16, 'snap'); c.to('thumb', 0, 'snap'); await c.wait(70);
        c.to('angle', c.goal('angle') + 78, 'gentle'); c.to('thumb', 1, 'gentle'); await c.wait(220);
        c.to('angle', c.goal('angle'), 'settle'); c.to('thumb', c.goal('thumb'), 'settle'); await c.wait(160);
      }}
    }
  });

  M.define('sentence', {
    svg: `<rect x="25" y="21" width="70" height="78" rx="10"/><path data-part="lineA" d="M37 41h45"/><path data-part="lineB" d="M37 56h45"/><path data-part="lineC" d="M37 71h32"/><g data-part="pen"><path d="m70 80 15-15 6 6-15 15-9 3Z"/><path d="m81 69 6 6"/></g>`,
    state: {inkA: 1, inkB: 1, inkC: 1, penX: 0, penY: 0, penOpacity: 0},
    poses: {idle: {}, selected: {inkC: .32, penOpacity: 1, penX: -12, penY: -10}},
    render(s, p) {
      dash(p.lineA, 45, s.inkA); dash(p.lineB, 45, s.inkB); dash(p.lineC, 32, s.inkC);
      attr(p.pen, 'transform', `translate(${s.penX} ${s.penY})`);
      attr(p.pen, 'opacity', clamp01(s.penOpacity));
    },
    actions: {
      tap: {label: '轻触句页', async run(c) {
        c.to('penOpacity', 1, 'fade'); c.to('penX', -6, 'snap'); c.to('penY', -22, 'snap'); await c.wait(70);
        c.to('penY', -6, 'impact'); c.to('inkC', .35, 'snap'); await c.wait(90);
        c.to('penY', -14, 'settle'); await c.wait(110);
      }},
      peek: {label: '展开句子', async run(c) {
        c.to('penOpacity', 1, 'fade'); c.to('penX', -22, 'snap'); c.to('penY', -36, 'snap'); await c.wait(80);
        c.to('inkB', .4, 'draw'); c.to('penX', -8, 'gentle'); await c.wait(180);
      }},
      select: {label: '阅读句子', pose: 'selected', async run(c) {
        c.to('penOpacity', 1, 'fade'); c.to('penY', -24, 'snap'); c.to('penX', 4, 'snap'); await c.wait(70);
        c.to('penY', -10, 'impact'); c.to('penX', -12, 'gentle'); c.to('inkC', .32, 'draw'); await c.wait(200);
      }},
      writing: {label: '写下例句', loop: true, run(c) {
        c.claim('penX', 'penY'); c.to('penOpacity', 1, 'fade');
        c.loop(t => { c.s.penX = -3 + 5*Math.sin(t*Math.PI*2); c.s.penY = -2 * M.util.wave(t, 1); });
      }},
      reveal: {label: '例句落笔', async run(c) {
        c.set({inkA: 0, inkB: 0, inkC: 0, penOpacity: 0});
        c.to('inkA', 1, 'draw'); await c.wait(85);
        c.to('inkB', 1, 'draw'); await c.wait(85);
        c.to('inkC', c.goal('inkC'), 'draw'); await c.wait(220);
      }},
      fail: {label: '笔尖停住', async run(c) {
        c.error(); c.to('penOpacity', 1, 'fade'); c.to('penY', 4, 'impact'); await c.wait(100);
        c.to('penY', -3, 'settle'); await c.shake();
        await c.wait(c.timing.holdFail); c.to('penOpacity', 0, 'fade');
      }}
    },
    task: {busy: 'writing', success: 'reveal', fail: 'fail'}
  });

  M.define('memory', {
    svg: `<defs><clipPath id="mi-memory-window"><rect x="29" y="34" width="62" height="48" rx="3"/></clipPath></defs><g data-part="frame"><rect x="21" y="25" width="78" height="68" rx="10"/><g clip-path="url(#mi-memory-window)"><g data-part="landscape"><circle cx="65" cy="43" r="7"/><path d="m28 82 20-24 17 17 13-13 14 20"/></g></g><path data-part="tag" d="M78 25v25l7-5 7 5V25"/></g>`,
    state: {frameAngle: 0, landX: 0, tagHeight: .66},
    poses: {idle: {}, selected: {tagHeight: 1.7, landX: -12, frameAngle: -6}},
    render(s, p) {
      attr(p.frame, 'transform', `rotate(${s.frameAngle} 60 93)`);
      attr(p.landscape, 'transform', `translate(${s.landX} 0)`);
      attr(p.tag, 'transform', aroundXY(1, s.tagHeight, 85, 25));
    },
    actions: {
      tap: {label: '轻触情景', run: c => preview(c, 'frameAngle', -3)},
      peek: {label: '看向情景', async run(c) {
        c.to('landX', 3, 'gentle'); c.to('frameAngle', -3, 'gentle'); await c.wait(230);
      }},
      select: {label: '记下情景', pose: 'selected', async run(c) {
        c.to('tagHeight', .45, 'snap'); c.to('landX', 6, 'snap'); await c.wait(70);
        c.to('tagHeight', 1.85, 'gentle'); c.to('landX', -14, 'gentle'); c.to('frameAngle', -7, 'gentle'); await c.wait(180);
        c.to('tagHeight', 1.7, 'settle'); c.to('landX', -12, 'settle'); c.to('frameAngle', -6, 'settle'); await c.wait(140);
      }},
      imagining: {label: '构思情景', loop: true, run(c) {
        c.claim('landX'); c.loop(t => { c.s.landX = 14 * Math.sin(t * Math.PI * 2 * .9); });
      }},
      bind: {label: '情景入册', pose: 'selected', async run(c) {
        c.to('frameAngle', 4, 'snap'); await c.wait(100);
        c.to('frameAngle', -3, 'gentle'); c.to('tagHeight', 1, 'gentle'); await c.wait(240);
      }},
      fail: {label: '画面搁置', async run(c) {
        c.error(); c.to('frameAngle', -5, 'snap'); await c.shake(); await c.wait(c.timing.holdFail);
      }}
    },
    task: {busy: 'imagining', success: 'bind', fail: 'fail'}
  });

  M.define('pencil', {
    svg: `<path d="M28 29h44M28 43h35M28 57h25M28 92h62"/><g data-part="pen"><path d="m45 72 38-38 11 11-38 38-15 4Z"/><path d="m77 40 11 11M45 72l11 11"/></g>`,
    state: {penX: 0, penY: 0, angle: 0},
    poses: {idle: {}, selected: {angle: -3}},
    render(s, p) { attr(p.pen, 'transform', `translate(${s.penX} ${s.penY}) rotate(${s.angle} 43 85)`); },
    actions: {
      tap: {label: '轻触笔尖', run: c => preview(c, 'penY', -4)},
      peek: {label: '执笔待写', async run(c) { c.to('angle', c.goal('angle') - 5, 'gentle'); await c.wait(200); }},
      select: {label: '准备落笔', pose: 'selected', async run(c) {
        c.to('penY', -4, 'snap'); await c.wait(100); c.to('penY', 0, 'impact'); await c.wait(210);
      }},
      write: {label: '笔尖划过', async run(c) {
        c.to('penX', -4, 'snap'); await c.wait(100);
        c.to('penX', 7, 'gentle'); c.to('angle', c.goal('angle') + 4, 'gentle'); await c.wait(230);
      }}
    }
  });

  M.define('voice', {
    svg: `<g data-part="capsule"><rect x="43" y="22" width="34" height="48" rx="17"/><path d="M51 34h18M51 45h18"/></g><path d="M32 54v6a28 28 0 0 0 56 0v-6M60 88v12M45 100h30"/><path data-part="wave" d="M90 42C102 50 102 70 90 78"/><path data-part="wave2" d="M98 34C114 46 114 74 98 86"/><path data-part="wave3" d="M106 28C120 44 120 78 106 94"/>`,
    state: {capsuleY: 0, waveAlpha: 0},
    poses: {idle: {}, selected: {waveAlpha: 1, capsuleY: -3}},
    render(s, p) {
      const level = clamp01(s.waveAlpha);
      attr(p.capsule, 'transform', `translate(0 ${s.capsuleY})`);
      attr(p.wave, 'opacity', clamp01(level * 2.4));
      attr(p.wave2, 'opacity', clamp01((level - .28) * 2.4));
      attr(p.wave3, 'opacity', clamp01((level - .58) * 2.4));
    },
    actions: {
      tap: {label: '轻触话筒', async run(c) {
        c.to('capsuleY', 5, 'snap'); await c.wait(70);
        c.to('capsuleY', c.goal('capsuleY') - 6, 'gentle'); c.to('waveAlpha', Math.min(1, c.goal('waveAlpha') + .45), 'fade');
        await c.wait(120);
      }},
      peek: {label: '轻声回应', async run(c) {
        c.to('waveAlpha', 1, 'fade'); c.to('capsuleY', c.goal('capsuleY') - 4, 'snap'); await c.wait(220);
      }},
      select: {label: '开始表达', pose: 'selected', async run(c) {
        c.to('capsuleY', 6, 'snap'); c.to('waveAlpha', 0, 'fade'); await c.wait(80);
        c.to('capsuleY', -3, 'gentle'); c.to('waveAlpha', 1, 'fade'); await c.wait(220);
      }},
      speaking: {label: '正在表达', loop: true, run(c) {
        c.claim('waveAlpha', 'capsuleY');
        c.loop(t => {
          const w = M.util.wave(t, 1.3);
          c.s.waveAlpha = .2 + .8 * w;
          c.s.capsuleY = c.goal('capsuleY') - 4 * w;
        });
      }},
      level: {label: '音量驱动', initial: 0, drive(c, value) { c.to('waveAlpha', value, 'track'); }}
    }
  });
})(window.MotionIcon);
