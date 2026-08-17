(() => {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const progressBar = document.getElementById("progress-bar");
  const counter = document.getElementById("slide-counter");
  const live = document.getElementById("sr-live");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnOverview = document.getElementById("btn-overview");
  const btnHelp = document.getElementById("btn-help");
  const overview = document.getElementById("overview");
  const overviewGrid = document.getElementById("overview-grid");
  const overviewClose = document.getElementById("overview-close");
  const help = document.getElementById("help");
  const helpClose = document.getElementById("help-close");

  let index = 0;
  let overviewOpen = false;
  let helpOpen = false;

  function parseHash() {
    const m = location.hash.match(/^#slide-(\d+)$/);
    if (!m) return 0;
    const n = parseInt(m[1], 10) - 1;
    return Number.isFinite(n) ? Math.max(0, Math.min(total - 1, n)) : 0;
  }

  function titleOf(el) {
    const h = el.querySelector("h1, h2");
    return h ? h.textContent.trim() : el.getAttribute("aria-label") || "Slide";
  }

  function buildOverview() {
    overviewGrid.innerHTML = "";
    slides.forEach((slide, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "overview__item";
      btn.dataset.index = String(i);
      btn.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span><span class="title"></span>`;
      btn.querySelector(".title").textContent = titleOf(slide);
      btn.addEventListener("click", () => {
        goTo(i);
        closeOverview();
      });
      overviewGrid.appendChild(btn);
    });
  }

  function updateChrome() {
    counter.textContent = `${index + 1} / ${total}`;
    progressBar.style.width = `${((index + 1) / total) * 100}%`;
    btnPrev.disabled = index === 0;
    btnNext.disabled = index === total - 1;
    live.textContent = `Slide ${index + 1} trên ${total}: ${titleOf(slides[index])}`;

    overviewGrid.querySelectorAll(".overview__item").forEach((el, i) => {
      el.classList.toggle("is-current", i === index);
    });
  }

  function pauseAllVideos(exceptSlide) {
    document.querySelectorAll("video.demo-video").forEach((v) => {
      if (exceptSlide && exceptSlide.contains(v)) return;
      try {
        v.pause();
      } catch (_) {
        /* ignore */
      }
    });
  }

  function goTo(i, { pushHash = true } = {}) {
    const next = Math.max(0, Math.min(total - 1, i));
    slides.forEach((s, j) => s.classList.toggle("is-active", j === next));
    index = next;
    slides[index].scrollTop = 0;
    pauseAllVideos(slides[index]);
    if (pushHash) {
      history.replaceState(null, "", `#slide-${index + 1}`);
    }
    updateChrome();
  }

  function next() {
    if (index < total - 1) goTo(index + 1);
  }

  function prev() {
    if (index > 0) goTo(index - 1);
  }

  function openOverview() {
    overviewOpen = true;
    overview.classList.add("is-open");
    overview.setAttribute("aria-hidden", "false");
    updateChrome();
    overviewClose.focus();
  }

  function closeOverview() {
    overviewOpen = false;
    overview.classList.remove("is-open");
    overview.setAttribute("aria-hidden", "true");
    btnOverview.focus();
  }

  function toggleOverview() {
    if (helpOpen) closeHelp();
    overviewOpen ? closeOverview() : openOverview();
  }

  function openHelp() {
    helpOpen = true;
    help.classList.add("is-open");
    help.setAttribute("aria-hidden", "false");
    helpClose.focus();
  }

  function closeHelp() {
    helpOpen = false;
    help.classList.remove("is-open");
    help.setAttribute("aria-hidden", "true");
    btnHelp.focus();
  }

  function toggleHelp() {
    if (overviewOpen) closeOverview();
    helpOpen ? closeHelp() : openHelp();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function onKey(e) {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "VIDEO" || tag === "SELECT") return;

    if (e.key === "?" || (e.shiftKey && e.key === "/")) {
      e.preventDefault();
      toggleHelp();
      return;
    }

    if (e.key === "Escape") {
      if (helpOpen) {
        e.preventDefault();
        closeHelp();
        return;
      }
      if (overviewOpen) {
        e.preventDefault();
        closeOverview();
        return;
      }
    }

    if (e.key === "o" || e.key === "O") {
      e.preventDefault();
      toggleOverview();
      return;
    }

    if (helpOpen || overviewOpen) {
      if (overviewOpen && (e.key === "Enter" || e.key === " ")) return;
      if (["ArrowRight", "ArrowLeft", " ", "PageDown", "PageUp"].includes(e.key)) {
        return;
      }
    }

    switch (e.key) {
      case "ArrowRight":
      case "PageDown":
      case " ":
        e.preventDefault();
        next();
        break;
      case "ArrowLeft":
      case "PageUp":
      case "Backspace":
        e.preventDefault();
        prev();
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(total - 1);
        break;
      case "f":
      case "F":
        e.preventDefault();
        toggleFullscreen();
        break;
      case "p":
      case "P":
        document.body.classList.toggle("show-notes");
        break;
      default:
        break;
    }
  }

  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);
  btnOverview.addEventListener("click", toggleOverview);
  btnHelp.addEventListener("click", toggleHelp);
  overviewClose.addEventListener("click", closeOverview);
  helpClose.addEventListener("click", closeHelp);

  help.addEventListener("click", (e) => {
    if (e.target === help) closeHelp();
  });

  window.addEventListener("hashchange", () => {
    goTo(parseHash(), { pushHash: false });
  });

  document.addEventListener("keydown", onKey);

  buildOverview();
  goTo(parseHash(), { pushHash: false });
  if (!location.hash) {
    history.replaceState(null, "", "#slide-1");
  }
})();
