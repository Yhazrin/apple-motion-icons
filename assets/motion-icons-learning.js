/* Learning recipes: additive subjects; the animator and built-ins remain unchanged. */
(function (M) {
  'use strict';
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
      tap: {label: '轻触词页', run: c => c.nudge('lensScale', 0.08)},
      searching: {label: '检索词页', loop: true, run(c) {
        c.claim('lx', 'ly');
        c.loop(t => { c.s.lx = 4 * Math.sin(t * Math.PI * 2); c.s.ly = -3 * (1 - Math.cos(t * Math.PI * 2)); });
      }},
      found: {label: '聚焦词义', async run(c) {
        c.to('lensScale', 0.94, 'snap');
        await c.wait(90);
        c.to('lx', 0, 'track'); c.to('ly', -3, 'pop'); c.to('lensScale', 1.12, 'pop');
        await c.wait(260);
      }},
      empty: {label: '继续寻找', async run(c) {
        c.to('lx', -5, 'gentle'); await c.wait(140);
        c.to('lx', 5, 'gentle'); await c.wait(200);
      }},
      fail: {label: '词页卡住', async run(c) {
        c.error(); c.to('pageTilt', -4, 'snap');
        c.to('ly', 5, 'impact'); await c.wait(100);
        c.to('ly', -2, 'rebound'); await c.shake();
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
      tap: {label: '轻触词本', run: c => c.squash('compression', 0.95)},
      saving: {label: '词卡就位', loop: true, run(c) {
        c.claim('paperY'); c.to('paperOpacity', 1, 'fade');
        c.loop(t => { c.s.paperY = -4 - 2*Math.sin(t*Math.PI*2); });
      }},
      save: {label: '收入词本', pose: 'saved', from: 'empty', async run(c) {
        c.set({paperY: -3, paperOpacity: 0, mark: 0});
        c.to('paperOpacity', 1, 'fade'); c.to('paperY', -8, 'snap');
        await c.wait(100);
        c.to('paperY', 25, 'snap'); await c.wait(140);
        c.squash('compression', 0.90); c.to('paperOpacity', 0, 'fade');
        await c.wait(70); c.to('mark', 1, 'pop'); await c.wait(240);
      }},
      reopen: {label: '取出词卡', pose: 'empty', from: 'saved', async run(c) {
        c.set({paperY: 25, paperOpacity: 0}); c.to('mark', 0, 'fade');
        c.to('paperOpacity', 1, 'fade'); c.to('paperY', -6, 'pop');
        await c.wait(320); c.to('paperOpacity', 0, 'fade'); await c.wait(180);
      }},
      fail: {label: '词卡退回', from: 'empty', async run(c) {
        c.error(); c.set({paperY: -4, paperOpacity: 0}); c.to('paperOpacity', 1, 'fade');
        c.to('paperY', 8, 'snap'); await c.wait(100);
        c.to('paperY', -8, 'rebound'); c.squash('compression', 0.95);
        await c.shake(); await c.wait(c.timing.holdFail); c.to('paperOpacity', 0, 'fade');
      }}
    }
  });
})(window.MotionIcon);

(function (M) {
  'use strict';
  const {around, aroundXY, clamp01} = M.util;
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
      out.push((60 + x * cosA).toFixed(2), (60 + y * yScale).toFixed(2));
    }
    let n = 0;
    return d.replace(PATH_NUM, () => out[n++]);
  }
  M.define('daylight', {
    svg: `<g data-part="sun"><path data-part="outline" d="${sunOutline}"/></g><path data-part="rays" d="${rayOutline}"/><path data-part="stars" d="${starOutline}"/>`,
    state: {phase: 0, rise: 0, warmth: 1, rayAngle: 0},
    poses: {idle: {}, selected: {rayAngle: 12}, night: {phase: 1}, nightSelected: {phase: 1, rayAngle: 12}},
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
      tap: {label: '轻触天光', run: c => c.nudge('warmth', .06)},
      peek: {label: '天光舒展', async run(c) {
        c.to('warmth', 1.04, 'gentle'); c.to('rayAngle', c.goal('rayAngle') + 9, 'slow');
        await c.wait(220);
      }},
      select: {label: '迎接白昼', pose: 'selected', async run(c) {
        c.to('phase', 0, 'slow');
        c.to('rise', 3, 'snap'); await c.wait(95);
        c.to('rise', -2, 'pop'); await c.wait(240);
      }},
      selectNight: {label: '迎接夜晚', pose: 'nightSelected', from: 'night', async run(c) {
        c.to('phase', 1, 'slow');
        c.to('rise', 3, 'snap'); await c.wait(95);
        c.to('rise', -2, 'pop'); await c.wait(240);
      }},
      toNight: {label: '太阳变月亮', pose: 'night', from: 'idle', async run(c) {
        c.to('phase', 1, 'slow'); c.to('rise', -3, 'snap');
        await c.wait(150);
        c.to('rise', 1, 'pop'); await c.wait(320);
      }},
      toDay: {label: '月亮变太阳', pose: 'idle', from: 'night', async run(c) {
        c.to('phase', 0, 'slow'); c.to('rise', -3, 'snap');
        await c.wait(150);
        c.to('rise', 1, 'pop'); await c.wait(320);
      }}
    }
  });

  M.define('cards', {
    svg: `<g data-part="back"><rect x="23" y="25" width="63" height="62" rx="11"/></g><g data-part="front"><rect x="30" y="35" width="63" height="62" rx="11"/><path d="M43 54h37M43 67h28M43 80h19"/></g>`,
    state: {frontX: 0, frontY: 0, tilt: 0, backAngle: 0, contact: 1},
    poses: {idle: {}, selected: {backAngle: -5}},
    render(s, p) {
      attr(p.back, 'transform', `rotate(${s.backAngle} 55 90)`);
      attr(p.front, 'transform', `translate(${s.frontX} ${s.frontY}) rotate(${s.tilt} 61 97) ${aroundXY(1 + (1-s.contact)*.4, s.contact, 61, 97)}`);
    },
    actions: {
      tap: {label: '轻触词卡', run: c => c.squash('contact', .94)},
      peek: {label: '错开卡片', async run(c) {
        c.to('frontX', 4, 'gentle'); c.to('tilt', 4, 'gentle'); await c.wait(45);
        c.to('backAngle', c.goal('backAngle') - 6, 'swing'); await c.wait(200);
      }},
      select: {label: '抽出一张', pose: 'selected', async run(c) {
        c.to('frontY', 4, 'snap'); await c.wait(100);
        c.to('frontY', -8, 'pop'); c.to('tilt', -4, 'gentle'); await c.wait(210);
      }},
      remember: {label: '词卡归位', async run(c) {
        c.to('frontY', -5, 'snap'); await c.wait(95);
        c.to('frontY', 0, 'impact'); await c.wait(80);
        c.squash('contact', .90); c.to('backAngle', c.goal('backAngle') - 3, 'swing'); await c.wait(220);
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
    state: {opening: 0, bodyAngle: 0, leafWidth: 1, leafOpacity: 0},
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
      attr(p.turning, 'd', cover);
      attr(p.leaf, 'transform', aroundXY(s.leafWidth, 1, hinge, 60));
      attr(p.leaf, 'opacity', clamp01(s.leafOpacity)*opening);
    },
    actions: {
      tap: {label: '轻触词本', run: c => c.nudge('bodyAngle', -3)},
      peek: {label: '展开词本', pose: 'open', from: 'idle', async run(c) {
        c.to('opening', 1, 'gentle'); c.to('bodyAngle', 2, 'snap');
        await c.wait(85);
        c.to('bodyAngle', -2, 'pop'); await c.wait(260);
      }},
      select: {label: '选中词本', pose: 'selected', async run(c) {
        c.to('opening', 1, 'gentle'); c.to('bodyAngle', 3, 'snap');
        await c.wait(90);
        c.to('bodyAngle', -2, 'pop'); await c.wait(260);
      }},
      close: {label: '合上词本', pose: 'idle', from: 'open', async run(c) {
        c.to('opening', 0, 'gentle'); c.to('bodyAngle', -2, 'snap');
        await c.wait(85);
        c.to('bodyAngle', 0, 'pop'); await c.wait(260);
      }},
      turn: {label: '翻过一页', pose: 'open', from: 'open', async run(c) {
        c.to('leafOpacity', 1, 'fade'); c.to('leafWidth', 1.04, 'snap'); await c.wait(100);
        c.to('leafWidth', -.90, 'gentle'); await c.wait(260);
        await c.to('leafOpacity', 0, 'fade'); c.set({leafWidth: 1});
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
      tap: {label: '轻触回忆卡', run: c => c.nudge('tilt', -3)},
      reveal: {label: '展开答案', pose: 'revealed', from: 'idle', async run(c) {
        c.to('cardY', 3, 'snap'); await c.wait(90);
        c.to('opening', 1, 'gentle'); c.to('cardY', -2, 'pop'); await c.wait(260);
      }},
      close: {label: '收起答案', pose: 'idle', from: 'revealed', async run(c) {
        c.to('opening', 0, 'gentle'); await c.wait(240);
      }},
      next: {label: '记住 · 过一词', pose: 'idle', from: 'revealed', async run(c) {
        c.to('cardX', -3, 'snap'); await c.wait(90);
        c.to('cardX', 12, 'gentle'); c.to('cardY', -4, 'gentle');
        await c.to('opacity', 0, 'fade');
        c.set({cardX:-10, cardY:0, opening:0});
        c.to('opacity', 1, 'fade'); c.to('cardX', 0, 'pop'); await c.wait(210);
      }},
      retry: {label: '留待重温', pose: 'idle', from: 'revealed', async run(c) {
        c.to('cardY', -4, 'gentle'); c.to('tilt', -6, 'gentle'); await c.wait(180);
        c.to('opening', 0, 'gentle'); c.to('tilt', 0, 'pop'); await c.wait(180);
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
      tap: {label: '轻触整轮词本', run: c => c.nudge('pageAngle', 3)},
      complete: {label: '背完一轮', pose: 'complete', from: 'idle', async run(c) {
        c.to('pageY', -8, 'snap'); await c.wait(100);
        c.to('pageY', 0, 'impact'); c.to('pageAngle', 0, 'gentle'); await c.wait(100);
        c.squash('contact', .92); c.to('sealOpacity', 1, 'fade'); c.to('sealScale', 1, 'pop');
        await c.wait(85); c.to('check', 1, 'draw'); await c.wait(240);
      }},
      restart: {label: '开始新一轮', pose: 'idle', from: 'complete', async run(c) {
        c.to('sealOpacity', 0, 'fade'); await c.wait(90);
        c.to('pageY', -5, 'gentle'); c.to('pageAngle', 5, 'gentle'); await c.wait(240);
      }}
    }
  });

  M.define('capture', {
    svg: `<g data-part="paper"><path data-part="outline" d="M36 22h37l19 19v49a10 10 0 0 1-10 10H36a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10Z"/><path data-part="fold" d="M73 22v12a7 7 0 0 0 7 7h12"/><g data-part="plus"><path d="M46 68h28M60 54v28"/></g></g>`,
    state: {paperY: 0, plusAngle: 0, foldAngle: 0, contact: 1},
    poses: {idle: {}, selected: {plusAngle: 90}},
    periodic: {plusAngle: 360},
    render(s, p) {
      attr(p.paper, 'transform', `translate(0 ${s.paperY}) ${aroundXY(1 + (1-s.contact)*.4, s.contact, 60, 100)}`);
      attr(p.plus, 'transform', `rotate(${s.plusAngle} 60 68)`);
      attr(p.fold, 'transform', `rotate(${s.foldAngle} 73 22)`);
      const theta = s.foldAngle * Math.PI / 180;
      const tipX = 73 + 19*Math.cos(theta) - 19*Math.sin(theta);
      const tipY = 22 + 19*Math.sin(theta) + 19*Math.cos(theta);
      attr(p.outline, 'd', `M36 22H73L${tipX} ${tipY}L92 56V90a10 10 0 0 1-10 10H36a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10Z`);
    },
    actions: {
      tap: {label: '轻触纸页', run: c => c.squash('contact', .95)},
      peek: {label: '纸角扬起', async run(c) {
        c.to('foldAngle', -9, 'swing'); c.to('plusAngle', c.goal('plusAngle') + 12, 'gentle'); await c.wait(230);
      }},
      select: {label: '准备收录', pose: 'selected', async run(c) {
        c.to('plusAngle', c.goal('plusAngle') - 5, 'snap'); await c.wait(95);
        c.to('plusAngle', 90, 'slow'); c.to('paperY', -4, 'pop'); await c.wait(220);
      }},
      insert: {label: '放下纸页', async run(c) {
        c.to('paperY', -6, 'snap'); await c.wait(100);
        c.to('paperY', 0, 'impact'); await c.wait(70);
        c.squash('contact', .90); c.to('foldAngle', -7, 'swing'); await c.wait(220);
      }}
    }
  });

  M.define('conversation', {
    svg: `<g data-part="back"><path d="M53 50h39a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10h-4l-10 10V92H53a10 10 0 0 1-10-10V60a10 10 0 0 1 10-10Z"/></g><g data-part="front"><path d="M28 23h47a10 10 0 0 1 10 10v25a10 10 0 0 1-10 10H44L30 81V68h-2a10 10 0 0 1-10-10V33a10 10 0 0 1 10-10Z"/><circle data-part="dotA" data-fill cx="36" cy="46" r="2.8"/><circle data-part="dotB" data-fill cx="51" cy="46" r="2.8"/><circle data-part="dotC" data-fill cx="66" cy="46" r="2.8"/></g>`,
    state: {frontY: 0, backY: 0, frontAngle: 0, dotA: 1, dotB: 1, dotC: 1},
    poses: {idle: {}, selected: {backY: -3}},
    render(s, p) {
      attr(p.front, 'transform', `translate(0 ${s.frontY}) rotate(${s.frontAngle} 51 68)`);
      attr(p.back, 'transform', `translate(0 ${s.backY})`);
      ['dotA', 'dotB', 'dotC'].forEach(k => attr(p[k], 'opacity', clamp01(s[k])));
    },
    actions: {
      tap: {label: '轻触对话', run: c => c.nudge('frontY', -4)},
      peek: {label: '倾听一下', async run(c) {
        c.to('frontAngle', -4, 'gentle'); await c.wait(50);
        c.to('backY', c.goal('backY') + 3, 'gentle'); await c.wait(190);
      }},
      select: {label: '展开对话', pose: 'selected', async run(c) {
        c.to('frontY', 4, 'snap'); await c.wait(95);
        c.to('frontY', -4, 'pop'); await c.wait(55);
        c.to('backY', -3, 'rebound'); await c.wait(180);
      }},
      reply: {label: '接上回答', async run(c) {
        c.to('backY', c.goal('backY') + 4, 'snap'); await c.wait(100);
        c.to('backY', c.goal('backY') - 4, 'pop'); await c.wait(70);
        c.to('frontY', -3, 'gentle'); await c.wait(210);
      }},
      thinking: {label: '组织表达', loop: true, run(c) {
        c.claim('dotA', 'dotB', 'dotC');
        c.loop(t => ['dotA', 'dotB', 'dotC'].forEach((k, i) => { c.s[k] = .35 + .65 * M.util.wave(t, 1.1, i * .7); }));
      }}
    }
  });

  M.define('settings', {
    svg: `<rect x="22" y="22" width="76" height="76" rx="16"/><path d="M34 35h14M72 35h14"/><g data-part="dial"><circle cx="60" cy="66" r="20"/><path d="M60 51v9"/><circle cx="60" cy="66" r="4"/></g>`,
    state: {angle: 0, dialScale: 1},
    poses: {idle: {}, selected: {angle: 18}},
    periodic: {angle: 360},
    render(s, p) { attr(p.dial, 'transform', `rotate(${s.angle} 60 66) ${around(s.dialScale, 60, 66)}`); },
    actions: {
      tap: {label: '轻触旋钮', run: c => c.nudge('dialScale', -.06)},
      peek: {label: '旋钮预览', async run(c) {
        c.to('angle', c.goal('angle') + 15, 'gentle'); await c.wait(220);
      }},
      select: {label: '调到设置', pose: 'selected', async run(c) {
        c.to('angle', 13, 'snap'); await c.wait(95);
        c.to('angle', 18, 'pop'); await c.wait(200);
      }},
      turn: {label: '转过一格', async run(c) {
        c.to('angle', c.goal('angle') - 5, 'snap'); await c.wait(100);
        c.to('angle', c.goal('angle') + 45, 'slow'); await c.wait(280);
      }}
    }
  });

  M.define('sentence', {
    svg: `<rect x="25" y="21" width="70" height="78" rx="10"/><path data-part="lineA" d="M37 41h45"/><path data-part="lineB" d="M37 56h45"/><path data-part="lineC" d="M37 71h32"/><g data-part="pen"><path d="m70 80 15-15 6 6-15 15-9 3Z"/><path d="m81 69 6 6"/></g>`,
    state: {inkA: 1, inkB: 1, inkC: 1, penX: 0, penY: 0, penOpacity: 0},
    poses: {idle: {}, selected: {inkC: .84}},
    render(s, p) {
      dash(p.lineA, 45, s.inkA); dash(p.lineB, 45, s.inkB); dash(p.lineC, 32, s.inkC);
      attr(p.pen, 'transform', `translate(${s.penX} ${s.penY})`);
      attr(p.pen, 'opacity', clamp01(s.penOpacity));
    },
    actions: {
      tap: {label: '轻触句页', run: c => c.nudge('inkC', -.12)},
      peek: {label: '展开句子', run: c => c.nudge('inkC', -.2)},
      select: {label: '阅读句子', pose: 'selected', run: c => c.nudge('inkB', -.15)},
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
        c.to('penY', -3, 'rebound'); await c.shake();
        await c.wait(c.timing.holdFail); c.to('penOpacity', 0, 'fade');
      }}
    },
    task: {busy: 'writing', success: 'reveal', fail: 'fail'}
  });

  M.define('memory', {
    svg: `<defs><clipPath id="mi-memory-window"><rect x="29" y="34" width="62" height="48" rx="3"/></clipPath></defs><g data-part="frame"><rect x="21" y="25" width="78" height="68" rx="10"/><g clip-path="url(#mi-memory-window)"><g data-part="landscape"><circle cx="65" cy="43" r="7"/><path d="m28 82 20-24 17 17 13-13 14 20"/></g></g><path data-part="tag" d="M78 25v25l7-5 7 5V25"/></g>`,
    state: {frameAngle: 0, landX: 0, tagHeight: .66},
    poses: {idle: {}, selected: {tagHeight: 1}},
    render(s, p) {
      attr(p.frame, 'transform', `rotate(${s.frameAngle} 60 93)`);
      attr(p.landscape, 'transform', `translate(${s.landX} 0)`);
      attr(p.tag, 'transform', aroundXY(1, s.tagHeight, 85, 25));
    },
    actions: {
      tap: {label: '轻触情景', run: c => c.nudge('frameAngle', -3)},
      peek: {label: '看向情景', async run(c) {
        c.to('landX', 3, 'gentle'); c.to('frameAngle', -3, 'gentle'); await c.wait(230);
      }},
      select: {label: '记下情景', pose: 'selected', async run(c) {
        c.to('tagHeight', .84, 'snap'); await c.wait(100);
        c.to('tagHeight', 1, 'pop'); await c.wait(220);
      }},
      imagining: {label: '构思情景', loop: true, run(c) {
        c.claim('landX'); c.loop(t => { c.s.landX = 3 * Math.sin(t*Math.PI*2*.9); });
      }},
      bind: {label: '情景入册', pose: 'selected', async run(c) {
        c.to('frameAngle', 4, 'snap'); await c.wait(100);
        c.to('frameAngle', -3, 'pop'); c.to('tagHeight', 1, 'pop'); await c.wait(240);
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
      tap: {label: '轻触笔尖', run: c => c.nudge('penY', -4)},
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
    svg: `<g data-part="capsule"><rect x="43" y="22" width="34" height="48" rx="17"/><path d="M51 34h18M51 45h18"/></g><path d="M32 54v6a28 28 0 0 0 56 0v-6M60 88v12M45 100h30"/><path data-part="wave" d="M96 38a34 34 0 0 1 0 37"/>`,
    state: {capsuleY: 0, waveAlpha: 0},
    poses: {idle: {}, selected: {waveAlpha: .75}},
    render(s, p) {
      attr(p.capsule, 'transform', `translate(0 ${s.capsuleY})`);
      attr(p.wave, 'opacity', clamp01(s.waveAlpha));
    },
    actions: {
      tap: {label: '轻触话筒', run: c => c.nudge('capsuleY', -3)},
      peek: {label: '轻声回应', async run(c) { c.to('waveAlpha', 1, 'fade'); await c.wait(220); }},
      select: {label: '开始表达', pose: 'selected', async run(c) {
        c.to('capsuleY', 4, 'snap'); await c.wait(100);
        c.to('capsuleY', -3, 'pop'); c.to('waveAlpha', .75, 'fade'); await c.wait(220);
      }},
      speaking: {label: '正在表达', loop: true, run(c) {
        c.claim('waveAlpha'); c.loop(t => { c.s.waveAlpha = .25 + .75*M.util.wave(t, 1.3); });
      }},
      level: {label: '音量驱动', initial: 0, drive(c, value) { c.to('waveAlpha', value, 'track'); }}
    }
  });
})(window.MotionIcon);
