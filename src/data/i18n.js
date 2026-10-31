/**
 * Localization dictionary (Tiếng Việt & English)
 * Includes failure diagnostics shown ONLY on Game Over.
 */
(function (global) {
  const I18N = {
    vi: {
      appTitle: "TIME PRESSURE",
      appSubtitle: "THINK  ·  READ  ·  ACT",
      startBtn: "BẮT ĐẦU",
      homeBtn: "TRANG CHỦ",
      updateBtn: "Cập nhật phần mềm",
      homeConfirmTitle: "Về trang chủ?",
      homeConfirmMessage: "Vòng chơi hiện tại sẽ bị hủy và bạn sẽ mất lượt. Bạn có chắc muốn thoát?",
      homeConfirmStay: "Ở LẠI",
      homeConfirmLeave: "VỀ TRANG CHỦ",
      themeToggleToLight: "Chuyển giao diện sáng",
      themeToggleToDark: "Chuyển giao diện tối",
      leftHintLine1: "Đọc kỹ luật chơi.",
      leftHintLine2: "Đừng nhấn vội!",
      rightHintLine1: "Mỗi sai lầm",
      rightHintLine2: "là kết thúc!",
      helpTooltipTitle: "Cách chơi",
      helpTooltipItems: [
        "60 vòng chơi liên tiếp — bạn chỉ có 1 mạng duy nhất.",
        "Vòng 1–3 (Dễ - 5s): 1 nút Đỏ, tối đa 3 lần nhấn.",
        "Vòng 4–10 (Trung bình - 7s): Thêm nút mới, nhấn theo thứ tự/ngược thứ tự dùng toàn bộ nút hiện có, nút sáng. Câu ngược được +1 giây.",
        "Luật Chẵn/Lẻ: kết quả quyết định màu; số lần nhấn bằng chính kết quả (ra 3 thì nhấn 3 lần).",
        "Vòng 11–19 (Khó - 9s): Đảo vị trí nút, hỏi nút sáng vòng trước, ghi nhớ số/màu cho 5–6 vòng sau.",
        "Luật động vật 🐾: mỗi ván random 1 trong chó/mèo/chuột/sư tử là zero; 1–2 stimulus khác nhấn thêm màu của nó 1 lần vào đáp án chính; các stimulus còn lại chỉ nhấn đúng màu được công bố.",
        "Luật sư tử 🦁: sư tử xuất hiện đúng 1 lần trong Vòng 40–60; luật của sư tử thay đổi theo ván (zero hoặc nhấn màu).",
        "Câu hỏi Stroop: nhấn 1 lần theo MÀU ĐANG TÔ CHỮ, không nhấn theo nghĩa của chữ.",
        "Câu hỏi đời thường: số lần nhấn bằng đáp án. Nếu cần nhấn quá 6 lần, thời gian = số lần + 3 giây.",
        "Nút sáng: nhấn màu được yêu cầu nếu đúng nút đó sáng; nếu nút khác sáng thì không nhấn.",
        "Từ Vòng 20 trở đi (6 nút): Luật dùng màu cũ chuyển sang màu mới; câu hỏi ghi rõ màu (đếm, thứ tự, ghi nhớ, Stroop, nút sáng) vẫn giữ nguyên màu.",
        "Vòng 20+: có câu đếm màu đang tô của các chữ; nhấn màu xuất hiện nhiều nhất với số lần tương ứng.",
        "Vòng 20+ đôi khi xuất hiện LUẬT GIẢ (nhãn riêng): luật này không có hiệu lực, hãy bỏ qua nó.",
        "Từ vòng 15+: có câu nhấn lại đúng các nút bạn đã nhấn ở vòng trước, gồm đúng màu, số lần và thứ tự; nếu vòng trước không nhấn thì không nhấn."
      ],
      roundOnlyLabel: "VÒNG {round}",
      newRuleTag: "LUẬT MỚI",
      replacedRuleTag: "LUẬT MỚI",
      fakeRuleTag: "LUẬT GIẢ",
      victoryTitle: "CHIẾN THẮNG!",
      victorySubtitle: "Bạn đã chinh phục xuất sắc toàn bộ các vòng!",
      gameOverTitle: "THUA RỒI!",
      gameOverSubtitle: "Dừng bước tại Vòng {round}",
      playAgainBtn: "CHƠI LẠI TỪ ĐẦU",
      whyLostTitle: "Lý do thua:",
      promptWasLabel: "Câu hỏi vòng này:",
      expectedAnswerLabel: "Đáp án đúng:",
      yourInputLabel: "Bạn đã nhấn:",
      activeRulesTraceLabel: "Luật áp dụng ở vòng này:",
      nothingPressed: "Không nhấn nút nào (0 lần)",
      phasePrefixFirst: "[Đầu tiên] ",
      phasePrefixMain: "",
      phasePrefixLast: "[Cuối cùng] ",
      colors: {
        red: "ĐỎ",
        blue: "XANH",
        yellow: "VÀNG",
        black: "ĐEN",
        white: "TRẮNG",
        purple: "TÍM"
      },
      stimuli: {
        dog: "🐶",
        bomb: "💣",
        bolt: "⚡",
        stars2: "⭐⭐",
        stars3: "⭐⭐⭐",
        stars4: "⭐⭐⭐⭐",
        stars5: "⭐⭐⭐⭐⭐",
        gems2: "💎💎",
        gems3: "💎💎💎",
        gems4: "💎💎💎💎",
        fire2: "🔥🔥",
        fire3: "🔥🔥🔥",
        fire4: "🔥🔥🔥🔥"
      },
      failReasons: {
        wrong_color: "Bạn đã nhấn nút {color} (nút này không có trong đáp án hoặc bị cấm)!",
        wrong_order: "Bạn đã nhấn nút {color} sai thứ tự yêu cầu!",
        exceeded_count: "Bạn đã nhấn nút {color} vượt quá số lần quy định!",
        pressed_on_zero: "Vòng này yêu cầu KHÔNG nhấn nút nào, nhưng bạn đã nhấn nút {color}!",
        timeout_incomplete: "Hết thời gian nhưng bạn chưa nhấn đủ số lần yêu cầu!"
      }
    },
    en: {
      appTitle: "TIME PRESSURE",
      appSubtitle: "THINK  ·  READ  ·  ACT",
      startBtn: "START",
      homeBtn: "HOME",
      updateBtn: "Update app",
      homeConfirmTitle: "Return home?",
      homeConfirmMessage: "The current round will be cancelled and you will lose your run. Are you sure you want to exit?",
      homeConfirmStay: "STAY",
      homeConfirmLeave: "RETURN HOME",
      themeToggleToLight: "Switch to light mode",
      themeToggleToDark: "Switch to dark mode",
      leftHintLine1: "Read the rules carefully.",
      leftHintLine2: "Don't press too fast!",
      rightHintLine1: "Every mistake",
      rightHintLine2: "is game over!",
      helpTooltipTitle: "How to Play",
      helpTooltipItems: [
        "60 consecutive rounds — you only have 1 life.",
        "Rounds 1–3 (Easy - 5s): Red button only, max 3 presses.",
        "Rounds 4–10 (Medium - 7s): Forward/reverse sequences use every available button, glowing buttons, cumulative rules. Reverse questions get 1 extra second.",
        "Odd/Even Rule: the result decides the color; press exactly that many times (result 3 → press 3 times).",
        "Rounds 11–19 (Hard - 9s): Shuffled button positions, previous lit button, memorize numbers/colors for 5–6 rounds later.",
        "Animal Rules 🐾: each run randomly assigns zero to one of dog/cat/mouse/lion; 1–2 other stimuli add 1 press of their color on top of the main answer; the rest require ONLY the announced color.",
        "Lion Rule 🦁: the lion appears exactly once in Rounds 40–60; its rule changes each run (zero or a color press).",
        "Stroop question: press once in the color the word is painted in, not the color it names.",
        "Everyday knowledge: the answer is the number of presses. If more than 6 presses are needed, time = presses + 3 seconds.",
        "Glowing button: press the requested color only if that exact button glows; if a different button glows, press nothing.",
        "Round 20+ (6 buttons): Rules using the old color transfer to the new color; prompts that name a color (counts, sequences, memory, Stroop, glowing button) keep their original colors.",
        "Round 20+: some questions show color words painted in different ink colors; press the most frequent ink color as many times as it appears.",
        "Round 20+ sometimes shows a FAKE RULE (its own badge): it has no effect, so ignore it.",
        "Round 15+: some questions ask you to repeat the exact buttons you pressed last round, including color, count, and order; if you pressed nothing, press nothing."
      ],
      roundOnlyLabel: "ROUND {round}",
      newRuleTag: "NEW RULE",
      replacedRuleTag: "NEW RULE",
      fakeRuleTag: "FAKE RULE",
      victoryTitle: "VICTORY!",
      victorySubtitle: "You conquered every round!",
      gameOverTitle: "GAME OVER",
      gameOverSubtitle: "Stopped on Round {round}",
      playAgainBtn: "PLAY AGAIN",
      whyLostTitle: "Why you lost:",
      promptWasLabel: "Round Prompt:",
      expectedAnswerLabel: "Correct Answer:",
      yourInputLabel: "What You Pressed:",
      activeRulesTraceLabel: "Rules applied in this round:",
      nothingPressed: "Press nothing (0 times)",
      phasePrefixFirst: "[First] ",
      phasePrefixMain: "",
      phasePrefixLast: "[Last] ",
      colors: {
        red: "RED",
        blue: "BLUE",
        yellow: "YELLOW",
        black: "BLACK",
        white: "WHITE",
        purple: "PURPLE"
      },
      stimuli: {
        dog: "🐶",
        bomb: "💣",
        bolt: "⚡",
        stars2: "⭐⭐",
        stars3: "⭐⭐⭐",
        stars4: "⭐⭐⭐⭐",
        stars5: "⭐⭐⭐⭐⭐",
        gems2: "💎💎",
        gems3: "💎💎💎",
        gems4: "💎💎💎💎",
        fire2: "🔥🔥",
        fire3: "🔥🔥🔥",
        fire4: "🔥🔥🔥🔥"
      },
      failReasons: {
        wrong_color: "You pressed {color}, which was not required or was forbidden!",
        wrong_order: "You pressed {color} in the wrong sequence order!",
        exceeded_count: "You pressed {color} more times than required!",
        pressed_on_zero: "Required 0 presses, but you pressed {color}!",
        timeout_incomplete: "Time ran out before you completed all required presses!"
      }
    }
  };

  function t(lang, key, params = {}) {
    const dict = I18N[lang] || I18N.vi;
    const parts = key.split(".");
    let val = dict;
    for (const p of parts) {
      val = val ? val[p] : undefined;
    }
    if (typeof val !== "string") return val !== undefined ? val : key;
    return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
  }

  global.PressGame = global.PressGame || {};
  global.PressGame.I18N = I18N;
  global.PressGame.t = t;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { I18N, t };
  }
})(typeof window !== "undefined" ? window : globalThis);
