// ====== Elements ======
const responseDiv = document.getElementById("response");
const stickyHint = document.getElementById("stickyHint");
const inputEl = document.getElementById("question");
const modeLabel = document.getElementById("modeLabel");
const modePills = document.getElementById("modePills");
const templatePanel = document.getElementById("templatePanel");

const btnClear = document.getElementById("btnClear");
const btnCopyLast = document.getElementById("btnCopyLast");
const btnDownload = document.getElementById("btnDownload");

// Language UI
const langBtn = document.getElementById("langBtn");
const langBtnLabel = document.getElementById("langBtnLabel");
const langMenu = document.getElementById("langMenu");

const LS_LANG = "ai_tanym_lang_v1";
const LS_CHAT = "ai_tanym_chat_v3";
const LS_MODE = "ai_tanym_mode_v3";

// ====== i18n dictionary ======
const I18N = {
  kk: {
    privacy_link: "Құпиялық саясаты",
    go_ai: "🔎 AI көмекшіге өту",
    subtitle: "География мұғаліміне арналған AI көмекші • Карта • PISA • Диаграмма • Тест • Сабақ жоспары",
    school_name: "Д.Қонаев атындағы BINOM SCHOOL мектеп-лицейі",
    about_title: "Платформа қысқаша",
    about_text:
      "AI-TANYM — география мұғаліміне арналған көмекші: тақырыпты түсіндіру, PISA форматындағы тапсырма құрастыру, картамен жұмыс, диаграмма/кесте талдау, тест және бағалау критерийлері.",
    quick_title: "Жылдам мүмкіндіктер",
    tile_1: "PISA + карта тапсырма",
    tile_2: "Диаграмма/кесте талдау",
    tile_3: "45 минут сабақ жоспары",
    tile_4: "Тест + жауап кілті",
    tile_5: "Картамен жұмыс дағдысы",
    tile_6: "Критерий + дескриптор",
    tile_7: "Координата/қашықтық/азимут",
    tile_8: "Оқушы жауабын тексеру",
    ai_title: "География мұғаліміне AI көмекші",
    ai_desc:
      "Режим таңда да сұрағыңды жаз: түсіндіру / тапсырма / тест / тексеру / сабақ жоспары. Географияға үлкен акцент: Қазақстан + әлем географиясы.",
    mode_chat: "💬 Жалпы",
    mode_explain: "📘 Түсіндіру",
    mode_task: "🧩 Тапсырма",
    mode_test: "📝 Тест",
    mode_check: "✅ Тексеру",
    mode_lesson: "🧑‍🏫 Сабақ жоспары",
    btn_clear: "🧹 Тазарту",
    btn_copy_last: "📋 Соңғысын көшіру",
    btn_download: "⬇️ Жүктеу (.txt)",
    chip_teacher_req: "🧾 Мұғалім сұранысы",
    chip_pisa_map: "🧭 PISA + карта",
    chip_diagram: "📊 Диаграмма",
    chip_rubric: "✅ Дескриптор",
    chip_coords: "📍 Координата",
    mode_label: "Режим: 💬 Жалпы",
    tip_enter: "Enter — жіберу • Shift+Enter — жаңа жол",
    input_placeholder: "Сынып, тақырып, форматты жаз...",
    btn_send: "Жіберу",
    tpl_title: "Дайын шаблондар (мұғалімге)",
    tpl_45: "🧑‍🏫 45 мин сабақ жоспары",
    tpl_15: "⏱️ 15 мин мини-сабақ",
    tpl_pisa_data: "🧩 PISA (дерек/кесте)",
    tpl_map_skill: "🗺️ Карта дағдысы",
    tpl_formative: "🟦 ҚБ тапсырмасы",
    tpl_summative: "🟪 ЖБ тапсырмасы",
    tpl_test: "📝 Тест генерация",
    tpl_check: "✅ Шешімді тексеру",
    hint: "Кеңес: нақты болсын — сынып, тақырып, формат, оқу мақсаты жаз.",
    footer: "© 2026 AI-TANYM | Географияны білу — әлемді тану",
    sticky_text: "💬 География AI көмекші дайын — төменге өтіңіз",
    sticky_btn: "Өту",
    lang_label: "Қазақша",
    policy_text:
      "Құпиялық саясаты: Бұл демо-нұсқа. Құпия кілттер серверде сақталады, қолданушы мәліметтері жарияланбайды.",
    empty_question: "⚠️ Сұрақ енгізіңіз.",
    typing: "⏳ Жауап дайындалып жатыр...",
    copied: "✅ Соңғы жауап көшірілді.",
    copy_failed: "⚠️ Көшіру мүмкін болмады.",
    server_down: "❌ Сервер қол жетімсіз (API жұмыс істемей тұр)."
  },

  ru: {
    privacy_link: "Политика конфиденциальности",
    go_ai: "🔎 Перейти к AI помощнику",
    subtitle: "AI помощник учителя географии • Карта • PISA • Диаграммы • Тест • План урока",
    school_name: "Школа-лицей BINOM им. Д. Конаева",
    about_title: "Коротко о платформе",
    about_text:
      "AI-TANYM — помощник учителя географии: объяснение тем, задания PISA, работа с картой, анализ диаграмм/таблиц, тесты и критерии оценивания.",
    quick_title: "Быстрые возможности",
    tile_1: "PISA + задание по карте",
    tile_2: "Анализ диаграмм/таблиц",
    tile_3: "План урока на 45 минут",
    tile_4: "Тест + ключ ответов",
    tile_5: "Навыки работы с картой",
    tile_6: "Критерии + дескрипторы",
    tile_7: "Координаты/расстояние/азимут",
    tile_8: "Проверка ответа ученика",
    ai_title: "AI помощник учителя географии",
    ai_desc:
      "Выберите режим и задайте вопрос: объяснение / задание / тест / проверка / план урока. Сильный акцент на географию: Казахстан + мир.",
    mode_chat: "💬 Общий",
    mode_explain: "📘 Объяснение",
    mode_task: "🧩 Задание",
    mode_test: "📝 Тест",
    mode_check: "✅ Проверка",
    mode_lesson: "🧑‍🏫 План урока",
    btn_clear: "🧹 Очистить",
    btn_copy_last: "📋 Копировать последнее",
    btn_download: "⬇️ Скачать (.txt)",
    chip_teacher_req: "🧾 Запрос учителя",
    chip_pisa_map: "🧭 PISA + карта",
    chip_diagram: "📊 Диаграмма",
    chip_rubric: "✅ Дескриптор",
    chip_coords: "📍 Координаты",
    mode_label: "Режим: 💬 Общий",
    tip_enter: "Enter — отправить • Shift+Enter — новая строка",
    input_placeholder: "Напишите класс, тему и формат…",
    btn_send: "Отправить",
    tpl_title: "Готовые шаблоны (для учителя)",
    tpl_45: "🧑‍🏫 План урока 45 мин",
    tpl_15: "⏱️ Мини-урок 15 мин",
    tpl_pisa_data: "🧩 PISA (данные/таблица)",
    tpl_map_skill: "🗺️ Навыки карты",
    tpl_formative: "🟦 ФО задание",
    tpl_summative: "🟪 СОР/СОЧ задание",
    tpl_test: "📝 Генерация теста",
    tpl_check: "✅ Проверка решения",
    hint: "Совет: пишите конкретно — класс, тема, формат, цель обучения.",
    footer: "© 2026 AI-TANYM | Знать географию — понимать мир",
    sticky_text: "💬 AI помощник по географии готов — прокрутите вниз",
    sticky_btn: "Перейти",
    lang_label: "Русский",
    policy_text:
      "Политика конфиденциальности: это демо. Ключи хранятся на сервере, данные пользователей не публикуются.",
    empty_question: "⚠️ Введите вопрос.",
    typing: "⏳ Готовлю ответ...",
    copied: "✅ Последний ответ скопирован.",
    copy_failed: "⚠️ Не удалось скопировать.",
    server_down: "❌ Сервер недоступен (API не работает)."
  },

  en: {
    privacy_link: "Privacy Policy",
    go_ai: "🔎 Go to AI assistant",
    subtitle: "Geography teacher AI assistant • Map • PISA • Charts • Test • Lesson plan",
    school_name: "BINOM School-Lyceum named after D. Konaev",
    about_title: "About the platform",
    about_text:
      "AI-TANYM is a geography teacher assistant: topic explanations, PISA tasks, map skills, chart/table analysis, tests, and assessment criteria.",
    quick_title: "Quick tools",
    tile_1: "PISA + map task",
    tile_2: "Chart/table analysis",
    tile_3: "45-minute lesson plan",
    tile_4: "Test + answer key",
    tile_5: "Map skills",
    tile_6: "Rubric + descriptors",
    tile_7: "Coordinates/distance/bearing",
    tile_8: "Check student's work",
    ai_title: "Geography Teacher AI Assistant",
    ai_desc:
      "Pick a mode and ask: explain / task / test / check / lesson plan. Strong geography focus: Kazakhstan + world geography.",
    mode_chat: "💬 General",
    mode_explain: "📘 Explain",
    mode_task: "🧩 Task",
    mode_test: "📝 Test",
    mode_check: "✅ Check",
    mode_lesson: "🧑‍🏫 Lesson plan",
    btn_clear: "🧹 Clear",
    btn_copy_last: "📋 Copy last",
    btn_download: "⬇️ Download (.txt)",
    chip_teacher_req: "🧾 Teacher request",
    chip_pisa_map: "🧭 PISA + map",
    chip_diagram: "📊 Chart",
    chip_rubric: "✅ Rubric",
    chip_coords: "📍 Coordinates",
    mode_label: "Mode: 💬 General",
    tip_enter: "Enter — send • Shift+Enter — new line",
    input_placeholder: "Write grade, topic, and format…",
    btn_send: "Send",
    tpl_title: "Ready templates (teacher)",
    tpl_45: "🧑‍🏫 45-min lesson plan",
    tpl_15: "⏱️ 15-min mini lesson",
    tpl_pisa_data: "🧩 PISA (data/table)",
    tpl_map_skill: "🗺️ Map skills",
    tpl_formative: "🟦 Formative task",
    tpl_summative: "🟪 Summative task",
    tpl_test: "📝 Test generator",
    tpl_check: "✅ Check solution",
    hint: "Tip: be specific — grade, topic, format, learning goal.",
    footer: "© 2026 AI-TANYM | Knowing geography means understanding the world",
    sticky_text: "💬 Geography AI assistant is ready — scroll down",
    sticky_btn: "Go",
    lang_label: "English",
    policy_text:
      "Privacy Policy: this is a demo. Keys are stored on the server, user data is not published.",
    empty_question: "⚠️ Please enter a question.",
    typing: "⏳ Generating an answer...",
    copied: "✅ Last answer copied.",
    copy_failed: "⚠️ Copy failed.",
    server_down: "❌ Server unreachable (API not working)."
  }
};

// ====== Current language ======
let currentLang = localStorage.getItem(LS_LANG) || "kk";

// ====== Modes ======
const MODES = {
  chat:   { labelKey:"mode_chat", prefix:"" },
  explain:{ labelKey:"mode_explain", prefix:"[MODE:EXPLAIN]\n" },
  task:   { labelKey:"mode_task", prefix:"[MODE:TASK]\n" },
  test:   { labelKey:"mode_test", prefix:"[MODE:TEST]\n" },
  check:  { labelKey:"mode_check", prefix:"[MODE:CHECK]\n" },
  lesson: { labelKey:"mode_lesson", prefix:"[MODE:LESSON]\n" },
};
let currentMode = localStorage.getItem(LS_MODE) || "chat";

// ====== Templates (can be same for all languages or later split) ======
const TEMPLATES = {
  teacher_request:
`МҰҒАЛІМГЕ СҰРАНЫС (толтыр):
- Сынып:
- Тақырып:
- Формат: (Түсіндіру / Тапсырма / Тест / ҚБ / ЖБ / Сабақ жоспары)
- Оқу мақсаты:
- Құрал: (карта / кесте / диаграмма / мәтін)
- Деңгей: (жеңіл/орта/күрделі)
- Уақыт: (10/15/45 мин)
Сосын дайын материалды бер.`,

  pisa_map:
`PISA форматында КАРТАға байланысты 1 тапсырма құрастыр:
- Контекст: нақты өмір
- Оқушыға берілетін дерек: шағын мәтін + карта сипаттамасы (шартты белгілер/масштаб/бағыт)
- 3 сұрақ: (1) түсіну, (2) қолдану, (3) талдау
- Жауап/шешім қадамдап
- Бағалау критерийі және 3–5 дескриптор`,

  diagram:
`Диаграмма/кестені талдауға арналған түсіндіру жаса:
- 5 қадамдық алгоритм
- 1 қысқа мысал (шағын дерекпен)
- Оқушыға 3 сұрақ + жауап кілті`,

  rubric:
`Осы тақырыпқа бағалау критерийі мен дескриптор жаса:
- 2 критерий
- әр критерийге 3 дескриптор
- деңгейлер: төмен/орта/жоғары`,

  coords:
`Координата бойынша есеп құрастыр да шығар:
- 2 нүкте координатасы (lat/lon)
- Қашықтық (км) және азимут (°)
- Қадамдап түсіндір, соңында қорытынды жауап`,

  lesson_45:
`45 минутқа ГЕОГРАФИЯ сабағының жоспары:
- Сынып:
- Тақырып:
- Оқу мақсаты:
- Сабақ құрылымы: кіріспе/негізгі/қорытынды
- Әдістер: топтық + жұптық + жеке
- ҚБ: критерий + дескриптор
- Саралау: 2 тәсіл`,

  lesson_15:
`15 минуттық мини-сабақ:
- 1 мақсат
- 1 қысқа түсіндіру
- 1 шағын тапсырма
- 1 тез тексеру сұрағы + жауап`,

  task_pisa_data:
`PISA форматында дерекке сүйенетін тапсырма:
- қысқа мәтін + кесте/дерек (шағын)
- 3 сұрақ (әртүрлі деңгей)
- жауап кілті + дескриптор`,

  map_skill:
`Картамен жұмыс дағдысына арналған тапсырмалар:
- масштаб / шартты белгілер / бағыт/азимут / координата
- 2 тапсырма + шешімі қадамдап
- бағалау критерийі + дескриптор`,

  formative:
`ҚБ тапсырмасы:
- 10 минутқа
- 3 қысқа сұрақ
- жауап кілті
- дескриптор`,

  summative:
`ЖБ тапсырмасы:
- 4 тапсырма
- әр тапсырмаға балл
- жауап кілті + дескриптор`,

  test_gen:
`Географиядан тест құрастыр:
- 10 сұрақ
- 4 нұсқа (A, B, C, D)
- соңында "Жауап кілті"
- 2 сұрақ карта/координата/масштаб туралы болсын`,

  check_solution:
`Мен оқушының жауабын жіберемін.
Сен:
- қателерді тап
- нақты қай қадамда қате екенін айт
- толық шешімді бермей, подсказка бер
- соңында 1 қысқа кеңес бер`
};

// ====== UI helpers ======
function scrollToSearch(){
  document.getElementById("ai-search").scrollIntoView({ behavior: "smooth", block: "start" });
}

function autoGrow(el){
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 240) + "px";
}

function setTyping(on){
  const id = "aiTypingBubble";
  let node = document.getElementById(id);

  if (on){
    if (node) return;
    node = document.createElement("div");
    node.id = id;
    node.className = "ai-msg ai";
    node.innerHTML = `<div class="ai-bubble ai-typing">${t("typing")}</div>`;
    responseDiv.appendChild(node);
    responseDiv.scrollTop = responseDiv.scrollHeight;
  } else {
    node?.remove();
  }
}

function appendMsg(role, text){
  const wrap = document.createElement("div");
  wrap.className = `ai-msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.textContent = text;
  wrap.appendChild(bubble);
  responseDiv.appendChild(wrap);
  responseDiv.scrollTop = responseDiv.scrollHeight;
  saveChat();
}

async function copyText(text){
  try{ await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

function getLastAiMessage(){
  const nodes = Array.from(responseDiv.querySelectorAll(".ai-msg.ai .ai-bubble"));
  if (!nodes.length) return "";
  return nodes[nodes.length - 1].innerText || "";
}

function exportChatAsText(){
  const msgs = Array.from(responseDiv.querySelectorAll(".ai-msg"));
  return msgs.map(m => {
    const role = m.classList.contains("user") ? "USER" : "AI";
    const content = m.querySelector(".ai-bubble")?.innerText || "";
    return `[${role}] ${content}`;
  }).join("\n\n");
}

function downloadChat(){
  const text = exportChatAsText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AI-TANYM_${currentLang}_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ====== i18n core ======
function t(key){
  return (I18N[currentLang] && I18N[currentLang][key]) || (I18N.kk[key] || key);
}

function applyLanguage(lang){
  currentLang = ["kk","ru","en"].includes(lang) ? lang : "kk";
  localStorage.setItem(LS_LANG, currentLang);

  document.documentElement.setAttribute("lang", currentLang);

  // translate text nodes
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    el.textContent = t(k);
  });

  // translate placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const k = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(k));
  });

  // update language button label
  langBtnLabel.textContent = t("lang_label");

  // update mode label based on active mode
  updateModeLabel();
}

function updateModeLabel(){
  const key = MODES[currentMode]?.labelKey || "mode_chat";
  // mode_label is a full string in dict; we can just use "Mode: ..." from it,
  // but better: build dynamic label:
  const prefix = currentLang === "ru" ? "Режим: " : currentLang === "en" ? "Mode: " : "Режим: ";
  modeLabel.textContent = prefix + t(key).replace(/^.*?\s/, ""); // keep emoji+text
}

// ====== Mode handling ======
function setMode(mode){
  currentMode = MODES[mode] ? mode : "chat";
  localStorage.setItem(LS_MODE, currentMode);

  Array.from(modePills.querySelectorAll(".mode-pill")).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });

  updateModeLabel();
}

// ====== Templates ======
function toggleTemplatePanel(){
  const show = !templatePanel.classList.contains("show");
  templatePanel.classList.toggle("show", show);
  templatePanel.setAttribute("aria-hidden", show ? "false" : "true");
}

function useTemplate(key){
  const tpls = TEMPLATES[key];
  if (!tpls) return;
  inputEl.value = tpls;
  autoGrow(inputEl);
  inputEl.focus();
  templatePanel.classList.remove("show");
  templatePanel.setAttribute("aria-hidden", "true");
  scrollToSearch();
}

function copyInput(){
  const text = inputEl.value || "";
  if (!text) return;
  copyText(text);
}

// ====== Policy ======
function openPolicy(e){
  e.preventDefault();
  scrollToSearch();
  appendMsg("ai", t("policy_text"));
}

// ====== Chat persistence ======
function saveChat(){
  const msgs = Array.from(responseDiv.querySelectorAll(".ai-msg")).map(m => {
    const role = m.classList.contains("user") ? "user" : "ai";
    const text = m.querySelector(".ai-bubble")?.innerText || "";
    return { role, text };
  });
  localStorage.setItem(LS_CHAT, JSON.stringify(msgs));
}

function loadChat(){
  const raw = localStorage.getItem(LS_CHAT);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearChat(){
  responseDiv.innerHTML = "";
  localStorage.removeItem(LS_CHAT);
  appendMsg("ai", "AI-TANYM: " + t("ai_title"));
}

function hydrateChat(){
  const history = loadChat();
  if (!history || history.length === 0){
    clearChat();
    return;
  }
  responseDiv.innerHTML = "";
  history.forEach(m => appendMsg(m.role, m.text));
}

// ====== Main ask() ======
async function ask(){
  const raw = (inputEl.value || "").trim();
  if(!raw){
    appendMsg("ai", t("empty_question"));
    return;
  }

  // Strong geography assistant prefix
  const superPrefix =
`[ROLE:GEOGRAPHY_TEACHER_ASSISTANT]
Rules:
- You are a geography teacher assistant.
- If the question is not geography-related, answer briefly and suggest a geography-relevant direction.
- If info is missing, ask 1 clarifying question.
- Be structured: definition → reason → example → 1 quick check question.
`;

  const modePrefix = MODES[currentMode]?.prefix || "";
  const questionToSend = `${superPrefix}\n${modePrefix}${raw}`;

  appendMsg("user", raw);
  inputEl.value = "";
  autoGrow(inputEl);
  inputEl.focus();

  setTyping(true);

  try{
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionToSend, lang: currentLang })
    });

    const data = await res.json().catch(() => ({}));
    setTyping(false);

    if(!res.ok){
      appendMsg("ai", `❌ ${data?.error || "Error"}\n${data?.hint ? "ℹ️ " + data.hint : ""}`);
      return;
    }

    appendMsg("ai", data.answer || "—");
  }catch(e){
    setTyping(false);
    appendMsg("ai", t("server_down"));
  }
}

// ====== Sticky hint ======
function handleHint(){
  const el = document.getElementById("ai-search");
  if (!el || !stickyHint) return;

  const rect = el.getBoundingClientRect();
  const visible = rect.top < window.innerHeight && rect.bottom > 0;

  if(visible) stickyHint.classList.remove("show");
  else stickyHint.classList.add("show");
}
window.addEventListener("scroll", handleHint);

// ====== Enter / Shift+Enter ======
if (inputEl){
  inputEl.addEventListener("input", () => autoGrow(inputEl));
  autoGrow(inputEl);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  });
}

// ====== Mode pills click ======
if (modePills){
  modePills.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-pill");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });
}

// ====== Teacher buttons ======
btnClear?.addEventListener("click", clearChat);
btnCopyLast?.addEventListener("click", async () => {
  const text = getLastAiMessage();
  if (!text) return;
  const ok = await copyText(text);
  appendMsg("ai", ok ? t("copied") : t("copy_failed"));
});
btnDownload?.addEventListener("click", downloadChat);

// ====== Language menu behavior ======
function closeLangMenu(){
  langMenu.classList.remove("show");
  langMenu.setAttribute("aria-hidden", "true");
  langBtn.setAttribute("aria-expanded", "false");
}
function openLangMenu(){
  langMenu.classList.add("show");
  langMenu.setAttribute("aria-hidden", "false");
  langBtn.setAttribute("aria-expanded", "true");
}

langBtn?.addEventListener("click", () => {
  if (langMenu.classList.contains("show")) closeLangMenu();
  else openLangMenu();
});

langMenu?.addEventListener("click", (e) => {
  const item = e.target.closest(".lang-item");
  if (!item) return;
  applyLanguage(item.dataset.lang);
  closeLangMenu();
});

document.addEventListener("click", (e) => {
  const inSwitcher = e.target.closest(".lang-switch");
  if (!inSwitcher) closeLangMenu();
});

// ====== Init ======
applyLanguage(currentLang);
setMode(currentMode);
hydrateChat();
handleHint();

// expose for HTML onclick
window.scrollToSearch = scrollToSearch;
window.openPolicy = openPolicy;
window.ask = ask;
window.useTemplate = useTemplate;
window.toggleTemplatePanel = toggleTemplatePanel;
window.copyInput = copyInput;
