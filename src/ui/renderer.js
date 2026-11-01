/**
 * UI Renderer — Modern Cyber-Minimalist Edition ("Time Pressure")
 * - Custom crisp SVG vector icons for Dog, Fire, Diamond, Star, Bomb, and Checkmark
 * - 3D glossy dome arcade buttons with concentric tech rings matching the Start screen
 * - Sleek HUD perimeter countdown bar running around the screen edges
 * - Zero canvas/blur filter overhead for instant <0.1ms button press response
 */
(function (global) {
  const { t, AnswerValidator } = global.PressGame;

  /**
   * Crisp, modern minimalist SVG vector icons replacing OS emojis
   */
  const VECTOR_ICONS = {
    dog: `
      <svg class="stim-svg stim-dog-svg" viewBox="0 0 64 64" fill="none" aria-label="Dog">
        <!-- Geometric modern dog head -->
        <path d="M14 26L10 10L25 18H39L54 10L50 26L55 36C55 47 45 54 32 54C19 54 9 47 9 36L14 26Z" fill="#18181b" stroke="#f8fafc" stroke-width="3" stroke-linejoin="round"/>
        <!-- Inner ear accents -->
        <path d="M14 23L13 14L22 19Z" fill="#ef4444"/>
        <path d="M50 23L51 14L42 19Z" fill="#ef4444"/>
        <!-- Muzzle patch -->
        <path d="M22 36C22 31 26.5 28 32 28C37.5 28 42 31 42 36C42 43 37.5 48 32 48C26.5 48 22 43 22 36Z" fill="#f8fafc"/>
        <!-- Eyes -->
        <circle cx="23" cy="29" r="2.6" fill="#f8fafc"/>
        <circle cx="41" cy="29" r="2.6" fill="#f8fafc"/>
        <!-- Nose & mouth -->
        <polygon points="32,39 27.5,34 36.5,34" fill="#ef4444"/>
        <path d="M32 39V43M32 43L28 45M32 43L36 45" stroke="#09090b" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    `,
    cat: `
      <svg class="stim-svg stim-cat-svg" viewBox="0 0 64 64" fill="none" aria-label="Cat">
        <path d="M12 28L10 8L26 18H38L54 8L52 28C56 34 56 46 48 52C41 57 23 57 16 52C8 46 8 34 12 28Z" fill="#18181b" stroke="#f8fafc" stroke-width="3" stroke-linejoin="round"/>
        <path d="M14 22L13 12L22 17Z" fill="#a78bfa"/>
        <path d="M50 22L51 12L42 17Z" fill="#a78bfa"/>
        <circle cx="25" cy="34" r="2.6" fill="#f8fafc"/>
        <circle cx="39" cy="34" r="2.6" fill="#f8fafc"/>
        <polygon points="32,43 28,38 36,38" fill="#f472b6"/>
        <path d="M28 46C30 48 34 48 36 46M8 34H18M8 40H18M46 34H56M46 40H56" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `,
    mouse: `
      <svg class="stim-svg stim-mouse-svg" viewBox="0 0 64 64" fill="none" aria-label="Mouse">
        <circle cx="32" cy="38" r="16" fill="#18181b" stroke="#f8fafc" stroke-width="3"/>
        <circle cx="18" cy="27" r="9" fill="#18181b" stroke="#f8fafc" stroke-width="3"/>
        <circle cx="46" cy="27" r="9" fill="#18181b" stroke="#f8fafc" stroke-width="3"/>
        <circle cx="18" cy="27" r="4" fill="#f472b6"/>
        <circle cx="46" cy="27" r="4" fill="#f472b6"/>
        <circle cx="26" cy="36" r="2.4" fill="#f8fafc"/>
        <circle cx="38" cy="36" r="2.4" fill="#f8fafc"/>
        <circle cx="32" cy="43" r="3" fill="#f472b6"/>
        <path d="M26 48C29 50 35 50 38 48M6 42L14 45M6 48L14 49M58 42L50 45M58 48L50 49" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `,
    chicken: `
      <svg class="stim-svg stim-chicken-svg" viewBox="0 0 64 64" fill="none" aria-label="Chicken">
        <path d="M20 40C20 26 30 18 40 18C50 18 56 26 56 36C56 48 47 54 36 54C25 54 20 48 20 40Z" fill="#facc15" stroke="#f8fafc" stroke-width="3" stroke-linejoin="round"/>
        <path d="M40 18C40 12 44 8 50 10C54 12 54 18 50 20Z" fill="#ef4444" stroke="#f8fafc" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M50 10C50 6 54 4 57 7" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="44" cy="30" r="2.6" fill="#09090b"/>
        <polygon points="55,33 63,37 55,41" fill="#f97316"/>
        <path d="M26 48L22 58M38 48L38 58M48 46L52 56" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
        <path d="M20 38C12 34 10 26 16 20C18 26 22 30 26 32" fill="#facc15" stroke="#f8fafc" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `,
    lion: `
      <svg class="stim-svg stim-lion-svg" viewBox="0 0 64 64" fill="none" aria-label="Lion">
        <path d="M32 8L37 17L47 13L45 24L56 25L49 33L57 40L47 44L51 54L40 51L37 60L31 52L24 60L22 51L11 54L15 44L5 40L13 33L6 25L17 24L15 13L25 17Z" fill="#b45309" stroke="#f8fafc" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="32" cy="34" r="16" fill="#f59e0b" stroke="#f8fafc" stroke-width="2.5"/>
        <circle cx="26" cy="32" r="2.8" fill="#09090b"/>
        <circle cx="38" cy="32" r="2.8" fill="#09090b"/>
        <polygon points="32,40 28,35 36,35" fill="#09090b"/>
        <path d="M27 45C30 48 34 48 37 45" stroke="#09090b" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    `,
    bomb: `
      <svg class="stim-svg stim-bomb-svg" viewBox="0 0 64 64" fill="none" aria-label="Bomb">
        <!-- Fuse & Spark -->
        <path d="M37 18C39 12 45 10 50 13" stroke="#a1a1aa" stroke-width="3" stroke-linecap="round"/>
        <path d="M52 6L53.5 11L58.5 12.5L53.5 14L52 19L50.5 14L45.5 12.5L50.5 11L52 6Z" fill="#facc15"/>
        <!-- Bomb Cap -->
        <rect x="27" y="16" width="10" height="6" rx="1.5" fill="#71717a" stroke="#f8fafc" stroke-width="2"/>
        <!-- Bomb Sphere -->
        <circle cx="32" cy="38" r="18" fill="#18181b" stroke="#ef4444" stroke-width="3"/>
        <!-- Specular Shine -->
        <path d="M22 31A12 12 0 0 1 30 25" stroke="#f8fafc" stroke-width="2.8" stroke-linecap="round"/>
        <circle cx="32" cy="38" r="5" fill="#ef4444"/>
      </svg>
    `,
    star: `
      <svg class="stim-svg stim-unit-svg" viewBox="0 0 48 48" fill="none" aria-label="Star">
        <polygon points="24,4 29.8,16.6 43.6,18.3 33.4,27.8 36.1,41.4 24,34.7 11.9,41.4 14.6,27.8 4.4,18.3 18.2,16.6" fill="#facc15" stroke="#fef08a" stroke-width="2.2" stroke-linejoin="round"/>
        <polygon points="24,11 27.4,18.6 35.5,19.6 29.5,25.2 31.1,33.2 24,29.2 16.9,33.2 18.5,25.2 12.5,19.6 20.6,18.6" fill="#fef08a" opacity="0.45"/>
      </svg>
    `,
    gem: `
      <svg class="stim-svg stim-unit-svg" viewBox="0 0 48 48" fill="none" aria-label="Diamond">
        <polygon points="14,8 34,8 44,20 24,42 4,20" fill="#0284c7" stroke="#7dd3fc" stroke-width="2.4" stroke-linejoin="round"/>
        <polygon points="14,8 34,8 30,20 18,20" fill="#7dd3fc" opacity="0.65"/>
        <polygon points="18,20 30,20 24,42" fill="#38bdf8" opacity="0.75"/>
        <line x1="4" y1="20" x2="44" y2="20" stroke="#bae6fd" stroke-width="2"/>
      </svg>
    `,
    fire: `
      <svg class="stim-svg stim-unit-svg" viewBox="0 0 48 48" fill="none" aria-label="Fire">
        <path d="M25 4C25 4 39 14 39 27C39 36.4 32.3 43 24 43C15.7 43 9 36.4 9 27C9 20.5 13.2 14.8 16.5 12C16.5 12 15.8 17.5 19.5 19C18 12.5 25 4 25 4Z" fill="#ef4444" stroke="#fca5a5" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 21C24 21 31 26 31 32.5C31 37.2 27.9 40.5 24 40.5C20.1 40.5 17 37.2 17 32.5C17 28.8 20.2 24.5 24 21Z" fill="#facc15"/>
      </svg>
    `,
    check: `
      <svg class="btn-check-svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M7 16.5L13.2 22.5L25 10.5" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  };

  const REAL_ANIMAL_IMAGES = {
    dog: "assets/dog.jpg",
    cat: "assets/cat.jpg",
    lion: "assets/lion.jpg",
    mouse: "assets/mouse.jpg",
    chicken: "assets/chicken.jpg"
  };

  const THEME_STORAGE_KEY = "time-pressure-theme";

  const HOME_ICON = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  `;

  const UPDATE_ICON = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M3 21h18" />
    </svg>
  `;

  function renderStimulusVisual(stimKey) {
    if (REAL_ANIMAL_IMAGES[stimKey]) {
      return `
        <div class="stim-photo-frame">
          <img class="stim-photo-img" src="${REAL_ANIMAL_IMAGES[stimKey]}" alt="${stimKey}" decoding="async" />
        </div>
      `;
    }
    if (stimKey === "bomb") return VECTOR_ICONS.bomb;

    const match = stimKey.match(/^(stars|gems|fire)(\d+)$/);
    if (match) {
      const family = match[1];
      const count = parseInt(match[2], 10);
      const unitSvg =
        family === "stars"
          ? VECTOR_ICONS.star
          : family === "gems"
          ? VECTOR_ICONS.gem
          : VECTOR_ICONS.fire;
      return `<div class="stim-multi-group">${unitSvg.repeat(count)}</div>`;
    }

    return "";
  }

  class UIRenderer {
    constructor(rootElement, controller) {
      this.root = rootElement;
      this.controller = controller;
      this.lastScreen = null;
      this.lastRoundIndex = null;
      this.renderedPressCount = 0;
      this.perimeterStrokeEl = null;
      this.trayEl = null;
      this.screenEl = null;
      this.buttonGridEl = null;
      this.buttonArenaEl = null;
      this.promptTextEl = null;
      this.roundPillTextEl = null;
      this.stimuliRowEl = null;
      this._currentUrgency = null;

      if (typeof Image !== "undefined") {
        Object.values(REAL_ANIMAL_IMAGES).forEach((src) => {
          const img = new Image();
          img.src = src;
        });
      }
      this.helpOpen = false;
      this.theme = this._getInitialTheme();
      this._applyTheme(this.theme);

      this._bindGlobalEvents();
    }

    _getInitialTheme() {
      const current = document.documentElement.getAttribute("data-theme");
      if (current === "light" || current === "dark") return current;
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark") return saved;
      } catch (error) {}
      return "dark";
    }

    _applyTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.style.colorScheme = theme;
    }

    _toggleTheme() {
      const nextTheme = this.theme === "light" ? "dark" : "light";
      this._applyTheme(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {}
      this._renderStartScreen(this.controller.config.lang);
    }

    _bindGlobalEvents() {
      // Keyboard shortcuts (1..6)
      window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const { state } = this.controller;
        if (state.screen === "playing" && state.currentRound && !state.roundClearedWait) {
          const buttons = state.currentRound.buttons || [];
          const num = parseInt(e.key, 10);
          if (num >= 1 && num <= buttons.length) {
            e.preventDefault();
            const color = buttons[num - 1];
            const btn = this.root.querySelector(`.game-btn[data-color="${color}"]`);
            this._showPressedButtonImage(btn);
            this.controller.handleButtonPress(color);
          }
        }
      });

      // Close help tooltip when clicking outside on start screen
      this.root.addEventListener("click", (event) => {
        if (this.helpOpen) {
          this.helpOpen = false;
          const tooltip = this.root.querySelector(".help-tooltip");
          const hBtn = this.root.querySelector('.help-wrapper [data-action="toggle-help"]');
          if (tooltip) tooltip.classList.remove("open");
          if (hBtn) hBtn.classList.remove("active");
        }

        const homeBtn = event.target.closest?.('[data-action="return-home"]');
        if (homeBtn) {
          event.preventDefault();
          event.stopPropagation();
          this._requestHome();
        }
      });
    }

    /**
     * Switches the button to its "pressed" image state instantly with zero animation lag.
     */
    _showPressedButtonImage(btn) {
      if (!btn) return;
      btn.classList.add("is-pressed-img");
      if (btn._pressTimer) clearTimeout(btn._pressTimer);
      btn._pressTimer = setTimeout(() => {
        btn.classList.remove("is-pressed-img");
      }, 120);
    }

    updateTimer({ progressRatio }) {
      if (!this.perimeterStrokeEl) return;
      const clamped = Math.max(0, Math.min(1, progressRatio));
      const offset = 1000 * (1 - clamped);
      this.perimeterStrokeEl.style.strokeDashoffset = `${offset}`;

      if (this.controller.state.screen === "rule_intro") {
        return;
      }

      let nextUrgency = "normal";
      if (clamped <= 0.28) {
        nextUrgency = "critical";
      } else if (clamped <= 0.55) {
        nextUrgency = "warning";
      }

      if (nextUrgency !== this._currentUrgency) {
        this._currentUrgency = nextUrgency;
        this.perimeterStrokeEl.setAttribute("data-urgency", nextUrgency);
      }
    }

    render(state, config) {
      const lang = config.lang;

      if (state.screen === "start") {
        this._renderStartScreen(lang);
      } else if (state.screen === "rule_intro") {
        this._renderRuleIntroScreen(state, lang);
      } else if (state.screen === "playing") {
        this._renderPlayingScreen(state, lang);
      } else if (state.screen === "summary") {
        this._renderSummaryScreen(state, lang);
      }

      this.lastScreen = state.screen;
      this.lastRoundIndex = state.roundIndex;
    }

    _requestHome() {
      const screen = this.controller.state.screen;
      if (screen === "playing" || screen === "rule_intro") {
        this._showHomeConfirm();
        return;
      }
      this.controller.returnToStart();
    }

    _showHomeConfirm() {
      if (this.root.querySelector(".home-confirm-overlay")) return;

      const lang = this.controller.config.lang;
      this.controller.pauseRound();

      const overlay = document.createElement("div");
      overlay.className = "home-confirm-overlay";
      overlay.innerHTML = `
        <div class="home-confirm-card" role="dialog" aria-modal="true" aria-labelledby="home-confirm-title">
          <div class="home-confirm-icon">${HOME_ICON}</div>
          <h2 class="home-confirm-title" id="home-confirm-title">${t(lang, "homeConfirmTitle")}</h2>
          <p class="home-confirm-message">${t(lang, "homeConfirmMessage")}</p>
          <div class="home-confirm-actions">
            <button type="button" class="home-confirm-btn stay" data-action="cancel-home">
              ${t(lang, "homeConfirmStay")}
            </button>
            <button type="button" class="home-confirm-btn leave" data-action="confirm-home">
              ${t(lang, "homeConfirmLeave")}
            </button>
          </div>
        </div>
      `;

      const close = (leave) => {
        overlay.remove();
        if (leave) {
          this.controller.returnToStart();
        } else {
          this.controller.resumeRound();
        }
      };

      overlay.querySelector('[data-action="cancel-home"]').addEventListener("click", () => {
        close(false);
      });
      overlay.querySelector('[data-action="confirm-home"]').addEventListener("click", () => {
        close(true);
      });
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close(false);
      });

      this.root.appendChild(overlay);
    }

    _renderStartScreen(lang) {
      const tooltipItems = t(lang, "helpTooltipItems")
        .map((item) => `<li>${item}</li>`)
        .join("");
      const soundEnabled = this.controller.sound ? this.controller.sound.enabled : true;

      this.root.innerHTML = `
        <div class="screen start-screen">
          <div class="start-bg-facets" aria-hidden="true"></div>
          <svg class="perimeter-timer-svg start-perimeter-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
            <rect
              class="perimeter-track"
              x="8"
              y="8"
              width="984"
              height="984"
              rx="14"
              ry="14"
              pathLength="1000"
            />
            <rect
              class="perimeter-fill start-perimeter-loop"
              x="8"
              y="8"
              width="984"
              height="984"
              rx="14"
              ry="14"
              pathLength="1000"
            />
          </svg>
          <svg class="start-horizon-svg" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">
            <line x1="690" y1="815" x2="55" y2="965" class="horizon-laser-line" />
            <line x1="1230" y1="815" x2="1865" y2="965" class="horizon-laser-line" />
          </svg>
          <div class="corner-hazard left-hazard" aria-hidden="true">
            <span></span><span></span>
          </div>
          <div class="corner-hazard right-hazard" aria-hidden="true">
            <span></span><span></span>
          </div>

          <div class="top-minimal-bar">
            <div class="lang-switch">
              <button type="button" class="lang-pill ${lang === "vi" ? "active" : ""}" data-action="set-lang" data-lang="vi">VI</button>
              <button type="button" class="lang-pill ${lang === "en" ? "active" : ""}" data-action="set-lang" data-lang="en">EN</button>
            </div>

            <div class="top-right-actions">
              <button type="button" class="circle-icon-btn" data-action="toggle-theme" aria-label="${t(lang, this.theme === "light" ? "themeToggleToDark" : "themeToggleToLight")}" title="${t(lang, this.theme === "light" ? "themeToggleToDark" : "themeToggleToLight")}">
                ${
                  this.theme === "light"
                    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`
                    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>`
                }
              </button>

              <button type="button" class="circle-icon-btn ${soundEnabled ? "" : "muted"}" data-action="toggle-sound" aria-label="Toggle Sound">
                ${
                  soundEnabled
                    ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11 5L6 9H2v6h4l5 4V5zm4.5 7c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
                    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`
                }
              </button>

              <button type="button" class="circle-icon-btn update-icon-btn" data-action="check-update" aria-label="${t(lang, "updateBtn")}" title="${t(lang, "updateBtn")}">
                ${UPDATE_ICON}
              </button>

              <div class="help-wrapper">
                <button type="button" class="circle-icon-btn ${this.helpOpen ? "active" : ""}" data-action="toggle-help" aria-label="Info">i</button>
                <div class="help-tooltip ${this.helpOpen ? "open" : ""}" role="tooltip">
                  <div class="help-tooltip-title">${t(lang, "helpTooltipTitle")}</div>
                  <ul class="help-tooltip-list">${tooltipItems}</ul>
                </div>
              </div>
            </div>
          </div>

          <div class="start-center-stage">
            <div class="title-block">
              <h1 class="pressure-logo-title" aria-label="TIME PRESSURE">
                <span class="title-word"><span>T</span><span>I</span><span>M</span><span>E</span></span>
                <span class="title-word-gap" aria-hidden="true"></span>
                <span class="title-word"><span>P</span><span>R</span><span>E</span><span>S</span><span>S</span><span class="red-u-glyph"><svg viewBox="0 0 46 54" class="red-u-svg" aria-hidden="true"><path d="M8 10v22c0 8.5 6.2 14.5 14.5 14.5S37 40.5 37 32V12" fill="none" stroke="#e11d48" stroke-width="8.5" stroke-linecap="square"/><polygon points="37,2 27,15 45,15" fill="#ef4444"/></svg></span><span>R</span><span>E</span></span>
              </h1>
              <p class="pressure-logo-subtitle">${t(lang, "appSubtitle")}</p>
            </div>

            <div class="start-hero-row">
              <div class="start-side-callout left-callout">
                <span class="callout-vert-bar"></span>
                <div class="callout-text-wrap">
                  <span class="callout-line-white">${t(lang, "leftHintLine1")}</span>
                  <span class="callout-line-red">${t(lang, "leftHintLine2")}</span>
                </div>
              </div>

              <div class="hero-button-rig" data-action="start-game" role="button" tabindex="0" aria-label="${t(lang, "startBtn")}">
                <svg class="hero-rings-svg" viewBox="0 0 360 360" aria-hidden="true">
                  <!-- Base faint guide orbit -->
                  <circle cx="180" cy="180" r="158" fill="none" stroke="rgba(239, 68, 68, 0.14)" stroke-width="1.5" />

                  <!-- Layer 1: Outer Calibration & Segmented Arcs (rotates CCW in stepped assembly motion on hover) -->
                  <g class="rig-ring rig-ring-outer">
                    <path d="M 36 125 A 168 168 0 0 0 48 248" fill="none" stroke="rgba(239, 68, 68, 0.55)" stroke-width="2.2" stroke-linecap="round" />
                    <path d="M 324 125 A 168 168 0 0 1 312 248" fill="none" stroke="rgba(239, 68, 68, 0.55)" stroke-width="2.2" stroke-linecap="round" />
                    <path d="M 122 22 A 168 168 0 0 1 238 22" fill="none" stroke="rgba(239, 68, 68, 0.32)" stroke-width="1.8" stroke-dasharray="14 10" stroke-linecap="round" />
                    <path d="M 122 338 A 168 168 0 0 0 238 338" fill="none" stroke="rgba(239, 68, 68, 0.32)" stroke-width="1.8" stroke-dasharray="14 10" stroke-linecap="round" />
                  </g>

                  <!-- Layer 2: Primary Heavy Dual Brackets (rotates CW with mechanical lock steps on hover) -->
                  <g class="rig-ring rig-ring-mid">
                    <path d="M 54 96 A 152 152 0 0 0 54 264" fill="none" stroke="#ef4444" stroke-width="3.8" stroke-linecap="round" />
                    <path d="M 306 96 A 152 152 0 0 1 306 264" fill="none" stroke="#ef4444" stroke-width="3.8" stroke-linecap="round" />
                    <line x1="180" y1="22" x2="180" y2="33" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                    <line x1="180" y1="327" x2="180" y2="338" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                  </g>

                  <!-- Layer 3: Inner Bayonet Gear Ring (tightens & counter-rotates on hover) -->
                  <g class="rig-ring rig-ring-bayonet">
                    <circle cx="180" cy="180" r="140" fill="none" stroke="rgba(239, 68, 68, 0.72)" stroke-width="2.5" stroke-dasharray="38 28" stroke-linecap="round" />
                  </g>

                  <!-- Layer 4: Radial Mechanical Lock Clamps (contract inward & rotate into lock slots on hover) -->
                  <g class="rig-ring rig-ring-clamps">
                    <path d="M 173 44 L 187 44 L 184 52 L 176 52 Z" fill="#ef4444" opacity="0.85" />
                    <path d="M 173 316 L 187 316 L 184 308 L 176 308 Z" fill="#ef4444" opacity="0.85" />
                    <path d="M 44 173 L 44 187 L 52 184 L 52 176 Z" fill="#ef4444" opacity="0.85" />
                    <path d="M 316 173 L 316 187 L 308 184 L 308 176 Z" fill="#ef4444" opacity="0.85" />
                  </g>

                  <!-- Layer 5: Inner Core Lock Ring -->
                  <circle class="rig-ring rig-ring-core" cx="180" cy="180" r="130" fill="none" stroke="rgba(239, 68, 68, 0.88)" stroke-width="3" />
                </svg>

                <div class="hero-red-socket">
                  <div class="hero-red-cap">
                    <span class="hero-dome-shine"></span>
                  </div>
                </div>
              </div>

              <div class="start-side-callout right-callout">
                <span class="callout-warn-icon" aria-hidden="true">
                  <svg viewBox="0 0 28 26" width="28" height="26" fill="none">
                    <path d="M14 2L26 23H2L14 2Z" stroke="#ef4444" stroke-width="2.3" stroke-linejoin="round" />
                    <line x1="14" y1="9.5" x2="14" y2="15.5" stroke="#ef4444" stroke-width="2.3" stroke-linecap="round" />
                    <circle cx="14" cy="19.2" r="1.3" fill="#ef4444" />
                  </svg>
                </span>
                <div class="callout-text-wrap">
                  <span class="callout-line-white">${t(lang, "rightHintLine1")}</span>
                  <span class="callout-line-red">${t(lang, "rightHintLine2")}</span>
                </div>
                <span class="callout-horiz-line"></span>
              </div>
            </div>

            <div class="start-bottom-cta">
              <button type="button" class="cyber-start-btn" data-action="start-game">
                <span class="cyber-play-icon" aria-hidden="true">▶</span>
                <span>${t(lang, "startBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      `;

      this.root.querySelectorAll('[data-action="set-lang"]').forEach((btn) => {
        btn.addEventListener("click", () => {
          this.controller.setConfig({ lang: btn.getAttribute("data-lang") });
        });
      });

      const themeBtn = this.root.querySelector('[data-action="toggle-theme"]');
      if (themeBtn) {
        themeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._toggleTheme();
        });
      }

      const soundBtn = this.root.querySelector('[data-action="toggle-sound"]');
      if (soundBtn) {
        soundBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (this.controller.sound) {
            this.controller.sound.toggle();
            this._renderStartScreen(lang);
          }
        });
      }

      const updateBtn = this.root.querySelector('[data-action="check-update"]');
      if (updateBtn) {
        updateBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (global.AndroidBridge && typeof global.AndroidBridge.checkForUpdates === "function") {
            global.AndroidBridge.checkForUpdates(lang);
          } else {
            global.open("https://github.com/Nagaruu/timepressure/releases/latest", "_blank", "noopener");
          }
        });
      }

      this.root.querySelectorAll('[data-action="toggle-help"]').forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.helpOpen = !this.helpOpen;
          const tooltip = this.root.querySelector(".help-tooltip");
          const infoBtn = this.root.querySelector('.help-wrapper [data-action="toggle-help"]');
          if (tooltip) tooltip.classList.toggle("open", this.helpOpen);
          if (infoBtn) infoBtn.classList.toggle("active", this.helpOpen);
        });
      });

      this.root.querySelectorAll('[data-action="start-game"]').forEach((el) => {
        el.addEventListener("click", () => {
          this.helpOpen = false;
          this.controller.startNewGame();
        });
      });
    }

    _renderPerimeterTimerSvg(initialUrgency = "normal") {
      return `
        <svg class="perimeter-timer-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          <rect
            class="perimeter-track"
            x="8"
            y="8"
            width="984"
            height="984"
            rx="14"
            ry="14"
            pathLength="1000"
          />
          <rect
            class="perimeter-fill"
            id="perimeter-timer-stroke"
            x="8"
            y="8"
            width="984"
            height="984"
            rx="14"
            ry="14"
            pathLength="1000"
            data-urgency="${initialUrgency}"
          />
        </svg>
      `;
    }

    _formatRuleDescriptionHtml(text) {
      if (!text) return "";
      // Replace emoji bomb 💣 with the exact same vector SVG icon used during gameplay
      const inlineBomb = `<span class="inline-stimulus-icon" data-stimulus="bomb">${VECTOR_ICONS.bomb}</span>`;
      return text.replace(/💣/g, inlineBomb);
    }

    _renderRuleIntroScreen(state, lang) {
      if (
        this.lastScreen === "rule_intro" &&
        this.lastRoundIndex === state.roundIndex &&
        this.root.querySelector(".rule-intro-screen")
      ) {
        return;
      }

      const { rule, replacedRule } = state.ruleAnnouncement;
      const isFake = Boolean(rule.isFake);
      const isReplacement = !isFake && Boolean(replacedRule);
      const urgency = isFake ? "rule" : isReplacement ? "rule_replace" : "rule";
      const badgeClass = isFake ? "fake" : isReplacement ? "replacement" : "";
      const badgeText = isFake
        ? t(lang, "fakeRuleTag")
        : isReplacement
          ? t(lang, "replacedRuleTag")
          : t(lang, "newRuleTag");

      const ruleDescHtml = this._formatRuleDescriptionHtml(rule.description[lang]);

      this.root.innerHTML = `
        <div class="screen rule-intro-screen${isFake ? " fake-rule-screen" : ""}">
          <div class="start-bg-facets" aria-hidden="true"></div>
          ${this._renderPerimeterTimerSvg(urgency)}

          <button type="button" class="circle-icon-btn home-corner-btn" data-action="return-home" aria-label="${t(lang, "homeBtn")}" title="${t(lang, "homeBtn")}">
            ${HOME_ICON}
          </button>

          <div class="rule-intro-center">
            <span class="rule-intro-badge ${badgeClass}">
              <span class="badge-dot"></span>
              ${badgeText}
            </span>
            <h2 class="rule-intro-text">${ruleDescHtml}</h2>
          </div>
        </div>
      `;

      this.perimeterStrokeEl = this.root.querySelector("#perimeter-timer-stroke");
      this._currentUrgency = urgency;
    }

    _buildSinglePressedIconHtml(color) {
      return `<span class="pressed-btn-graphic pressed-color-${color}" title="${color}"><span class="pressed-btn-socket"></span><span class="pressed-btn-cap"><span class="pressed-btn-shine"></span></span></span>`;
    }

    _buildStimuliHtml(roundData) {
      if (!roundData.stimuli || roundData.stimuli.length === 0) return "";
      return roundData.stimuli
        .map(
          (stimKey) =>
            `<div class="pure-stimulus-icon" data-stimulus="${stimKey}">${renderStimulusVisual(stimKey)}</div>`
        )
        .join("");
    }

    _buildButtonsHtml(buttons, litButton) {
      return buttons
        .map((color) => {
          const isLit = litButton === color;
          return `
            <button
              type="button"
              class="game-btn btn-color-${color} ${isLit ? "is-lit-btn" : ""}"
              data-color="${color}"
              aria-label="${color}"
            >
              <svg class="btn-tech-ring-svg" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="92" class="tech-ring-base" />
                <path d="M 24 58 A 87 87 0 0 0 24 142" class="tech-ring-arc" />
                <path d="M 176 58 A 87 87 0 0 1 176 142" class="tech-ring-arc" />
              </svg>
              <span class="btn-socket"></span>
              <span class="btn-cap">
                <span class="btn-dome-shine"></span>
                <span class="btn-pressed-mark">${VECTOR_ICONS.check}</span>
              </span>
            </button>
          `;
        })
        .join("");
    }

    _bindButtonGridEvents() {
      if (!this.buttonGridEl) return;
      this.buttonGridEl.addEventListener("pointerdown", (e) => {
        const btn = e.target.closest ? e.target.closest(".game-btn") : null;
        if (!btn || !this.buttonGridEl.contains(btn)) return;
        if (e.button !== undefined && e.button !== 0) return;
        btn._lastPointerDownTs = performance.now();
        this._showPressedButtonImage(btn);
        this.controller.handleButtonPress(btn.getAttribute("data-color"));
      });

      this.buttonGridEl.addEventListener("click", (e) => {
        const btn = e.target.closest ? e.target.closest(".game-btn") : null;
        if (!btn || !this.buttonGridEl.contains(btn)) return;
        const now = performance.now();
        if (btn._lastPointerDownTs && now - btn._lastPointerDownTs < 350) {
          return;
        }
        this._showPressedButtonImage(btn);
        this.controller.handleButtonPress(btn.getAttribute("data-color"));
      });
    }

    _updatePlayingScreen(state, lang) {
      const roundData = state.currentRound;
      const buttons = roundData.buttons || ["red"];
      const pressHistory = state.pressHistory || [];

      if (this.screenEl) this.screenEl.classList.remove("round-cleared-pulse");
      if (this.roundPillTextEl) {
        this.roundPillTextEl.textContent = t(lang, "roundOnlyLabel", {
          round: roundData.round
        });
      }
      if (this.promptTextEl) {
        this.promptTextEl.innerHTML =
          (roundData.promptHtml && roundData.promptHtml[lang]) || roundData.prompt[lang];
      }

      const stimuliHtml = this._buildStimuliHtml(roundData);
      if (this.stimuliRowEl) {
        this.stimuliRowEl.innerHTML = stimuliHtml;
        this.stimuliRowEl.style.display = stimuliHtml ? "" : "none";
      }

      if (this.buttonArenaEl) {
        this.buttonArenaEl.setAttribute("data-btn-count", buttons.length);
      }
      if (this.buttonGridEl) {
        this.buttonGridEl.setAttribute("data-btn-count", buttons.length);
        this.buttonGridEl.innerHTML = this._buildButtonsHtml(
          buttons,
          roundData.litButton || null
        );
      }
      if (this.trayEl) {
        this.trayEl.innerHTML = pressHistory
          .map((item) => this._buildSinglePressedIconHtml(item.color))
          .join("");
      }
      this.renderedPressCount = pressHistory.length;

      if (this.perimeterStrokeEl) {
        this.perimeterStrokeEl.setAttribute("data-urgency", "normal");
        this.perimeterStrokeEl.style.strokeDashoffset = "0";
      }
      this._currentUrgency = "normal";
    }

    _renderPlayingScreen(state, lang) {
      const roundData = state.currentRound;
      const buttons = roundData.buttons || ["red"];
      const pressHistory = state.pressHistory || [];

      // Fast-path incremental DOM update during the same playing round (O(1) per button press!)
      if (
        this.lastScreen === "playing" &&
        this.lastRoundIndex === state.roundIndex &&
        this.screenEl &&
        this.root.contains(this.screenEl)
      ) {
        if (this.trayEl && this.renderedPressCount < pressHistory.length) {
          let newIconsHtml = "";
          for (let i = this.renderedPressCount; i < pressHistory.length; i++) {
            newIconsHtml += this._buildSinglePressedIconHtml(pressHistory[i].color);
          }
          this.trayEl.insertAdjacentHTML("beforeend", newIconsHtml);
          this.renderedPressCount = pressHistory.length;
        }

        if (state.roundClearedWait && !this.screenEl.classList.contains("round-cleared-pulse")) {
          this.screenEl.classList.add("round-cleared-pulse");
          if (this.perimeterStrokeEl) {
            this._currentUrgency = "cleared";
            this.perimeterStrokeEl.setAttribute("data-urgency", "cleared");
            this.perimeterStrokeEl.style.strokeDashoffset = "0";
          }
        }
        return;
      }

      if (this.lastScreen === "playing" && this.screenEl && this.root.contains(this.screenEl)) {
        this._updatePlayingScreen(state, lang);
        return;
      }

      const stimuliHtml = this._buildStimuliHtml(roundData);
      const buttonsHtml = this._buildButtonsHtml(buttons, roundData.litButton || null);
      const initialTrayHtml = pressHistory
        .map((item) => this._buildSinglePressedIconHtml(item.color))
        .join("");
      this.renderedPressCount = pressHistory.length;

      this.root.innerHTML = `
        <div class="screen playing-screen ${state.roundClearedWait ? "round-cleared-pulse" : ""}">
          <div class="start-bg-facets" aria-hidden="true"></div>
          ${this._renderPerimeterTimerSvg("normal")}

          <div class="play-content-container">
            <header class="minimal-round-header">
              <span class="round-header-spacer" aria-hidden="true"></span>
              <div class="round-pill">
                <span class="round-pill-dot"></span>
                <span class="round-pill-text">${t(lang, "roundOnlyLabel", { round: roundData.round })}</span>
              </div>
              <button type="button" class="circle-icon-btn home-corner-btn" data-action="return-home" aria-label="${t(lang, "homeBtn")}" title="${t(lang, "homeBtn")}">${HOME_ICON}</button>
            </header>

            <main class="stage-area">
              <div class="minimal-prompt-box">
                <span class="prompt-side-accent left"></span>
                <div class="prompt-inner-content">
                  <div class="stimuli-row" style="${stimuliHtml ? "" : "display: none;"}">${stimuliHtml}</div>
                  <p class="prompt-text">${(roundData.promptHtml && roundData.promptHtml[lang]) || roundData.prompt[lang]}</p>
                </div>
                <span class="prompt-side-accent right"></span>
              </div>
              <!-- Visual tray showing the pressed button image each time a button is pressed -->
              <div class="pressed-history-tray" id="pressed-history-tray">${initialTrayHtml}</div>
            </main>

            <section class="button-arena" data-btn-count="${buttons.length}">
              <div class="button-grid" data-btn-count="${buttons.length}">
                ${buttonsHtml}
              </div>
            </section>
          </div>
        </div>
      `;

      this.perimeterStrokeEl = this.root.querySelector("#perimeter-timer-stroke");
      this.screenEl = this.root.querySelector(".playing-screen");
      this.trayEl = this.root.querySelector("#pressed-history-tray");
      this.buttonGridEl = this.root.querySelector(".button-grid");
      this.buttonArenaEl = this.root.querySelector(".button-arena");
      this.promptTextEl = this.root.querySelector(".prompt-text");
      this.roundPillTextEl = this.root.querySelector(".round-pill-text");
      this.stimuliRowEl = this.root.querySelector(".stimuli-row");
      this._currentUrgency = "normal";

      this._bindButtonGridEvents();
    }

    _renderSummaryScreen(state, lang) {
      const isVictory = state.victory;
      let diagnosticHtml = "";

      if (!isVictory && state.failDetails) {
        const { reason, failedColor, pressHistory, plan, roundData } = state.failDetails;
        const colorName = failedColor ? t(lang, `colors.${failedColor}`) : "";
        const reasonText = t(lang, `failReasons.${reason || "timeout_incomplete"}`, { color: colorName });
        const expectedStr = AnswerValidator.formatPlanSummary(plan, lang, t);
        const actualStr = AnswerValidator.formatInputSummary(pressHistory, lang, t);

        const promptStr = roundData ? roundData.prompt[lang] : "";

        const traceItems =
          plan && plan.trace && plan.trace.length > 0
            ? plan.trace.map((tr) => `<li>${tr[lang]}</li>`).join("")
            : "";

        diagnosticHtml = `
          <div class="loss-diagnostic-box">
            <div class="loss-reason-banner">
              <span class="loss-reason-label">${t(lang, "whyLostTitle")}</span>
              <p class="loss-reason-text">${reasonText}</p>
            </div>

            <div class="loss-comparison-grid">
              <div class="loss-comp-item full-span">
                <span class="loss-comp-label">${t(lang, "promptWasLabel")}</span>
                <span class="loss-comp-value prompt-val">${promptStr}</span>
              </div>
              <div class="loss-comp-item">
                <span class="loss-comp-label">${t(lang, "expectedAnswerLabel")}</span>
                <span class="loss-comp-value expected-val">${expectedStr}</span>
              </div>
              <div class="loss-comp-item">
                <span class="loss-comp-label">${t(lang, "yourInputLabel")}</span>
                <span class="loss-comp-value actual-val">${actualStr}</span>
              </div>
            </div>

            ${
              traceItems
                ? `<div class="loss-trace-section">
                    <span class="loss-comp-label">${t(lang, "activeRulesTraceLabel")}</span>
                    <ul class="loss-trace-list">${traceItems}</ul>
                  </div>`
                : ""
            }
          </div>
        `;
      }

      this.root.innerHTML = `
        <div class="screen summary-screen ${isVictory ? "victory-bg" : ""}">
          <div class="start-bg-facets" aria-hidden="true"></div>
          <div class="modern-summary-card ${isVictory ? "victory" : "gameover"}">
            <div class="summary-badge-icon">${isVictory ? "★" : "✕"}</div>
            <h1 class="summary-title">
              ${isVictory ? t(lang, "victoryTitle") : t(lang, "gameOverTitle")}
            </h1>
            <p class="summary-subtitle">
              ${
                isVictory
                  ? t(lang, "victorySubtitle")
                  : t(lang, "gameOverSubtitle", { round: state.roundIndex + 1 })
              }
            </p>

            <div class="summary-actions">
              <button type="button" class="cyber-start-btn summary-home-btn" data-action="return-home">
                <span class="cyber-home-icon" aria-hidden="true">${HOME_ICON}</span>
                <span>${t(lang, "homeBtn")}</span>
              </button>
              <button type="button" class="cyber-start-btn" data-action="play-again">
                <span class="cyber-play-icon" aria-hidden="true">▶</span>
                <span>${t(lang, "playAgainBtn")}</span>
              </button>
            </div>
          </div>
        </div>
      `;

      const playAgainBtn = this.root.querySelector('[data-action="play-again"]');
      if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
          this.controller.startNewGame();
        });
      }
    }
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.UIRenderer = UIRenderer;
})(typeof window !== "undefined" ? window : globalThis);
