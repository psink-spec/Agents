/* Progressive enhancement only — the page is fully usable without this file. */
(function () {
  "use strict";

  /* ---- Live availability: fetch assets/status.json, else keep static text ---- */
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
    .catch(function () { /* offline or missing file: static fallback stands */ });

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
    if (!value) return setError(input, "Required.");
    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
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

    /* [replace: remove this block once the form action posts to a real endpoint] */
    event.preventDefault();
    form.hidden = true;
    confirmBox.hidden = false;
    confirmBox.setAttribute("tabindex", "-1");
    confirmBox.focus();
  });
})();
