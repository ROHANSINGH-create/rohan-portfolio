(function () {
  "use strict";

  var nav = document.getElementById("nav");
  var toggle = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");

  function closeMenu() {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }

  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  links.addEventListener("click", function (event) {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener(
    "scroll",
    function () {
      nav.classList.toggle("is-stuck", window.scrollY > 8);
    },
    { passive: true }
  );

  var reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );

    reveals.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 4, 3) * 60 + "ms";
      observer.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  var sections = Array.prototype.slice
    .call(document.querySelectorAll("main section[id]"))
    .filter(function (s) {
      return s.id !== "top";
    });

  var navAnchors = {};
  links.querySelectorAll("a[href^='#']").forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    if (!navAnchors[id]) navAnchors[id] = [];
    navAnchors[id].push(a);
  });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var anchors = navAnchors[entry.target.id] || [];
          anchors.forEach(function (a) {
            a.classList.toggle("is-active", entry.isIntersecting);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach(function (s) {
      spy.observe(s);
    });
  }

  function legacyCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(field);
    return ok;
  }

  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var value = btn.dataset.copy;
      var label = btn.dataset.label || "Copy";

      function done() {
        btn.textContent = "Copied";
        btn.classList.add("is-copied");
        setTimeout(function () {
          btn.textContent = label;
          btn.classList.remove("is-copied");
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {
          if (legacyCopy(value)) done();
        });
      } else if (legacyCopy(value)) {
        done();
      }
    });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
