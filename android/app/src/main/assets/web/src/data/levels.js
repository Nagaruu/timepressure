/**
 * Truly Dynamic & Randomized 60-Round Campaign Generator (Tiếng Việt & English)
 *
 * Progression:
 * - Rounds 1–3 (Easy): 5s, Red button only (['red']), max 3 presses per round.
 * - Rounds 4–10 (Medium): 7s, 2–3 buttons (['red', 'blue'] at R4, ['red', 'blue', 'yellow'] at R5–10).
 *   Includes forward sequences (Xanh -> Đỏ -> Vàng), reverse sequences (Vàng -> Đỏ -> Xanh),
 *   lit button conditions ("Nhấn nút Xanh khi nút Vàng sáng"), and memory seeding.
 * - Rounds 11–19 (Hard): base 9s, 4–5 buttons with SHUFFLED positions every round,
 *   "Vòng trước nút nào sáng?", memory recall 5–6 rounds later, Stroop ink-color questions,
 *   everyday knowledge questions, and the Lion Rule.
 * - Rounds 15–60: 1–2 questions ask the player to repeat the exact buttons pressed
 *   in the previous round (same color, count, and order).
 * - Rounds 20+ (6 Buttons): two Odd-Fruit rules are introduced at random rounds in R20–34
 *   and their fruit groups appear at random later rounds.
 * - Extra question kinds: color mixing, longest color name, and vowel counting.
 * - Dog/cat/mouse rules and appearances are spread through R4–39.
 * - Each run randomly assigns one of dog/cat/mouse/lion to zero, 1–2 others to additive,
 *   and the rest to exclusive.
 * - The lion rule is introduced early, but the lion appears exactly once in R40–60.
 * - Any round needing more than 6 presses gets time = presses + 3 seconds.
 * - Reverse-sequence rounds get 1 extra second on top of the resolved time.
 */
(function (global) {
  const { RuleFactories, RuleEngine } = global.PressGame || require("./rules.js");

  const ANIMALS = ["cat", "mouse", "dog"];
  const STIMULI = [...ANIMALS, "lion"];
  const TOTAL_ROUNDS = 60;
  const ANIMAL_SCHEDULE_END = 39;
  const DOG_MIN_ROUND = 50;
  const DOG_MAX_ROUND = 58;
  const LION_SIGHTING_MIN = 40;
  const LION_SIGHTING_MAX = 60;
  const HIGH_PRESS_TIME_THRESHOLD = 6;
  const HIGH_PRESS_EXTRA_SECONDS = 3;
  const REVERSE_SEQUENCE_EXTRA_SECONDS = 1;
  const ANIMAL_RULE_DELAY_MIN = 2;
  const ANIMAL_RULE_DELAY_MAX = 6;
  const ANIMAL_APPEARANCE_MIN_GAP = 3;
  const PARITY_RULE_INTRO_ROUND = 5;
  const REPEAT_PREVIOUS_MIN_ROUND = 15;
  const NUMERIC_RESULT_KINDS = new Set(["parity_math", "trivia"]);
  const EXACT_COUNT_KINDS = new Set([
    "simple_count",
    "zero",
    "cond_red",
    "direct_color",
    "dual_color",
    "true_false_verify",
    "stroop_color",
    "prev_lit_button",
    "memory_set",
    "color_mix",
    "longest_color_name",
    "animal_appearance"
  ]);

  function promptDeclaresExactCount(kind, memoryInfo = null) {
    if (kind === "memory_recall") {
      return Boolean(memoryInfo && memoryInfo.type !== "number");
    }
    return EXACT_COUNT_KINDS.has(kind);
  }


  const TRIVIA_QUESTIONS = [
    {
      id: "duck_legs",
      value: 2,
      vi: "Vịt đi bằng mấy chân?",
      en: "How many legs does a duck walk on?",
      expVi: "Vịt có 2 chân",
      expEn: "A duck has 2 legs"
    },
    {
      id: "week_days",
      value: 7,
      vi: "Một tuần có mấy ngày?",
      en: "How many days are there in a week?",
      expVi: "Một tuần có 7 ngày",
      expEn: "A week has 7 days"
    },
    {
      id: "cat_legs",
      value: 4,
      vi: "Con mèo có mấy chân?",
      en: "How many legs does a cat have?",
      expVi: "Con mèo có 4 chân",
      expEn: "A cat has 4 legs"
    },
    {
      id: "spider_legs",
      value: 8,
      vi: "Con nhện có mấy chân?",
      en: "How many legs does a spider have?",
      expVi: "Con nhện có 8 chân",
      expEn: "A spider has 8 legs"
    },
    {
      id: "triangle_sides",
      value: 3,
      vi: "Hình tam giác có mấy cạnh?",
      en: "How many sides does a triangle have?",
      expVi: "Hình tam giác có 3 cạnh",
      expEn: "A triangle has 3 sides"
    },
    {
      id: "hand_fingers",
      value: 5,
      vi: "Một bàn tay có mấy ngón?",
      en: "How many fingers are on one hand?",
      expVi: "Một bàn tay có 5 ngón",
      expEn: "One hand has 5 fingers"
    },
    {
      id: "rainbow_colors",
      value: 7,
      vi: "Cầu vồng có mấy màu?",
      en: "How many colors are in a rainbow?",
      expVi: "Cầu vồng có 7 màu",
      expEn: "A rainbow has 7 colors"
    },
    {
      id: "year_seasons",
      value: 4,
      vi: "Một năm có mấy mùa?",
      en: "How many seasons are there in a year?",
      expVi: "Một năm có 4 mùa",
      expEn: "A year has 4 seasons"
    },
    {
      id: "bike_wheels",
      value: 2,
      vi: "Xe đạp có mấy bánh?",
      en: "How many wheels does a bicycle have?",
      expVi: "Xe đạp có 2 bánh",
      expEn: "A bicycle has 2 wheels"
    },
    {
      id: "chopstick_pair",
      value: 2,
      vi: "Một đôi đũa có mấy chiếc?",
      en: "How many chopsticks are in one pair?",
      expVi: "Một đôi đũa có 2 chiếc",
      expEn: "One pair has 2 chopsticks"
    },
    {
      id: "month_31_days",
      value: 7,
      vi: "Một năm có mấy tháng có 31 ngày?",
      en: "How many months have 31 days in a year?",
      expVi: "Có 7 tháng có 31 ngày",
      expEn: "7 months have 31 days"
    },
    {
      id: "chicken_legs",
      value: 2,
      vi: "Con gà có mấy chân?",
      en: "How many legs does a chicken have?",
      expVi: "Con gà có 2 chân",
      expEn: "A chicken has 2 legs"
    },
    {
      id: "dog_legs",
      value: 4,
      vi: "Con chó có mấy chân?",
      en: "How many legs does a dog have?",
      expVi: "Con chó có 4 chân",
      expEn: "A dog has 4 legs"
    },
    {
      id: "square_sides",
      value: 4,
      vi: "Hình vuông có mấy cạnh?",
      en: "How many sides does a square have?",
      expVi: "Hình vuông có 4 cạnh",
      expEn: "A square has 4 sides"
    },
    {
      id: "pentagon_sides",
      value: 5,
      vi: "Hình ngũ giác có mấy cạnh?",
      en: "How many sides does a pentagon have?",
      expVi: "Hình ngũ giác có 5 cạnh",
      expEn: "A pentagon has 5 sides"
    }
  ];

  const COLOR_VI = {
    red: "ĐỎ",
    blue: "XANH",
    yellow: "VÀNG",
    black: "ĐEN",
    white: "TRẮNG",
    purple: "TÍM"
  };

  const COLOR_EN = {
    red: "RED",
    blue: "BLUE",
    yellow: "YELLOW",
    black: "BLACK",
    white: "WHITE",
    purple: "PURPLE"
  };

  const FRUIT_INTRO_MIN_ROUND = 20;
  const FRUIT_INTRO_MAX_ROUND = 34;
  const FRUIT_INTRO_MIN_GAP = 3;
  const FRUIT_APPEARANCES_PER_RULE = 2;
  const FRUIT_APPEARANCE_GAP_MIN = 1;
  const FRUIT_APPEARANCE_GAP_MAX = 6;

  const MIX_RECIPES = [
    { a: "red", b: "blue", result: "purple" }
  ];

  const MIX_VERBS_VI = ["pha với", "trộn với", "kết hợp với"];
  const MIX_VERBS_EN = ["mixed with", "blended with", "combined with"];

  const VOWEL_WORDS = {
    vi: [
      "ÁP LỰC",
      "THỜI GIAN",
      "CHIẾN THẮNG",
      "BÌNH TĨNH",
      "TẬP TRUNG",
      "NĂNG LƯỢNG",
      "KIÊN NHẪN",
      "TỐC ĐỘ",
      "MÀU SẮC",
      "CẢM XÚC",
      "QUYẾT TÂM",
      "SÁNG TẠO",
      "ĐỒNG ĐỘI",
      "TỰ TIN"
    ],
    en: [
      "PRESSURE",
      "FOCUS",
      "COLOR",
      "SIGNAL",
      "BUTTON",
      "VICTORY",
      "CHALLENGE",
      "MOMENTUM",
      "ACCURACY",
      "PATIENCE",
      "BALANCE",
      "TARGET",
      "TIMING"
    ]
  };

  function stripDiacritics(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  function countVowels(word, lang) {
    const normalized = stripDiacritics(String(word)).toLowerCase();
    const vowelSet = lang === "en" ? "aeiou" : "aeiouy";
    let count = 0;
    for (const char of normalized) {
      if (vowelSet.includes(char)) count++;
    }
    return count;
  }

  function getColorNames(lang) {
    return lang === "en" ? COLOR_EN : COLOR_VI;
  }

  function getColorLengths(buttons, lang) {
    const names = getColorNames(lang);
    return buttons.map((color) => ({
      color,
      length: (names[color] || color).length
    }));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Gradual difficulty ramp: 0 before Round 20, rising to 1 at Round 60.
   */
  function getDifficultyProgress(round) {
    if (!Number.isFinite(round) || round < 20) return 0;
    return Math.min(1, (round - 20) / 40);
  }

  /**
   * Chance that a lit-button round shows a DIFFERENT button (trap -> press nothing).
   * Low before R20, then rises gradually from R20 to R60.
   */
  function getLitTrapChance(round) {
    if (!Number.isFinite(round) || round < 20) return 0.1;
    return 0.15 + 0.35 * getDifficultyProgress(round);
  }

  /**
   * Scales a maximum press count upward as the campaign progresses.
   */
  function scaleMaxCount(round, baseMax, extraAtEnd) {
    return baseMax + Math.round(getDifficultyProgress(round) * extraAtEnd);
  }

  /**
   * Shuffles an array of buttons and ensures the order differs from `prevButtons`
   * so the player visibly sees the buttons swap/scramble positions.
   */
  function shuffleButtonsDifferent(buttons, prevButtons) {
    if (!buttons || buttons.length <= 1) return [...(buttons || [])];
    let candidate = shuffle(buttons);
    if (prevButtons && prevButtons.length === buttons.length) {
      let attempts = 0;
      while (
        attempts < 10 &&
        candidate.every((col, idx) => col === prevButtons[idx])
      ) {
        candidate = shuffle(buttons);
        attempts++;
      }
      if (candidate.every((col, idx) => col === prevButtons[idx])) {
        // Force swap first two
        [candidate[0], candidate[1]] = [candidate[1], candidate[0]];
      }
    }
    return candidate;
  }

  /**
   * Diverse numeric generators that produce a target number using varied question styles.
   */
  function makeDiverseNumericPrompt(targetVal) {
    const styles = ["arith", "digit_sum", "max_min", "missing_num", "double_half", "count_list"];
    const style = pickOne(styles);

    if (style === "digit_sum" && targetVal >= 2) {
      const d1 = randInt(1, targetVal - 1);
      const d2 = targetVal - d1;
      const num = d1 * 10 + d2;
      return {
        vi: `Tổng 2 chữ số của ${num} = ?`,
        en: `Sum of digits of ${num} = ?`,
        expVi: `Cơ bản: ${d1} + ${d2} = ${targetVal}.`,
        expEn: `Base: ${d1} + ${d2} = ${targetVal}.`
      };
    }

    if (style === "max_min") {
      const isMax = Math.random() < 0.5;
      if (isMax && targetVal >= 2) {
        const other = randInt(1, targetVal - 1);
        const pair = shuffle([targetVal, other]);
        return {
          vi: `Số lớn hơn giữa ${pair[0]} và ${pair[1]}?`,
          en: `Larger number between ${pair[0]} and ${pair[1]}?`,
          expVi: `Cơ bản: Số lớn hơn là ${targetVal}.`,
          expEn: `Base: Larger number is ${targetVal}.`
        };
      } else {
        const other = randInt(targetVal + 1, targetVal + 4);
        const pair = shuffle([targetVal, other]);
        return {
          vi: `Số nhỏ hơn giữa ${pair[0]} và ${pair[1]}?`,
          en: `Smaller number between ${pair[0]} and ${pair[1]}?`,
          expVi: `Cơ bản: Số nhỏ hơn là ${targetVal}.`,
          expEn: `Base: Smaller number is ${targetVal}.`
        };
      }
    }

    if (style === "missing_num") {
      const a = randInt(1, 5);
      const sum = a + targetVal;
      return {
        vi: `${a} + ? = ${sum}`,
        en: `${a} + ? = ${sum}`,
        expVi: `Cơ bản: ${sum} - ${a} = ${targetVal}.`,
        expEn: `Base: ${sum} - ${a} = ${targetVal}.`
      };
    }

    if (style === "double_half" && targetVal % 2 === 0) {
      const half = targetVal / 2;
      return {
        vi: `Gấp đôi của ${half} = ?`,
        en: `Double of ${half} = ?`,
        expVi: `Cơ bản: ${half} × 2 = ${targetVal}.`,
        expEn: `Base: ${half} × 2 = ${targetVal}.`
      };
    }

    if (style === "count_list" && targetVal <= 4) {
      const askOdd = Math.random() < 0.5;
      const odds = shuffle([1, 3, 5, 7, 9]);
      const evens = shuffle([2, 4, 6, 8]);
      const chosen = askOdd
        ? [...odds.slice(0, targetVal), ...evens.slice(0, 4 - targetVal)]
        : [...evens.slice(0, targetVal), ...odds.slice(0, 4 - targetVal)];
      const listStr = shuffle(chosen).join(", ");
      return {
        vi: `Có mấy số ${askOdd ? "LẺ" : "CHẴN"} trong: ${listStr}?`,
        en: `How many ${askOdd ? "ODD" : "EVEN"} numbers in: ${listStr}?`,
        expVi: `Cơ bản: Có ${targetVal} số ${askOdd ? "lẻ" : "chẵn"}.`,
        expEn: `Base: There are ${targetVal} ${askOdd ? "odd" : "even"} numbers.`
      };
    }

    const op = randInt(1, 3);
    if (op === 1 && targetVal >= 2) {
      const a = randInt(1, targetVal - 1);
      const b = targetVal - a;
      return {
        vi: `${a} + ${b} = ?`,
        en: `${a} + ${b} = ?`,
        expVi: `Cơ bản: ${a} + ${b} = ${targetVal}.`,
        expEn: `Base: ${a} + ${b} = ${targetVal}.`
      };
    }
    if (op === 2) {
      const b = randInt(2, 6);
      const a = targetVal + b;
      return {
        vi: `${a} - ${b} = ?`,
        en: `${a} - ${b} = ?`,
        expVi: `Cơ bản: ${a} - ${b} = ${targetVal}.`,
        expEn: `Base: ${a} - ${b} = ${targetVal}.`
      };
    }
    const b = randInt(2, 3);
    const a = targetVal * b;
    return {
      vi: `${a} ÷ ${b} = ?`,
      en: `${a} ÷ ${b} = ?`,
      expVi: `Cơ bản: ${a} ÷ ${b} = ${targetVal}.`,
      expEn: `Base: ${a} ÷ ${b} = ${targetVal}.`
    };
  }

  /**
   * Generates a randomized Red-only task for Rounds 1–3.
   * Strictly capped at max 3 presses per round!
   */
  function buildRedOnlyTask(kind, stimuli = []) {
    if (kind === "zero") {
      return {
        stimuli: [...stimuli],
        prompt: { vi: "Không nhấn nút nào!", en: "Do NOT press!" },
        baseSpec: {
          type: "direct_counts",
          counts: {},
          explanation: { vi: "Cơ bản: Không nhấn (0 lần).", en: "Base: Press nothing (0 times)." }
        }
      };
    }

    if (kind === "icon_count") {
      const iconFamily = pickOne([
        { prefix: "stars", labelVi: "ngôi sao", labelEn: "star", counts: [2, 3] },
        { prefix: "gems", labelVi: "viên kim cương", labelEn: "gem", counts: [2, 3] },
        { prefix: "fire", labelVi: "ngọn lửa", labelEn: "flame", counts: [2, 3] }
      ]);
      const count = pickOne(iconFamily.counts); // Max 3
      return {
        stimuli: [`${iconFamily.prefix}${count}`, ...stimuli],
        prompt: {
          vi: `Nhấn theo số ${iconFamily.labelVi}`,
          en: `Press once per ${iconFamily.labelEn}`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { red: count },
          explanation: {
            vi: `Cơ bản: Có ${count} ${iconFamily.labelVi} → Nhấn ĐỎ ${count} lần.`,
            en: `Base: ${count} ${iconFamily.labelEn}s → Press RED ${count} times.`
          }
        }
      };
    }

    if (kind === "math_red") {
      const target = randInt(1, 3); // Max 3 presses
      const q = makeDiverseNumericPrompt(target);
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `${q.vi} (Nhấn bấy nhiêu lần)`,
          en: `${q.en} (Press that many times)`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { red: target },
          explanation: {
            vi: `${q.expVi} → Nhấn ĐỎ ${target} lần.`,
            en: `${q.expEn} → Press RED ${target} times.`
          }
        }
      };
    }

    if (kind === "cond_red") {
      const a = randInt(2, 9);
      let b = randInt(2, 9);
      if (a === b) b++;
      const isGreater = a > b;
      const nTrue = randInt(2, 3); // Max 3
      const nFalse = 1;
      const ans = isGreater ? nTrue : nFalse;
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `Nếu ${a} > ${b} nhấn ${nTrue} lần, sai nhấn ${nFalse} lần`,
          en: `If ${a} > ${b} press ${nTrue}×, else ${nFalse}×`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { red: ans },
          explanation: {
            vi: `Cơ bản: ${a} ${isGreater ? ">" : "<"} ${b} → Nhấn ĐỎ ${ans} lần.`,
            en: `Base: ${a} ${isGreater ? ">" : "<"} ${b} → Press RED ${ans} times.`
          }
        }
      };
    }

    const n = randInt(1, 3);
    return {
      stimuli: [...stimuli],
      prompt: { vi: `Nhấn ${n} lần`, en: `Press ${n} times` },
      baseSpec: {
        type: "direct_counts",
        counts: { red: n },
        explanation: { vi: `Cơ bản: Nhấn ĐỎ ${n} lần.`, en: `Base: Press RED ${n} times.` }
      }
    };
  }

  /**
   * Compresses a press history into ordered steps, merging consecutive presses
   * of the same color (e.g. red, red, blue -> RED x2, BLUE x1).
   */
  function compressPressHistory(pressHistory) {
    const steps = [];
    for (const press of pressHistory || []) {
      const color = press && press.color;
      if (!color) continue;
      const last = steps[steps.length - 1];
      if (last && last.color === color) {
        last.count++;
      } else {
        steps.push({ color, count: 1 });
      }
    }
    return steps;
  }

  /**
   * Builds the runtime base spec + prompt for the "repeat last round's presses"
   * question. The answer is the exact ordered sequence the player pressed.
   */
  function buildRepeatPreviousRound(pressHistory) {
    const steps = compressPressHistory(pressHistory);
    if (steps.length === 0) {
      return {
        prompt: {
          vi: "Vòng trước bạn không nhấn nút nào — hãy không nhấn nút nào!",
          en: "You pressed nothing last round — press nothing!"
        },
        baseSpec: {
          type: "direct_counts",
          counts: {},
          explanation: {
            vi: "Cơ bản: Vòng trước bạn không nhấn nút nào → Không nhấn nút nào (0 lần).",
            en: "Base: You pressed nothing last round → Press nothing (0 times)."
          }
        }
      };
    }

    const viSeq = steps.map((step) => `${COLOR_VI[step.color]} ${step.count} lần`).join(" ➔ ");
    const enSeq = steps.map((step) => `${COLOR_EN[step.color]} ${step.count}×`).join(" ➔ ");
    return {
      prompt: {
        vi: "Hãy nhấn lại đúng các nút bạn đã nhấn ở vòng trước (đúng thứ tự và số lần)",
        en: "Press the same buttons you pressed last round (same order and counts)"
      },
      baseSpec: {
        type: "sequence",
        steps,
        explanation: {
          vi: `Cơ bản: Vòng trước bạn đã nhấn ${viSeq} → nhấn lại y hệt.`,
          en: `Base: You pressed ${enSeq} last round → repeat exactly.`
        }
      }
    };
  }

  /**
   * Resolves the runtime time limit for a repeat-previous question, applying the
   * same "high press count" fairness rule used during campaign generation.
   */
  function resolveRepeatTimeLimit(baseTimeLimit, totalPresses) {
    if (totalPresses > HIGH_PRESS_TIME_THRESHOLD) {
      return Math.max(
        baseTimeLimit,
        totalPresses + HIGH_PRESS_EXTRA_SECONDS
      );
    }
    return baseTimeLimit;
  }

  /**
    * Generates a randomized multi-color task for Rounds 4–60.
    */
  function buildMultiColorTask({
    round = 1,
    buttons,
    kind,
    stimuli = [],
    activeAnimal = null,
    animalColor = "red",
    prevLitButton = null,
    memoryInfo = null,
    lang = "vi",
    fruitInfo = null
  }) {
    const hasAnimal = Boolean(activeAnimal && stimuli.includes(activeAnimal));
    const hasBomb = stimuli.includes("bomb");

    const selectableColors = buttons.filter((c) => {
      if (hasAnimal && c === animalColor) return false;
      if (hasBomb && (c === "black" || c === "yellow")) return false;
      return true;
    });

    // Fruit odd-one-out round: the answer is resolved by the fruit rule.
    if (kind === "fruit_odd" && fruitInfo && fruitInfo.fruitSet) {
      const fruitSet = fruitInfo.fruitSet;
      const fruitRow = fruitSet.fruits
        .map((fruit) => `<span class="fruit-emoji">${fruit.emoji}</span>`)
        .join("");
      return {
        stimuli: [...stimuli],
        fruitSet,
        prompt: {
          vi: "Nhấn màu của loại quả CÓ MÀU KHÁC BIỆT với các quả còn lại!",
          en: "Press the color of the fruit that is DIFFERENT from the rest!"
        },
        promptHtml: {
          vi: `<span class="fruit-row">${fruitRow}</span><br>Nhấn màu của loại quả CÓ MÀU KHÁC BIỆT với các quả còn lại!`,
          en: `<span class="fruit-row">${fruitRow}</span><br>Press the color of the fruit that is DIFFERENT from the rest!`
        },
        baseSpec: {
          type: "direct_counts",
          counts: {}
        }
      };
    }

    // Color-mixing question: only combinations whose result is a real button.
    if (kind === "color_mix") {
      const recipe = MIX_RECIPES.find(
        (item) =>
          buttons.includes(item.a) &&
          buttons.includes(item.b) &&
          buttons.includes(item.result)
      );
      if (recipe) {
        const flip = Math.random() < 0.5;
        const first = flip ? recipe.b : recipe.a;
        const second = flip ? recipe.a : recipe.b;
        const result = recipe.result;
        const count = 1;
        const verbVi = pickOne(MIX_VERBS_VI);
        const verbEn = pickOne(MIX_VERBS_EN);
        return {
          stimuli: [...stimuli],
          colorMix: { first, second, result, count },
          prompt: {
            vi: `${COLOR_VI[first]} ${verbVi} ${COLOR_VI[second]} ra màu gì? Nhấn màu đó ${count} lần!`,
            en: `What color does ${COLOR_EN[first]} ${verbEn} ${COLOR_EN[second]} make? Press that color ${count} time!`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [result]: count },
            explanation: {
              vi: `Cơ bản: ${COLOR_VI[first]} ${verbVi} ${COLOR_VI[second]} ra màu ${COLOR_VI[result]} → Nhấn ${COLOR_VI[result]} ${count} lần.`,
              en: `Base: ${COLOR_EN[first]} ${verbEn} ${COLOR_EN[second]} makes ${COLOR_EN[result]} → Press ${COLOR_EN[result]} ${count} time.`
            }
          }
        };
      }
    }

    // Longest color-name question, computed from the buttons of this round.
    if (kind === "longest_color_name") {
      const lengths = getColorLengths(buttons, lang);
      const maxLength = Math.max(...lengths.map((item) => item.length));
      const longestColors = lengths
        .filter((item) => item.length === maxLength)
        .map((item) => item.color);
      const names = getColorNames(lang);
      if (longestColors.length === 1) {
        const targetColor = longestColors[0];
        const targetName = names[targetColor];
        return {
          stimuli: [...stimuli],
          longestColorNames: { lang, maxLength, colors: longestColors },
          prompt: {
            vi: "Nhấn nút có tên màu DÀI NHẤT (nhiều ký tự nhất)!",
            en: "Press the button whose color name is the LONGEST (most characters)!"
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [targetColor]: 1 },
            explanation: {
              vi: `Cơ bản: Tên màu dài nhất là ${targetName} (${maxLength} ký tự) → Nhấn ${targetName} 1 lần.`,
              en: `Base: The longest color name is ${targetName} (${maxLength} characters) → Press ${targetName} 1 time.`
            }
          }
        };
      }

      const viNames = longestColors.map((color) => COLOR_VI[color]).join(", ");
      const enNames = longestColors.map((color) => COLOR_EN[color]).join(", ");
      const counts = {};
      for (const color of longestColors) counts[color] = 1;
      return {
        stimuli: [...stimuli],
        longestColorNames: { lang, maxLength, colors: longestColors },
        prompt: {
          vi: `Nhấn TẤT CẢ các nút có tên màu DÀI NHẤT (${viNames}), mỗi nút 1 lần!`,
          en: `Press ALL buttons with the LONGEST color name (${enNames}), 1 time each!`
        },
        baseSpec: {
          type: "direct_counts",
          counts,
          explanation: {
            vi: `Cơ bản: Các màu dài nhất (${maxLength} ký tự) là ${viNames} → Nhấn mỗi nút 1 lần.`,
            en: `Base: The longest color names (${maxLength} characters) are ${enNames} → Press each button 1 time.`
          }
        }
      };
    }

    // Vowel-count question: the answer is the number of vowels in a word.
    if (kind === "vowel_count") {
      const wordPool = VOWEL_WORDS[lang] || VOWEL_WORDS.vi;
      const candidates = wordPool
        .map((word) => ({ word, count: countVowels(word, lang) }))
        .filter((item) => item.count > 0 && item.count <= 6);
      if (candidates.length > 0) {
        const picked = pickOne(candidates);
        const targetColor =
          selectableColors.length > 0 ? pickOne(selectableColors) : pickOne(buttons);
        const viTarget = COLOR_VI[targetColor];
        const enTarget = COLOR_EN[targetColor];
        return {
          stimuli: [...stimuli],
          vowelQuestion: {
            word: picked.word,
            count: picked.count,
            targetColor
          },
          prompt: {
            vi: `Từ "${picked.word}" có bao nhiêu nguyên âm? Nhấn ${viTarget} bấy nhiêu lần!`,
            en: `How many vowels are in "${picked.word}"? Press ${enTarget} that many times!`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [targetColor]: picked.count },
            explanation: {
              vi: `Cơ bản: "${picked.word}" có ${picked.count} nguyên âm → Nhấn ${viTarget} ${picked.count} lần.`,
              en: `Base: "${picked.word}" has ${picked.count} vowels → Press ${enTarget} ${picked.count} times.`
            }
          }
        };
      }
    }

    // 0. Repeat the exact presses from the previous round (resolved at runtime).
    if (kind === "repeat_previous_presses") {
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: "Hãy nhấn lại đúng các nút bạn đã nhấn ở vòng trước (đúng thứ tự và số lần)",
          en: "Press the same buttons you pressed last round (same order and counts)"
        },
        baseSpec: {
          type: "repeat_previous_presses"
        }
      };
    }

    // 1. Forward Sequence: e.g. "Nhấn theo thứ tự: XANH ➔ ĐỎ ➔ VÀNG"
    if (kind === "sequence_forward" && selectableColors.length >= 2 && !hasAnimal) {
      const seqColors = shuffle(selectableColors);
      const viOrder = seqColors.map((c) => COLOR_VI[c]).join(" ➔ ");
      const enOrder = seqColors.map((c) => COLOR_EN[c]).join(" ➔ ");
      return {
        stimuli: [...stimuli],
        sequenceDirection: "forward",
        prompt: {
          vi: `Nhấn theo thứ tự: ${viOrder}`,
          en: `Press in order: ${enOrder}`
        },
        baseSpec: {
          type: "sequence",
          steps: seqColors.map((c) => ({ color: c, count: 1 })),
          explanation: {
            vi: `Cơ bản: Nhấn đúng thứ tự ${viOrder} (mỗi nút 1 lần).`,
            en: `Base: Press in exact order ${enOrder} (1 each).`
          }
        }
      };
    }

    // 2. Reverse Sequence: e.g. "Nhấn NGƯỢC LẠI theo thứ tự: VÀNG ➔ ĐỎ ➔ XANH"
    if (kind === "sequence_reverse" && selectableColors.length >= 2 && !hasAnimal) {
      const shownColors = shuffle(selectableColors);
      const reversedColors = [...shownColors].reverse();
      const viShown = shownColors.map((c) => COLOR_VI[c]).join(" ➔ ");
      const enShown = shownColors.map((c) => COLOR_EN[c]).join(" ➔ ");
      const viRev = reversedColors.map((c) => COLOR_VI[c]).join(" ➔ ");
      const enRev = reversedColors.map((c) => COLOR_EN[c]).join(" ➔ ");
      return {
        stimuli: [...stimuli],
        sequenceDirection: "reverse",
        prompt: {
          vi: `Nhấn NGƯỢC LẠI theo thứ tự: ${viShown}`,
          en: `Press in REVERSE order: ${enShown}`
        },
        baseSpec: {
          type: "sequence",
          steps: reversedColors.map((c) => ({ color: c, count: 1 })),
          explanation: {
            vi: `Cơ bản: Ngược lại của (${viShown}) là ${viRev}.`,
            en: `Base: Reverse of (${enShown}) is ${enRev}.`
          }
        }
      };
    }

    // 3. Lit Button Condition: e.g. "Nhấn nút XANH khi nút VÀNG sáng"
    // Most rounds light the named button, but occasionally a DIFFERENT button is lit
    // (a trap): then the correct action is to press nothing.
    if (kind === "when_lit_press" && selectableColors.length >= 2) {
      // Prefer Yellow as the lit button and Blue as the press button when both are available, or randomize
      let litCol;
      let pressCol;
      if (
        selectableColors.includes("yellow") &&
        selectableColors.includes("blue") &&
        Math.random() < 0.65
      ) {
        litCol = "yellow";
        pressCol = "blue";
      } else {
        const pair = shuffle(selectableColors).slice(0, 2);
        pressCol = pair[0];
        litCol = pair[1];
      }

      const isTrap = Math.random() < getLitTrapChance(round);
      const otherColors = buttons.filter((c) => c !== litCol);
      const actualLit = isTrap ? pickOne(otherColors) : litCol;

      return {
        stimuli: [...stimuli],
        forcedLitButton: actualLit,
        litCondition: {
          namedLit: litCol,
          pressColor: pressCol,
          expectedLit: actualLit,
          isTrap
        },
        prompt: {
          vi: `Nhấn nút ${COLOR_VI[pressCol]} khi nút ${COLOR_VI[litCol]} sáng (nút khác sáng thì không nhấn)`,
          en: `Press ${COLOR_EN[pressCol]} when ${COLOR_EN[litCol]} button is lit (press nothing if another button is lit)`
        },
        baseSpec: {
          type: "direct_counts",
          counts: isTrap ? {} : { [pressCol]: 1 },
          explanation: isTrap
            ? {
                vi: `Cơ bản: Nút ${COLOR_VI[actualLit]} đang sáng (không phải ${COLOR_VI[litCol]}) → Không nhấn nút nào.`,
                en: `Base: ${COLOR_EN[actualLit]} is lit (not ${COLOR_EN[litCol]}) → Press nothing.`
              }
            : {
                vi: `Cơ bản: Nút ${COLOR_VI[litCol]} đang sáng → Nhấn nút ${COLOR_VI[pressCol]} 1 lần.`,
                en: `Base: ${COLOR_EN[litCol]} button is lit → Press ${COLOR_EN[pressCol]} 1 time.`
              }
        }
      };
    }

    // 3b. Stroop Color: the color NAME is written in a DIFFERENT ink color.
    // The player must press the INK color, not the color named by the word.
    if (kind === "stroop_color" && selectableColors.length >= 2) {
      const [wordColor, inkColor] = shuffle(selectableColors).slice(0, 2);
      const count = 1;
      const viWord = COLOR_VI[wordColor];
      const enWord = COLOR_EN[wordColor];
      const viInk = COLOR_VI[inkColor];
      const enInk = COLOR_EN[inkColor];
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `Nhấn màu đang tô chữ: ${viWord} (1 lần)`,
          en: `Press the color the word is painted in: ${enWord} (1×)`
        },
        promptHtml: {
          vi: `Nhấn màu đang tô chữ: <span class="stroop-word stroop-ink-${inkColor}">${viWord}</span> (1 lần)`,
          en: `Press the color the word is painted in: <span class="stroop-word stroop-ink-${inkColor}">${enWord}</span> (1×)`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [inkColor]: count },
          explanation: {
            vi: `Cơ bản: Chữ "${viWord}" được tô màu ${viInk} → Nhấn ${viInk} ${count} lần.`,
            en: `Base: The word "${enWord}" is painted ${enInk} → Press ${enInk} ${count}×.`
          }
        }
      };
    }

    // 3c. Everyday knowledge question: the answer is the press count.
    if (kind === "trivia") {
      const q = pickOne(TRIVIA_QUESTIONS);
      return {
        stimuli: [...stimuli],
        triviaId: q.id,
        triviaValue: q.value,
        prompt: { vi: q.vi, en: q.en },
        baseSpec: {
          type: "numeric_result",
          value: q.value,
          fallbackColor: "red",
          explanation: {
            vi: `${q.expVi} → Nhấn ${q.value} lần.`,
            en: `${q.expEn} → Press ${q.value} times.`
          }
        }
      };
    }

    // 3d. Lion zero question: seeing the lion means pressing nothing.
    if (kind === "lion_zero") {
      return {
        stimuli: [...stimuli.filter((s) => s !== "lion"), "lion"],
        prompt: {
          vi: "Không nhấn nút nào!",
          en: "Do NOT press any button!"
        },
        baseSpec: {
          type: "direct_counts",
          counts: {},
          explanation: {
            vi: "Cơ bản: Nhìn thấy sư tử → Không nhấn nút nào (0 lần).",
            en: "Base: Saw the lion → Press nothing (0 times)."
          }
        }
      };
    }

    // 4. Previous Round Lit Button: "Vòng trước nút nào sáng?"
    if (kind === "prev_lit_button" && prevLitButton) {
      const count = randInt(1, scaleMaxCount(round, 2, 2));
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: count === 1
            ? `Vòng trước nút nào sáng? Nhấn nút đó!`
            : `Vòng trước nút nào sáng? Nhấn nút đó ${count} lần!`,
          en: count === 1
            ? `Which button was lit last round? Press it!`
            : `Which button was lit last round? Press it ${count} times!`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [prevLitButton]: count },
          explanation: {
            vi: `Cơ bản: Vòng trước nút ${COLOR_VI[prevLitButton]} sáng → Nhấn ${COLOR_VI[prevLitButton]} ${count} lần.`,
            en: `Base: ${COLOR_EN[prevLitButton]} was lit last round → Press ${COLOR_EN[prevLitButton]} ${count}×.`
          }
        }
      };
    }

    // 5. Memory Set (Number or Color) to be used 5–6 rounds later
    if (kind === "memory_set" && memoryInfo) {
      const targetColor = selectableColors.length > 0 ? pickOne(selectableColors) : "blue";
      if (memoryInfo.type === "number") {
        const num = memoryInfo.value;
        return {
          stimuli: [...stimuli],
          prompt: {
            vi: `Hãy nhớ số ${num}! (Vòng này nhấn ${COLOR_VI[targetColor]} ${num} lần)`,
            en: `Memorize number ${num}! (Now press ${COLOR_EN[targetColor]} ${num}×)`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [targetColor]: num },
            explanation: {
              vi: `Cơ bản: Nhấn ${COLOR_VI[targetColor]} ${num} lần (và ghi nhớ số ${num}).`,
              en: `Base: Press ${COLOR_EN[targetColor]} ${num}× (and memorize ${num}).`
            }
          }
        };
      } else {
        const memCol = memoryInfo.value;
        const count = randInt(1, 2);
        return {
          stimuli: [...stimuli],
          prompt: {
            vi: `Hãy nhớ màu ${COLOR_VI[memCol]}! (Vòng này nhấn ${COLOR_VI[memCol]} ${count} lần)`,
            en: `Memorize color ${COLOR_EN[memCol]}! (Now press ${COLOR_EN[memCol]} ${count}×)`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [memCol]: count },
            explanation: {
              vi: `Cơ bản: Nhấn ${COLOR_VI[memCol]} ${count} lần (và ghi nhớ màu ${COLOR_VI[memCol]}).`,
              en: `Base: Press ${COLOR_EN[memCol]} ${count}× (and memorize ${COLOR_EN[memCol]}).`
            }
          }
        };
      }
    }

    // 6. Memory Recall (5–6 rounds after Memory Set)
    if (kind === "memory_recall" && memoryInfo) {
      if (memoryInfo.type === "number") {
        const num = memoryInfo.value;
        const targetColor = selectableColors.length > 0 ? pickOne(selectableColors) : "blue";
        return {
          stimuli: [...stimuli],
          prompt: {
            vi: `Nhấn ${COLOR_VI[targetColor]} đúng bằng CON SỐ đã nhớ ở Vòng ${memoryInfo.fromRound}!`,
            en: `Press ${COLOR_EN[targetColor]} the NUMBER of times memorized in Round ${memoryInfo.fromRound}!`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [targetColor]: num },
            explanation: {
              vi: `Cơ bản: Số đã nhớ ở Vòng ${memoryInfo.fromRound} là ${num} → Nhấn ${COLOR_VI[targetColor]} ${num} lần.`,
              en: `Base: Number from Round ${memoryInfo.fromRound} was ${num} → Press ${COLOR_EN[targetColor]} ${num}×.`
            }
          }
        };
      } else {
        const memCol = memoryInfo.value;
        const count = randInt(2, scaleMaxCount(round, 3, 1));
        return {
          stimuli: [...stimuli],
          prompt: {
            vi: `Nhấn nút có MÀU đã nhớ ở Vòng ${memoryInfo.fromRound} (${count} lần)!`,
            en: `Press the COLOR memorized in Round ${memoryInfo.fromRound} (${count} times)!`
          },
          baseSpec: {
            type: "direct_counts",
            counts: { [memCol]: count },
            explanation: {
              vi: `Cơ bản: Màu đã nhớ ở Vòng ${memoryInfo.fromRound} là ${COLOR_VI[memCol]} → Nhấn ${COLOR_VI[memCol]} ${count} lần.`,
              en: `Base: Color from Round ${memoryInfo.fromRound} was ${COLOR_EN[memCol]} → Press ${COLOR_EN[memCol]} ${count}×.`
            }
          }
        };
      }
    }

    // 7. Ink-Color Majority Count (Round 20+):
    // A concise list of color words painted in different ink colors.
    // The player must count the INK colors, find the most frequent one, and press that color that many times.
    if (kind === "stroop_majority_count" && selectableColors.length >= 3) {
      const wordCount = 5;
      const majorityCount = 3;
      const otherCount = 2;

      const inkPool = shuffle(selectableColors).slice(0, 3);
      const majorityInk = inkPool[0];
      const otherInks = inkPool.slice(1);

      const inkSequence = [];
      for (let i = 0; i < majorityCount; i++) inkSequence.push(majorityInk);
      for (let i = 0; i < otherCount; i++) {
        inkSequence.push(otherInks[i % otherInks.length]);
      }
      const shuffledInks = shuffle(inkSequence);

      const words = shuffledInks.map((inkColor) => {
        const wordColor = pickOne(inkPool.filter((c) => c !== inkColor));
        return { wordColor, inkColor };
      });

      const buildWordsHtml = (lang) =>
        words
          .map(({ wordColor, inkColor }) => {
            const label = lang === "vi" ? COLOR_VI[wordColor] : COLOR_EN[wordColor];
            return `<span class="stroop-word stroop-ink-${inkColor}">${label}</span>`;
          })
          .join(" ");

      return {
        stimuli: [...stimuli],
        prompt: {
          vi: "Đếm màu chữ: Nhấn màu xuất hiện nhiều nhất (số lần bằng số chữ màu đó).",
          en: "Count ink colors: Press the most frequent color as many times as it appears."
        },
        promptHtml: {
          vi: `<div class="stroop-majority-wrapper"><div class="stroop-majority-header">Đếm màu chữ: Nhấn màu xuất hiện nhiều nhất</div><div class="stroop-words-row">${buildWordsHtml("vi")}</div></div>`,
          en: `<div class="stroop-majority-wrapper"><div class="stroop-majority-header">Count ink colors: Press most frequent color</div><div class="stroop-words-row">${buildWordsHtml("en")}</div></div>`
        },
        stroopMajority: {
          majorityInk,
          majorityCount,
          words: words.map(({ wordColor, inkColor }) => ({ wordColor, inkColor }))
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [majorityInk]: majorityCount },
          explanation: {
            vi: `Cơ bản: Màu ${COLOR_VI[majorityInk]} xuất hiện ${majorityCount} lần → Nhấn ${COLOR_VI[majorityInk]} ${majorityCount} lần.`,
            en: `Base: ${COLOR_EN[majorityInk]} appears ${majorityCount} times → Press ${COLOR_EN[majorityInk]} ${majorityCount} times.`
          }
        }
      };
    }

    if (kind === "parity_math") {
      const val = randInt(2, scaleMaxCount(round, 4, 1));
      const q = makeDiverseNumericPrompt(val);
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `${q.vi} (Nhấn bấy nhiêu lần)`,
          en: `${q.en} (Press that many times)`
        },
        baseSpec: {
          type: "numeric_result",
          value: val,
          fallbackColor: "red",
          explanation: { vi: q.expVi, en: q.expEn }
        }
      };
    }

    if (kind === "direct_color") {
      const targetColor = selectableColors.length > 0 ? pickOne(selectableColors) : "blue";
      const count = randInt(2, scaleMaxCount(round, 3, 2));
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `Nhấn ${COLOR_VI[targetColor]} ${count} lần`,
          en: `Press ${COLOR_EN[targetColor]} ${count} times`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [targetColor]: count },
          explanation: {
            vi: `Cơ bản: Nhấn ${COLOR_VI[targetColor]} ${count} lần.`,
            en: `Base: Press ${COLOR_EN[targetColor]} ${count} times.`
          }
        }
      };
    }

    if (kind === "dual_color" && selectableColors.length >= 2) {
      const [c1, c2] = shuffle(selectableColors).slice(0, 2);
      const maxEach = scaleMaxCount(round, 2, 2);
      const n1 = randInt(1, maxEach);
      const n2 = randInt(1, maxEach);
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `Nhấn ${COLOR_VI[c1]} ${n1} lần và ${COLOR_VI[c2]} ${n2} lần`,
          en: `Press ${COLOR_EN[c1]} ${n1}× and ${COLOR_EN[c2]} ${n2}×`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [c1]: n1, [c2]: n2 },
          explanation: {
            vi: `Cơ bản: Nhấn ${COLOR_VI[c1]} ${n1} lần + ${COLOR_VI[c2]} ${n2} lần.`,
            en: `Base: Press ${COLOR_EN[c1]} ${n1}× + ${COLOR_EN[c2]} ${n2}×.`
          }
        }
      };
    }

    if (kind === "true_false_verify" && selectableColors.length >= 2) {
      const [cTrue, cFalse] = shuffle(selectableColors).slice(0, 2);
      const a = randInt(2, 6);
      const b = randInt(2, 5);
      const isCorrect = Math.random() < 0.5;
      const shownSum = isCorrect ? a + b : a + b + pickOne([-1, 1, 2]);
      const n = randInt(2, scaleMaxCount(round, 3, 1));
      const chosen = isCorrect ? cTrue : cFalse;
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: `${a} + ${b} = ${shownSum}: Đúng nhấn ${COLOR_VI[cTrue]} ${n} lần, Sai nhấn ${COLOR_VI[cFalse]} ${n} lần`,
          en: `${a} + ${b} = ${shownSum}: True press ${COLOR_EN[cTrue]} ${n}×, False press ${COLOR_EN[cFalse]} ${n}×`
        },
        baseSpec: {
          type: "direct_counts",
          counts: { [chosen]: n },
          explanation: {
            vi: `Cơ bản: ${a} + ${b} = ${a + b} (${isCorrect ? "Đúng" : "Sai"}) → Nhấn ${COLOR_VI[chosen]} ${n} lần.`,
            en: `Base: ${a} + ${b} = ${a + b} (${isCorrect ? "True" : "False"}) → Press ${COLOR_EN[chosen]} ${n}×.`
          }
        }
      };
    }

    if (kind === "zero_with_stim" && hasAnimal) {
      return {
        stimuli: [...stimuli],
        prompt: {
          vi: "Không nhấn nút nào!",
          en: "Do NOT press any button!"
        },
        baseSpec: {
          type: "direct_counts",
          counts: {},
          explanation: {
            vi: "Cơ bản: Không nhấn nút nào (0 lần).",
            en: "Base: Press nothing (0 times)."
          }
        }
      };
    }

    const pool = selectableColors.length >= 2 ? shuffle(selectableColors) : ["yellow", "white"];
    const cTrue = pool[0];
    const cFalse = pool[1] || pool[0];
    const x = randInt(2, 9);
    let y = randInt(2, 9);
    if (x === y) y++;
    const isGreater = x > y;
    const n = randInt(2, 3);
    const chosen = isGreater ? cTrue : cFalse;
    return {
      stimuli: [...stimuli],
      prompt: {
        vi: `Nếu ${x} > ${y} nhấn ${COLOR_VI[cTrue]} ${n} lần, ngược lại nhấn ${COLOR_VI[cFalse]} ${n} lần`,
        en: `If ${x} > ${y} press ${COLOR_EN[cTrue]} ${n}×, else press ${COLOR_EN[cFalse]} ${n}×`
      },
      baseSpec: {
        type: "direct_counts",
        counts: { [chosen]: n },
        explanation: {
          vi: `Cơ bản: ${x} ${isGreater ? ">" : "<"} ${y} → Nhấn ${COLOR_VI[chosen]} ${n} lần.`,
          en: `Base: ${x} ${isGreater ? ">" : "<"} ${y} → Press ${COLOR_EN[chosen]} ${n}×.`
        }
      }
    };
  }

  /**
   * Returns base canonical buttons for a round number (1..60)
   */
  function getBaseButtonsForRound(r) {
    if (r <= 3) return ["red"];
    if (r === 4) return ["red", "blue"];
    if (r <= 10) return ["red", "blue", "yellow"];
    if (r <= 14) return ["red", "blue", "yellow", "black"];
    if (r <= 19) return ["red", "blue", "yellow", "black", "white"];
    return ["red", "blue", "yellow", "black", "white", "purple"]; // Round 20+: 6 buttons!
  }

  /**
   * Builds a randomized animal schedule: each rule is introduced first, then its
   * animal appears a random number of rounds later. Appearance rounds are kept
   * apart so animals never feel clustered, but the exact gaps vary every run.
   */
  function buildAnimalSchedule(
    blockedRounds,
    {
      animals = ["cat", "mouse"],
      minGap = ANIMAL_APPEARANCE_MIN_GAP,
      delayMin = ANIMAL_RULE_DELAY_MIN,
      delayMax = ANIMAL_RULE_DELAY_MAX,
      scheduleEnd = ANIMAL_SCHEDULE_END
    } = {}
  ) {
    const allowedRounds = [];
    for (let r = 4; r <= scheduleEnd; r++) {
      if (!blockedRounds.has(r)) allowedRounds.push(r);
    }

    const pairs = [];
    const usedRounds = new Set();
    let visitedNodes = 0;
    const maxNodes = 300000;

    function search() {
      visitedNodes++;
      if (visitedNodes > maxNodes) return false;
      if (pairs.length === animals.length) return true;

      const introCandidates = shuffle(
        allowedRounds.filter(
          (r) => !usedRounds.has(r) && r <= scheduleEnd - delayMin
        )
      );

      for (const introRound of introCandidates) {
        const delays = shuffle(
          Array.from(
            { length: delayMax - delayMin + 1 },
            (_value, index) => delayMin + index
          )
        );

        for (const delay of delays) {
          const appearanceRound = introRound + delay;
          if (appearanceRound > scheduleEnd) continue;
          if (blockedRounds.has(appearanceRound)) continue;
          if (usedRounds.has(appearanceRound)) continue;
          if (
            pairs.some(
              (pair) =>
                Math.abs(pair.appearanceRound - appearanceRound) < minGap
            )
          ) {
            continue;
          }

          usedRounds.add(introRound);
          usedRounds.add(appearanceRound);
          pairs.push({ introRound, appearanceRound });

          if (search()) return true;

          pairs.pop();
          usedRounds.delete(appearanceRound);
          usedRounds.delete(introRound);
        }
      }

      return false;
    }

    return search() ? pairs.slice() : null;
  }

  /**
   * Generates a fresh 60-round campaign AND dynamic rules for this run.
   */
  function generateGameLevels(lang = "vi") {
    const levels = [];
    const customCatalog = {};

    // 1. Dynamic Rules Setup
    const [oddCol1, evenCol1] = shuffle(["blue", "red"]);
    customCatalog.rule_parity_blue_red = RuleFactories.createParityRule(
      oddCol1,
      evenCol1,
      false,
      "rule_parity_blue_red"
    );

    customCatalog.rule_bomb_yellow_first = RuleFactories.createBombRule(
      "yellow",
      "black",
      "rule_bomb_yellow_first"
    );

    // 2. Schedule Memory Set & Recall (5 or 6 rounds apart!)
    // Memory 1: Set in Round 6 or 7 -> Recalled 5 or 6 rounds later (Round 11, 12, or 13)
    const mem1SetRound = pickOne([6, 7]);
    const mem1RecallRound = mem1SetRound + pickOne([5, 6]); // 11, 12, or 13
    const mem1IsNumber = Math.random() < 0.5;

    // Memory 2: Set in Round 13 or 14 (avoiding mem1RecallRound) -> Recalled 5 or 6 rounds later (Round 18, 19)
    const mem2SetRound = mem1RecallRound === 13 ? 14 : 13;
    const mem2RecallRound = mem2SetRound + pickOne([5, 6]); // 18, 19, or 20 -> clamp to 19
    const finalMem2RecallRound = Math.min(19, mem2RecallRound);
    const mem2IsNumber = !mem1IsNumber; // Ensure player experiences BOTH number memory and color memory!

    const mem1Data = {
      type: mem1IsNumber ? "number" : "color",
      value: mem1IsNumber ? randInt(2, 4) : pickOne(["red", "blue", "yellow"]),
      fromRound: mem1SetRound,
      recallRound: mem1RecallRound
    };

    const mem2Data = {
      type: mem2IsNumber ? "number" : "color",
      value: mem2IsNumber ? randInt(2, 4) : pickOne(["yellow", "black"]),
      fromRound: mem2SetRound,
      recallRound: finalMem2RecallRound
    };

    // 3. Rounds 1–3: Easy (5 seconds), Red button only, MAX 3 presses per round!
    const r1to3Templates = shuffle(["simple_count", "zero", "icon_count", "math_red", "cond_red"]);
    for (let r = 1; r <= 3; r++) {
      const taskKind = r1to3Templates[r - 1];
      const task = buildRedOnlyTask(taskKind, []);
      levels.push({
        round: r,
        phase: 1,
        timeLimit: 5,
        buttons: ["red"],
        litButton: null,
        newRuleId: null,
        questionKind: taskKind,
        promptDeclaresExactCount: promptDeclaresExactCount(taskKind),
        ...task
      });
    }

    // 4. Choose the Lion Rule intro round, avoiding memory rounds.
    const bombRounds = new Set([11, 22]);
    const lionExcluded = new Set([
      11,
      mem1RecallRound,
      mem2SetRound,
      finalMem2RecallRound
    ]);
    const lionCandidates = [12, 13, 14, 15, 16, 17].filter(
      (r) => !lionExcluded.has(r)
    );
    const lionRound = lionCandidates.length > 0 ? pickOne(lionCandidates) : 17;
    const lionSightingRound = randInt(LION_SIGHTING_MIN, LION_SIGHTING_MAX);

    // 5. Odd-Fruit rules: random intro rounds (not fixed R20/R23) and random appearances.
    const fruitIntroBlocked = new Set([
      ...bombRounds,
      lionRound,
      lionSightingRound,
      mem1SetRound,
      mem1RecallRound,
      mem2SetRound,
      finalMem2RecallRound
    ]);

    const fruitIntroCandidates = [];
    for (let r = FRUIT_INTRO_MIN_ROUND; r <= FRUIT_INTRO_MAX_ROUND; r++) {
      if (!fruitIntroBlocked.has(r)) fruitIntroCandidates.push(r);
    }

    let fruitIntroRounds = [];
    if (fruitIntroCandidates.length >= 2) {
      for (const candidate of shuffle(fruitIntroCandidates)) {
        if (fruitIntroRounds.length === 0) {
          fruitIntroRounds.push(candidate);
        } else if (
          fruitIntroRounds.every(
            (chosen) => Math.abs(chosen - candidate) >= FRUIT_INTRO_MIN_GAP
          )
        ) {
          fruitIntroRounds.push(candidate);
        }
        if (fruitIntroRounds.length === 2) break;
      }
    }
    if (fruitIntroRounds.length < 2) {
      fruitIntroRounds = [
        FRUIT_INTRO_MIN_ROUND,
        FRUIT_INTRO_MIN_ROUND + FRUIT_INTRO_MIN_GAP
      ];
    }
    fruitIntroRounds.sort((a, b) => a - b);

    const fruitRuleDefs = [
      { id: "rule_fruit_odd_1", group: "stimulus_fruit_1", pressCount: 1 },
      { id: "rule_fruit_odd_2", group: "stimulus_fruit_2", pressCount: 2 }
    ];

    const fruitRulesInfo = fruitRuleDefs.map((def, idx) => {
      const introRound = fruitIntroRounds[idx];
      const introButtons = getBaseButtonsForRound(introRound);
      customCatalog[def.id] = RuleFactories.createFruitOddRule({
        ...def,
        exampleSet: RuleFactories.buildFruitSet({
          buttons: introButtons,
          ruleId: def.id,
          size: 4
        })
      });
      return { ...def, introRound, appearanceRounds: [] };
    });

    const fruitAppearanceByRound = {};
    const usedFruitAppearanceRounds = new Set(fruitIntroRounds);

    fruitRulesInfo.forEach((info) => {
      let attempts = 0;
      while (
        info.appearanceRounds.length < FRUIT_APPEARANCES_PER_RULE &&
        attempts < 300
      ) {
        attempts++;
        const minRound = info.introRound + FRUIT_APPEARANCE_GAP_MIN;
        const maxRound = Math.min(
          TOTAL_ROUNDS,
          info.introRound + FRUIT_APPEARANCE_GAP_MAX + 6
        );
        if (minRound > TOTAL_ROUNDS) break;
        const candidate = randInt(minRound, maxRound);
        if (fruitIntroBlocked.has(candidate)) continue;
        if (usedFruitAppearanceRounds.has(candidate)) continue;
        if (
          info.appearanceRounds.some(
            (chosen) => Math.abs(chosen - candidate) < 2
          )
        ) {
          continue;
        }
        usedFruitAppearanceRounds.add(candidate);
        info.appearanceRounds.push(candidate);
      }

      if (info.appearanceRounds.length === 0) {
        for (let r = info.introRound + 2; r <= TOTAL_ROUNDS; r++) {
          if (fruitIntroBlocked.has(r) || usedFruitAppearanceRounds.has(r)) continue;
          usedFruitAppearanceRounds.add(r);
          info.appearanceRounds.push(r);
          break;
        }
      }

      info.appearanceRounds.forEach((r) => {
        const fruitSet = RuleFactories.buildFruitSet({
          buttons: getBaseButtonsForRound(r),
          ruleId: info.id
        });
        fruitAppearanceByRound[r] = { ...info, fruitSet };
      });
    });

    // 6. Build a randomized, non-clustered animal schedule.
    // Each rule is introduced first; its animal appears a random number of rounds later.
    const animalBlockedRounds = new Set([
      5,
      ...bombRounds,
      lionRound,
      lionSightingRound,
      mem1SetRound,
      mem1RecallRound,
      mem2SetRound,
      finalMem2RecallRound,
      ...fruitIntroRounds,
      ...Object.keys(fruitAppearanceByRound).map(Number)
    ]);

    let animalSchedule = buildAnimalSchedule(animalBlockedRounds, {
      animals: ["cat", "mouse"],
      scheduleEnd: ANIMAL_SCHEDULE_END
    });
    if (!animalSchedule) {
      animalSchedule = buildAnimalSchedule(animalBlockedRounds, {
        animals: ["cat", "mouse"],
        minGap: 2,
        delayMin: 2,
        delayMax: 8,
        scheduleEnd: ANIMAL_SCHEDULE_END
      });
    }
    if (!animalSchedule) {
      animalSchedule = buildAnimalSchedule(animalBlockedRounds, {
        animals: ["cat", "mouse"],
        minGap: 1,
        delayMin: 2,
        delayMax: 10,
        scheduleEnd: ANIMAL_SCHEDULE_END
      });
    }
    if (!animalSchedule) {
      throw new Error("Unable to build animal schedule");
    }

    // Schedule Dog separately for late-game (Round 50+)
    const dogIntroCandidates = [];
    for (let r = DOG_MIN_ROUND; r <= DOG_MAX_ROUND - ANIMAL_RULE_DELAY_MIN; r++) {
      if (!animalBlockedRounds.has(r)) dogIntroCandidates.push(r);
    }
    const dogIntroRound = pickOne(dogIntroCandidates.length > 0 ? dogIntroCandidates : [50, 51, 52]);
    const dogAppearanceCandidates = [];
    for (let r = dogIntroRound + ANIMAL_RULE_DELAY_MIN; r <= Math.min(TOTAL_ROUNDS, dogIntroRound + ANIMAL_RULE_DELAY_MAX); r++) {
      if (!animalBlockedRounds.has(r) && r !== dogIntroRound) dogAppearanceCandidates.push(r);
    }
    const dogAppearanceRound = pickOne(dogAppearanceCandidates.length > 0 ? dogAppearanceCandidates : [dogIntroRound + 3]);
    animalSchedule.push({ introRound: dogIntroRound, appearanceRound: dogAppearanceRound });

    const zeroStimulus = pickOne(STIMULI);
    const pressStimuli = shuffle(STIMULI.filter((key) => key !== zeroStimulus));
    const additiveStimuli = new Set(pressStimuli.slice(0, randInt(1, 2)));
    const getStimulusMode = (key) =>
      key === zeroStimulus
        ? "zero"
        : additiveStimuli.has(key)
          ? "additive"
          : "exclusive";

    // Cat and Mouse are early/mid game; Dog is placed in late-game (R50+)
    const earlyAnimals = shuffle(["cat", "mouse"]);
    const animalOrder = [...earlyAnimals, "dog"];
    const animalRuleIntroByRound = {};
    const animalAppearanceByRound = {};
    const animalIntroRoundSet = new Set();
    const animalAppearanceRoundSet = new Set();
    const usedAnimalColors = new Set();

    animalSchedule.forEach(({ introRound, appearanceRound }, idx) => {
      const animalKey = animalOrder[idx];
      const ruleId = `rule_animal_${animalKey}`;
      const mode = getStimulusMode(animalKey);
      let targetColor = null;
      if (mode !== "zero") {
        const availableColors = getBaseButtonsForRound(introRound);
        const unusedColors = availableColors.filter(
          (color) => !usedAnimalColors.has(color)
        );
        targetColor = pickOne(
          unusedColors.length > 0 ? unusedColors : availableColors
        );
        usedAnimalColors.add(targetColor);
      }

      const animalInfo = { animalKey, ruleId, targetColor, introRound, appearanceRound, mode };
      animalRuleIntroByRound[introRound] = animalInfo;
      animalAppearanceByRound[appearanceRound] = animalInfo;
      animalIntroRoundSet.add(introRound);
      animalAppearanceRoundSet.add(appearanceRound);
      customCatalog[ruleId] = RuleFactories.createAnimalRule(
        animalKey,
        targetColor,
        ruleId,
        mode
      );
    });

    const lionMode = getStimulusMode("lion");
    const lionRuleId =
      lionMode === "zero" ? "rule_lion_zero" : "rule_lion_press";
    let lionTargetColor = null;
    if (lionMode === "zero") {
      customCatalog[lionRuleId] = RuleFactories.createLionZeroRule();
    } else {
      const availableLionColors = getBaseButtonsForRound(lionRound);
      const unusedLionColors = availableLionColors.filter(
        (color) => !usedAnimalColors.has(color)
      );
      lionTargetColor = pickOne(
        unusedLionColors.length > 0 ? unusedLionColors : availableLionColors
      );
      usedAnimalColors.add(lionTargetColor);
      customCatalog[lionRuleId] = RuleFactories.createAnimalRule(
        "lion",
        lionTargetColor,
        lionRuleId,
        lionMode
      );
    }

    const lionInfo = {
      animalKey: "lion",
      ruleId: lionRuleId,
      targetColor: lionTargetColor,
      introRound: lionRound,
      appearanceRound: lionSightingRound,
      mode: lionMode
    };

    // 7. Lock in all reserved rule/memory rounds, then fill free rounds with required mechanics.
    const kindsByRound = {
      [PARITY_RULE_INTRO_ROUND]: "parity_math",
      11: "parity_math",
      [lionSightingRound]: "direct_color",
      [mem1SetRound]: "memory_set",
      [mem1RecallRound]: "memory_recall",
      [mem2SetRound]: "memory_set",
      [finalMem2RecallRound]: "memory_recall"
    };
    fruitIntroRounds.forEach((r) => {
      kindsByRound[r] = "direct_color";
    });
    Object.keys(fruitAppearanceByRound).forEach((r) => {
      kindsByRound[Number(r)] = "fruit_odd";
    });
    animalAppearanceRoundSet.forEach((r) => {
      kindsByRound[r] = "animal_appearance";
    });

    const reservedRounds = new Set(Object.keys(kindsByRound).map(Number));
    const freeRounds = [];
    for (let r = 4; r <= TOTAL_ROUNDS; r++) {
      if (!reservedRounds.has(r)) freeRounds.push(r);
    }

    const isNumericResultKind = (kind) => NUMERIC_RESULT_KINDS.has(kind);
    const isSequenceKind = (kind) =>
      kind === "sequence_forward" || kind === "sequence_reverse";
    const isWhenLitKind = (kind) => kind === "when_lit_press";
    const isStroopMajorityKind = (kind) => kind === "stroop_majority_count";
    const isColorMixKind = (kind) => kind === "color_mix";
    const canUseNumericResultAtRound = (round) =>
      round >= PARITY_RULE_INTRO_ROUND;
    const canUseSequenceAtRound = (round) => !bombRounds.has(round);
    const canUseWhenLitAtRound = (round) => !bombRounds.has(round);
    const canUseStroopMajorityAtRound = (round) =>
      round >= 20 && !bombRounds.has(round);
    const canUseColorMixAtRound = (round) =>
      round >= 20 && getBaseButtonsForRound(round).includes("purple");

    const assignedFreeRounds = new Set();
    const prevLitCandidates = freeRounds.filter((r) => r >= 6);
    if (prevLitCandidates.length > 0) {
      const prevLitRound = pickOne(prevLitCandidates);
      kindsByRound[prevLitRound] = "prev_lit_button";
      assignedFreeRounds.add(prevLitRound);
    }

    // Repeat-last-presses questions (Round 15+): 1–2 clean rounds, resolved at runtime.
    const repeatRoundSet = new Set();
    const repeatCandidates = shuffle(freeRounds).filter(
      (r) =>
        r >= REPEAT_PREVIOUS_MIN_ROUND &&
        !assignedFreeRounds.has(r) &&
        !bombRounds.has(r) &&
        !animalRuleIntroByRound[r] &&
        r !== lionRound
    );
    const repeatRoundCount = randInt(1, 2);
    for (const r of repeatCandidates) {
      if (repeatRoundSet.size >= repeatRoundCount) break;
      if (
        Array.from(repeatRoundSet).some((chosen) => Math.abs(chosen - r) === 1)
      ) {
        continue;
      }
      repeatRoundSet.add(r);
      kindsByRound[r] = "repeat_previous_presses";
      assignedFreeRounds.add(r);
    }

    const requiredMechanics = shuffle([
      "sequence_forward",
      "sequence_reverse",
      "when_lit_press",
      "stroop_color",
      "trivia"
    ]);
    requiredMechanics.forEach((kind) => {
      const targetRound = freeRounds.find(
        (r) =>
          !assignedFreeRounds.has(r) &&
          (!isSequenceKind(kind) || canUseSequenceAtRound(r)) &&
          (!isNumericResultKind(kind) || canUseNumericResultAtRound(r)) &&
          (!isWhenLitKind(kind) || canUseWhenLitAtRound(r))
      );
      if (targetRound === undefined) return;
      kindsByRound[targetRound] = kind;
      assignedFreeRounds.add(targetRound);
    });

    const extraMechanics = shuffle([
      "sequence_forward",
      "sequence_reverse",
      "when_lit_press",
      "direct_color",
      "dual_color",
      "true_false_verify",
      "parity_math",
      "stroop_color",
      "stroop_majority_count",
      "trivia",
      "color_mix",
      "longest_color_name",
      "vowel_count"
    ]);
    let extraIdx = 0;
    freeRounds.forEach((r) => {
      if (assignedFreeRounds.has(r)) return;
      let kind = extraMechanics[extraIdx % extraMechanics.length];
      extraIdx++;
      if (isSequenceKind(kind) && !canUseSequenceAtRound(r)) {
        kind = "direct_color";
      }
      if (isNumericResultKind(kind) && !canUseNumericResultAtRound(r)) {
        kind = "direct_color";
      }
      if (isWhenLitKind(kind) && !canUseWhenLitAtRound(r)) {
        kind = "direct_color";
      }
      if (isStroopMajorityKind(kind) && !canUseStroopMajorityAtRound(r)) {
        kind = "direct_color";
      }
      if (isColorMixKind(kind) && !canUseColorMixAtRound(r)) {
        kind = "direct_color";
      }
      kindsByRound[r] = kind;
    });

    // 6b. Fake rules (Round 20+): announced like real rules but with NO effect.
    // One appears in R20–34 and another in R35–60, never on a reserved rule round.
    const fakeVariantKeys = shuffle(RuleFactories.FAKE_RULE_VARIANTS || []);
    const fakeRuleBands = [
      { min: 20, max: 34, id: "rule_fake_1", variant: fakeVariantKeys[0] || null },
      { min: 35, max: 60, id: "rule_fake_2", variant: fakeVariantKeys[1] || null }
    ];
    const isFakeRuleRoundEligible = (r) =>
      !reservedRounds.has(r) &&
      !bombRounds.has(r) &&
      !repeatRoundSet.has(r) &&
      r !== lionRound &&
      !animalRuleIntroByRound[r];
    const fakeRuleRounds = {};
    const usedFakeRounds = new Set();
    fakeRuleBands.forEach((band) => {
      const candidates = [];
      for (let r = band.min; r <= band.max; r++) {
        if (!usedFakeRounds.has(r) && isFakeRuleRoundEligible(r)) {
          candidates.push(r);
        }
      }
      if (candidates.length === 0) return;
      const chosenRound = pickOne(candidates);
      usedFakeRounds.add(chosenRound);
      fakeRuleRounds[chosenRound] = band.id;
      customCatalog[band.id] = RuleFactories.createFakeRule(
        band.id,
        band.variant
      );
    });

    let prevButtons = ["red"];
    let prevLitButton = null;

    for (let r = 4; r <= TOTAL_ROUNDS; r++) {
      const timeLimit = r <= 10 ? 7 : 9;
      const baseButtons = getBaseButtonsForRound(r);
      // From Round 11 onwards, shuffle button positions every round!
      const buttons = r >= 11 ? shuffleButtonsDifferent(baseButtons, prevButtons) : [...baseButtons];
      prevButtons = buttons;

      // New rule introduced on this round (7s "LUẬT MỚI" screen)
      const introInfo = animalRuleIntroByRound[r] || null;
      const appearanceInfo = animalAppearanceByRound[r] || null;
      const fruitInfo = fruitAppearanceByRound[r] || null;
      let newRuleId = null;
      if (introInfo) newRuleId = introInfo.ruleId;
      else if (r === PARITY_RULE_INTRO_ROUND) newRuleId = "rule_parity_blue_red";
      else if (r === 11) newRuleId = "rule_bomb_yellow_first";
      else if (r === lionRound) newRuleId = lionInfo.ruleId;
      else if (fruitRulesInfo[0].introRound === r) newRuleId = fruitRulesInfo[0].id;
      else if (fruitRulesInfo[1].introRound === r) newRuleId = fruitRulesInfo[1].id;
      else if (fakeRuleRounds[r]) newRuleId = fakeRuleRounds[r];

      let kind = appearanceInfo ? "direct_color" : kindsByRound[r];
      if (isSequenceKind(kind) && !canUseSequenceAtRound(r)) {
        kind = "direct_color";
      }
      if (isNumericResultKind(kind) && !canUseNumericResultAtRound(r)) {
        kind = "direct_color";
      }

      // The rule intro round has no animal; the animal appears on a later random round.
      const stimuli = [];
      if (appearanceInfo) {
        stimuli.push(appearanceInfo.animalKey);
      }
      if (bombRounds.has(r)) {
        stimuli.push("bomb");
      }
      if (r === lionSightingRound) {
        stimuli.push("lion");
      }

      let memoryInfo = null;
      if (r === mem1SetRound || r === mem1RecallRound) memoryInfo = mem1Data;
      else if (r === mem2SetRound || r === finalMem2RecallRound) memoryInfo = mem2Data;

      const isLionSighting = r === lionSightingRound;
      const activeAnimal = appearanceInfo
        ? appearanceInfo.animalKey
        : isLionSighting
          ? "lion"
          : null;
      const animalColor = appearanceInfo
        ? appearanceInfo.targetColor
        : isLionSighting
          ? lionTargetColor
          : "red";

      const task = buildMultiColorTask({
        round: r,
        buttons,
        kind,
        stimuli,
        activeAnimal,
        animalColor,
        prevLitButton,
        memoryInfo,
        lang,
        fruitInfo
      });

      // Choose which button lights up (`litButton`) on this round
      let litButton = null;
      if (task.forcedLitButton) {
        litButton = task.forcedLitButton;
      } else if (r >= 5 && buttons.length > 0) {
        litButton = pickOne(buttons);
      }
      prevLitButton = litButton;

      levels.push({
        round: r,
        phase: r <= 10 ? 2 : r <= 19 ? 3 : 4,
        timeLimit,
        buttons,
        litButton,
        newRuleId,
        prompt: task.prompt,
        questionKind: kind,
        promptDeclaresExactCount: promptDeclaresExactCount(kind, memoryInfo),
        promptHtml: task.promptHtml || null,
        sequenceDirection: task.sequenceDirection || null,
        stimuli: task.stimuli,
        baseSpec: task.baseSpec,
        triviaId: task.triviaId || null,
        triviaValue: task.triviaValue !== undefined ? task.triviaValue : null,
        difficultyProgress: getDifficultyProgress(r),
        litCondition: task.litCondition || null,
        stroopMajority: task.stroopMajority || null,
        fruitSet: task.fruitSet || null,
        colorMix: task.colorMix || null,
        longestColorNames: task.longestColorNames || null,
        vowelQuestion: task.vowelQuestion || null
      });
    }

    levels.customCatalog = customCatalog;

    // Compute the effective time limit from the FINAL resolved plan.
    // High press counts get a fair window: time = presses + 3 seconds.
    const timingEngine = new RuleEngine(customCatalog);
    for (const level of levels) {
      if (level.newRuleId) timingEngine.activateRule(level.newRuleId);
      const plan = timingEngine.resolveRoundPlan(level);
      level.baseTimeLimit = level.timeLimit;
      level.expectedPresses = plan.totalPresses;
      let resolvedTime = level.timeLimit;
      if (plan.totalPresses > HIGH_PRESS_TIME_THRESHOLD) {
        resolvedTime = Math.max(
          resolvedTime,
          plan.totalPresses + HIGH_PRESS_EXTRA_SECONDS
        );
      }
      if (level.sequenceDirection === "reverse") {
        resolvedTime += REVERSE_SEQUENCE_EXTRA_SECONDS;
      }
      level.timeLimit = resolvedTime;
    }

    return levels;
  }

  const LEVELS_DATA = generateGameLevels();

  global.PressGame = global.PressGame || {};
  global.PressGame.LEVELS_DATA = LEVELS_DATA;
  global.PressGame.generateGameLevels = generateGameLevels;
  global.PressGame.buildRepeatPreviousRound = buildRepeatPreviousRound;
  global.PressGame.resolveRepeatTimeLimit = resolveRepeatTimeLimit;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      LEVELS_DATA,
      generateGameLevels,
      buildRepeatPreviousRound,
      resolveRepeatTimeLimit
    };
  }
})(typeof window !== "undefined" ? window : globalThis);
