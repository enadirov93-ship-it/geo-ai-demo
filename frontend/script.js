// ====== Elements ======
const responseDiv = document.getElementById("response");
const stickyHint = document.getElementById("stickyHint");
const inputEl = document.getElementById("question");
const langEl = document.getElementById("lang");
const modeLabel = document.getElementById("modeLabel");
const modePills = document.getElementById("modePills");
const templatePanel = document.getElementById("templatePanel");

const btnClear = document.getElementById("btnClear");
const btnCopyLast = document.getElementById("btnCopyLast");
const btnDownload = document.getElementById("btnDownload");

// ====== Storage keys ======
const LS_KEY = "ai_tanym_chat_v1";
const LS_MODE = "ai_tanym_mode_v1";

// ====== Modes ======
const MODES = {
  chat:   { label:"💬 Жалпы", prefix:"" },
  explain:{ label:"📘 Түсіндіру", prefix:"[MODE:EXPLAIN]\n" },
  task:   { label:"🧩 Тапсырма", prefix:"[MODE:TASK]\n" },
  test:   { label:"📝 Тест", prefix:"[MODE:TEST]\n" },
  check:  { label:"✅ Тексеру", prefix:"[MODE:CHECK]\n" },
  lesson: { label:"🧑‍🏫 Сабақ жоспары", prefix:"[MODE:LESSON]\n" },
};

let currentMode = loadMode() || "chat";

// ====== Platform points ======
const pointsText = {
  1:"Функционалдық сауаттылықты дамыту: Оқушылардың логикалық ойлау және практикалық дағдыларын жетілдіру.",
  2:"PISA форматындағы тапсырмалар: Халықаралық зерттеулерге сәйкес тапсырмалар арқылы біліктілікті бағалау.",
  3:"Картамен жұмыс дағдылары: Географиялық ақпаратты визуалды түрде пайдалану қабілеті.",
  4:"Диаграмма және статистикалық деректерді талдау: Мәліметтерді өңдеу және талдау дағдылары.",
  5:"Қазақстан географиясына басымдық: Ел картасы мен аймақтарын терең зерттеу.",
  6:"Құзыреттілікке негізделген тапсырмалар: Өмірмен байланыстырылған тапсырмалар арқылы білімді қолдану.",
  7:"Оқу мақсаттарына сәйкестік: Жүйелі бағдарламаға сәйкес тапсырмалар.",
  8:"Бағалау және дескрипторлар жүйесі: Оқу жетістіктерін нақты бағалау.",
  9:"Мұғалімнің әдістемелік жұмысын жеңілдету: Жұмысты автоматтандыру және қосымша материалдар.",
  10:"Цифрлық және жасанды интеллект мүмкіндіктері: AI арқылы тапсырмаларды жылдам іздеу және талдау."
};

// ====== UI helpers ======
function scrollToSearch(){
  document.getElementById("ai-search").scrollIntoView({ behavior: "smooth", block: "start" });
}

function autoGrow(el){
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

// lightweight markdown: **bold**, `code`, ```pre```, списки
function renderMarkdownLite(text){
  const safe = escapeHtml(text);

  // code blocks ```
  let html = safe.replace(/```([\s\S]*?)```/g, (_m, p1) => {
    return `<pre><code>${p1}</code></pre>`;
  });

  // inline code
  html = html.replace(/`([^`]+)`/g, `<code>$1</code>`);

  // bold
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);

  // headings (simple)
  html = html.replace(/^\s*####\s*(.+)$/gm, `<h4>$1</h4>`);

  // unordered lists
  html = html.replace(/^\s*-\s+(.+)$/gm, `<li>$1</li>`);
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, `<ul>$1</ul>`);
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map(block => {
      if (block.trim().startsWith("<pre") || block.trim().startsWith("<ul") || block.trim().startsWith("<h4")) return block;
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  return `<div class="md">${html}</div>`;
}

function appendMsg(role, text){
  if (!responseDiv) return;

  const wrap = document.createElement("div");
  wrap.className = `ai-msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";

  // AI messages render markdown-lite, user messages as plain
  if (role === "ai") bubble.innerHTML = renderMarkdownLite(text);
  else bubble.textContent = text;

  wrap.appendChild(bubble);
  responseDiv.appendChild(wrap);
  responseDiv.scrollTop = responseDiv.scrollHeight;

  saveChat();
}

function setTyping(on){
  if (!responseDiv) return;
  const id = "aiTypingBubble";
  let node = document.getElementById(id);

  if (on){
    if (node) return;
    node = document.createElement("div");
    node.id = id;
    node.className = "ai-msg ai";
    node.innerHTML = `<div class="ai-bubble ai-typing">⏳ Жауап дайындалып жатыр...</div>`;
    responseDiv.appendChild(node);
    responseDiv.scrollTop = responseDiv.scrollHeight;
  } else {
    node?.remove();
  }
}

function copyText(text){
  return navigator.clipboard?.writeText(text);
}

function getLastAiMessage(){
  const nodes = Array.from(responseDiv.querySelectorAll(".ai-msg.ai .ai-bubble"));
  if (!nodes.length) return "";
  const last = nodes[nodes.length - 1];
  return last.innerText || "";
}

function downloadChat(){
  const text = exportChatAsText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AI-TANYM_chat_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportChatAsText(){
  const msgs = Array.from(responseDiv.querySelectorAll(".ai-msg"));
  const lines = msgs.map(m => {
    const role = m.classList.contains("user") ? "USER" : "AI";
    const content = m.querySelector(".ai-bubble")?.innerText || "";
    return `[${role}] ${content}`;
  });
  return lines.join("\n\n");
}

// ====== Mode handling ======
function setMode(mode){
  currentMode = MODES[mode] ? mode : "chat";
  localStorage.setItem(LS_MODE, currentMode);

  // update pill UI
  Array.from(modePills.querySelectorAll(".mode-pill")).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });

  modeLabel.textContent = `Режим: ${MODES[currentMode].label}`;
}

function loadMode(){
  return localStorage.getItem(LS_MODE);
}

// ====== Templates ======
const TEMPLATES = {
  pisa_map: `PISA форматында картаға байланысты 1 тапсырма құрастыр:
- Контекст: нақты өмір
- Мәтін + шағын карта-сипаттама (оқушыға берілетін дерек)
- 3 сұрақ: (1) түсіну, (2) қолдану, (3) талдау
- Жауап/шешім қадамдап
- Бағалау критерийі және 3-5 дескриптор`,

  diagram: `Диаграмма/кестені талдауға арналған түсіндіру жаса:
- 5 қадамдық алгоритм
- 1 мысал (ойдан шығарылған шағын дерекпен)
- Оқушыға 3 сұрақ және жауап кілті`,

  rubric: `Осы тақырыпқа бағалау критерийі мен дескриптор жаса:
- 2 критерий
- әр критерийге 3 дескриптор
- деңгейлер: төмен/орта/жоғары`,

  kazakhstan: `Қазақстан туралы фактілерді тексеріп, қысқаша түсіндір:
- әкімшілік бөлініс (облыс саны + неге бұрын басқаша болды)
- 3 қала республикалық маңызы бар
- 1-2 сөйлеммен контекст бер`,

  coords: `Координата бойынша есеп:
- Екі нүктенің координатасы берілсін (лат/лон)
- Қашықтықты және азимутты тап
- Қадамдап түсіндір, соңында жауапты дөңгелекте`,

  lesson_45: `45 минутқа сабақ жоспары:
- Сынып: (жазып бер)
- Тақырып: (жазып бер)
- Оқу мақсаты: (жазып бер)
- Құндылық: 1
- Сабақ құрылымы: кіріспе/негізгі/қорытынды
- Әдістер: топтық + жұптық + жеке
- ҚБ: критерий + дескриптор
- Саралау: 2 тәсіл`,

  lesson_15: `15 минуттық мини-сабақ:
- 1 мақсат
- 1 қысқа түсіндіру
- 1 шағын тапсырма
- 1 тез тексеру сұрағы + жауап`,

  pisa_data: `PISA форматында дерекке (кесте/мәтін) сүйенетін тапсырма құрастыр:
- қысқа мәтін + кесте (шағын дерек)
- 3 сұрақ (әртүрлі деңгей)
- жауап кілті + дескриптор`,

  map_skill: `Картамен жұмыс дағдысына арналған тапсырма:
- масштаб/шартты белгілер/бағыт/координата бойынша
- 2 тапсырма және шешім қадамдап
- бағалау критерийі + дескриптор`,

  formative: `ҚБ (қалыптастырушы бағалау) тапсырмасы:
- 10 минутқа
- 3 қысқа сұрақ
- жауап кілті
- дескриптор`,

  summative: `ЖБ (жиынтық бағалау) тапсырмасы:
- бөлім бойынша 4 тапсырма
- әр тапсырмаға балл қою
- жауап кілті + дескриптор`,

  check_solution: `Оқушының шешімін тексер:
- мен шешімді жапсырамын
- сен қате қай жерде екенін тап
- толық жауап бермей, нақты нұсқау/подсказка бер`,

  vocab: `Осы тақырып бойынша 10 термин:
- анықтамасы
- 1 мысал сөйлем
- 3 терминге қысқа сұрақ-жауап`
};

function toggleTemplatePanel(){
  const show = !templatePanel.classList.contains("show");
  templatePanel.classList.toggle("show", show);
  templatePanel.setAttribute("aria-hidden", show ? "false" : "true");
}

function useTemplate(key){
  const t = TEMPLATES[key];
  if (!t) return;
  if (inputEl){
    inputEl.value = t;
    autoGrow(inputEl);
    inputEl.focus();
  }
  toggleTemplatePanel();
  scrollToSearch();
}

function copyInput(){
  const text = inputEl?.value || "";
  if (!text) return;
  copyText(text);
}

// ====== Policy & points ======
function openPolicy(e){
  e.preventDefault();
  scrollToSearch();
  appendMsg("ai", "Құпиялық саясаты: Бұл демо-нұсқа. Құпия кілттер серверде сақталады, қолданушы мәліметтері жарияланбайды.");
}

function askPoint(n){
  scrollToSearch();
  appendMsg("ai", pointsText[n] || "Ақпарат табылмады.");
}

// ====== Chat persistence ======
function saveChat(){
  const msgs = Array.from(responseDiv.querySelectorAll(".ai-msg")).map(m => {
    const role = m.classList.contains("user") ? "user" : "ai";
    const text = m.querySelector(".ai-bubble")?.innerText || "";
    return { role, text };
  });
  localStorage.setItem(LS_KEY, JSON.stringify(msgs));
}

function loadChat(){
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clearChat(){
  responseDiv.innerHTML = "";
  localStorage.removeItem(LS_KEY);
  // welcome message
  appendMsg("ai",
`Сәлем! Мен AI-TANYM — мұғалімге арналған көмекші.
Мына режимдер көмектеседі:
- 📘 Түсіндіру: тақырыпты қадамдап
- 🧩 Тапсырма: PISA/карта/диаграмма
- 📝 Тест: 4 нұсқа + жауап кілті
- ✅ Тексеру: оқушы жауабын тексеру
- 🧑‍🏫 Сабақ жоспары: 15/45 минут`);
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
  const raw = (inputEl?.value || "").trim();
  const lang = langEl?.value || "kk";

  if(!raw){
    appendMsg("ai", "⚠️ Сұрақ енгізіңіз.");
    return;
  }

  // prefix adds strong instruction for teacher assistant
  const prefix = MODES[currentMode]?.prefix || "";
  const question = `${prefix}${raw}`;

  appendMsg("user", raw);

  // clear input
  inputEl.value = "";
  autoGrow(inputEl);
  inputEl.focus();

  setTyping(true);

  try{
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang })
    });

    const data = await res.json().catch(() => ({}));

    setTyping(false);

    if(!res.ok){
      const errText =
        `❌ ${data?.error || "Қате шықты"}\n` +
        (data?.hint ? `ℹ️ ${data.hint}` : "");
      appendMsg("ai", errText);
      return;
    }

    appendMsg("ai", data.answer || "Жауап табылмады");
  }catch(e){
    setTyping(false);
    appendMsg("ai", "❌ Сервер қол жетімсіз (API жұмыс істемей тұр).");
  }
}

// ====== Enter / Shift+Enter + autogrow ======
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
  await copyText(text);
  appendMsg("ai", "✅ Соңғы жауап көшірілді.");
});
btnDownload?.addEventListener("click", downloadChat);

// ====== Init ======
setMode(currentMode);
hydrateChat();
handleHint();

// expose functions for HTML onclick
window.scrollToSearch = scrollToSearch;
window.openPolicy = openPolicy;
window.askPoint = askPoint;
window.ask = ask;
window.useTemplate = useTemplate;
window.toggleTemplatePanel = toggleTemplatePanel;
window.copyInput = copyInput;
