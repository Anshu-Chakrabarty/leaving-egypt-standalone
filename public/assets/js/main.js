/* ==========================================================================
   Leaving Egypt — Site behavior
   Vanilla JS. Progressive enhancement only: the site is fully usable with
   JavaScript disabled (nav links resolve, forms POST to FormSubmit directly).
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Inject config-driven links (email, social, phone) ---------- */
  var email = CONFIG.activeEmail || "sunbirdsrvresortvillage@gmail.com";
  document.querySelectorAll("[data-email-link]").forEach(function (a) {
    a.href = "mailto:" + email;
    if (a.hasAttribute("data-email-text")) a.textContent = email;
  });

  document.querySelectorAll("[data-social]").forEach(function (a) {
    var key = a.getAttribute("data-social");
    var url = CONFIG.social ? CONFIG.social[key] : null;
    if (!url || url.indexOf("#") === 0) {
      // No confirmed link yet — remove the placeholder icon rather than link to nowhere.
      a.parentNode && a.parentNode.removeChild(a);
    } else {
      a.href = url;
    }
  });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    var closeNav = function () {
      toggle.setAttribute("aria-expanded", "false");
      nav.setAttribute("data-open", "false");
    };
    var openNav = function () {
      toggle.setAttribute("aria-expanded", "true");
      nav.setAttribute("data-open", "true");
    };
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeNav() : openNav();
    });
    // Close on link click (mobile)
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    // Close on Escape / resize to desktop
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---------- Accordion (FAQ) ---------- */
  document.querySelectorAll(".accordion__trigger").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(!expanded));
      if (panel) {
        if (expanded) {
          panel.style.maxHeight = null;
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      }
    });
  });
  // Keep open panels sized correctly on resize
  window.addEventListener("resize", function () {
    document.querySelectorAll('.accordion__trigger[aria-expanded="true"]').forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
    });
  });

  /* ---------- Scroll reveal ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Forms: validation + AJAX submission ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(field, message) {
    var input = field.querySelector("input, select, textarea");
    var errorEl = field.querySelector(".field__error");
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
    return !message;
  }

  function validateField(field) {
    var input = field.querySelector("input, select, textarea");
    if (!input) return true;
    var val = (input.value || "").trim();

    if (input.type === "checkbox") {
      if (input.required && !input.checked) {
        var lbl = field.querySelector("label");
        return setError(field, "Please check this box to continue.");
      }
      return setError(field, "");
    }
    if (input.required && !val) {
      return setError(field, "This field is required.");
    }
    if (input.type === "email" && val && !EMAIL_RE.test(val)) {
      return setError(field, "Please enter a valid email address.");
    }
    return setError(field, "");
  }

  document.querySelectorAll("form[data-enhanced]").forEach(function (form) {
    // Populate the AJAX endpoint from config (keeps the source of truth in site-config.js).
    if (CONFIG.formActionAjax) form.setAttribute("data-ajax-action", CONFIG.formActionAjax);

    // Stamp the current page URL for context in the email.
    var pageField = form.querySelector('input[name="_page_url"], input[name="page_url"]');
    if (pageField) pageField.value = window.location.href;

    var fields = Array.prototype.slice.call(form.querySelectorAll(".field, .checkbox-field"));
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');

    // Live-clear errors as the user corrects them
    fields.forEach(function (field) {
      var input = field.querySelector("input, select, textarea");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(field); });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      // Honeypot: if filled, silently drop.
      var honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) { e.preventDefault(); return; }

      var valid = true;
      fields.forEach(function (field) { if (!validateField(field)) valid = false; });

      if (!valid) {
        e.preventDefault();
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        if (status) {
          status.setAttribute("data-state", "error");
          status.textContent = "Please fix the highlighted fields and try again.";
        }
        return;
      }

      // If fetch is unavailable, let the browser POST to the standard endpoint.
      if (!("fetch" in window)) return;

      e.preventDefault();
      var action = form.getAttribute("data-ajax-action") || form.getAttribute("action");

      if (submitBtn) submitBtn.setAttribute("aria-busy", "true");
      if (status) { status.removeAttribute("data-state"); status.textContent = ""; }

      var data = new FormData(form);

      fetch(action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Bad response");
          return res.json();
        })
        .then(function () {
          form.reset();
          var next = form.getAttribute("data-next") || "/thank-you";
          window.location.href = next;
        })
        .catch(function () {
          if (submitBtn) submitBtn.removeAttribute("aria-busy");
          if (status) {
            status.setAttribute("data-state", "error");
            status.textContent =
              "Something went wrong sending your message. Please try again, or email us directly at " +
              email + ".";
          }
        });
    });
  });
})();
