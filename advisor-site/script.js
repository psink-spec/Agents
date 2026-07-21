/* Progressive enhancement only — the page is fully usable without this file. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Scroll progress bar ---- */
  var progressEl = document.querySelector(".progress");
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    if (progressEl && max > 0) {
      progressEl.style.setProperty("--scroll", String(doc.scrollTop / max));
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Scroll reveals ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Animated counters (skips [replace] placeholders gracefully) ---- */
  document.querySelectorAll(".count").forEach(function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target)) return; /* still a [replace: …] slot — leave text as-is */
    el.textContent = "0";
    var animate = function () {
      if (reducedMotion.matches) { el.textContent = String(target); return; }
      var start = null;
      var duration = 1400;
      function tick(ts) {
        if (start === null) start = ts;
        var t = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      var seen = false;
      new IntersectionObserver(function (entries, obs) {
        if (!seen && entries[0].isIntersecting) { seen = true; animate(); obs.disconnect(); }
      }, { threshold: 0.6 }).observe(el);
    } else {
      animate();
    }
  });

  /* ---- Hero canvas: drifting market-lines + soft aurora glow ---- */
  var canvas = document.querySelector(".hero-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var dark = window.matchMedia("(prefers-color-scheme: dark)");
    var raf = null;

    function size() {
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    }

    function draw(now) {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width, h = rect.height;
      var t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      /* aurora orbs */
      var orbs = [
        { x: 0.82, y: 0.22, r: 0.5, hue: dark.matches ? "212, 169, 79" : "201, 154, 63", a: 0.14, sp: 0.11 },
        { x: 0.15, y: 0.85, r: 0.45, hue: dark.matches ? "36, 84, 120" : "14, 34, 51", a: 0.10, sp: 0.07 }
      ];
      orbs.forEach(function (o, i) {
        var ox = (o.x + Math.sin(t * o.sp + i * 2) * 0.05) * w;
        var oy = (o.y + Math.cos(t * o.sp + i) * 0.05) * h;
        var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.r * Math.max(w, h));
        g.addColorStop(0, "rgba(" + o.hue + "," + o.a + ")");
        g.addColorStop(1, "rgba(" + o.hue + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      /* three gently rising lines, like well-behaved portfolios */
      for (var l = 0; l < 3; l++) {
        ctx.beginPath();
        var alpha = 0.16 - l * 0.04;
        ctx.strokeStyle = dark.matches
          ? "rgba(212,169,79," + alpha + ")"
          : "rgba(14,34,51," + alpha + ")";
        ctx.lineWidth = 1.5;
        for (var x = 0; x <= w; x += 8) {
          var p = x / w;
          var y = h * (0.85 - p * 0.35 - l * 0.08)
            + Math.sin(p * 6 + t * (0.35 + l * 0.12) + l * 7) * h * 0.03
            + Math.sin(p * 17 + t * 0.6 + l * 3) * h * 0.012;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    function loop(now) { draw(now); raf = requestAnimationFrame(loop); }

    function start() {
      size();
      if (reducedMotion.matches) { draw(0); return; } /* static frame, no animation */
      if (raf === null) raf = requestAnimationFrame(loop);
    }
    function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

    start();
    window.addEventListener("resize", function () { size(); if (reducedMotion.matches) draw(0); });
    reducedMotion.addEventListener("change", function () { stop(); start(); });
    dark.addEventListener("change", function () { if (reducedMotion.matches) draw(0); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  }

  /* ---- Live availability from assets/status.json ---- */
  fetch("assets/status.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.booking) return;
      document.querySelectorAll("[data-status-month]").forEach(function (el) {
        el.textContent = data.booking;
      });
      if (data.open === false) {
        document.querySelectorAll("[data-status] .dot").forEach(function (el) {
          el.style.background = "var(--ink-soft)";
        });
      }
    })
    .catch(function () { /* static fallback text stands */ });

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
    if (input.type === "tel" && value && !/^[\d\s()+.-]{7,}$/.test(value)) {
      return setError(input, "That doesn't look like a phone number.");
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

    /* [replace: remove this block once the form action posts to a real endpoint] */
    event.preventDefault();
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.setAttribute("tabindex", "-1");
    confirmBox.focus();
  });
})();
