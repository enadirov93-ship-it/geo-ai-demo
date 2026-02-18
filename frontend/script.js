const chat = document.getElementById("chat");
const chatBody = document.getElementById("chatBody");
const chatNote = document.getElementById("chatNote");

function toggleChat(){
  chat.classList.toggle("show");
}
function openChat(){
  chat.classList.add("show");
  document.getElementById("question")?.focus();
}

function addMsg(text, who="bot"){
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function openPolicy(e){
  e.preventDefault();
  openChat();
  addMsg("Құпиялық саясаты: Бұл демо-нұсқа. API кілттері қауіпсіз серверде сақталады. Қолданушы деректері жарияланбайды.", "bot");
}

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

function askPoint(n){
  openChat();
  const q = pointsText[n] || "Платформа басымдығы туралы түсіндір.";
  document.getElementById("question").value = q;
  ask();
}

async function ask(){
  const qEl = document.getElementById("question");
  const lang = document.getElementById("lang").value;
  const question = (qEl.value || "").trim();

  chatNote.textContent = "";
  if(!question){
    chatNote.textContent = "⚠️ Сұрақ енгізіңіз.";
    return;
  }

  addMsg(question, "user");
  qEl.value = "";
  addMsg("⏳ Жауап дайындалып жатыр...", "bot");

  try{
    const res = await fetch("/api/ask", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ question, lang })
    });

    const data = await res.json();

    // Удаляем "⏳" сообщение
    chatBody.removeChild(chatBody.lastElementChild);

    if(!res.ok){
      // Покажем ошибку красиво
      addMsg(`❌ ${data?.error || "Қате шықты"}`, "bot");
      if(data?.hint) chatNote.textContent = data.hint;
      return;
    }

    addMsg(data.answer || "Жауап табылмады", "bot");
  }catch(e){
    chatBody.removeChild(chatBody.lastElementChild);
    addMsg("❌ Сервер қол жетімсіз. Кейінірек қайталап көріңіз.", "bot");
  }
}
