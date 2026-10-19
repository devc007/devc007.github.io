/* Devesh Chouhan · portfolio interactions
   Progressive enhancement: everything is readable without this file.
   GSAP + ScrollTrigger + SplitText + Lenis are vendored in assets/vendor. */
(() => {
  'use strict';
  window.__ready = true;

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const animate = hasGsap && !reduceMotion && !root.classList.contains('fallback');

  // Joined Rover AI on 21 Sep 2026 (IST).
  const ROVER_START = new Date('2026-09-21T10:00:00+05:30');

  /* ------------------------------------------------------------------
     Live bits: uptime, IST clock, kubectl-style age, year, build sha
     ------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, '0');
  const since = (date) => {
    let s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    return { d, h, m, s };
  };
  const kubeAge = (date) => {
    const { d, h } = since(date);
    if (d < 2) return `${d * 24 + h}h`;
    if (d < 365) return `${d}d`;
    return `${Math.floor(d / 365)}y${d % 365}d`;
  };

  const uptimeEl = $('#uptime');
  const clockEls = $$('[data-clock]');
  const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => {
    if (uptimeEl) {
      const t = since(ROVER_START);
      uptimeEl.textContent = `${t.d}d ${pad(t.h)}h ${pad(t.m)}m ${pad(t.s)}s`;
    }
    const now = clockFmt.format(new Date());
    clockEls.forEach((el) => { el.textContent = now; });
  };
  tick();
  setInterval(tick, 1000);

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const buildEl = $('#build');
  if (buildEl) {
    const sha = buildEl.dataset.sha || '';
    if (/^[0-9a-f]{7,40}$/.test(sha)) {
      buildEl.innerHTML = `build <a href="https://github.com/devc007/devc007.github.io/commit/${sha}" target="_blank" rel="noopener">${sha.slice(0, 7)}</a>`;
    }
  }

  /* ------------------------------------------------------------------
     Hero terminal
     ------------------------------------------------------------------ */
  const term = $('#terminal');
  const PROMPT = '<span class="t-prompt">devesh@rover</span><span class="t-dim">:</span><span class="t-path">~</span><span class="t-dim">$</span> ';
  const CARET = '<span class="t-caret"></span>';
  const jobRow = (name, status, cls, dur) =>
    `${name.padEnd(27)}<span class="${cls}">${status}</span>${' '.repeat(11 - status.length)}${dur}`;
  const SCRIPT = [
    { cmd: 'whoami' },
    { out: 'devesh-chouhan <span class="t-dim">·</span> devops engineer <span class="t-dim">·</span> india' },
    { out: '' },
    { cmd: 'kubectl get jobs -n career' },
    { out: `<span class="t-dim">${'NAME'.padEnd(27)}${'STATUS'.padEnd(11)}DURATION</span>` },
    { out: jobRow('devops-engineer.rover-ai', 'Running', 't-ok', kubeAge(ROVER_START)) },
    { out: jobRow('swe-intern.hosho-digital', 'Complete', 't-dim', '4mo') },
    { out: jobRow('lfx-mentee.kgateway', 'Complete', 't-dim', '3mo') },
    { out: '' },
    { cmd: 'cat focus.txt' },
    { out: '<span class="t-ok">kubernetes</span> · aws · terraform · ci/cd · go' },
    { out: '' },
  ];
  const lineHTML = (step) => (step.cmd != null ? `${PROMPT}<span class="t-cmd">${step.cmd}</span>` : step.out);
  const renderTerminal = () => {
    if (term) term.innerHTML = `${SCRIPT.map(lineHTML).join('\n')}\n${PROMPT}${CARET}`;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let typing = false;
  async function typeTerminal() {
    if (!term || typing) return;
    typing = true;
    renderTerminal();
    term.style.minHeight = `${term.offsetHeight}px`;
    let html = '';
    term.innerHTML = PROMPT + CARET;
    await sleep(500);
    for (const step of SCRIPT) {
      if (step.cmd != null) {
        html += PROMPT;
        let typed = '';
        for (const ch of step.cmd) {
          typed += ch;
          term.innerHTML = `${html}<span class="t-cmd">${typed}</span>${CARET}`;
          await sleep(32 + Math.random() * 48);
        }
        html += `<span class="t-cmd">${step.cmd}</span>\n`;
        term.innerHTML = html;
        await sleep(240);
      } else {
        html += `${step.out}\n`;
        term.innerHTML = html;
        await sleep(65);
      }
    }
    term.innerHTML = html + PROMPT + CARET;
  }
  renderTerminal();

  /* ------------------------------------------------------------------
     Nav: scrolled state, hide on scroll down, progress bar, active link
     ------------------------------------------------------------------ */
  const nav = $('#nav');
  const progress = $('.scroll-progress span');
  let lastY = 0;
  const onScroll = (y, max) => {
    nav.classList.toggle('is-scrolled', y > 30);
    if (Math.abs(y - lastY) > 6) {
      nav.classList.toggle('is-hidden', y > lastY && y > 480 && !root.classList.contains('menu-open'));
      lastY = y;
    }
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };

  const navLinks = $$('.nav__links a');
  const linkById = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      const link = linkById.get(entry.target.id);
      if (link) link.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObserver.observe(s));

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  const burger = $('.nav__burger');
  const menu = $('#menu');
  let lenis = null;
  function openMenu() {
    root.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    nav.classList.remove('is-hidden');
    if (lenis) lenis.stop();
    if (animate) {
      gsap.fromTo('.menu nav a', { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out', delay: 0.15 });
    }
  }
  function closeMenu() {
    if (!root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  burger.addEventListener('click', () => (root.classList.contains('menu-open') ? closeMenu() : openMenu()));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ------------------------------------------------------------------
     In-page links (smooth with Lenis when available)
     ------------------------------------------------------------------ */
  $$('a[href^="#"]:not(.skip-link)').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' || id === '#' ? 0 : $(id);
      if (target == null) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.5 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  /* ------------------------------------------------------------------
     Copy email + toast
     ------------------------------------------------------------------ */
  const toastEl = $('#toast');
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2300);
  };
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) { /* try the legacy path */ }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      if (await copyText(text)) toast('Email copied to clipboard ✓');
      else window.location.href = `mailto:${text}`;
    });
  });

  /* ------------------------------------------------------------------
     Skills orbit: light up a group from the cards, name tools on hover
     ------------------------------------------------------------------ */
  const orbit = $('#orbit');
  if (orbit) {
    const label = $('#orbitLabel');
    const sub = $('#orbitSub');
    const planets = $$('.planet', orbit);
    const defaults = [label.textContent, sub.textContent];
    const setLabel = (main, small) => { label.textContent = main; sub.textContent = small; };
    const reset = () => setLabel(...defaults);
    const light = (cat) => {
      planets.forEach((p) => {
        const on = !!cat && p.dataset.cats.split(' ').includes(cat);
        p.classList.toggle('is-dim', !!cat && !on);
        p.classList.toggle('is-lit', on);
      });
    };
    const cards = $$('.skill-card');
    const activate = (card) => {
      cards.forEach((c) => c.classList.toggle('is-active', c === card));
      light(card ? card.dataset.cat : null);
      if (card) setLabel(card.dataset.short, `${$$('.planet.is-lit', orbit).length} in orbit`);
      else reset();
    };
    cards.forEach((card) => {
      card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') activate(card); });
      card.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') activate(null); });
      card.addEventListener('focus', () => activate(card));
      card.addEventListener('blur', () => activate(null));
      card.addEventListener('click', () => activate(card.classList.contains('is-active') && !finePointer ? null : card));
    });
    planets.forEach((p) => {
      p.addEventListener('pointerenter', () => setLabel(p.dataset.name, 'tool'));
      p.addEventListener('pointerleave', () => {
        const active = $('.skill-card.is-active');
        if (active) setLabel(active.dataset.short, `${$$('.planet.is-lit', orbit).length} in orbit`);
        else reset();
      });
    });
  }

  /* ------------------------------------------------------------------
     Pointer effects: spotlight cards, page glow
     ------------------------------------------------------------------ */
  if (finePointer) {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    const glow = $('.page-glow');
    window.addEventListener('pointermove', (e) => {
      glow.style.setProperty('--gx', `${e.clientX}px`);
      glow.style.setProperty('--gy', `${e.clientY}px`);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     No-animation path (reduced motion, or GSAP failed to load)
     ------------------------------------------------------------------ */
  if (!animate) {
    root.classList.add('fallback', 'no-anim', 'no-boot');
    const boot = $('#boot');
    if (boot) boot.remove();
    window.addEventListener('scroll', () => onScroll(window.scrollY, document.documentElement.scrollHeight - window.innerHeight), { passive: true });
    return;
  }

  /* ==================================================================
     Animated path
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  const hasSplit = !!window.SplitText;

  // Smooth scrolling
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', (l) => onScroll(l.scroll, l.limit));
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY, document.documentElement.scrollHeight - window.innerHeight), { passive: true });
  }

  /* ---------- Cursor + magnetic buttons + tilt ---------- */
  if (finePointer) {
    const cursor = $('.cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.add('is-visible'); }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerover', (e) => {
      const hit = e.target.closest('a, button, [data-copy], .planet, .skill-card');
      cursor.classList.toggle('is-hover', !!hit);
    });

    $$('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });

    $$('.tilt').forEach((el) => {
      gsap.set(el, { transformPerspective: 1100 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 6);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- Hero name: weight follows the pointer ---------- */
  function enableNameHover(chars) {
    if (!finePointer || !chars || !chars.length) return;
    const hero = $('.hero');
    let px = -1e4, py = -1e4, raf = 0;
    const frame = () => {
      raf = 0;
      const rects = chars.map((c) => c.getBoundingClientRect());
      chars.forEach((c, i) => {
        const r = rects[i];
        const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
        const p = Math.max(0, 1 - d / 300);
        const e = p * p * (3 - 2 * p);
        c.style.fontVariationSettings = `"wght" ${Math.round(700 - 400 * e)}`;
        c.style.setProperty('--p', e.toFixed(3));
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
    hero.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; queue(); });
    hero.addEventListener('pointerleave', () => { px = py = -1e4; queue(); });
  }

  /* ---------- Rotating words ---------- */
  function startRotator() {
    const el = $('#rotator');
    if (!el) return;
    const words = ['cloud-native infrastructure', 'Kubernetes workloads', 'CI/CD pipelines', 'infrastructure as code', 'faster feedback loops'];
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % words.length;
      gsap.timeline()
        .to(el, { yPercent: -105, autoAlpha: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power3.in' })
        .call(() => { el.textContent = words[i]; })
        .fromTo(el, { yPercent: 105, autoAlpha: 0, filter: 'blur(6px)' }, { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out' });
    }, 2900);
  }

  /* ---------- Hero intro ---------- */
  function heroIntro() {
    const title = $('#heroTitle');
    let chars = null;
    if (hasSplit) {
      const split = SplitText.create(title, { type: 'chars,words,lines', mask: 'lines', charsClass: 'char' });
      chars = split.chars;
    }
    gsap.set(title, { visibility: 'visible' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('#network', { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.2, ease: 'power2.out' }, 0);
    tl.fromTo('.status-chip', { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1 }, 0.05);
    if (chars) tl.from(chars, { yPercent: 118, rotate: 7, transformOrigin: '0% 100%', duration: 1.3, stagger: 0.034 }, 0.1);
    tl.fromTo('.hero__lead, .hero__text, .hero__actions, .socials', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.15, stagger: 0.08 }, 0.5);
    tl.fromTo('.terminal', { y: 44, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.3, onStart: typeTerminal }, 0.6);
    tl.fromTo('.hero__foot', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 1.05);
    tl.call(() => enableNameHover(chars), null, 1.7);
  }

  /* ---------- Boot sequence (once per session) ---------- */
  function runBoot() {
    return new Promise((resolve) => {
      const boot = $('#boot');
      if (!boot || root.classList.contains('no-boot')) {
        if (boot) boot.remove();
        resolve();
        return;
      }
      root.classList.add('is-booting');
      if (lenis) lenis.stop();
      const box = $('#bootLines');
      const countEl = $('#bootCount');
      const bar = $('#bootBar');
      const lines = [
        ['cmd', 'kubectl apply -f devesh-chouhan.yaml'],
        ['', 'deployment.apps/portfolio created'],
        ['', 'service/portfolio exposed'],
        ['cmd', 'kubectl rollout status deployment/portfolio'],
        ['', 'Waiting for rollout to finish: 2 of 3 updated replicas are available...'],
        ['ok', 'deployment "portfolio" successfully rolled out'],
      ];
      const counter = { v: 0 };
      let shown = 0;
      const tl = gsap.timeline();
      tl.to(counter, {
        v: 100, duration: 1.35, ease: 'power2.inOut',
        onUpdate: () => {
          // transform only (no layout); touch the text only when the number changes
          bar.style.transform = `scaleX(${counter.v / 100})`;
          const v = Math.round(counter.v);
          if (v !== shown) { shown = v; countEl.textContent = v; }
        },
      }, 0);
      lines.forEach(([cls, text], i) => {
        tl.call(() => {
          const p = document.createElement('p');
          if (cls) p.className = cls;
          p.textContent = text;
          box.appendChild(p);
        }, null, 0.08 + i * 0.2);
      });
      tl.to(boot, { yPercent: -100, duration: 0.95, ease: 'expo.inOut' }, 1.5);
      tl.call(() => {
        try { sessionStorage.setItem('booted', '1'); } catch (e) { /* private mode */ }
        resolve();
      }, null, 1.75);
      tl.call(() => {
        boot.remove();
        root.classList.remove('is-booting');
        if (lenis) lenis.start();
      }, null, 2.5);
    });
  }

  /* ---------- Marquee tapes (react to scroll speed and direction) ---------- */
  function initTapes() {
    const tapes = $$('.tape__track').map((track) => {
      const items = Array.from(track.children);
      const setWidth = track.scrollWidth;
      const copies = Math.max(2, Math.ceil((window.innerWidth * 1.2) / setWidth) + 1);
      for (let c = 0; c < copies; c++) items.forEach((n) => track.appendChild(n.cloneNode(true)));
      return { track, x: 0, w: setWidth, dir: Number(track.dataset.dir) || -1 };
    });
    let boost = 0;
    let scrollDir = 1;
    let visible = true;
    if (lenis) {
      lenis.on('scroll', (l) => {
        boost = Math.min(Math.abs(l.velocity) * 0.35, 12);
        if (l.direction) scrollDir = l.direction;
      });
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe($('.tapes'));
    gsap.ticker.add((time, deltaTime) => {
      if (!visible) return;
      const v = (0.7 + boost) * (deltaTime / 16.67);
      boost *= 0.94;
      tapes.forEach((t) => {
        t.x += v * t.dir * scrollDir;
        if (t.x <= -t.w) t.x += t.w;
        if (t.x > 0) t.x -= t.w;
        t.track.style.transform = `translate3d(${t.x.toFixed(2)}px,0,0)`;
      });
    });
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    // Big titles: line-by-line mask reveal
    if (hasSplit) {
      $$('[data-split]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines', mask: 'lines', autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: 115, duration: 1.25, stagger: 0.1, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          }),
        });
      });

      // About statement: words light up as you scroll. Word spans read fine in
      // screen readers, so no ARIA rewrite (aria-label is not allowed on <p>).
      // The start opacity keeps unread words at 3:1 contrast or better.
      const statement = $('#statement');
      if (statement) {
        SplitText.create(statement, {
          type: 'words', autoSplit: true, aria: 'none',
          onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.4 }, {
            opacity: 1, stagger: 0.1, ease: 'none',
            scrollTrigger: { trigger: statement, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 },
          }),
        });
      }
    }

    // Cards and blocks: staggered fade-up in batches
    const blocks = $$('[data-reveal]');
    gsap.set(blocks, { autoAlpha: 0, y: 44 });
    ScrollTrigger.batch(blocks, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        // After a jump (hash link, restored scroll) a batch can hold dozens of
        // blocks: show the ones already scrolled past at once, animate the rest quickly.
        const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
        const visible = batch.filter((el) => !passed.includes(el));
        if (passed.length) gsap.set(passed, { autoAlpha: 1, y: 0, overwrite: true });
        if (visible.length) {
          gsap.to(visible, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: Math.min(0.08, 0.5 / visible.length), overwrite: true });
        }
      },
    });

    // Counters
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const obj = { v: 0 };
      el.textContent = (0).toFixed(dec);
      gsap.to(obj, {
        v: end,
        duration: parseFloat(el.dataset.dur || '2'),
        ease: el.dataset.ease || 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = obj.v.toFixed(dec); },
      });
    });

    // 35s vs 1s race
    const race = $('.race');
    if (race) {
      const [slow, fast] = $$('.race__bar i', race);
      gsap.set([slow, fast], { scaleX: 0 });
      ScrollTrigger.create({
        trigger: race, start: 'top 92%', once: true,
        onEnter: () => {
          gsap.to(fast, { scaleX: 1, duration: 0.35, ease: 'power2.out' });
          gsap.to(slow, { scaleX: 1, duration: 3.4, ease: 'none' });
        },
      });
    }

    // Experience timeline: the line fills as you read
    const timeline = $('#timeline');
    if (timeline) {
      gsap.to('.timeline__fill', {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: timeline, start: 'top 62%', end: 'bottom 62%', scrub: 0.5 },
      });
      $$('.job', timeline).forEach((job) => {
        ScrollTrigger.create({
          trigger: job, start: 'top 62%',
          onEnter: () => job.classList.add('is-active'),
          onLeaveBack: () => job.classList.remove('is-active'),
        });
      });
    }

    // Footer wordmark drifts up
    gsap.fromTo('.footer__mark', { yPercent: 35 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  }

  /* ---------- Project card visuals (run only while on screen) ---------- */
  function whileVisible(el, tl) {
    ScrollTrigger.create({
      trigger: el, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
    });
  }
  function initProjectVisuals() {
    const pipe = $('[data-pipe]');
    if (pipe) {
      const stages = $$('.pipe__stage', pipe);
      const logs = $$('.pipe__log span', pipe);
      const packet = $('.pipe__packet', pipe);
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
      tl.call(() => { stages.forEach((s) => s.classList.remove('is-on')); logs.forEach((l) => l.classList.remove('is-on')); }, null, 0);
      tl.fromTo(packet, { left: '0%' }, { left: '100%', duration: 4, ease: 'none' }, 0);
      stages.forEach((s, i) => tl.call(() => s.classList.add('is-on'), null, i * (4 / (stages.length - 1))));
      logs.forEach((l, i) => tl.call(() => l.classList.add('is-on'), null, 1.1 + i * 0.95));
      tl.to({}, { duration: 1.4 });
      whileVisible(pipe, tl);
    }

    $$('[data-typeout]').forEach((box) => {
      const lines = $$(':scope > span', box);
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
      tl.set(lines, { autoAlpha: 0, x: -6 });
      lines.forEach((l, i) => tl.to(l, { autoAlpha: 1, x: 0, duration: 0.3, ease: 'power2.out' }, 0.3 + i * 0.5));
      tl.to(lines, { autoAlpha: 0, duration: 0.4, ease: 'power1.in' }, `+=${2.6}`);
      whileVisible(box, tl);
    });

    const flow = $('[data-flow]');
    if (flow) {
      // Light every step and arrow up to the current step, in DOM (process) order.
      const items = $$('li', flow);
      const stepAt = items.map((li, k) => (li.classList.contains('flow__step') ? k : -1)).filter((k) => k >= 0);
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
      stepAt.forEach((k, i) => tl.call(() => items.forEach((x, j) => x.classList.toggle('is-on', j <= k)), null, i * 0.7));
      tl.call(() => items.forEach((x) => x.classList.remove('is-on')), null, stepAt.length * 0.7 + 1.4);
      whileVisible(flow, tl);
    }
  }

  /* ---------- Start ---------- */
  const fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, sleep(900)])
    : Promise.resolve();

  // Start the boot animation first, then set up the rest in small tasks so
  // no single task blocks the main thread for long.
  const nextTask = () => new Promise((r) => setTimeout(r, 0));
  fontsReady.then(async () => {
    const booted = runBoot();
    await nextTask(); initTapes();
    await nextTask(); initReveals();
    await nextTask(); initProjectVisuals();
    return booted;
  }).then(() => {
    heroIntro();
    startRotator();
    ScrollTrigger.refresh();
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
