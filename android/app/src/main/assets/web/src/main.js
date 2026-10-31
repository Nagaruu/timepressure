/**
 * Application Bootstrap
 * Connects Data (I18N, Rules, Levels), Engine (Validator, GameController), and UI (SoundFX, UIRenderer).
 */
(function (global) {
  function initApp() {
    const root = document.getElementById("app");
    if (!root) return;

    const { LEVELS_DATA, SoundFX, GameController, UIRenderer } = global.PressGame;
    const sound = new SoundFX();

    let renderer = null;
    const controller = new GameController({
      levels: LEVELS_DATA,
      sound,
      onStateChange(state, config) {
        if (renderer) {
          renderer.render(state, config);
        }
      },
      onTimerTick(timerPayload) {
        if (renderer) {
          renderer.updateTimer(timerPayload);
        }
      }
    });

    renderer = new UIRenderer(root, controller);
    renderer.render(controller.state, controller.config);

    // Expose instance for debugging or automated testing
    global.pressGameApp = { controller, renderer, sound };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})(typeof window !== "undefined" ? window : globalThis);

