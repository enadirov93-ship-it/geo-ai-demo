/* AI-TANYM front app (no frameworks) */

const els = {
  year: document.getElementById("year"),
  chatScroll: document.getElementById("chatScroll"),
  questionInput: document.getElementById("questionInput"),
  sendBtn: document.getElementById("sendBtn"),
  status: document.getElementById("status"),

  clearChatBtn: document.getElementById("clearChatBtn"),
  copyLastBtn: document.getElementById("copyLastBtn"),
  downloadBtn: document.getElementById("downloadBtn"),

  langBtn: document.getElementById("langBtn"),
  langMenu: document.getElementById("langMenu"),
  langLabel: document.getElementById("langLabel"),

  memoryInput: document.getElementById("memoryInput"),
  saveMemoryBtn: document.getElementById("saveMemoryBtn"),
  clearMemoryBtn: document.getElementById("clearMemoryBtn"),
};

const STORAGE = {
  lang: "aitanym_lang",
  mode: "aitanym_mode",
  memory: "aitanym_memory",
  chat: "aitanym_chat_v1",
};

const I18N = {
  ru: {
    subtitle: "География AI помощник учителя",
    badge: "AI",
    aiTitle: "Чат-помощник",
    aiHint: "Пиши вопрос по географии — я помогу учителю быстро и по-школьному.",
    copyLast: "Копировать последнее",
    downloadTxt: "Скачать .txt",
    clearChat: "Очистить чат",
    memoryTitle: "Память для ИИ",
    memorySub: "Сохраняется и добавляется к каждому вопросу. Сброс — кнопкой “Очистить чат”.",
    saveMemory: "Сохранить память",
    clearMemory: "Очистить память",
    modesTitle: "Режим",
    templatesTitle: "Шаблоны для учителя",
    tplPisa: "PISA + карта",
    tplDiagram: "Диаграмма",
    tplCriteria: "Критерии",
    tplCoords: "Координаты",
    tpl15: "План 15 мин",
    tpl45: "План 45 мин",
    askPlaceholder: "Напиши вопрос по географии…",
    memoryPlaceholder: "Например: Я учитель 8 класса. Отвечай кратко, по школьному, с примерами Казахстана.",
    send: "Отправить",
    enterHint: "Enter — отправить, Shift+Enter — перенос",
    footerNote: "Сделано для учителей географии",
    thinking: "Думаю…",
    error: "Ошибка. Проверь интернет и попробуй ещё раз.",
    cleared: "Чат очищен.",
    copied: "Скопировано.",
    saved: "Сохранено.",
  },
  kk: {
    subtitle: "География мұғаліміне арналған AI көмекші",
    badge: "AI",
    aiTitle: "Чат-көмекші",
    aiHint: "География бойынша сұрақ қой — мұғалімге мектеп стилінде көмектесемін.",
    copyLast: "Соңғысын көшіру",
    downloadTxt: ".txt жүктеу",
    clearChat: "Чатты тазалау",
    memoryTitle: "AI жады",
    memorySub: "Сақталады және әр сұраққа қосылады. Қалпына келтіру — “Чатты тазалау”.",
    saveMemory: "Жадыны сақтау",
    clearMemory: "Жадыны тазалау",
    modesTitle: "Режим",
    templatesTitle: "Мұғалімге шаблондар",
    tplPisa: "PISA + карта",
    tplDiagram: "Диаграмма",
    tplCriteria: "Критерийлер",
    tplCoords: "Координаттар",
    tpl15: "15 мин жоспар",
    tpl45: "45 мин жоспар",
    askPlaceholder: "Географиядан сұрақ жаз…",
    memoryPlaceholder: "Мысалы: 8-сынып мұғалімімін. Қысқа, мектеп стилінде, Қазақстан мысалдарымен жауап бер.",
    send: "Жіберу",
    enterHint: "Enter — жіберу, Shift+Enter — жаңа жол",
    footerNote: "География мұғалімдеріне арналған",
    thinking: "Ойланып жатырмын…",
    error: "Қате. Интернетті тексеріп, қайта көр.",
    cleared: "Чат тазаланды.",
    copied: "Көшірілді.",
    saved: "Сақталды.",
  },
  en: {
    subtitle: "Geography AI assistant for teachers",
    badge: "AI",
    aiTitle: "Chat assistant",
    aiHint: "Ask a geography question — I’ll help in a clear, school-friendly style.",
    copyLast: "Copy last",
    downloadTxt: "Download .txt",
    clearChat: "Clear chat",
    memoryTitle: "AI memory",
    memorySub: "Saved and added to every question. Reset with “Clear chat”.",
    saveMemory: "Save memory",
    clearMemory: "Clear memory",
    modesTitle: "Mode",
    templatesTitle: "Teacher templates",
    tplPisa: "PISA + map",
    tplDiagram: "Diagram",
    tplCriteria: "Criteria",
    tplCoords: "Coordinates",
    tpl15: "15-min plan",
    tpl45: "45-min plan",
    askPlaceholder: "Ask a geography question…",
    memoryPlaceholder: "Example: I teach Grade 8. Answer briefly, school style, with Kazakhstan examples.",
    send: "Send",
    enterHint: "Enter — send, Shift+Enter — new line",
    footerNote: "Made for geography teachers",
    thinking: "Thinking…",
    error: "Error. Check your connection and try again.",
    cleared: "Chat cleared.",
    copied: "Copied.",
    saved: "Saved.",
  },
};

let state = {
  lang: load(STORAGE.lang, "ru"),
  mode: load(STORAGE.mode, "chat"),
  memory: load(STORAGE.memory, ""),
  messages: load(STORAGE.chat, []),
  busy: false,
};

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}
function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function t(key){
  return (I18N[state.lang] && I18N[state.lang][key]) || (I18N.ru[key] || key);
}

function applyI18n(){
  // text nodes
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const k = el.getAttribute("data-i18n");
    el.textContent = t(k);
  });
  // placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const k = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(k));
  });

  els.langLabel.textContent = state.lang.toUpperCase();
}

function setStatus(text){
  els.status.textContent = text || "";
}

function addMessage(role, content){
  const msg = { role, content, ts: Date.now() };
  state.messages.push(msg);
  save(STORAGE.chat, state.messages);
  renderMessage(msg);
  scrollToBottom();
}

function renderAll(){
  els.chatScroll.innerHTML = "";
  state.messages.forEach(renderMessage);
  scrollToBottom(true);
}

function renderMessage(msg){
  const row = document.createElement("div");
  row.className = `msg ${msg.role === "user" ? "user" : "ai"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = msg.content;

  row.appendChild(bubble);
  els.chatScroll.appendChild(row);
}

function scrollToBottom(immediate=false){
  const el = els.chatScroll;
  if(immediate){
    el.scrollTop = el.scrollHeight;
  }else{
    requestAnimationFrame(()=>{ el.scrollTop = el.scrollHeight; });
  }
}

function autoGrow(textarea){
  textarea.style.height = "0px";
  const h = Math.min(textarea.scrollHeight, 160);
  textarea.style.height = h + "px";
}

function currentMode(){
  return state.mode || "chat";
}

function setMode(mode){
  state.mode = mode;
  save(STORAGE.mode, mode);

  document.querySelectorAll(".chip").forEach(btn=>{
    btn.classList.toggle("is-active", btn.dataset.mode === mode);
  });
}

function buildPrompt(userQuestion){
  // “Память для ИИ” добавляем в начало запроса как контекст.
  // Backend пока принимает {question, lang}, так что делаем это на фронте.
  const mem = (state.memory || "").trim();
  const mode = currentMode();

  // Слегка структурируем, чтобы ИИ “понимал”, что где:
  let q = userQuestion.trim();

  // Режим вставим в вопрос, чтобы backend мог включить свои авто-режимы по словам:
  // (например если у тебя ask.js ищет "test"/"task")
  // Тут мы просто добавляем тег режима в начале.
  q = `[mode:${mode}] ` + q;

  if(mem){
    return `Контекст (память):\n${mem}\n\nВопрос:\n${q}`;
  }
  return q;
}

async function askAI(userQuestion){
  const question = buildPrompt(userQuestion);
  setStatus(t("thinking"));
  state.busy = true;
  els.sendBtn.disabled = true;

  try{
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang: state.lang }),
    });

    if(!res.ok){
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();
    // ожидаем { answer } или { text } — подстрахуемся:
    const answer = data.answer ?? data.text ?? (typeof data === "string" ? data : JSON.stringify(data));

    addMessage("ai", answer);
    setStatus("");
  }catch(err){
    console.error(err);
    setStatus(t("error"));
  }finally{
    state.busy = false;
    els.sendBtn.disabled = false;
  }
}

/* Templates */
const TEMPLATES = {
  pisaMap: {
    ru: "Составь PISA-задание по географии с использованием карты Казахстана: условие, данные, 4 варианта ответа, правильный ответ, объяснение.",
    kk: "Қазақстан картасын пайдаланып географиядан PISA тапсырмасын құрастыр: шарт, деректер, 4 жауап нұсқасы, дұрыс жауап, түсіндірме.",
    en: "Create a PISA-style geography task using a map of Kazakhstan: prompt, data, 4 options, correct answer, explanation."
  },
  diagram: {
    ru: "Сделай задание по диаграмме (описание диаграммы словами): вопросы, ответы, критерии оценивания.",
    kk: "Диаграмма бойынша тапсырма жаса (диаграмманы сөзбен сипатта): сұрақтар, жауаптар, бағалау критерийлері.",
    en: "Make a diagram-based task (describe the chart in words): questions, answers, scoring criteria."
  },
  criteria: {
    ru: "Составь критерии и дескрипторы оценивания для задания по географии (7–9 класс).",
    kk: "География тапсырмасына бағалау критерийлері мен дескрипторларын жаса (7–9 сынып).",
    en: "Create assessment criteria and descriptors for a geography task (Grades 7–9)."
  },
  coords: {
    ru: "Дай задачу на координаты: 5 пунктов с координатами, что это за места, и как определить по карте/атласу. Добавь ответы.",
    kk: "Координаталарға тапсырма бер: 5 нүкте координаталарымен, бұл қандай орындар, карта/атласпен қалай табуға болады. Жауаптарын қос.",
    en: "Create a coordinates task: 5 points with coordinates, identify places and explain how to find them on a map/atlas. Add answers."
  },
  lesson15: {
    ru: "Сделай план урока по географии на 15 минут: цель, этапы, задания, оценивание, домашка.",
    kk: "15 минуттық география сабағының жоспары: мақсат, кезеңдер, тапсырмалар, бағалау, үй жұмысы.",
    en: "Create a 15-minute geography lesson plan: objective, steps, tasks, assessment, homework."
  },
  lesson45: {
    ru: "Сделай план урока по географии на 45 минут: цель, этапы, активити, дифференциация, оценивание, домашка.",
    kk: "45 минуттық география сабағының жоспары: мақсат, кезеңдер, белсенділік, саралау, бағалау, үй жұмысы.",
    en: "Create a 45-minute geography lesson plan: objective, steps, activities, differentiation, assessment, homework."
  },
};

/* UI wiring */
function init(){
  els.year.textContent = new Date().getFullYear();

  // Load memory into textarea
  els.memoryInput.value = state.memory || "";

  applyI18n();
  setMode(state.mode);
  renderAll();

  // Autogrow question
  autoGrow(els.questionInput);
  els.questionInput.addEventListener("input", ()=> autoGrow(els.questionInput));

  // Send on Enter
  els.questionInput.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey){
      e.preventDefault();
      onSend();
    }
  });

  els.sendBtn.addEventListener("click", onSend);

  // Modes
  document.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setMode(btn.dataset.mode);
    });
  });

  // Templates
  document.querySelectorAll(".tpl").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const key = btn.dataset.template;
      const msg = (TEMPLATES[key] && (TEMPLATES[key][state.lang] || TEMPLATES[key].ru)) || "";
      if(!msg) return;
      els.questionInput.value = msg;
      autoGrow(els.questionInput);
      els.questionInput.focus();
    });
  });

  // Clear chat (also clears memory, as you requested)
  els.clearChatBtn.addEventListener("click", ()=>{
    state.messages = [];
    save(STORAGE.chat, state.messages);

    // Сброс памяти тоже, как ты просил
    state.memory = "";
    save(STORAGE.memory, state.memory);
    els.memoryInput.value = "";

    renderAll();
    setStatus(t("cleared"));
    setTimeout(()=> setStatus(""), 1200);
  });

  // Copy last AI message
  els.copyLastBtn.addEventListener("click", async ()=>{
    const last = [...state.messages].reverse().find(m=>m.role === "ai");
    if(!last) return;
    try{
      await navigator.clipboard.writeText(last.content);
      setStatus(t("copied"));
      setTimeout(()=> setStatus(""), 1000);
    }catch(e){
      console.error(e);
    }
  });

  // Download txt
  els.downloadBtn.addEventListener("click", ()=>{
    const lines = state.messages.map(m=>{
      const who = m.role === "user" ? "USER" : "AI";
      return `${who}: ${m.content}`;
    }).join("\n\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-tanym-chat.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Memory save
  els.saveMemoryBtn.addEventListener("click", ()=>{
    state.memory = (els.memoryInput.value || "").trim();
    save(STORAGE.memory, state.memory);
    setStatus(t("saved"));
    setTimeout(()=> setStatus(""), 1000);
  });

  // Memory clear only
  els.clearMemoryBtn.addEventListener("click", ()=>{
    state.memory = "";
    save(STORAGE.memory, state.memory);
    els.memoryInput.value = "";
    setStatus(t("cleared"));
    setTimeout(()=> setStatus(""), 900);
  });

  // Lang menu
  els.langBtn.addEventListener("click", ()=>{
    const open = els.langMenu.classList.toggle("is-open");
    els.langBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e)=>{
    if(!els.langMenu.contains(e.target) && !els.langBtn.contains(e.target)){
      els.langMenu.classList.remove("is-open");
      els.langBtn.setAttribute("aria-expanded", "false");
    }
  });

  els.langMenu.querySelectorAll("button[data-lang]").forEach(b=>{
    b.addEventListener("click", ()=>{
      state.lang = b.dataset.lang;
      save(STORAGE.lang, state.lang);
      applyI18n();
      els.langMenu.classList.remove("is-open");
      els.langBtn.setAttribute("aria-expanded", "false");
    });
  });
}

function onSend(){
  if(state.busy) return;
  const raw = (els.questionInput.value || "").trim();
  if(!raw) return;

  // show user's original question in chat (without memory prefix)
  addMessage("user", raw);

  // clear input
  els.questionInput.value = "";
  autoGrow(els.questionInput);

  // ask
  askAI(raw);
}

init();
