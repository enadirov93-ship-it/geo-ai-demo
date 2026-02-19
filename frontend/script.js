const responseDiv = document.getElementById("response");
const stickyHint = document.getElementById("stickyHint");

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

function scrollToSearch(){
  document.getElementById("ai-search").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openPolicy(e){
  e.preventDefault();
  responseDiv.textContent = "Құпиялық саясаты: Бұл демо-нұсқа. Құпия кілттер серверде сақталады, қолданушы мәліметтері жарияланбайды.";
  scrollToSearch();
}

function askPoint(n){
  const q = pointsText[n] || "Платформа басымдығы туралы түсіндір.";
  document.getElementById("question").value = q;
  scrollToSearch();
  ask();
}

async function ask(){
  const question = (document.getElementById("question").value || "").trim();
  const lang = document.getElementById("lang").value;

  if(!question){
    responseDiv.textContent = "⚠️ Сұрақ енгізіңіз.";
    return;
  }

  responseDiv.textContent = "⏳ Жауап дайындалып жатыр...";

  try{
    const res = await fetch("/api/ask", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ question, lang })
    });

    const data = await res.json();

    if(!res.ok){
      responseDiv.textContent = `❌ ${data?.error || "Қате шықты"}\n${data?.hint ? "ℹ️ " + data.hint : ""}`;
      return;
    }

    responseDiv.textContent = data.answer || "Жауап табылмады";
  }catch(e){
    responseDiv.textContent = "❌ Сервер қол жетімсіз (API жұмыс істемей тұр).";
  }
}

/* ✅ Sticky hint appears when user is not near search section */
function handleHint(){
  const el = document.getElementById("ai-search");
  const rect = el.getBoundingClientRect();
  const visible = rect.top < window.innerHeight && rect.bottom > 0;
  if(visible) stickyHint.classList.remove("show");
  else stickyHint.classList.add("show");
}
window.addEventListener("scroll", handleHint);
handleHint();
