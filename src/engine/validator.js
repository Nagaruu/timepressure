/**
 * Real-time & Final Answer Validator
 * Checks button color, exact press counts, phase/sequence order, and simultaneous cumulative rules.
 */
(function (global) {
  class AnswerValidator {
    constructor(targetPlan) {
      this.plan = targetPlan;
      this.pressHistory = [];
      this.currentPhaseIndex = 0;
      this.phaseProgress = (targetPlan.phases || []).map(() => ({}));
      this.failedState = null;
    }

    /**
     * Checks if a specific phase index has all its color counts fulfilled.
     */
    _isPhaseComplete(idx) {
      const phase = this.plan.phases[idx];
      if (!phase) return true;
      const prog = this.phaseProgress[idx] || {};
      for (const [color, requiredCount] of Object.entries(phase.counts)) {
        if ((prog[color] || 0) < requiredCount) {
          return false;
        }
      }
      return true;
    }

    /**
     * Advances currentPhaseIndex across any completed phases.
     */
    _advanceCompletedPhases() {
      while (
        this.currentPhaseIndex < this.plan.phases.length &&
        this._isPhaseComplete(this.currentPhaseIndex)
      ) {
        this.currentPhaseIndex++;
      }
    }

    /**
     * Returns true if all required phases and counts have been completely satisfied.
     */
    isAllSatisfied() {
      if (this.failedState) return false;
      this._advanceCompletedPhases();
      return this.currentPhaseIndex >= this.plan.phases.length;
    }

    /**
     * Registers a single button press and validates immediately.
     * @param {string} color
     * @param {number} timestamp
     */
    registerPress(color, timestamp = Date.now()) {
      this.pressHistory.push({ color, timestamp });

      if (this.failedState) {
        return this.failedState;
      }

      // 1. If target is 0 presses total, any press is an immediate failure
      if (this.plan.totalPresses === 0) {
        this.failedState = {
          status: "failed",
          reason: "pressed_on_zero",
          color
        };
        return this.failedState;
      }

      // 2. If color is explicitly forbidden by a hazard rule
      if (this.plan.forbiddenColors && this.plan.forbiddenColors.includes(color)) {
        this.failedState = {
          status: "failed",
          reason: "wrong_color",
          color
        };
        return this.failedState;
      }

      this._advanceCompletedPhases();

      // 3. If all phases were already complete, pressing again exceeds required count
      if (this.currentPhaseIndex >= this.plan.phases.length) {
        const hadColorAnywhere = this.plan.phases.some((p) => (p.counts[color] || 0) > 0);
        this.failedState = {
          status: "failed",
          reason: hadColorAnywhere ? "exceeded_count" : "wrong_color",
          color
        };
        return this.failedState;
      }

      const activePhase = this.plan.phases[this.currentPhaseIndex];
      const requiredInActive = activePhase.counts[color] || 0;
      const currentInActive = this.phaseProgress[this.currentPhaseIndex][color] || 0;

      // 4. Color is not part of the active phase
      if (requiredInActive === 0) {
        const requiredInLaterPhase = this.plan.phases
          .slice(this.currentPhaseIndex + 1)
          .some((p) => (p.counts[color] || 0) > 0);
        const requiredInEarlierPhase = this.plan.phases
          .slice(0, this.currentPhaseIndex)
          .some((p) => (p.counts[color] || 0) > 0);

        let reason = "wrong_color";
        if (requiredInLaterPhase) {
          reason = "wrong_order";
        } else if (requiredInEarlierPhase) {
          reason = "exceeded_count";
        }

        this.failedState = {
          status: "failed",
          reason,
          color
        };
        return this.failedState;
      }

      // 5. Color is part of the active phase, but already reached its count in this phase
      if (currentInActive >= requiredInActive) {
        const requiredInLaterPhase = this.plan.phases
          .slice(this.currentPhaseIndex + 1)
          .some((p) => (p.counts[color] || 0) > 0);

        this.failedState = {
          status: "failed",
          reason: requiredInLaterPhase ? "wrong_order" : "exceeded_count",
          color
        };
        return this.failedState;
      }

      // 6. Valid press within active phase
      this.phaseProgress[this.currentPhaseIndex][color] = currentInActive + 1;
      this._advanceCompletedPhases();

      if (this.currentPhaseIndex >= this.plan.phases.length) {
        return {
          status: "completed_pending",
          totalPressed: this.pressHistory.length,
          totalRequired: this.plan.totalPresses
        };
      }

      return {
        status: "in_progress",
        totalPressed: this.pressHistory.length,
        totalRequired: this.plan.totalPresses
      };
    }

    /**
     * Evaluates the round when time runs out.
     */
    evaluateTimeout() {
      if (this.failedState) return this.failedState;
      if (this.isAllSatisfied()) {
        return { status: "passed" };
      }
      this.failedState = {
        status: "failed",
        reason: "timeout_incomplete"
      };
      return this.failedState;
    }

    /**
     * Evaluates the round when the player manually locks in their answer early.
     */
    evaluateLockIn() {
      if (this.failedState) return this.failedState;
      if (this.isAllSatisfied()) {
        return { status: "passed" };
      }
      this.failedState = {
        status: "failed",
        reason: "early_submit_incomplete"
      };
      return this.failedState;
    }

    /**
     * Formats the target plan into a human-readable string for UI feedback.
     */
    static formatPlanSummary(plan, lang, tFn) {
      if (!plan || plan.totalPresses === 0) {
        return tFn(lang, "nothingPressed");
      }
      const parts = [];
      for (const phase of plan.phases) {
        let prefix = "";
        if (phase.id === "first") prefix = tFn(lang, "phasePrefixFirst");
        else if (phase.id === "last") prefix = tFn(lang, "phasePrefixLast");

        const subParts = Object.entries(phase.counts).map(([color, count]) => {
          const colorName = tFn(lang, `colors.${color}`);
          return `${colorName} × ${count}`;
        });
        parts.push(`${prefix}${subParts.join(" + ")}`);
      }
      return parts.join("  ➔  ");
    }

    /**
     * Formats the player's actual press history into grouped runs (e.g. XANH × 2 ➔ ĐỎ × 1).
     */
    static formatInputSummary(pressHistory, lang, tFn) {
      if (!pressHistory || pressHistory.length === 0) {
        return tFn(lang, "nothingPressed");
      }
      const runs = [];
      for (const item of pressHistory) {
        const last = runs[runs.length - 1];
        if (last && last.color === item.color) {
          last.count++;
        } else {
          runs.push({ color: item.color, count: 1 });
        }
      }
      return runs
        .map((r) => `${tFn(lang, `colors.${r.color}`)} × ${r.count}`)
        .join("  ➔  ");
    }
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.AnswerValidator = AnswerValidator;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { AnswerValidator };
  }
})(typeof window !== "undefined" ? window : globalThis);

