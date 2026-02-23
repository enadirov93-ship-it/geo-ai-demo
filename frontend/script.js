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
const LS_KEY = "ai_tanym_chat_v2";
const LS_MODE = "ai_tanym_mode_v2";

// ====== Modes (front-end instruction prefixes) ======
const MODES = {
  chat:   { label:"💬 Жалпы", prefix:"" },
  explain:{ label:"📘 Түсіндіру", prefix:"[MODE:EXPLAIN]\n" },
  task:   { label:"🧩 Тапсырма", prefix:"[MODE:TASK]\n" },
  test:   { label:"📝 Тест", prefix:"[MODE:TEST]\n" },
  check:  { label:"✅ Тексеру", prefix:"[MODE:CHECK]\n" },
  lesson: { label:"🧑‍🏫 Сабақ жоспары", prefix:"[MODE:LESSON]\n" },
};

let currentMode = localStorage.getItem(LS_MODE) || "chat";

// ====== Helpers ======
function scrollToSearch(){
  document.getElementById("ai-search").scrollIntoView({ behavior: "smooth", block: "start" });
}

function autoGrow(el){
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 220) + "px";
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

// lightweight markdown: **bold**, `code`, ```pre```, - списки
function renderMarkdownLite(text){
  const safe = escapeHtml(text);

  let html = safe.replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${p1}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, `<code>$1</code>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, `<strong>$1</strong>`);
  html = html.replace(/^\s*####\s*(.+)$/gm, `<h4>$1</h4>`);

  // unordered lists
  html = html.replace(/^\s*-\s+(.+)$/gm, `<li>$1</li>`);
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, `<ul>$1</ul>`);
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  // paragraphs
  html = html
    .split(/\n{2,}/)
    .map(block => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("<pre") || t.startsWith("<ul") || t.startsWith("<h4")) return t;
      return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("");

  return `<div class="md">${html}</div>`;
}

function appendMsg(role, text){
  const wrap = document.createElement("div");
  wrap.className = `ai-msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";

  if (role === "ai") bubble.innerHTML = renderMarkdownLite(text);
  else bubble.textContent = text;

  wrap.appendChild(bubble);
  responseDiv.appendChild(wrap);
  responseDiv.scrollTop = responseDiv.scrollHeight;

  saveChat();
}

function setTyping(on){
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

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
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
  a.download = `AI-TANYM_geography_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ====== Mode handling ======
function setMode(mode){
  currentMode = MODES[mode] ? mode : "chat";
  localStorage.setItem(LS_MODE, currentMode);

  Array.from(modePills.querySelectorAll(".mode-pill")).forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });

  modeLabel.textContent = `Режим: ${MODES[currentMode].label}`;
}

// ====== Templates (strong geography teacher focus) ======
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
- Сынып: (жаз)
- Тақырып: (жаз)
- Оқу мақсаты: (жаз)
- Құндылық: 1
- Сабақ құрылымы: кіріспе/негізгі/қорытынды
- Әдістер: топтық + жұптық + жеке
- ҚБ: критерий + дескриптор
- Саралау: 2 тәсіл
- Ресурс: карта/атлас/кесте/диаграмма (таңда)`,

  lesson_15:
`15 минуттық мини-сабақ:
- 1 мақсат
- 1 қысқа түсіндіру
- 1 шағын тапсырма
- 1 тез тексеру сұрағы + жауап`,

  map_skill:
`Картамен жұмыс дағдысына арналған тапсырмалар:
- масштаб немесе шартты белгілер немесе бағыт/азимут немесе координата
- 2 тапсырма + шешімі қадамдап
- бағалау критерийі + дескриптор`,

  formative:
`ҚБ (қалыптастырушы бағалау) тапсырмасы:
- 10 минутқа
- 3 қысқа сұрақ
- жауап кілті
- дескриптор`,

  summative:
`ЖБ (жиынтық бағалау) тапсырмасы:
- бөлім бойынша 4 тапсырма
- әр тапсырмаға балл қою
- жауап кілті + дескриптор`,

  task_pisa_data:
`PISA форматында дерекке сүйенетін тапсырма:
- қысқа мәтін + кесте/дерек (шағын)
- 3 сұрақ (әртүрлі деңгей)
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
- толық шешімді бермей, бағыт-бағдар (подсказка) бер
- соңында 1 қысқа кеңес бер`
};

function toggleTemplatePanel(){
  const show = !templatePanel.classList.contains("show");
  templatePanel.classList.toggle("show", show);
  templatePanel.setAttribute("aria-hidden", show ? "false" : "true");
}

function useTemplate(key){
  const t = TEMPLATES[key];
  if (!t) return;
  inputEl.value = t;
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

function openPolicy(e){
  e.preventDefault();
  scrollToSearch();
  appendMsg("ai", "Құпиялық саясаты: Бұл демо-нұсқа. Құпия кілттер серверде сақталады, қолданушы мәліметтері жарияланбайды.");
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
  appendMsg("ai",
`Сәлем! Мен AI-TANYM — география мұғаліміне көмекші.
Не істей аламын:
- 📘 Түсіндіру: тақырыпты қадамдап
- 🧩 Тапсырма: PISA/карта/диаграмма
- 📝 Тест: 4 нұсқа + жауап кілті
- ✅ Тексеру: оқушы жауабын тексеру
- 🧑‍🏫 Сабақ жоспары: 15/45 минут
Кеңес: "сынып + тақырып + формат" деп жазсаң, сапасы қатты өседі.`);
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
  const lang = langEl?.value || "kk";

  if(!raw){
    appendMsg("ai", "⚠️ Сұрақ енгізіңіз.");
    return;
  }

  // Strong teacher+geography instruction prefix (front-end side)
  const superPrefix =
`[ROLE:GEOGRAPHY_TEACHER_ASSISTANT]
Ереже:
- Сен география пәні бойынша мұғалім көмекшісің.
- Егер сұрақ география емес болса — қысқа айт та, географияға жақын бағыт ұсын.
- Егер дерек жетіспесе — 1 нақтылау сұрағын қой.
- Қысқа және нақты: анықтама → себеп → мысал → 1 тексеру сұрағы.
`;

  const modePrefix = MODES[currentMode]?.prefix || "";
  const questionToSend = `${superPrefix}\n${modePrefix}${raw}`;

  // user message shown without prefixes (clean)
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
      body: JSON.stringify({ question: questionToSend, lang })
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
  const ok = await copyText(text);
  appendMsg("ai", ok ? "✅ Соңғы жауап көшірілді." : "⚠️ Көшіру мүмкін болмады.");
});
btnDownload?.addEventListener("click", downloadChat);

// ====== Init ======
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
