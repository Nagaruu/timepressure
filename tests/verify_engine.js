/**
 * Automated verification suite for the 60-Round Randomized Campaign,
 * Cumulative Rule Engine (including the Odd-Fruit Rule) & AnswerValidator
 */
const assert = require("assert");
const { t } = require("../src/data/i18n.js");
const { RuleEngine, RULES_CATALOG, RuleFactories } = require("../src/data/rules.js");
const {
  generateGameLevels,
  buildRepeatPreviousRound,
  resolveRepeatTimeLimit
} = require("../src/data/levels.js");
const { AnswerValidator } = require("../src/engine/validator.js");

function getExpectedTimeLimit(level) {
  const normalTime =
    level.expectedPresses > 6
      ? level.expectedPresses + 3
      : level.baseTimeLimit;
  return normalTime + (level.sequenceDirection === "reverse" ? 1 : 0);
}

function runTests() {
  console.log("=== Running 60-Round Campaign, Rule Engine & Validator Tests ===");

  // 1. Verify Rule Intro header text is ONLY "LUẬT MỚI" / "NEW RULE"
  assert.strictEqual(t("vi", "newRuleTag"), "LUẬT MỚI", "Rule tag VI must be 'LUẬT MỚI'");
  assert.strictEqual(t("vi", "replacedRuleTag"), "LUẬT MỚI", "Replaced rule tag VI must be 'LUẬT MỚI'");
  assert.strictEqual(t("en", "newRuleTag"), "NEW RULE", "Rule tag EN must be 'NEW RULE'");
  assert.strictEqual(t("vi", "themeToggleToLight"), "Chuyển giao diện sáng");
  assert.strictEqual(t("en", "themeToggleToDark"), "Switch to dark mode");
  assert(
    t("vi", "helpTooltipItems").some((item) => item.includes("1 giây")),
    "VI help must mention the reverse-sequence extra second"
  );
  assert(
    t("en", "helpTooltipItems").some((item) => item.includes("1 extra second")),
    "EN help must mention the reverse-sequence extra second"
  );

  // Parity rule text must explicitly say the press count equals the result.
  assert(
    RULES_CATALOG.rule_parity_blue_red.description.vi.includes(
      "Kết quả ra bao nhiêu thì nhấn bấy nhiêu lần"
    ),
    "Parity rule VI must explain that press count equals the result"
  );
  assert(
    RULES_CATALOG.rule_parity_blue_red.description.en.includes(
      "Press exactly the result amount"
    ),
    "Parity rule EN must explain that press count equals the result"
  );
  assert(
    RULES_CATALOG.rule_parity_white_blue.description.vi.includes(
      "Kết quả ra bao nhiêu thì nhấn bấy nhiêu lần"
    ),
    "Replacement parity rule VI must explain that press count equals the result"
  );

  const firstRunPrompts = [];
  const seenNewKinds = new Set();
  let differencesFound = 0;
  const animalDelays = new Set();
  const animalAppearanceGaps = new Set();

  for (let run = 0; run < 10; run++) {
    const levels = generateGameLevels();
    assert.strictEqual(levels.length, 60, "Game must have 60 rounds");

    // Rounds 1–3: Easy (5s), Red only, max 3 presses per round
    for (let i = 0; i < 3; i++) {
      assert.deepStrictEqual(levels[i].buttons, ["red"], `Round ${i + 1} must be Red only`);
      assert.strictEqual(levels[i].timeLimit, 5, `Round ${i + 1} (Easy) must be 5s`);
      const redCount = levels[i].baseSpec.counts ? levels[i].baseSpec.counts.red || 0 : 0;
      assert(redCount <= 3, `Round ${i + 1} max presses must be <= 3, got ${redCount}`);
    }

    // Rounds 4–10: Medium (7s)
    assert.deepStrictEqual(levels[3].buttons, ["red", "blue"], "Round 4 must unlock Blue button");
    for (let i = 3; i < 10; i++) {
      assert.strictEqual(levels[i].baseTimeLimit, 7, `Round ${i + 1} (Medium) base time must be 7s`);
      assert.strictEqual(
        levels[i].timeLimit,
        getExpectedTimeLimit(levels[i]),
        `Round ${i + 1} medium timing must include the reverse-sequence bonus`
      );
    }

    // Rounds 11–60: Hard/finale (base 9s, extended when many presses are required), shuffled buttons
    for (let i = 10; i < 60; i++) {
      assert.strictEqual(levels[i].baseTimeLimit, 9, `Round ${i + 1} hard base time must be 9s`);
      assert.strictEqual(
        levels[i].timeLimit,
        getExpectedTimeLimit(levels[i]),
        `Round ${i + 1} hard timing must include the reverse-sequence bonus`
      );
      if (i > 10 && levels[i].buttons.length === levels[i - 1].buttons.length) {
        const sameOrder = levels[i].buttons.every((c, idx) => c === levels[i - 1].buttons[idx]);
        assert(!sameOrder, `Round ${i + 1} buttons must be shuffled differently from Round ${i}`);
      }
    }

    // Rounds 20–60: 6 pressable buttons, no physical locks
    for (let i = 19; i < 60; i++) {
      assert.strictEqual(levels[i].buttons.length, 6, `Round ${i + 1} must have 6 buttons`);
      assert(
        !levels[i].lockedButtons || levels[i].lockedButtons.length === 0,
        `Round ${i + 1} must not disable any button`
      );
    }
    // Odd-Fruit rules replace the old color-transfer rules at random rounds.
    const fruitIntroLevels = levels.filter(
      (level) => level.newRuleId && level.newRuleId.startsWith("rule_fruit_odd_")
    );
    assert.strictEqual(
      fruitIntroLevels.length,
      2,
      "Campaign must introduce 2 Odd-Fruit rules"
    );
    for (const level of fruitIntroLevels) {
      assert(
        level.round >= 20 && level.round <= 34,
        `Fruit rule intro must be in R20–R34, got R${level.round}`
      );
      assert.strictEqual(
        level.fruitSet,
        null,
        `Round ${level.round} fruit rule intro must not show fruits`
      );
      assert(
        levels.customCatalog[level.newRuleId],
        `Catalog must contain ${level.newRuleId}`
      );
      assert(
        levels.customCatalog[level.newRuleId].description.vi.includes(
          "KHÁC BIỆT"
        ),
        "Fruit rule must explain the odd color"
      );
      assert(
        levels.customCatalog[level.newRuleId].description.en.includes(
          "DIFFERENT"
        ),
        "Fruit rule EN text must explain the odd color"
      );
    }
    const fruitIntroRounds = fruitIntroLevels
      .map((level) => level.round)
      .sort((a, b) => a - b);
    assert(
      fruitIntroRounds[1] - fruitIntroRounds[0] >= 3,
      "Fruit rule intros must be at least 3 rounds apart"
    );

    const fruitAppearanceLevels = levels.filter((level) => level.fruitSet);
    assert(
      fruitAppearanceLevels.length >= 2,
      "Campaign must show fruit groups after the fruit rule intro"
    );
    for (const level of fruitAppearanceLevels) {
      const fruitSet = level.fruitSet;
      const rule = levels.customCatalog[fruitSet.ruleId];
      assert(rule, `Fruit round ${level.round} must reference a real rule`);
      const introRound = levels.find(
        (candidate) => candidate.newRuleId === rule.id
      ).round;
      assert(
        level.round > introRound,
        `Fruit round ${level.round} must appear after its intro R${introRound}`
      );
      assert.strictEqual(level.questionKind, "fruit_odd");
      assert(
        level.buttons.includes(fruitSet.oddColor),
        `Round ${level.round} odd fruit color must be pressable`
      );
      const oddFruits = fruitSet.fruits.filter((fruit) => fruit.isOdd);
      assert.strictEqual(
        oddFruits.length,
        1,
        `Round ${level.round} must contain exactly one odd fruit`
      );
      assert.strictEqual(
        oddFruits[0].color,
        fruitSet.oddColor,
        `Round ${level.round} odd fruit must carry the odd color`
      );
      assert(
        fruitSet.fruits.filter((fruit) => !fruit.isOdd).every(
          (fruit) => fruit.color === fruitSet.majorityColor
        ),
        `Round ${level.round} majority fruits must share one color`
      );
    }

    // Ordered forward/reverse sequences must use every active button exactly once.
    const sequenceLevels = levels.filter(
      (level) => level.baseSpec.type === "sequence"
    );
    assert(sequenceLevels.length >= 2, "Campaign must include sequence rounds");
    const orderedSequenceLevels = sequenceLevels.filter(
      (level) => level.sequenceDirection
    );
    assert(
      orderedSequenceLevels.length >= 2,
      "Campaign must include forward and reverse sequences"
    );
    for (const level of orderedSequenceLevels) {
      assert.strictEqual(
        level.baseSpec.steps.length,
        level.buttons.length,
        `Round ${level.round} sequence must use all ${level.buttons.length} buttons`
      );
      assert.strictEqual(
        new Set(level.baseSpec.steps.map((step) => step.color)).size,
        level.buttons.length,
        `Round ${level.round} sequence must not repeat or omit buttons`
      );
      assert(
        !level.stimuli.includes("bomb"),
        `Round ${level.round} sequence must not overlap the bomb rule`
      );
      assert(
        ["forward", "reverse"].includes(level.sequenceDirection),
        `Round ${level.round} sequence must declare its direction`
      );
      assert.strictEqual(
        level.timeLimit,
        getExpectedTimeLimit(level),
        `Round ${level.round} sequence timing must include the reverse bonus`
      );
      if (level.sequenceDirection === "reverse") {
        assert(
          level.prompt.vi.startsWith("Nhấn NGƯỢC LẠI theo thứ tự:"),
          `Round ${level.round} reverse sequence prompt must say NGƯỢC LẠI`
        );
      }
    }

    // Counted ordered sequences use 2–3 distinct buttons with per-step counts.
    const countedSequenceLevels = sequenceLevels.filter(
      (level) => level.questionKind === "sequence_counts"
    );
    for (const level of countedSequenceLevels) {
      assert(
        level.baseSpec.steps.length >= 2 && level.baseSpec.steps.length <= 3,
        `Round ${level.round} counted sequence must use 2–3 steps`
      );
      assert.strictEqual(
        new Set(level.baseSpec.steps.map((step) => step.color)).size,
        level.baseSpec.steps.length,
        `Round ${level.round} counted sequence must not repeat colors`
      );
      assert(
        level.baseSpec.steps.every((step) => step.count >= 1),
        `Round ${level.round} counted sequence counts must be positive`
      );
      assert(
        !level.stimuli.includes("bomb"),
        `Round ${level.round} counted sequence must not overlap the bomb rule`
      );
      assert.strictEqual(
        level.timeLimit,
        getExpectedTimeLimit(level),
        `Round ${level.round} counted sequence timing must be resolved correctly`
      );
    }

    // Verify new question mechanics appear in every generated campaign
    const allViPrompts = levels.map((l) => l.prompt.vi);
    assert(
      allViPrompts.some((p) => p.startsWith("Nhấn theo thứ tự:")),
      "Campaign must include forward sequence question"
    );
    assert(
      allViPrompts.some((p) => p.startsWith("Nhấn NGƯỢC LẠI theo thứ tự:")),
      "Campaign must include reverse sequence question"
    );
    assert(
      allViPrompts.some((p) => p.includes("khi nút") && p.includes("sáng")),
      "Campaign must include lit button question ('Nhấn nút ... khi nút ... sáng')"
    );
    const whenLitLevels = levels.filter((level) => level.litCondition);
    assert(whenLitLevels.length > 0, "Campaign must include lit-button questions");
    for (const level of whenLitLevels) {
      assert.strictEqual(
        level.litButton,
        level.litCondition.expectedLit,
        `Round ${level.round} lit button must match the expected lit color`
      );
      assert.strictEqual(
        level.litCondition.isTrap,
        level.litButton !== level.litCondition.namedLit,
        `Round ${level.round} lit trap flag must match the lit button`
      );
      assert(
        !level.stimuli.includes("bomb"),
        `Round ${level.round} lit-button question must not overlap the bomb`
      );
    }
    assert(
      allViPrompts.some((p) => p.startsWith("Vòng trước nút nào sáng?")),
      "Campaign must include previous round lit button question ('Vòng trước nút nào sáng?')"
    );
    assert(
      allViPrompts.some((p) => p.startsWith("Hãy nhớ số") || p.startsWith("Hãy nhớ màu")),
      "Campaign must include memory set question"
    );
    assert(
      allViPrompts.some((p) => p.includes("đã nhớ ở Vòng")),
      "Campaign must include memory recall question 5–6 rounds later"
    );
    assert(
      allViPrompts.some(
        (p) => p.startsWith("Nhấn màu đang tô chữ:") && p.includes("(1 lần)")
      ),
      "Campaign must include a Stroop ink-color question"
    );
    assert(
      levels.some((l) => l.triviaId),
      "Campaign must include an everyday knowledge trivia question"
    );
    const lionRuleIntroLevel = levels.find(
      (l) =>
        l.newRuleId &&
        levels.customCatalog[l.newRuleId] &&
        levels.customCatalog[l.newRuleId].group === "stimulus_lion"
    );
    assert(lionRuleIntroLevel, "Campaign must introduce the Lion Rule");
    const lionRule = levels.customCatalog[lionRuleIntroLevel.newRuleId];
    assert(
      ["zero", "additive", "exclusive"].includes(lionRule.mode),
      "Lion rule must declare its mode"
    );
    assert(
      !lionRuleIntroLevel.stimuli.includes("lion"),
      "Lion rule intro must not show the lion"
    );
    assert(lionRuleIntroLevel.round < 40, "Lion rule intro must be before R40");
    const lionSightingLevels = levels.filter((l) => l.stimuli.includes("lion"));
    assert.strictEqual(
      lionSightingLevels.length,
      1,
      "The lion must appear exactly once"
    );
    const lionSightingLevel = lionSightingLevels[0];
    assert(
      lionSightingLevel.round >= 40 && lionSightingLevel.round <= 60,
      `Lion must appear in R40–60, got R${lionSightingLevel.round}`
    );
    assert.strictEqual(
      lionSightingLevel.newRuleId,
      null,
      "Lion sighting must not introduce a new rule"
    );

    const parityRuleIntroRound = levels.find(
      (level) => level.newRuleId === "rule_parity_blue_red"
    ).round;
    for (const level of levels) {
      if (level.baseSpec.type !== "numeric_result") continue;
      assert(
        level.round >= parityRuleIntroRound,
        `Round ${level.round} has a numeric-result question before the Odd/Even rule is available`
      );
    }

    // New question mechanics: color mixing, longest color name, vowel count.
    const colorMixLevels = levels.filter((level) => level.colorMix);
    const longestNameLevels = levels.filter((level) => level.longestColorNames);
    const vowelLevels = levels.filter((level) => level.vowelQuestion);
    for (const level of colorMixLevels) {
      assert(
        level.round >= 20,
        `Color-mix question must start from R20, got R${level.round}`
      );
      assert(
        level.buttons.includes(level.colorMix.result),
        "Color-mix result must be a pressable button"
      );
      assert.strictEqual(level.colorMix.result, "purple");
      assert.strictEqual(level.colorMix.count, 1);
      assert.strictEqual(
        level.baseSpec.counts[level.colorMix.result],
        level.colorMix.count,
        `Round ${level.round} color-mix answer must equal the mixed color`
      );
      assert(
        level.prompt.vi.includes("ra màu gì"),
        "Color-mix VI prompt must ask which color results"
      );
    }
    for (const level of longestNameLevels) {
      const meta = level.longestColorNames;
      const lengths = level.buttons.map((color) => ({
        color,
        length: t(meta.lang, `colors.${color}`).length
      }));
      const maxLength = Math.max(...lengths.map((item) => item.length));
      const expectedColors = lengths
        .filter((item) => item.length === maxLength)
        .map((item) => item.color)
        .sort();
      assert.strictEqual(meta.maxLength, maxLength);
      assert.deepStrictEqual(
        [...meta.colors].sort(),
        expectedColors,
        `Round ${level.round} longest-color answer must match the language`
      );
      for (const color of expectedColors) {
        assert.strictEqual(
          level.baseSpec.counts[color],
          1,
          `Round ${level.round} must press ${color} once`
        );
      }
      assert.strictEqual(
        Object.keys(level.baseSpec.counts).length,
        expectedColors.length,
        `Round ${level.round} longest-color question must not press extra buttons`
      );
    }
    for (const level of vowelLevels) {
      const question = level.vowelQuestion;
      assert(question.count > 0, "Vowel count must be positive");
      assert(question.count <= 6, "Vowel count must stay small enough to press");
      assert(
        level.buttons.includes(question.targetColor),
        "Vowel-question target color must be pressable"
      );
      assert.strictEqual(
        level.baseSpec.counts[question.targetColor],
        question.count,
        `Round ${level.round} vowel answer must equal the number of vowels`
      );
      assert(
        level.prompt.vi.includes(question.word),
        "Vowel prompt must contain the generated word"
      );
    }

    if (colorMixLevels.length > 0) seenNewKinds.add("color_mix");
    if (longestNameLevels.length > 0) seenNewKinds.add("longest_color_name");
    if (vowelLevels.length > 0) seenNewKinds.add("vowel_count");

    // Fake rules: exactly one in R20–34 and one in R35–60, announced but inactive.
    const fakeIntroLevels = levels.filter((level) => {
      const rule = level.newRuleId && levels.customCatalog[level.newRuleId];
      return Boolean(rule && rule.isFake);
    });
    assert.strictEqual(
      fakeIntroLevels.length,
      2,
      "Campaign must announce exactly 2 fake rules"
    );
    const fakeRounds = fakeIntroLevels.map((level) => level.round).sort((a, b) => a - b);
    assert(
      fakeRounds[0] >= 20 && fakeRounds[0] <= 34,
      `First fake rule must appear in R20–34, got R${fakeRounds[0]}`
    );
    assert(
      fakeRounds[1] >= 35 && fakeRounds[1] <= 60,
      `Second fake rule must appear in R35–60, got R${fakeRounds[1]}`
    );
    for (const level of fakeIntroLevels) {
      const rule = levels.customCatalog[level.newRuleId];
      assert.strictEqual(rule.isFake, true, "Fake rule must be flagged as fake");
      assert(
        rule.description.vi.includes("không có hiệu lực"),
        "Fake rule VI text must state it has no effect"
      );
      assert(
        rule.description.en.includes("no effect"),
        "Fake rule EN text must state it has no effect"
      );
      assert.strictEqual(
        level.stimuli.length,
        0,
        `Round ${level.round} fake rule intro must not show any stimulus`
      );
      assert(
        !level.newRuleId.startsWith("rule_fruit_odd_"),
        `Round ${level.round} fake rule must not replace a fruit rule intro`
      );
      assert(
        !fruitIntroRounds.includes(level.round),
        `Round ${level.round} fake rule must not collide with fruit rule intros`
      );
    }

    // Repeat-previous-presses questions: 1–2 rounds from R15+, resolved at runtime.
    const repeatLevels = levels.filter(
      (level) => level.questionKind === "repeat_previous_presses"
    );
    assert(
      repeatLevels.length >= 1 && repeatLevels.length <= 2,
      `Campaign must include 1–2 repeat-previous questions, got ${repeatLevels.length}`
    );
    const repeatRounds = repeatLevels
      .map((level) => level.round)
      .sort((a, b) => a - b);
    for (const level of repeatLevels) {
      assert(
        level.round >= 15,
        `Repeat-previous question must start from R15, got R${level.round}`
      );
      assert.strictEqual(
        level.baseSpec.type,
        "repeat_previous_presses",
        `Round ${level.round} must use the dynamic repeat base spec`
      );
      assert.strictEqual(
        level.stimuli.length,
        0,
        `Round ${level.round} repeat question must not show stimuli`
      );
      assert.strictEqual(
        level.newRuleId,
        null,
        `Round ${level.round} repeat question must not introduce a rule`
      );
    }
    for (let i = 1; i < repeatRounds.length; i++) {
      assert(
        repeatRounds[i] - repeatRounds[i - 1] > 1,
        "Repeat-previous questions must not be in adjacent rounds"
      );
    }

    const animalNames = {
      dog: "chó",
      cat: "mèo",
      mouse: "chuột"
    };
    const animalKeys = Object.keys(animalNames);
    assert(
      !levels.some((level) => level.stimuli.includes("chicken")),
      "Chicken must be removed from the stimulus lineup"
    );
    assert(
      !levels.customCatalog.rule_animal_chicken,
      "Campaign must not generate a chicken rule"
    );
    const animalIntroLevels = levels.filter(
      (l) => l.newRuleId && l.newRuleId.startsWith("rule_animal_")
    );
    assert.strictEqual(animalIntroLevels.length, 3, "Campaign must introduce 3 separate animal rules");
    assert.strictEqual(
      new Set(animalIntroLevels.map((l) => l.round)).size,
      3,
      "Each animal rule must be introduced in its own round"
    );
    assert(
      animalIntroLevels.every(
        (l) => !animalKeys.some((key) => l.stimuli.includes(key))
      ),
      "Animal rule intro rounds must not show the animal"
    );

    const animalAppearanceLevels = levels.filter((l) =>
      animalKeys.some((key) => l.stimuli.includes(key))
    );
    assert.strictEqual(
      animalAppearanceLevels.length,
      3,
      "Campaign must contain exactly 3 animal appearance rounds"
    );
    const sortedAppearanceLevels = [...animalAppearanceLevels].sort(
      (a, b) => a.round - b.round
    );
    for (let i = 1; i < sortedAppearanceLevels.length; i++) {
      const gap = sortedAppearanceLevels[i].round - sortedAppearanceLevels[i - 1].round;
      assert(
        gap >= 3,
        `Animal appearances are too close: R${sortedAppearanceLevels[i - 1].round} and R${sortedAppearanceLevels[i].round}`
      );
      animalAppearanceGaps.add(gap);
    }

    const stimulusRules = [
      ...animalKeys.map((key) => levels.customCatalog[`rule_animal_${key}`]),
      lionRule
    ];
    const stimulusModes = stimulusRules.map((rule) => rule.mode);
    const zeroStimulusCount = stimulusModes.filter((mode) => mode === "zero").length;
    const additiveStimulusCount = stimulusModes.filter(
      (mode) => mode === "additive"
    ).length;
    const exclusiveStimulusCount = stimulusModes.filter(
      (mode) => mode === "exclusive"
    ).length;
    assert.strictEqual(
      zeroStimulusCount,
      1,
      `Each campaign needs exactly 1 zero stimulus, got ${zeroStimulusCount}`
    );
    assert(
      additiveStimulusCount >= 1 && additiveStimulusCount <= 2,
      `Each campaign needs 1–2 additive stimuli, got ${additiveStimulusCount}`
    );
    assert(
      exclusiveStimulusCount >= 1,
      "Each campaign needs at least 1 exclusive stimulus"
    );
    assert.strictEqual(
      new Set(stimulusRules.map((rule) => rule.group)).size,
      4,
      "The four stimuli must use separate rule groups"
    );
    assert(
      stimulusModes.every((mode) =>
        ["zero", "additive", "exclusive"].includes(mode)
      ),
      "Stimulus rules must be zero, additive, or exclusive"
    );

    for (const key of animalKeys) {
      const introLevel = levels.find(
        (l) => l.newRuleId === `rule_animal_${key}`
      );
      assert(introLevel, `Campaign must introduce rule_animal_${key}`);
      if (key === "dog") {
        assert(introLevel.round >= 50, `Dog intro must be at Round 50+, got R${introLevel.round}`);
      } else {
        assert(introLevel.round < 40, `Animal '${key}' intro must be before R40`);
      }
      assert(
        !introLevel.stimuli.includes(key),
        `Animal '${key}' must not appear in its rule intro round`
      );

      const roundsWithAnimal = levels.filter((l) => l.stimuli.includes(key));
      assert.strictEqual(
        roundsWithAnimal.length,
        1,
        `Animal '${key}' must appear exactly once in the campaign`
      );
      const appearanceLevel = roundsWithAnimal[0];
      if (key === "dog") {
        assert(appearanceLevel.round >= 52, `Dog appearance must be at Round 52+, got R${appearanceLevel.round}`);
      } else {
        assert(appearanceLevel.round < 40, `Animal '${key}' appearance must be before R40`);
      }
      const delay = appearanceLevel.round - introLevel.round;
      assert(
        delay >= 2,
        `Animal '${key}' must appear at least 2 rounds after its rule intro`
      );
      assert(
        delay <= 10,
        `Animal '${key}' should not appear too late after its rule intro`
      );
      animalDelays.add(delay);
      assert.strictEqual(
        appearanceLevel.newRuleId,
        null,
        "Animal appearance round must not also introduce a rule"
      );
      assert(
        !appearanceLevel.stimuli.includes("bomb"),
        "Animal appearance must not overlap the bomb"
      );
      assert(
        !appearanceLevel.stimuli.includes("lion"),
        "Animal appearance must not overlap the lion trap"
      );

      const rule = levels.customCatalog[introLevel.newRuleId];
      assert(rule, `Catalog must contain ${introLevel.newRuleId}`);
      assert.strictEqual(rule.animalKey, key, "Animal rule must target exactly one animal");
      assert.strictEqual(rule.group, `stimulus_${key}`, "Each animal rule needs its own group");
      assert(
        ["zero", "additive", "exclusive"].includes(rule.mode),
        `Animal '${key}' must declare its rule mode`
      );
      if (rule.mode === "zero") {
        assert.strictEqual(
          rule.targetColor,
          null,
          `Zero animal '${key}' must not have a target color`
        );
        assert(
          rule.description.vi.includes("KHÔNG nhấn"),
          `Zero animal '${key}' must explain zero presses`
        );
      } else {
        if (rule.mode === "additive") {
          assert(
            rule.description.vi.includes("nhấn thêm"),
            `Additive animal '${key}' must explain the extra press`
          );
        } else {
          assert(
            rule.description.vi.includes("không ấn nút khác"),
            `Exclusive animal '${key}' must forbid other presses`
          );
        }
        assert(
          introLevel.buttons.includes(rule.targetColor),
          "Animal target color must be selectable"
        );
        assert(
          appearanceLevel.buttons.includes(rule.targetColor),
          `Animal target ${rule.targetColor} must be selectable when the animal appears`
        );
      }

      const otherAnimalNames = animalKeys
        .filter((otherKey) => otherKey !== key)
        .map((otherKey) => animalNames[otherKey]);
      assert(
        rule.description.vi.includes(animalNames[key]),
        `Rule for '${key}' must mention ${animalNames[key]}`
      );
      for (const otherName of otherAnimalNames) {
        assert(
          !rule.description.vi.includes(otherName),
          `Rule for '${key}' must not mention ${otherName}`
        );
      }
    }

    assert.strictEqual(
      lionRule.group,
      "stimulus_lion",
      "Lion rule must use the lion stimulus group"
    );
    if (lionRule.mode === "zero") {
      assert.strictEqual(
        lionRule.targetColor,
        null,
        "Lion zero rule must not have a target color"
      );
      assert(
        lionRule.description.vi.includes("KHÔNG nhấn"),
        "Lion zero rule must explain zero presses"
      );
    } else {
      if (lionRule.mode === "additive") {
        assert(
          lionRule.description.vi.includes("nhấn thêm"),
          "Additive lion rule must explain the extra press"
        );
      } else {
        assert(
          lionRule.description.vi.includes("không ấn nút khác"),
          "Exclusive lion rule must forbid other presses"
        );
      }
      assert(
        lionRuleIntroLevel.buttons.includes(lionRule.targetColor),
        "Lion target color must be selectable when introduced"
      );
      assert(
        lionSightingLevel.buttons.includes(lionRule.targetColor),
        `Lion target ${lionRule.targetColor} must be selectable when the lion appears`
      );
    }

    assert(
      levels.customCatalog.rule_parity_blue_red.description.vi.includes(
        "Kết quả ra bao nhiêu thì nhấn bấy nhiêu lần"
      ),
      "Generated parity rule must explain that press count equals the result"
    );
    assert(
      levels.some(
        (l) =>
          l.baseSpec.type === "numeric_result" &&
          l.prompt.vi.includes("(Nhấn bấy nhiêu lần)")
      ),
      "Parity questions must remind players to press the result amount"
    );

    const engine = new RuleEngine(levels.customCatalog);
    const assertStimulusPlan = (rule, plan, level, label) => {
      if (rule.mode === "zero") {
        assert.strictEqual(
          plan.totalPresses,
          0,
          `Round ${level.round} ${label} must require zero presses`
        );
        return;
      }
      const effectiveTarget = rule.targetColor;
      const baseTargetCount = Object.entries(
        level.baseSpec.counts || {}
      ).reduce(
        (sum, [color, count]) =>
          sum + (color === effectiveTarget ? count : 0),
        0
      );
      const expectedTargetCount =
        rule.mode === "additive" ? baseTargetCount + 1 : 1;
      const targetCount = plan.phases.reduce(
        (sum, phase) => sum + (phase.counts[effectiveTarget] || 0),
        0
      );
      assert.strictEqual(
        targetCount,
        expectedTargetCount,
        `Round ${level.round} ${label} must press ${effectiveTarget} ${expectedTargetCount} time(s)`
      );
      if (rule.mode === "additive") {
        assert(
          plan.totalPresses > 1,
          `Round ${level.round} additive ${label} must keep the main task`
        );
      } else {
        assert.strictEqual(
          plan.totalPresses,
          1,
          `Round ${level.round} exclusive ${label} must suppress all other presses`
        );
      }
    };

    let previousRoundPresses = [];
    for (const level of levels) {
      let effectiveLevel = level;
      let repeatExpected = null;
      if (level.questionKind === "repeat_previous_presses") {
        repeatExpected = buildRepeatPreviousRound(previousRoundPresses);
        effectiveLevel = {
          ...level,
          prompt: repeatExpected.prompt,
          baseSpec: repeatExpected.baseSpec
        };
      }

      if (level.newRuleId) {
        engine.activateRule(level.newRuleId);
      }
      const plan = engine.resolveRoundPlan(effectiveLevel);
      const validator = new AnswerValidator(plan);

      if (repeatExpected) {
        assert.strictEqual(
          plan.totalPresses,
          previousRoundPresses.length,
          `Round ${level.round} repeat question must require exactly the presses from the previous round`
        );
        const firstPhase = plan.phases[0];
        const firstStep = repeatExpected.baseSpec.steps
          ? repeatExpected.baseSpec.steps[0]
          : null;
        if (firstStep) {
          assert.deepStrictEqual(
            firstPhase,
            {
              id: "main_seq",
              mode: "strict_step",
              counts: { [firstStep.color]: firstStep.count }
            },
            `Round ${level.round} repeat question must preserve the first ordered step`
          );
        }
      }

      if (level.stimuli.includes("lion")) {
        assertStimulusPlan(lionRule, plan, level, "lion");
      }

      const appearanceAnimalKey = animalKeys.find((key) =>
        level.stimuli.includes(key)
      );
      if (appearanceAnimalKey) {
        assertStimulusPlan(
          levels.customCatalog[`rule_animal_${appearanceAnimalKey}`],
          plan,
          level,
          `animal '${appearanceAnimalKey}'`
        );
      }

      if (level.fruitSet) {
        const fruitRule = levels.customCatalog[level.fruitSet.ruleId];
        assert(fruitRule, `Round ${level.round} must have an active fruit rule`);
        const oddCount = plan.phases.reduce(
          (sum, phase) => sum + (phase.counts[level.fruitSet.oddColor] || 0),
          0
        );
        assert.strictEqual(
          oddCount,
          fruitRule.pressCount,
          `Round ${level.round} fruit rule must press the odd color ${fruitRule.pressCount} time(s)`
        );
        assert.strictEqual(
          plan.totalPresses,
          fruitRule.pressCount,
          `Round ${level.round} fruit rule must suppress other presses`
        );
        assert(
          plan.trace.some((entry) => entry.ruleId === fruitRule.id),
          `Round ${level.round} fruit rule must add a trace`
        );
        assert(
          !level.stimuli.includes("bomb") &&
            !level.stimuli.includes("lion") &&
            !animalKeys.some((key) => level.stimuli.includes(key)),
          `Round ${level.round} fruit round must not overlap other stimuli`
        );
      }

      // Stroop: the required color must be the ink color shown in the prompt.
      const stroopMatch =
        level.promptHtml &&
        level.promptHtml.vi &&
        level.prompt.vi.startsWith("Nhấn màu đang tô chữ:")
          ? level.promptHtml.vi.match(/stroop-ink-(\w+)/)
          : null;
      if (stroopMatch) {
        const inkColor = stroopMatch[1];
        assert.strictEqual(
          level.baseSpec.counts[inkColor],
          1,
          `Round ${level.round} Stroop must require exactly 1 ink-color press`
        );
        assert(
          level.prompt.vi.includes("(1 lần)") &&
            level.prompt.en.includes("(1×)"),
          `Round ${level.round} Stroop prompt must show the 1-press count`
        );
        if (plan.totalPresses > 0) {
          assert(
            plan.phases.some((phase) => (phase.counts[inkColor] || 0) > 0),
            `Round ${level.round} Stroop answer must keep the explicit ink color (${inkColor})`
          );
        }
      }

      // Ink-color majority count: the base count must match the most frequent ink.
      if (level.stroopMajority) {
        const { majorityInk, majorityCount, words } = level.stroopMajority;
        assert(
          words.length >= 5 && words.length <= 7,
          `Round ${level.round} ink-majority word count must be 5–7`
        );
        assert.strictEqual(
          level.baseSpec.counts[majorityInk],
          majorityCount,
          `Round ${level.round} ink-majority base count must equal the majority count`
        );
        const inkCounts = {};
        for (const { inkColor } of words) {
          inkCounts[inkColor] = (inkCounts[inkColor] || 0) + 1;
        }
        const rankedInks = Object.entries(inkCounts).sort((a, b) => b[1] - a[1]);
        assert.strictEqual(rankedInks[0][0], majorityInk);
        assert.strictEqual(rankedInks[0][1], majorityCount);
        assert(
          rankedInks.length === 1 || rankedInks[1][1] < majorityCount,
          `Round ${level.round} ink-majority must be unique`
        );
        assert(
          !level.stimuli.includes("bomb"),
          `Round ${level.round} ink-majority must not overlap the bomb`
        );
        assert(
          level.promptHtml && level.promptHtml.vi.includes("stroop-ink-"),
          `Round ${level.round} ink-majority prompt must paint the words`
        );
      }

      // Trivia: the base press count must equal the everyday-knowledge answer
      // (the Bomb Rule may add one extra first press).
      if (level.triviaId && !level.stimuli.includes("lion")) {
        const bombBonus = level.stimuli.includes("bomb") ? 1 : 0;
        assert.strictEqual(level.baseSpec.value, level.triviaValue);
        assert.strictEqual(
          plan.totalPresses,
          level.triviaValue + bombBonus,
          `Round ${level.round} trivia answer must drive its press count`
        );
      }

      // High press counts must grant presses + 3 seconds.
      if (repeatExpected) {
        const expectedRuntime =
          plan.totalPresses > 6
            ? Math.max(level.timeLimit, plan.totalPresses + 3)
            : level.timeLimit;
        assert.strictEqual(
          resolveRepeatTimeLimit(level.timeLimit, plan.totalPresses),
          expectedRuntime,
          `Round ${level.round} repeat question must extend time to presses + 3 when needed`
        );
      } else if (plan.totalPresses > 6) {
        assert.strictEqual(
          level.timeLimit,
          getExpectedTimeLimit(level),
          `Round ${level.round} must extend time to presses + 3 plus any reverse bonus`
        );
      }

      // Simulate pressing the exact required plan and remember it for repeat rounds.
      previousRoundPresses = [];
      for (const phase of plan.phases) {
        for (const [color, count] of Object.entries(phase.counts)) {
          for (let c = 0; c < count; c++) {
            const res = validator.registerPress(color);
            assert.notStrictEqual(res.status, "failed", `Valid press failed on Round ${level.round}`);
            previousRoundPresses.push({ color });
          }
        }
      }
      assert.strictEqual(
        validator.evaluateTimeout().status,
        "passed",
        `Round ${level.round} should pass when all target presses are made`
      );

      if (run === 0) {
        firstRunPrompts.push(effectiveLevel.prompt.vi);
        console.log(
          `[Sample Run] R${String(level.round).padStart(2, "0")} (${level.timeLimit}s, ${level.buttons.length} btns${level.litButton ? `, 💡:${level.litButton}` : ""
          })${level.newRuleId ? ` [RULE: ${level.newRuleId}]` : ""
          }${level.questionKind === "repeat_previous_presses" ? " [REPEAT]" : ""
          }: "${effectiveLevel.prompt.vi}" -> ${AnswerValidator.formatPlanSummary(plan, "vi", t)}`
        );
      } else {
        const idx = level.round - 1;
        if (effectiveLevel.prompt.vi !== firstRunPrompts[idx]) {
          differencesFound++;
        }
      }
    }
  }

  assert(differencesFound > 0, "Generator must produce randomized questions across runs");
  assert(
    animalDelays.size > 1,
    "Animal rule-to-appearance delays must vary across runs"
  );
  assert(
    animalAppearanceGaps.size > 1,
    "Animal appearance gaps must vary across runs"
  );
  for (const kind of ["color_mix", "longest_color_name", "vowel_count"]) {
    assert(
      seenNewKinds.has(kind),
      `New question kind '${kind}' must appear across generated runs`
    );
  }

  // 2. Explicitly test the Dog Rule and the Odd-Fruit Rule.
  const lockEngine = new RuleEngine();
  lockEngine.activateRule("rule_dog_red"); // Dog -> ONLY Red 1 time, no other buttons
  assert.strictEqual(
    lockEngine.catalog.rule_dog_red.description.vi,
    "Khi nhìn thấy chó chỉ ấn nút ĐỎ 1 lần và không ấn nút khác"
  );
  const dogOnlyPlan = lockEngine.resolveRoundPlan({
    round: 6,
    buttons: ["red", "blue", "yellow"],
    stimuli: ["dog"],
    baseSpec: { type: "direct_counts", counts: { yellow: 2, blue: 1 } }
  });
  assert.deepStrictEqual(dogOnlyPlan.phases, [
    { id: "main", mode: "multiset", counts: { red: 1 } }
  ]);

  const additiveCatRule = RuleFactories.createAnimalRule(
    "cat",
    "blue",
    "rule_cat_blue_add",
    "additive"
  );
  const additiveEngine = new RuleEngine({ rule_cat_blue_add: additiveCatRule });
  additiveEngine.activateRule("rule_cat_blue_add");
  const additiveCatPlan = additiveEngine.resolveRoundPlan({
    round: 6,
    buttons: ["red", "blue", "yellow"],
    stimuli: ["cat"],
    baseSpec: { type: "direct_counts", counts: { yellow: 2 } }
  });
  assert.deepStrictEqual(additiveCatPlan.phases, [
    { id: "main", mode: "multiset", counts: { yellow: 2, blue: 1 } }
  ]);
  assert(
    additiveCatRule.description.vi.includes("nhấn thêm"),
    "Additive animal rule must describe the extra press"
  );

  const zeroMouseRule = RuleFactories.createAnimalRule(
    "mouse",
    null,
    "rule_mouse_zero",
    "zero"
  );
  assert.strictEqual(zeroMouseRule.mode, "zero");
  assert.strictEqual(zeroMouseRule.targetColor, null);
  assert(zeroMouseRule.description.vi.includes("KHÔNG nhấn"));
  const zeroEngine = new RuleEngine({ rule_mouse_zero: zeroMouseRule });
  zeroEngine.activateRule("rule_mouse_zero");
  const zeroMousePlan = zeroEngine.resolveRoundPlan({
    round: 6,
    buttons: ["red", "blue", "yellow"],
    stimuli: ["mouse"],
    baseSpec: { type: "direct_counts", counts: { yellow: 2 } }
  });
  assert.strictEqual(zeroMousePlan.totalPresses, 0);

  const lionPressRule = RuleFactories.createAnimalRule(
    "lion",
    "yellow",
    "rule_lion_press_test",
    "exclusive"
  );
  const lionPressEngine = new RuleEngine({
    rule_lion_press_test: lionPressRule
  });
  lionPressEngine.activateRule("rule_lion_press_test");
  const lionPressPlan = lionPressEngine.resolveRoundPlan({
    round: 45,
    buttons: ["red", "blue", "yellow", "black", "white", "purple"],
    stimuli: ["lion"],
    baseSpec: { type: "direct_counts", counts: { black: 2 } }
  });
  assert.deepStrictEqual(lionPressPlan.phases, [
    { id: "main", mode: "multiset", counts: { yellow: 1 } }
  ]);
  assert.strictEqual(lionPressRule.group, "stimulus_lion");

  const fruitRule = RuleFactories.createFruitOddRule({
    id: "rule_fruit_test",
    group: "stimulus_fruit_test",
    pressCount: 2
  });
  assert(fruitRule.description.vi.includes("KHÁC BIỆT"));
  assert(fruitRule.description.en.includes("DIFFERENT"));
  const fruitEngine = new RuleEngine({ rule_fruit_test: fruitRule });
  fruitEngine.activateRule("rule_fruit_test");
  const explicitFruitSet = RuleFactories.buildFruitSet({
    buttons: ["red", "blue", "yellow", "black", "white", "purple"],
    ruleId: "rule_fruit_test",
    size: 4,
    majorityColor: "red",
    oddColor: "yellow"
  });
  assert.strictEqual(explicitFruitSet.oddColor, "yellow");
  assert.strictEqual(
    explicitFruitSet.fruits.filter((fruit) => fruit.isOdd).length,
    1
  );
  const fruitPlan = fruitEngine.resolveRoundPlan({
    round: 25,
    buttons: ["red", "blue", "yellow", "black", "white", "purple"],
    stimuli: [],
    fruitSet: explicitFruitSet,
    baseSpec: { type: "direct_counts", counts: { blue: 2 } }
  });
  assert.deepStrictEqual(fruitPlan.phases, [
    { id: "main", mode: "multiset", counts: { yellow: 2 } }
  ]);
  assert.strictEqual(fruitPlan.totalPresses, 2);

  const unrelatedFruitPlan = fruitEngine.resolveRoundPlan({
    round: 26,
    buttons: ["red", "blue", "yellow", "black", "white", "purple"],
    stimuli: [],
    fruitSet: { ...explicitFruitSet, ruleId: "rule_other_fruit" },
    baseSpec: { type: "direct_counts", counts: { blue: 2 } }
  });
  assert.deepStrictEqual(
    unrelatedFruitPlan.phases,
    [{ id: "main", mode: "multiset", counts: { blue: 2 } }],
    "A fruit rule must not apply to another rule's fruit group"
  );

  // 3. Fake rules are announced but never change the required answer.
  const fakeRule = RuleFactories.createFakeRule("rule_fake_test", "bolt_add");
  assert.strictEqual(fakeRule.isFake, true, "Fake rule must be flagged as fake");
  assert(fakeRule.description.vi.includes("không có hiệu lực"));
  assert(
    Array.isArray(RuleFactories.FAKE_RULE_VARIANTS) &&
      RuleFactories.FAKE_RULE_VARIANTS.length >= 2,
    "Fake rule variants must be exposed to the level generator"
  );
  const fakeEngine = new RuleEngine({ rule_fake_test: fakeRule });
  fakeEngine.activateRule("rule_fake_test");
  const fakePlan = fakeEngine.resolveRoundPlan({
    round: 25,
    buttons: ["red", "blue", "yellow", "black", "white", "purple"],
    stimuli: ["dog"],
    baseSpec: { type: "direct_counts", counts: { blue: 2 } }
  });
  assert.deepStrictEqual(
    fakePlan.phases,
    [{ id: "main", mode: "multiset", counts: { blue: 2 } }],
    "Fake rule must not alter the resolved answer plan"
  );
  assert.strictEqual(
    fakePlan.trace.length,
    0,
    "Fake rule must not add any rule trace"
  );

  // 4. Repeat-previous question: exact order and counts from the last press history.
  const repeatSpec = buildRepeatPreviousRound([
    { color: "red" },
    { color: "red" },
    { color: "blue" },
    { color: "red" }
  ]);
  assert.strictEqual(repeatSpec.baseSpec.type, "sequence");
  assert.deepStrictEqual(
    repeatSpec.baseSpec.steps,
    [
      { color: "red", count: 2 },
      { color: "blue", count: 1 },
      { color: "red", count: 1 }
    ],
    "Consecutive presses of the same color must be compressed in order"
  );
  assert(repeatSpec.prompt.vi.includes("vòng trước"));

  const repeatEngine = new RuleEngine();
  const repeatPlan = repeatEngine.resolveRoundPlan({
    round: 16,
    buttons: ["red", "blue", "yellow", "black", "white"],
    stimuli: [],
    baseSpec: repeatSpec.baseSpec
  });
  assert.deepStrictEqual(repeatPlan.phases, [
    { id: "main_seq", mode: "strict_step", counts: { red: 2 } },
    { id: "main_seq", mode: "strict_step", counts: { blue: 1 } },
    { id: "main_seq", mode: "strict_step", counts: { red: 1 } }
  ]);

  const repeatOk = new AnswerValidator(repeatPlan);
  for (const color of ["red", "red", "blue", "red"]) {
    assert.notStrictEqual(
      repeatOk.registerPress(color).status,
      "failed",
      "Repeating the previous presses in order must be accepted"
    );
  }
  assert.strictEqual(repeatOk.evaluateTimeout().status, "passed");

  const repeatWrongOrder = new AnswerValidator(repeatPlan);
  repeatWrongOrder.registerPress("red");
  const wrongOrderRes = repeatWrongOrder.registerPress("blue");
  assert.strictEqual(wrongOrderRes.status, "failed");
  assert.strictEqual(
    wrongOrderRes.reason,
    "wrong_order",
    "Repeating the previous presses out of order must fail"
  );

  const zeroRepeat = buildRepeatPreviousRound([]);
  assert.strictEqual(zeroRepeat.baseSpec.type, "direct_counts");
  assert.deepStrictEqual(zeroRepeat.baseSpec.counts, {});
  assert(zeroRepeat.prompt.vi.includes("không nhấn"));
  const zeroRepeatPlan = repeatEngine.resolveRoundPlan({
    round: 16,
    buttons: ["red", "blue", "yellow", "black", "white"],
    stimuli: [],
    baseSpec: zeroRepeat.baseSpec
  });
  assert.strictEqual(zeroRepeatPlan.totalPresses, 0);

  assert.strictEqual(resolveRepeatTimeLimit(9, 5), 9);
  assert.strictEqual(resolveRepeatTimeLimit(9, 8), 11);
  assert.strictEqual(resolveRepeatTimeLimit(10, 8), 11);

  console.log("=== ALL 60-ROUND CAMPAIGN, RULE ENGINE & VALIDATOR TESTS PASSED! ===");
}

runTests();
