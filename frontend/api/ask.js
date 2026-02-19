module.exports = async (req, res) => {
  try {
    // ✅ CORS (optional)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = req.body || {};
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const langRaw = typeof body.lang === "string" ? body.lang : "kk";
    const language = ["kk", "ru", "en"].includes(langRaw) ? langRaw : "kk";

    if (!question) return res.status(400).json({ error: "Question is required" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY жоқ",
        hint: "Vercel → Settings → Environment Variables → OPENAI_API_KEY қосып, Production/Preview/Development таңдап, Redeploy жаса."
      });
    }

    // ✅ Авто-режим
    const q = question.toLowerCase();
    const isTest =
      q.includes("тест") || q.includes("test") || q.includes("mcq") ||
      q.includes("multiple choice") || q.includes("вариант") ||
      q.includes("10 сұрақ") || q.includes("20 сұрақ") || q.includes("жауап кілті");

    const isTask =
      q.includes("тапсырма") || q.includes("task") || q.includes("pisa") ||
      q.includes("есеп") || q.includes("дескриптор") || q.includes("бағалау") || q.includes("rubric");

    let mode = "chat";
    if (isTest) mode = "test";
    else if (isTask) mode = "task";

    let systemPrompt = "";

    if (mode === "chat") {
      systemPrompt = `
Сен AI-TANYM — география пәні бойынша AI көмекшісің (оқушы + мұғалім үшін).
Ереже:
- География сұрағына нақты, түсінікті жауап бер.
- Қазақстан географиясына басымдық бер.
- Егер сұрақ анық емес болса — 1 нақтылау сұрағын қой.
Жауап форматы:
1) Қысқа жауап
2) Түсіндіру (қадамдап)
3) Соңында 1 қысқа тексеру сұрағы
Тіл: ${language}.
`.trim();
    } else if (mode === "test") {
      systemPrompt = `
Сен AI-TANYM — мұғалімге арналған тест генераторысың.
Ереже:
- 4 нұсқа (A, B, C, D)
- әр сұраққа дұрыс жауап және 1-2 сөйлем түсіндірме
- соңында "Жауап кілті" бөлек тізім болып тұрсын
Тіл: ${language}.
`.trim();
    } else {
      systemPrompt = `
Сен AI-TANYM — география бойынша тапсырма құрастыратын көмекшісің.
Әр тапсырмада:
- Тапсырма мәтіні
- Шешімі (қадамдап)
- Бағалау критерийі/дескриптор (2-4 пункт)
Тіл: ${language}.
`.trim();
    }

    // ✅ OpenAI request
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 900,
        temperature: 0.6
      })
    });

    const raw = await r.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: `OpenAI JSON емес жауап қайтарды (status ${r.status})`,
        hint: raw.slice(0, 200)
      });
    }

    if (!r.ok) {
      const msg = data?.error?.message || "OpenAI API error";
      return res.status(r.status).json({
        error: msg,
        hint: r.status === 429
          ? "Лимит/квота таусылған (429). OpenAI Billing/Usage тексер."
          : "OpenAI error. Кілт/модель дұрыс па тексер."
      });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim() || "Жауап табылмады";
    return res.status(200).json({ answer, mode });

  } catch (e) {
    return res.status(500).json({ error: "Function crashed", hint: String(e?.message || e) });
  }
};
