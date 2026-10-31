/**
 * Game State Machine & Controller
 * - Generates fresh randomized 60 rounds & dynamic rules on every new game
 * - Shows a dedicated 7-second Rule Presentation screen (no challenge/buttons) whenever a new rule appears
 * - Evaluates answer ONLY when the round timer expires
 * - On Pass: 1-second green pulse -> auto-advance to next round (no explanation screen)
 * - On Fail: Game Over screen shows detailed explanation of WHY you lost
 */
(function (global) {
  const {
    RuleEngine,
    AnswerValidator,
    generateGameLevels,
    buildRepeatPreviousRound,
    resolveRepeatTimeLimit
  } = global.PressGame;

  class GameController {
    constructor({ levels, sound, onStateChange, onTimerTick }) {
      this.levels = levels;
      this.sound = sound;
      this.onStateChange = onStateChange || (() => { });
      this.onTimerTick = onTimerTick || (() => { });

      this.ruleEngine = new RuleEngine(levels && levels.customCatalog ? levels.customCatalog : undefined);

      this.config = {
        lang: "vi"
      };

      this.state = {
        screen: "start", // 'start' | 'rule_intro' | 'playing' | 'summary'
        roundIndex: 0,
        currentRound: null,
        currentPlan: null,
        ruleAnnouncement: null,
        pressHistory: [],
        roundClearedWait: false,
        victory: false,
        failDetails: null
      };

      this._rafId = null;
      this._nextRoundTimeoutId = null;
      this._roundStartTime = null;
      this._roundDurationMs = 0;
      this._lastWholeSecond = null;
      this._currentTimeLimit = 0;
      this._previousRoundPressHistory = [];
      this._isPaused = false;
      this._pausedRemainingMs = 0;
    }

    setConfig(partialConfig) {
      Object.assign(this.config, partialConfig);
      this._notify();
    }

    startNewGame() {
      this._stopTimers();

      if (typeof generateGameLevels === "function") {
        this.levels = generateGameLevels();
      }
      this.ruleEngine.reset(this.levels ? this.levels.customCatalog : null);

      this.state = {
        screen: "playing",
        roundIndex: 0,
        currentRound: null,
        currentPlan: null,
        ruleAnnouncement: null,
        pressHistory: [],
        roundClearedWait: false,
        victory: false,
        failDetails: null
      };

      this._beginRound(0);
    }

    _beginRound(roundIndex) {
      this._stopTimers();
      this._isPaused = false;
      this._pausedRemainingMs = 0;

      const originalRoundData = this.levels[roundIndex];
      const prevPressHistory =
        roundIndex > 0 ? [...this.state.pressHistory] : [];
      this._previousRoundPressHistory = prevPressHistory;

      let roundData = originalRoundData;
      let isDynamicRepeat = false;
      if (
        originalRoundData.baseSpec &&
        originalRoundData.baseSpec.type === "repeat_previous_presses"
      ) {
        const repeat = buildRepeatPreviousRound(prevPressHistory);
        roundData = {
          ...originalRoundData,
          prompt: repeat.prompt,
          baseSpec: repeat.baseSpec
        };
        isDynamicRepeat = true;
      }

      let ruleAnnouncement = null;

      if (roundData.newRuleId) {
        const res = this.ruleEngine.activateRule(roundData.newRuleId);
        if (res.isNew) {
          ruleAnnouncement = res;
        }
      }

      const plan = this.ruleEngine.resolveRoundPlan(roundData);
      this.validator = new AnswerValidator(plan);

      const effectiveTimeLimit = isDynamicRepeat
        ? resolveRepeatTimeLimit(roundData.timeLimit, plan.totalPresses)
        : roundData.timeLimit;
      this._currentTimeLimit = effectiveTimeLimit;

      this.state.roundIndex = roundIndex;
      this.state.currentRound = roundData;
      this.state.currentPlan = plan;
      this.state.ruleAnnouncement = ruleAnnouncement;
      this.state.pressHistory = [];
      this.state.roundClearedWait = false;
      this.state.failDetails = null;

      // Dedicated 7-second Rule Screen first (no challenge)
      if (ruleAnnouncement) {
        if (this.sound) this.sound.playRuleUnlock();
        this.state.screen = "rule_intro";
        this._roundDurationMs = 7000;
        this._roundStartTime = null;
        this._lastWholeSecond = 7;
        this._notify();
        this._startRuleIntroTimerLoop();
        return;
      }

      this._startChallengePhase();
    }

    _startChallengePhase() {
      this._stopTimers();
      const roundData = this.state.currentRound;
      this.state.screen = "playing";
      this.state.ruleAnnouncement = null;
      this.state.roundClearedWait = false;

      const timeLimit = this._currentTimeLimit || roundData.timeLimit;
      this._roundDurationMs = timeLimit * 1000;
      this._roundStartTime = null;
      this._lastWholeSecond = Math.ceil(timeLimit);
      this._isPaused = false;
      this._pausedRemainingMs = 0;

      this._notify();
      this._startTimerLoop();
    }

    handleButtonPress(color) {
      if (this.state.screen !== "playing" || this.state.roundClearedWait || this._isPaused) {
        return;
      }

      if (this.sound) {
        this.sound.playButtonPress(color);
      }

      // Record the press; pass/fail is evaluated ONLY when the round timer expires
      const now = performance.now();
      this.validator.registerPress(color, now);
      this.state.pressHistory.push({ color, timestamp: now });
      this._notify();
    }

    returnToStart() {
      this._stopTimers();
      this._isPaused = false;
      this._pausedRemainingMs = 0;
      this.state.screen = "start";
      this._notify();
    }

    pauseRound() {
      if (this._isPaused) return;
      if (this.state.screen !== "playing" && this.state.screen !== "rule_intro") return;
      if (this.state.roundClearedWait) return;

      this._isPaused = true;
      if (this._roundStartTime === null) {
        this._pausedRemainingMs = this._roundDurationMs;
      } else {
        const elapsed = performance.now() - this._roundStartTime;
        this._pausedRemainingMs = Math.max(0, this._roundDurationMs - elapsed);
      }
      this._stopTimers();
    }

    resumeRound() {
      if (!this._isPaused) return;

      this._isPaused = false;
      const remainingMs = Math.max(0, this._pausedRemainingMs);
      this._roundStartTime = performance.now() - (this._roundDurationMs - remainingMs);

      if (this.state.screen === "rule_intro") {
        this._startRuleIntroTimerLoop();
      } else if (this.state.screen === "playing") {
        this._startTimerLoop();
      }
    }

    _triggerRoundCleared() {
      this._stopTimers();
      if (this.sound) this.sound.playSuccess(this.state.roundIndex);

      this.state.roundClearedWait = true;
      this._notify();

      this._nextRoundTimeoutId = setTimeout(() => {
        const nextIdx = this.state.roundIndex + 1;
        if (nextIdx >= this.levels.length) {
          this.state.screen = "summary";
          this.state.victory = true;
          this.state.roundClearedWait = false;
          this._notify();
        } else {
          this._beginRound(nextIdx);
        }
      }, 1000);
    }

    _triggerGameOver(evalRes) {
      this._stopTimers();
      if (this.sound) this.sound.playFail();

      this.state.screen = "summary";
      this.state.victory = false;
      this.state.roundClearedWait = false;
      this.state.failDetails = {
        reason: evalRes ? evalRes.reason : "timeout_incomplete",
        failedColor: evalRes ? evalRes.color : null,
        pressHistory: this.validator ? [...this.validator.pressHistory] : [],
        plan: this.state.currentPlan,
        roundData: this.state.currentRound
      };
      this._notify();
    }

    _startRuleIntroTimerLoop() {
      const tick = (now) => {
        if (this.state.screen !== "rule_intro" || this._isPaused) return;
        if (this._roundStartTime === null) this._roundStartTime = now;

        const elapsed = now - this._roundStartTime;
        const remainingMs = Math.max(0, this._roundDurationMs - elapsed);

        this.onTimerTick({
          remainingMs,
          remainingSec: remainingMs / 1000,
          totalMs: this._roundDurationMs,
          progressRatio: remainingMs / this._roundDurationMs
        });

        if (remainingMs <= 0) {
          this._startChallengePhase();
          return;
        }

        this._rafId = requestAnimationFrame(tick);
      };

      this._rafId = requestAnimationFrame(tick);
    }

    _startTimerLoop() {
      const tick = (now) => {
        if (this.state.screen !== "playing" || this.state.roundClearedWait || this._isPaused) {
          return;
        }
        if (this._roundStartTime === null) this._roundStartTime = now;

        const elapsed = now - this._roundStartTime;
        const remainingMs = Math.max(0, this._roundDurationMs - elapsed);
        const remainingSec = remainingMs / 1000;
        const wholeSec = Math.ceil(remainingSec);

        if (wholeSec !== this._lastWholeSecond && wholeSec > 0) {
          this._lastWholeSecond = wholeSec;
          if (wholeSec <= 2 && this.sound) {
            this.sound.playTick(wholeSec === 1);
          }
        }

        this.onTimerTick({
          remainingMs,
          remainingSec,
          totalMs: this._roundDurationMs,
          progressRatio: remainingMs / this._roundDurationMs
        });

        if (remainingMs <= 0) {
          const evalRes = this.validator.evaluateTimeout();
          if (evalRes.status === "passed") {
            this._triggerRoundCleared();
          } else {
            this._triggerGameOver(evalRes);
          }
          return;
        }

        this._rafId = requestAnimationFrame(tick);
      };

      this._rafId = requestAnimationFrame(tick);
    }

    _stopTimers() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      if (this._nextRoundTimeoutId) {
        clearTimeout(this._nextRoundTimeoutId);
        this._nextRoundTimeoutId = null;
      }
    }

    _notify() {
      this.onStateChange(this.state, this.config);
    }
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.GameController = GameController;
})(typeof window !== "undefined" ? window : globalThis);
