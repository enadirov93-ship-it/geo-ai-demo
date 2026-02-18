let currentLang = "ru";

function setLang(lang) {
  currentLang = lang;
}

async function sendQuestion() {
  const input = document.getElementById("question");
  const chat = document.getElementById("chat");
  const loader = document.getElementById("loader");

  const text = input.value.trim();
  if (!text) return;

  chat.innerHTML += `<div class="message user">${text}</div>`;
  input.value = "";

  loader.classList.remove("hidden");

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        lang: currentLang
      })
    });

    const data = await response.json();
    chat.innerHTML += `<div class="message ai">${data.answer}</div>`;
  } catch (e) {
    chat.innerHTML += `<div class="message ai">Ошибка сервера</div>`;
  }

  loader.classList.add("hidden");
  chat.scrollTop = chat.scrollHeight;
}
