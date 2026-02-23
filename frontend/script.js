// ====== Elements ======
const responseDiv = document.getElementById("response"); // теперь это чат-лента
const stickyHint = document.getElementById("stickyHint");
const inputEl = document.getElementById("question");
const langEl = document.getElementById("lang");

// ====== Text for platform points (оставил, вдруг понадобится дальше) ======
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

// ====== Helpers ======
function scrollToSearch(){
  document.getElementById("ai-search").scrollIntoView({ behavior: "smooth", block: "start" });
}

function autoGrow(el){
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 180) + "px";
}

function appendMsg(role, text){
  if (!responseDiv) return;

  const wrap = document.createElement("div");
  wrap.className = `ai-msg ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "ai-bubble";
  bubble.textContent = text;

  wrap.appendChild(bubble);
  responseDiv.appendChild(wrap);
  responseDiv.scrollTop = responseDiv.scrollHeight;
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

function openPolicy(e){
  e.preventDefault();
  scrollToSearch();
  appendMsg("ai", "Құпиялық саясаты: Бұл демо-нұсқа. Құпия кілттер серверде сақталады, қолданушы мәліметтері жарияланбайды.");
}

function askPoint(n){
  // Если потом будут detail-карточки — оставил как было
  const target = document.getElementById(`detail-${n}`);
  if(target){
    target.scrollIntoView({ behavior:"smooth", block:"start" });
    target.classList.add("flash");
    setTimeout(()=>target.classList.remove("flash"), 900);
  } else {
    // если detail блоков нет — просто кинем пояснение в чат
    scrollToSearch();
    appendMsg("ai", pointsText[n] || "Ақпарат табылмады.");
  }
}

function quickAsk(text){
  if (inputEl){
    inputEl.value = text;
    autoGrow(inputEl);
  }
  scrollToSearch();
  ask();
}

// ====== Main ask() ======
async function ask(){
  const question = (inputEl?.value || "").trim();
  const lang = langEl?.value || "kk";

  if(!question){
    appendMsg("ai", "⚠️ Сұрақ енгізіңіз.");
    return;
  }

  // 1) Добавляем сообщение пользователя
  appendMsg("user", question);

  // 2) Очистим инпут
  if (inputEl){
    inputEl.value = "";
    autoGrow(inputEl);
    inputEl.focus();
  }

  // 3) Typing...
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

// ====== Enter / Shift+Enter behavior + autogrow ======
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

// ====== Sticky hint appears when user is not near search section ======
function handleHint(){
  const el = document.getElementById("ai-search");
  if (!el || !stickyHint) return;

  const rect = el.getBoundingClientRect();
  const visible = rect.top < window.innerHeight && rect.bottom > 0;

  if(visible) stickyHint.classList.remove("show");
  else stickyHint.classList.add("show");
}

window.addEventListener("scroll", handleHint);
handleHint();
