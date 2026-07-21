/* Progressive enhancement only — the page reads fine without this file. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var darkMq = window.matchMedia("(prefers-color-scheme: dark)");
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : darkMq.matches;
  }

  /* ---- Kinetic word-split for giant headlines ---- */
  function splitWords(el) {
    (function walk(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    })(el);
    Array.prototype.forEach.call(el.querySelectorAll(".w"), function (w, i) {
      w.style.setProperty("--i", String(i));
    });
  }
  document.querySelectorAll(".giant").forEach(splitWords);
  var heroH = document.getElementById("hero-h");
  if (heroH) requestAnimationFrame(function () { requestAnimationFrame(function () { heroH.classList.add("is-visible"); }); });

  /* ---- Scroll progress + hero parallax ---- */
  var progressEl = document.querySelector(".progress");
  var heroInner = document.querySelector(".hero .scene-inner");
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (progressEl && max > 0) progressEl.style.setProperty("--scroll", String(doc.scrollTop / max));
    if (heroInner && !reducedMotion.matches) {
      var y = doc.scrollTop;
      var vh = window.innerHeight || 1;
      heroInner.style.transform = "translateY(" + y * 0.22 + "px)";
      heroInner.style.opacity = String(Math.max(1 - y / (vh * 0.9), 0));
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Magnetic buttons (fine pointers only) ---- */
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".button, .nav-cta").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        if (reducedMotion.matches) return;
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / r.width;
        var dy = (e.clientY - r.top - r.height / 2) / r.height;
        btn.style.transform = "translate(" + (dx * 10).toFixed(1) + "px," + (dy * 7).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---- Counters (placeholder [replace] values are left untouched) ---- */
  document.querySelectorAll(".count").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return;
    el.textContent = "0";
    var animate = function () {
      if (reducedMotion.matches) { el.textContent = String(target); return; }
      var start = null, duration = 1600;
      (function tick(ts) {
        if (start === null) start = ts || performance.now();
        var t = Math.min(((ts || performance.now()) - start) / duration, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      })(performance.now());
    };
    if ("IntersectionObserver" in window) {
      var seen = false;
      new IntersectionObserver(function (entries, obs) {
        if (!seen && entries[0].isIntersecting) { seen = true; animate(); obs.disconnect(); }
      }, { threshold: 0.5 }).observe(el);
    } else animate();
  });

  /* ---- Canvas scenes: one rAF loop drives every .fx canvas ---- */
  var canvases = [];

  function setupCanvas(canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return null;
    var state = { canvas: canvas, ctx: ctx, kind: canvas.getAttribute("data-fx"), w: 0, h: 0, particles: null };
    state.size = function () {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.w = rect.width; state.h = rect.height;
      state.particles = null; /* re-seed on resize */
    };
    state.size();
    return state;
  }

  /* golden particle flow-field */
  function drawField(s, t) {
    var ctx = s.ctx, w = s.w, h = s.h;
    if (!s.particles) {
      s.particles = [];
      var n = Math.min(240, Math.round(w * h / 6500));
      for (var i = 0; i < n; i++) {
        s.particles.push({ x: Math.random() * w, y: Math.random() * h, v: 0.35 + Math.random() * 0.8, r: 0.6 + Math.random() * 1.8 });
      }
    }
    ctx.clearRect(0, 0, w, h);
    /* aurora wash */
    var g = ctx.createRadialGradient(w * 0.78, h * 0.25, 0, w * 0.78, h * 0.25, Math.max(w, h) * 0.7);
    g.addColorStop(0, isDark() ? "rgba(212,169,79,0.13)" : "rgba(201,154,63,0.14)");
    g.addColorStop(1, "rgba(201,154,63,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    var g2 = ctx.createRadialGradient(w * 0.12, h * 0.85, 0, w * 0.12, h * 0.85, Math.max(w, h) * 0.6);
    g2.addColorStop(0, isDark() ? "rgba(36,84,120,0.14)" : "rgba(14,34,51,0.10)");
    g2.addColorStop(1, "rgba(14,34,51,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
    /* particles drifting along a curl-ish field */
    ctx.fillStyle = isDark() ? "rgba(229,195,122,0.75)" : "rgba(138,101,34,0.55)";
    s.particles.forEach(function (p) {
      var a = Math.sin(p.y * 0.006 + t * 0.25) + Math.cos(p.x * 0.004 - t * 0.18);
      p.x += Math.cos(a) * p.v;
      p.y += Math.sin(a) * p.v * 0.6 - 0.08;
      if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5;
      if (p.y < -5) p.y = h + 5; if (p.y > h + 5) p.y = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    });
  }

  /* chart that draws itself as its scene scrolls through the viewport */
  function drawChart(s, t) {
    var ctx = s.ctx, w = s.w, h = s.h;
    var rect = s.canvas.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height * 0.6), 0), 1);
    if (reducedMotion.matches) progress = 1;
    ctx.clearRect(0, 0, w, h);
    function y(p, l) {
      return h * (0.88 - p * 0.55 - l * 0.05)
        + Math.sin(p * 7 + l * 5) * h * 0.045
        + Math.sin(p * 19 + l * 2) * h * 0.015;
    }
    for (var l = 0; l < 2; l++) {
      var end = progress * (l === 0 ? 1 : 0.92);
      /* area fill under the front line */
      if (l === 0 && end > 0.02) {
        ctx.beginPath();
        ctx.moveTo(0, y(0, 0));
        for (var px = 0; px <= end; px += 0.01) ctx.lineTo(px * w, y(px, 0));
        ctx.lineTo(end * w, h); ctx.lineTo(0, h); ctx.closePath();
        var fg = ctx.createLinearGradient(0, 0, 0, h);
        fg.addColorStop(0, isDark() ? "rgba(212,169,79,0.10)" : "rgba(138,101,34,0.08)");
        fg.addColorStop(1, "rgba(138,101,34,0)");
        ctx.fillStyle = fg;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.strokeStyle = l === 0
        ? (isDark() ? "rgba(229,195,122,0.9)" : "rgba(138,101,34,0.8)")
        : (isDark() ? "rgba(163,168,178,0.25)" : "rgba(14,34,51,0.18)");
      ctx.lineWidth = l === 0 ? 2.5 : 1.25;
      for (var p = 0; p <= end; p += 0.005) {
        var xx = p * w, yy = y(p, l);
        if (p === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      /* glowing endpoint on the front line */
      if (l === 0 && end > 0.01) {
        var ex = end * w, ey = y(end, 0);
        var glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 26);
        glow.addColorStop(0, isDark() ? "rgba(229,195,122,0.75)" : "rgba(201,154,63,0.6)");
        glow.addColorStop(1, "rgba(201,154,63,0)");
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(ex, ey, 26, 0, 6.2832); ctx.fill();
        ctx.fillStyle = isDark() ? "#e5c37a" : "#8a6522";
        ctx.beginPath(); ctx.arc(ex, ey, 4, 0, 6.2832); ctx.fill();
      }
    }
  }

  /* flowing silk — stands in for 4K footage when the video is missing */
  function drawSilk(s, t) {
    var ctx = s.ctx, w = s.w, h = s.h;
    ctx.fillStyle = "#0e2233";
    ctx.fillRect(0, 0, w, h);
    for (var l = 0; l < 14; l++) {
      ctx.beginPath();
      var alpha = 0.05 + (l % 4) * 0.02;
      ctx.strokeStyle = l % 3 === 0 ? "rgba(229,195,122," + alpha + ")" : "rgba(120,160,200," + alpha + ")";
      ctx.lineWidth = 40;
      for (var x = -60; x <= w + 60; x += 14) {
        var p = x / w;
        var yy = h * (0.15 + l * 0.06)
          + Math.sin(p * 4 + t * 0.3 + l * 1.7) * h * 0.09
          + Math.sin(p * 9 - t * 0.22 + l) * h * 0.035;
        if (x === -60) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  var draws = { field: drawField, chart: drawChart, silk: drawSilk };
  document.querySelectorAll(".fx").forEach(function (c) {
    if (c.hidden) return; /* fallback canvases register when activated */
    if (!c.getAttribute("data-fx")) return; /* WebGL canvases must never get a 2d context */
    var s = setupCanvas(c);
    if (s && draws[s.kind]) canvases.push(s);
  });

  var raf = null;
  function frame(now) {
    var t = now / 1000;
    canvases.forEach(function (s) {
      if (s.canvas.hidden) return;
      var r = s.canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; /* offscreen: skip */
      draws[s.kind](s, t);
    });
    raf = requestAnimationFrame(frame);
  }
  function startFx() {
    if (reducedMotion.matches) { canvases.forEach(function (s) { draws[s.kind](s, 0); }); return; }
    if (raf === null) raf = requestAnimationFrame(frame);
  }
  function stopFx() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  startFx();

  window.addEventListener("resize", function () {
    canvases.forEach(function (s) { s.size(); });
    if (reducedMotion.matches) canvases.forEach(function (s) { draws[s.kind](s, 0); });
  });
  reducedMotion.addEventListener("change", function () { stopFx(); startFx(); });
  darkMq.addEventListener("change", function () { if (reducedMotion.matches) canvases.forEach(function (s) { draws[s.kind](s, 0); }); });
  new MutationObserver(function () { if (reducedMotion.matches) canvases.forEach(function (s) { draws[s.kind](s, 0); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stopFx(); else startFx(); });

  /* ---- Video scenes: real footage when present, canvas art when not ---- */
  document.querySelectorAll("video[data-video-scene]").forEach(function (video) {
    var scene = video.closest(".scene");
    var fallback = scene ? scene.querySelector("canvas.fx") : null;
    function useFallback() {
      if (video.hidden) return;
      video.hidden = true;
      if (scene) scene.classList.remove("has-video");
      if (fallback && fallback.hidden) {
        fallback.hidden = false;
        var s = setupCanvas(fallback);
        if (s && draws[s.kind]) {
          canvases.push(s);
          if (reducedMotion.matches) draws[s.kind](s, 0);
        }
      }
    }
    function useVideo() {
      /* undo a hasty fallback: NETWORK_NO_SOURCE is also reported while source
         selection is still pending, so loadeddata is the final word */
      video.hidden = false;
      if (fallback) fallback.hidden = true;
      if (scene) scene.classList.add("has-video");
    }
    video.addEventListener("loadeddata", useVideo);
    video.addEventListener("error", useFallback);
    /* when every <source> fails, the error event fires on the LAST one */
    var sources = video.querySelectorAll("source");
    if (sources.length) sources[sources.length - 1].addEventListener("error", useFallback);
    /* the failure may have fired during parsing, before this deferred script ran —
       and a video with no <source> at all never fires an error */
    if (!sources.length || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) useFallback();
    if (video.readyState >= 2) useVideo();
    if (reducedMotion.matches) video.pause();
  });

  /* ---- Explore dropdown: close on outside click / Escape ---- */
  var menu = document.querySelector("[data-menu]");
  if (menu) {
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
  }

  /* ---- 3D particle terrain (Three.js), behind the numbers ---- */
  var glCanvas = document.getElementById("gl-terrain");
  if (glCanvas && window.THREE && window.WebGLRenderingContext) {
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: false, powerPreference: "low-power" });
      var glScene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
      camera.position.set(0, 19, 54);
      camera.lookAt(0, 0, 0);

      var COLS = 160, ROWS = 60, SPACING = 1.1;
      function buildLayer(color, size, opacity, phase) {
        var positions = new Float32Array(COLS * ROWS * 3);
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        var mat = new THREE.PointsMaterial({
          color: color, size: size, transparent: true, opacity: opacity,
          sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        var points = new THREE.Points(geo, mat);
        points.userData.phase = phase;
        glScene.add(points);
        return points;
      }
      var gold = buildLayer(0xd4a94f, 0.38, 0.65, 0);
      var steel = buildLayer(0x4a7aa8, 0.28, 0.35, 2.1);

      function waveY(x, z, t, phase) {
        return Math.sin(x * 0.28 + t * 0.7 + phase) * 1.6
          + Math.cos(z * 0.22 + t * 0.45 + phase) * 1.9
          + Math.sin((x + z) * 0.11 + t * 0.3) * 1.1;
      }
      function updateLayer(layer, t, lift) {
        var pos = layer.geometry.attributes.position.array;
        var i = 0;
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            var x = (c - COLS / 2) * SPACING;
            var z = (r - ROWS / 2) * SPACING;
            pos[i++] = x;
            pos[i++] = waveY(x, z, t, layer.userData.phase) + lift;
            pos[i++] = z;
          }
        }
        layer.geometry.attributes.position.needsUpdate = true;
      }

      var pointerX = 0;
      if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener("mousemove", function (e) {
          pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
        }, { passive: true });
      }

      function sizeGL() {
        var rect = glCanvas.getBoundingClientRect();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(rect.width, rect.height, false);
        camera.aspect = rect.width / Math.max(rect.height, 1);
        camera.updateProjectionMatrix();
      }
      sizeGL();
      window.addEventListener("resize", sizeGL);

      var glRaf = null;
      function glFrame(now) {
        var t = now / 1000;
        updateLayer(gold, t, -2);
        updateLayer(steel, t, -4.5);
        camera.position.x += (pointerX * 6 - camera.position.x) * 0.03;
        camera.position.y = 19 + Math.sin(t * 0.12) * 1.5;
        camera.lookAt(0, 0, 0);
        renderer.render(glScene, camera);
        glRaf = requestAnimationFrame(glFrame);
      }
      function glStart() {
        if (reducedMotion.matches) { updateLayer(gold, 0, -2); updateLayer(steel, 0, -4.5); renderer.render(glScene, camera); return; }
        if (glRaf === null) glRaf = requestAnimationFrame(glFrame);
      }
      function glStop() { if (glRaf !== null) { cancelAnimationFrame(glRaf); glRaf = null; } }

      /* run only while the scene is on screen */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) glStart(); else glStop();
        }, { threshold: 0.05 }).observe(glCanvas);
      } else {
        glStart();
      }
      reducedMotion.addEventListener("change", function () { glStop(); glStart(); });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) glStop();
        else if (glCanvas.getBoundingClientRect().bottom > 0) glStart();
      });
    } catch (e) { /* WebGL unavailable: the scene simply stays flat */ }
  }

  /* ---- Live availability ---- */
  fetch("assets/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.booking) return;
      document.querySelectorAll("[data-status-month]").forEach(function (el) { el.textContent = data.booking; });
      if (data.open === false) {
        document.querySelectorAll("[data-status] .dot").forEach(function (el) { el.style.background = "var(--ink-soft)"; });
      }
    })
    .catch(function () { /* static fallback stands */ });

  /* ---- Footer year ---- */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- Two-step callback form ---- */
  var form = document.querySelector(".callback");
  var confirmBox = document.querySelector(".confirm");
  if (!form || !confirmBox) return;

  function setError(input, message) {
    var err = document.getElementById(input.id + "-err");
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (err) err.textContent = message;
    return !message;
  }
  function validateField(input) {
    var value = input.value.trim();
    if (input.required && !value) return setError(input, "Required.");
    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return setError(input, "That doesn't look like an email.");
    }
    return setError(input, "");
  }
  form.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validateField(input);
    });
  });
  form.addEventListener("submit", function (event) {
    var inputs = Array.prototype.slice.call(form.querySelectorAll("input"));
    var allValid = inputs.map(validateField).every(Boolean);
    if (!allValid) {
      event.preventDefault();
      inputs.find(function (i) { return i.getAttribute("aria-invalid") === "true"; }).focus();
      return;
    }
    /* [replace: remove once the form action posts to a real endpoint] */
    event.preventDefault();
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.setAttribute("tabindex", "-1");
    confirmBox.focus();
  });
})();
