/**
 * Cumulative Rule Catalog, Dynamic Rule Factory & Rule Engine
 * Supports parameterized rules:
 * - Stimulus Rules (dog/cat/mouse/lion; randomly zero, exclusive, or additive)
 * - Lion Rule (the lion can be zero or a normal press rule)
 * - Odd/Even Parity Rule
 * - Bomb First/Forbidden Rule
 * - Finale Last-Button Rule
 * - Odd-Fruit Rule ("Nhấn màu của loại quả CÓ MÀU KHÁC BIỆT với các quả còn lại")
 */
(function (global) {
  const COLOR_NAMES = {
    vi: { red: "ĐỎ", blue: "XANH", yellow: "VÀNG", black: "ĐEN", white: "TRẮNG", purple: "TÍM" },
    en: { red: "RED", blue: "BLUE", yellow: "YELLOW", black: "BLACK", white: "WHITE", purple: "PURPLE" }
  };

  const ANIMAL_NAMES = {
    vi: { dog: "chó", cat: "mèo", mouse: "chuột", lion: "sư tử" },
    en: { dog: "dog", cat: "cat", mouse: "mouse", lion: "lion" }
  };

  const ANIMAL_ICONS = {
    dog: "🐶",
    cat: "🐱",
    mouse: "🐭",
    lion: "🦁"
  };

  /**
   * Fruit palette used by the Odd-Fruit Rule. Every fruit maps to one of the
   * pressable button colors so the answer is always reachable.
   */
  const FRUIT_POOLS = {
    red: [
      { emoji: "🍎", vi: "táo", en: "apple" },
      { emoji: "🍓", vi: "dâu", en: "strawberry" },
      { emoji: "🍉", vi: "dưa hấu", en: "watermelon" },
      { emoji: "🍒", vi: "anh đào", en: "cherry" },
      { emoji: "🍅", vi: "cà chua", en: "tomato" }
    ],
    yellow: [
      { emoji: "🍌", vi: "chuối", en: "banana" },
      { emoji: "🍋", vi: "chanh", en: "lemon" },
      { emoji: "🍍", vi: "dứa", en: "pineapple" }
    ],
    purple: [
      { emoji: "🍇", vi: "nho", en: "grape" },
      { emoji: "🫐", vi: "việt quất", en: "blueberry" }
    ],
    white: [
      { emoji: "🥥", vi: "dừa", en: "coconut" },
      { emoji: "🧄", vi: "tỏi", en: "garlic" }
    ]
  };

  const FRUIT_COLORS = Object.keys(FRUIT_POOLS);

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Builds one randomized fruit group with exactly one odd-colored fruit.
   * `buttons` limits the colors that can appear, guaranteeing the odd color is
   * pressable. The odd fruit is placed at a random position.
   */
  function buildFruitSet({
    buttons = null,
    ruleId = null,
    size = null,
    majorityColor = null,
    oddColor = null
  } = {}) {
    const allowedColors = FRUIT_COLORS.filter(
      (color) => !buttons || buttons.includes(color)
    );
    const usableColors = allowedColors.length >= 2 ? allowedColors : FRUIT_COLORS;

    const resolvedMajority =
      majorityColor && usableColors.includes(majorityColor)
        ? majorityColor
        : pickRandom(usableColors);
    const oddCandidates = usableColors.filter((c) => c !== resolvedMajority);
    const resolvedOdd =
      oddColor && oddCandidates.includes(oddColor)
        ? oddColor
        : pickRandom(oddCandidates.length > 0 ? oddCandidates : usableColors);

    const total = size || (3 + Math.floor(Math.random() * 2));
    const majorityCount = Math.max(1, total - 1);
    const majorityPool = FRUIT_POOLS[resolvedMajority] || FRUIT_POOLS.red;
    const oddPool = FRUIT_POOLS[resolvedOdd] || FRUIT_POOLS.yellow;

    const fruits = [];
    for (let i = 0; i < majorityCount; i++) {
      const fruit = majorityPool[i % majorityPool.length];
      fruits.push({
        emoji: fruit.emoji,
        vi: fruit.vi,
        en: fruit.en,
        color: resolvedMajority,
        isOdd: false
      });
    }

    const oddFruit = pickRandom(oddPool);
    fruits.push({
      emoji: oddFruit.emoji,
      vi: oddFruit.vi,
      en: oddFruit.en,
      color: resolvedOdd,
      isOdd: true
    });

    return {
      ruleId,
      majorityColor: resolvedMajority,
      oddColor: resolvedOdd,
      fruits: shuffleArray(fruits)
    };
  }

  /**
   * Factory for one stimulus rule.
   * - zero: "Khi nhìn thấy [stimulus] thì KHÔNG nhấn nút nào"
   * - exclusive: "Khi nhìn thấy [stimulus] chỉ ấn nút [color] 1 lần và không ấn nút khác"
   * - additive: "Khi nhìn thấy [stimulus], nhấn thêm nút [color] 1 lần vào yêu cầu chính"
   */
  function createAnimalRule(
    animalKey = "dog",
    targetColor = "red",
    id = "rule_animal_dog",
    mode = "exclusive"
  ) {
    const key = ANIMAL_NAMES.vi[animalKey] ? animalKey : "dog";
    const ruleMode =
      mode === "additive" || mode === "zero" ? mode : "exclusive";
    const viColor = COLOR_NAMES.vi[targetColor] || "ĐỎ";
    const enColor = COLOR_NAMES.en[targetColor] || "RED";
    const viAnimal = ANIMAL_NAMES.vi[key];
    const enAnimal = ANIMAL_NAMES.en[key];
    const isZero = ruleMode === "zero";
    const isAdditive = ruleMode === "additive";
    return {
      id,
      group: `stimulus_${key}`,
      priority: isZero ? 95 : 50,
      icon: ANIMAL_ICONS[key],
      animalKey: key,
      targetColor: isZero ? null : targetColor,
      mode: ruleMode,
      description: {
        vi: isZero
          ? `Khi nhìn thấy ${viAnimal} thì KHÔNG nhấn nút nào!`
          : isAdditive
            ? `Khi nhìn thấy ${viAnimal}, nhấn thêm nút ${viColor} 1 lần vào yêu cầu chính`
            : `Khi nhìn thấy ${viAnimal} chỉ ấn nút ${viColor} 1 lần và không ấn nút khác`,
        en: isZero
          ? `When you see a ${enAnimal}, do NOT press any button!`
          : isAdditive
            ? `When you see a ${enAnimal}, add 1 press of the ${enColor} button on top of the main task`
            : `When you see a ${enAnimal}, ONLY press the ${enColor} button 1 time and no other button`
      },
      apply(plan, context) {
        if (context.stimuli && context.stimuli.includes(key)) {
          if (isZero) {
            plan.forceZero();
          } else if (isAdditive) {
            plan.addMainCount(targetColor, 1);
          } else {
            plan.onlySingleColorCount(targetColor, 1);
          }
          plan.addTrace({
            ruleId: this.id,
            vi: isZero
              ? `Luật Động Vật: Nhìn thấy ${viAnimal} → Không nhấn nút nào.`
              : isAdditive
                ? `Luật Động Vật: Nhìn thấy ${viAnimal} → Nhấn thêm nút ${viColor} 1 lần vào yêu cầu chính.`
                : `Luật Động Vật: Nhìn thấy ${viAnimal} → Chỉ ấn nút ${viColor} 1 lần và không ấn nút khác.`,
            en: isZero
              ? `Animal Rule: Saw a ${enAnimal} → Press nothing.`
              : isAdditive
                ? `Animal Rule: Saw a ${enAnimal} → Add 1 press of ${enColor} on top of the main task.`
                : `Animal Rule: Saw a ${enAnimal} → ONLY press ${enColor} 1 time and no other button.`
          });
        }
      }
    };
  }

  /**
   * Backward-compatible Dog Rule factory.
   */
  function createDogRule(targetColor = "red", id = "rule_dog_red") {
    return createAnimalRule("dog", targetColor, id);
  }

  /**
   * Factory for the Lion Rule: "Khi nhìn thấy sư tử thì KHÔNG nhấn nút nào"
   */
  function createLionZeroRule(id = "rule_lion_zero") {
    return {
      id,
      group: "stimulus_lion",
      priority: 95,
      icon: "🦁",
      animalKey: "lion",
      targetColor: null,
      mode: "zero",
      description: {
        vi: "Khi nhìn thấy sư tử 🦁 thì KHÔNG nhấn nút nào!",
        en: "When you see a lion 🦁, do NOT press any button!"
      },
      apply(plan, context) {
        if (context.stimuli && context.stimuli.includes("lion")) {
          plan.forceZero();
          plan.addTrace({
            ruleId: this.id,
            vi: "Luật Sư Tử 🦁: Nhìn thấy sư tử → Không nhấn nút nào.",
            en: "Lion Rule 🦁: Saw a lion → Press nothing."
          });
        }
      }
    };
  }

  /**
   * Factory for the Odd/Even Parity Rule (or its replacement)
   */
  function createParityRule(oddColor = "blue", evenColor = "red", isReplacement = false, id = null) {
    const ruleId = id || (isReplacement ? "rule_parity_white_blue" : "rule_parity_blue_red");
    const viOdd = COLOR_NAMES.vi[oddColor];
    const viEven = COLOR_NAMES.vi[evenColor];
    const enOdd = COLOR_NAMES.en[oddColor];
    const enEven = COLOR_NAMES.en[evenColor];

    return {
      id: ruleId,
      group: "number_color_map",
      priority: 10,
      icon: isReplacement ? "🔄" : "🔢",
      oddColor,
      evenColor,
      description: {
        vi: isReplacement
          ? `Thay luật cũ: LẺ → ${viOdd} • CHẴN → ${viEven}. Kết quả ra bao nhiêu thì nhấn bấy nhiêu lần (ra 3 → nhấn 3 lần).`
          : `Kết quả LẺ → nhấn ${viOdd} • Kết quả CHẴN → nhấn ${viEven}. Kết quả ra bao nhiêu thì nhấn bấy nhiêu lần (ra 3 → nhấn 3 lần).`,
        en: isReplacement
          ? `New rule: ODD → ${enOdd} • EVEN → ${enEven}. Press exactly the result amount (e.g. result 3 → press 3 times).`
          : `ODD result → press ${enOdd} • EVEN result → press ${enEven}. Press exactly the result amount (e.g. result 3 → press 3 times).`
      },
      apply(plan, context) {
        if (context.baseSpec && context.baseSpec.type === "numeric_result") {
          const val = context.baseSpec.value;
          if (val <= 0) {
            plan.setNumericColor(null, 0);
            return;
          }
          const isOdd = val % 2 !== 0;
          const targetColor = isOdd ? oddColor : evenColor;
          const viTarget = isOdd ? viOdd : viEven;
          const enTarget = isOdd ? enOdd : enEven;
          plan.setNumericColor(targetColor, val);
          plan.addTrace({
            ruleId: this.id,
            vi: `Luật Chẵn/Lẻ: ${val} là số ${isOdd ? "LẺ" : "CHẴN"} → Nhấn ${viTarget} ${val} lần.`,
            en: `Odd/Even Rule: ${val} is ${isOdd ? "ODD" : "EVEN"} → Press ${enTarget} ${val} times.`
          });
        }
      }
    };
  }

  /**
   * Factory for the Bomb Rule
   */
  function createBombRule(firstColor = "yellow", forbiddenColor = "black", id = "rule_bomb_yellow_first") {
    const viFirst = COLOR_NAMES.vi[firstColor];
    const viForbid = COLOR_NAMES.vi[forbiddenColor];
    const enFirst = COLOR_NAMES.en[firstColor];
    const enForbid = COLOR_NAMES.en[forbiddenColor];

    return {
      id,
      group: "stimulus_bomb",
      priority: 30,
      icon: "💣",
      firstColor,
      forbiddenColor,
      description: {
        vi: `Khi nhìn thấy 💣 thì nhấn nút ${viFirst} 1 lần ĐẦU TIÊN (Cấm nhấn ${viForbid})`,
        en: `When you see 💣, press ${enFirst} 1 time FIRST (Never press ${enForbid})`
      },
      apply(plan, context) {
        if (context.stimuli && context.stimuli.includes("bomb")) {
          plan.addFirstCount(firstColor, 1);
          plan.removeMainColor(forbiddenColor);
          plan.forbidColor(forbiddenColor);
          plan.addTrace({
            ruleId: this.id,
            vi: `Luật 💣: Nhìn thấy 💣 → Nhấn ${viFirst} 1 lần ĐẦU TIÊN (cấm chạm ${viForbid}).`,
            en: `Rule 💣: Saw 💣 → Press ${enFirst} 1 time FIRST (${enForbid} forbidden).`
          });
        }
      }
    };
  }

  /**
   * Factory for the Finale Rule
   */
  function createFinaleRule(lastColor = "purple", id = "rule_finale_purple_last") {
    const viLast = COLOR_NAMES.vi[lastColor];
    const enLast = COLOR_NAMES.en[lastColor];

    return {
      id,
      group: "finale_cap",
      priority: 40,
      icon: "👑",
      lastColor,
      description: {
        vi: `Luôn kết thúc bằng cách nhấn nút ${viLast} 1 lần ở CUỐI CÙNG!`,
        en: `Always finish by pressing the ${enLast} button 1 time LAST!`
      },
      apply(plan) {
        plan.addLastCount(lastColor, 1);
        plan.addTrace({
          ruleId: this.id,
          vi: `Luật 👑: Luôn nhấn ${viLast} 1 lần ở CUỐI CÙNG.`,
          en: `Rule 👑: Always press ${enLast} 1 time LAST.`
        });
      }
    };
  }

  const FAKE_RULE_VARIANTS = {
    bolt_add: {
      vi: "Luật giả (không có hiệu lực): Khi nhìn thấy ⚡, nhấn thêm nút VÀNG 1 lần. Hãy bỏ qua luật này!",
      en: "Fake Rule (no effect): When you see ⚡, add 1 press of YELLOW. Ignore this rule!"
    },
    moon_zero: {
      vi: "Luật giả (không có hiệu lực): Khi nhìn thấy 🌙, không nhấn nút nào. Hãy bỏ qua luật này!",
      en: "Fake Rule (no effect): When you see 🌙, do NOT press any button. Ignore this rule!"
    },
    crown_last: {
      vi: "Luật giả (không có hiệu lực): Luôn kết thúc bằng cách nhấn nút TÍM 1 lần. Hãy bỏ qua luật này!",
      en: "Fake Rule (no effect): Always finish by pressing the PURPLE button 1 time. Ignore this rule!"
    }
  };

  /**
   * Factory for a FAKE rule (Round 20+): it is announced like a real rule but
   * its `apply` is a no-op, so it never changes the required answer.
   */
  function createFakeRule(id = "rule_fake_1", variantKey = null) {
    const keys = Object.keys(FAKE_RULE_VARIANTS);
    const key = FAKE_RULE_VARIANTS[variantKey]
      ? variantKey
      : keys[Math.floor(Math.random() * keys.length)];
    const variant = FAKE_RULE_VARIANTS[key];
    return {
      id,
      group: id,
      priority: 80,
      icon: "🎭",
      isFake: true,
      variantKey: key,
      description: {
        vi: variant.vi,
        en: variant.en
      },
      apply() {}
    };
  }

  /**
   * Factory for the Odd-Fruit Rule:
   * "Nhấn màu của loại quả CÓ MÀU KHÁC BIỆT với các quả còn lại."
   * Each rule instance is tied to one fruit family via `fruitSet.ruleId`.
   */
  function createFruitOddRule({
    id = "rule_fruit_odd_1",
    group = "stimulus_fruit_1",
    pressCount = 1,
    exampleSet = null
  } = {}) {
    const count = pressCount === 2 ? 2 : 1;
    const example = exampleSet || buildFruitSet({ ruleId: id, size: 4 });
    const exampleEmojis = example.fruits.map((fruit) => fruit.emoji).join(" ");
    const oddFruit = example.fruits.find((fruit) => fruit.isOdd) || example.fruits[0];
    const viOdd = COLOR_NAMES.vi[example.oddColor] || "VÀNG";
    const enOdd = COLOR_NAMES.en[example.oddColor] || "YELLOW";

    return {
      id,
      group,
      priority: 60,
      icon: "🍎",
      pressCount: count,
      description: {
        vi: `Khi thấy một nhóm quả, nhấn màu của loại quả CÓ MÀU KHÁC BIỆT với các quả còn lại! Ví dụ: ${exampleEmojis} → quả ${oddFruit.vi} màu ${viOdd} → nhấn ${viOdd}${count > 1 ? ` ${count} lần` : " 1 lần"}.`,
        en: `When you see a group of fruits, press the color of the fruit whose color is DIFFERENT from the rest! Example: ${exampleEmojis} → ${oddFruit.en} is ${enOdd} → press ${enOdd}${count > 1 ? ` ${count} times` : " 1 time"}.`
      },
      apply(plan, context) {
        const fruitSet = context.fruitSet;
        if (!fruitSet || fruitSet.ruleId !== this.id) return;
        plan.onlySingleColorCount(fruitSet.oddColor, count);
        const viOddColor = COLOR_NAMES.vi[fruitSet.oddColor] || fruitSet.oddColor;
        const enOddColor = COLOR_NAMES.en[fruitSet.oddColor] || fruitSet.oddColor;
        const viOddFruit =
          (fruitSet.fruits.find((fruit) => fruit.isOdd) || {}).vi || "quả";
        const enOddFruit =
          (fruitSet.fruits.find((fruit) => fruit.isOdd) || {}).en || "fruit";
        plan.addTrace({
          ruleId: this.id,
          vi: `Luật Quả 🍎: ${viOddFruit} có màu ${viOddColor} khác với các quả còn lại → Nhấn ${viOddColor} ${count} lần.`,
          en: `Fruit Rule 🍎: ${enOddFruit} is ${enOddColor}, different from the rest → Press ${enOddColor} ${count} time(s).`
        });
      }
    };
  }

  const RULES_CATALOG = {
    rule_dog_red: createDogRule("red", "rule_dog_red"),
    rule_parity_blue_red: createParityRule("blue", "red", false, "rule_parity_blue_red"),
    rule_bomb_yellow_first: createBombRule("yellow", "black", "rule_bomb_yellow_first"),
    rule_parity_white_blue: createParityRule("white", "blue", true, "rule_parity_white_blue"),
    rule_finale_purple_last: createFinaleRule("purple", "rule_finale_purple_last"),
    rule_lion_zero: createLionZeroRule(),
    rule_fake_1: createFakeRule("rule_fake_1", "bolt_add"),
    rule_fake_2: createFakeRule("rule_fake_2", "moon_zero")
  };

  class TargetPlanBuilder {
    constructor(baseSpec) {
      this.baseSpec = baseSpec;
      this.firstCounts = {};
      this.baseMainCounts = {};
      this.ruleMainCounts = {};
      this.mainOrderedSteps = null;
      this.lastCounts = {};
      this.forbiddenColors = new Set();
      this.trace = [];
      this.numericResolved = false;

      this._initBase();
    }

    _initBase() {
      if (!this.baseSpec) return;

      if (this.baseSpec.explanation) {
        this.trace.push({
          ruleId: "base",
          vi: this.baseSpec.explanation.vi,
          en: this.baseSpec.explanation.en
        });
      }

      if (this.baseSpec.type === "direct_counts") {
        const counts = this.baseSpec.counts || {};
        for (const [color, count] of Object.entries(counts)) {
          if (count > 0) {
            this.baseMainCounts[color] = (this.baseMainCounts[color] || 0) + count;
          }
        }
      } else if (this.baseSpec.type === "sequence") {
        this.mainOrderedSteps = (this.baseSpec.steps || [])
          .filter((s) => s.count > 0)
          .map((s) => ({ color: s.color, count: s.count }));
      }
    }

    setNumericColor(color, count) {
      this.numericResolved = true;
      if (color && count > 0) {
        this.ruleMainCounts[color] = (this.ruleMainCounts[color] || 0) + count;
      }
    }

    finalizeUnhandledNumeric() {
      if (this.baseSpec && this.baseSpec.type === "numeric_result" && !this.numericResolved) {
        const val = this.baseSpec.value || 0;
        const fallbackColor = this.baseSpec.fallbackColor || "red";
        if (val > 0) {
          this.baseMainCounts[fallbackColor] = (this.baseMainCounts[fallbackColor] || 0) + val;
        }
        this.numericResolved = true;
      }
    }

    addFirstCount(color, count) {
      if (count > 0) {
        this.firstCounts[color] = (this.firstCounts[color] || 0) + count;
      }
    }

    addMainCount(color, count) {
      if (count > 0) {
        this.ruleMainCounts[color] = (this.ruleMainCounts[color] || 0) + count;
      }
    }

    setMainCount(color, count) {
      if (count <= 0) {
        delete this.ruleMainCounts[color];
      } else {
        this.ruleMainCounts[color] = count;
      }
    }

    /**
     * Clears all other button presses and sets ONLY `color` to `count`.
     * Used by each Animal Rule: "Khi nhìn thấy một con vật cụ thể chỉ ấn nút ... 1 lần và không ấn nút khác".
     */
    onlySingleColorCount(color, count = 1) {
      this.numericResolved = true;
      this.firstCounts = {};
      this.baseMainCounts = {};
      this.ruleMainCounts = {};
      this.mainOrderedSteps = null;
      this.lastCounts = {};
      if (color && count > 0) {
        this.ruleMainCounts[color] = count;
      }
    }

    addLastCount(color, count) {
      if (count > 0) {
        this.lastCounts[color] = (this.lastCounts[color] || 0) + count;
      }
    }

    /**
     * Clears every planned press so the round requires zero presses.
     * Used by the Lion Rule.
     */
    forceZero() {
      this.numericResolved = true;
      this.firstCounts = {};
      this.baseMainCounts = {};
      this.ruleMainCounts = {};
      this.mainOrderedSteps = null;
      this.lastCounts = {};
    }

    removeMainColor(color) {
      let removed = 0;
      if (this.baseMainCounts[color]) {
        removed += this.baseMainCounts[color];
        delete this.baseMainCounts[color];
      }
      if (this.ruleMainCounts[color]) {
        removed += this.ruleMainCounts[color];
        delete this.ruleMainCounts[color];
      }
      if (this.mainOrderedSteps) {
        this.mainOrderedSteps = this.mainOrderedSteps.filter((step) => {
          if (step.color === color) {
            removed += step.count;
            return false;
          }
          return true;
        });
      }
      return removed;
    }

    forbidColor(color) {
      this.forbiddenColors.add(color);
    }

    /**
     * Redirects RULE-DERIVED colors from `oldColor` to `newColor`.
     * Explicit prompt colors (base counts and ordered steps) are intentionally NOT remapped.
     * The old color is not forbidden, so its button remains pressable.
     */
    remapRuleColor(oldColor, newColor) {
      this.finalizeUnhandledNumeric();
      let moved = 0;

      if (this.firstCounts[oldColor]) {
        const c = this.firstCounts[oldColor];
        moved += c;
        delete this.firstCounts[oldColor];
        if (oldColor !== newColor) {
          this.firstCounts[newColor] = (this.firstCounts[newColor] || 0) + c;
        }
      }

      if (this.ruleMainCounts[oldColor]) {
        const c = this.ruleMainCounts[oldColor];
        moved += c;
        delete this.ruleMainCounts[oldColor];
        if (oldColor !== newColor) {
          this.ruleMainCounts[newColor] = (this.ruleMainCounts[newColor] || 0) + c;
        }
      }

      if (this.lastCounts[oldColor]) {
        const c = this.lastCounts[oldColor];
        moved += c;
        delete this.lastCounts[oldColor];
        if (oldColor !== newColor) {
          this.lastCounts[newColor] = (this.lastCounts[newColor] || 0) + c;
        }
      }

      if (this.forbiddenColors.has(oldColor)) {
        this.forbiddenColors.delete(oldColor);
        if (oldColor !== newColor) {
          this.forbiddenColors.add(newColor);
        }
        moved++;
      }

      return moved;
    }

    addTrace(entry) {
      this.trace.push(entry);
    }

    build() {
      this.finalizeUnhandledNumeric();

      const phases = [];

      const firstEntries = Object.entries(this.firstCounts).filter(([, c]) => c > 0);
      if (firstEntries.length > 0) {
        phases.push({
          id: "first",
          mode: "multiset",
          counts: Object.fromEntries(firstEntries)
        });
      }

      if (this.mainOrderedSteps && this.mainOrderedSteps.length > 0) {
        for (const step of this.mainOrderedSteps) {
          phases.push({
            id: "main_seq",
            mode: "strict_step",
            counts: { [step.color]: step.count }
          });
        }
      }

      const mergedMainCounts = { ...this.baseMainCounts };
      for (const [color, count] of Object.entries(this.ruleMainCounts)) {
        mergedMainCounts[color] = (mergedMainCounts[color] || 0) + count;
      }
      const mainEntries = Object.entries(mergedMainCounts).filter(([, c]) => c > 0);
      if (mainEntries.length > 0) {
        phases.push({
          id: "main",
          mode: "multiset",
          counts: Object.fromEntries(mainEntries)
        });
      }

      const lastEntries = Object.entries(this.lastCounts).filter(([, c]) => c > 0);
      if (lastEntries.length > 0) {
        phases.push({
          id: "last",
          mode: "multiset",
          counts: Object.fromEntries(lastEntries)
        });
      }

      const totalPresses = phases.reduce(
        (sum, p) => sum + Object.values(p.counts).reduce((a, b) => a + b, 0),
        0
      );

      return {
        phases,
        totalPresses,
        forbiddenColors: Array.from(this.forbiddenColors),
        trace: this.trace
      };
    }
  }

  class RuleEngine {
    constructor(catalog = RULES_CATALOG) {
      this.catalog = { ...catalog };
      this.activeRulesMap = new Map();
      this.activationHistory = [];
    }

    reset(customCatalog = null) {
      if (customCatalog) {
        this.catalog = { ...RULES_CATALOG, ...customCatalog };
      }
      this.activeRulesMap.clear();
      this.activationHistory = [];
    }

    registerDynamicRule(ruleObj) {
      this.catalog[ruleObj.id] = ruleObj;
    }

    activateRule(ruleId) {
      const rule = this.catalog[ruleId];
      if (!rule) {
        throw new Error(`Unknown ruleId: ${ruleId}`);
      }
      const existing = this.activeRulesMap.get(rule.group) || null;
      if (existing && existing.id === rule.id) {
        return { rule, replacedRule: null, isNew: false };
      }
      this.activeRulesMap.set(rule.group, rule);
      this.activationHistory.push({
        ruleId: rule.id,
        replacedRuleId: existing ? existing.id : null
      });
      return {
        rule,
        replacedRule: existing,
        isNew: true
      };
    }

    getActiveRules() {
      return Array.from(this.activeRulesMap.values()).sort((a, b) => a.priority - b.priority);
    }

    resolveRoundPlan(roundData) {
      const builder = new TargetPlanBuilder(roundData.baseSpec);
      const context = {
        roundNumber: roundData.round,
        baseSpec: roundData.baseSpec,
        stimuli: roundData.stimuli || [],
        availableButtons: roundData.buttons || ["red"],
        litButton: roundData.litButton || null,
        fruitSet: roundData.fruitSet || null
      };

      const activeRules = this.getActiveRules();
      for (const rule of activeRules) {
        rule.apply(builder, context);
      }

      return builder.build();
    }
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.RULES_CATALOG = RULES_CATALOG;
  global.PressGame.RuleEngine = RuleEngine;
  const RULE_FACTORIES = {
    createDogRule,
    createAnimalRule,
    createLionZeroRule,
    createParityRule,
    createBombRule,
    createFinaleRule,
    createFruitOddRule,
    createFakeRule,
    buildFruitSet,
    FRUIT_COLORS,
    FAKE_RULE_VARIANTS: Object.keys(FAKE_RULE_VARIANTS)
  };
  global.PressGame.RuleFactories = RULE_FACTORIES;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      RULES_CATALOG,
      RuleEngine,
      TargetPlanBuilder,
      RuleFactories: RULE_FACTORIES
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
