module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const lang = typeof body.lang === "string" ? body.lang : "kk";
  const language = ["kk", "ru", "en"].includes(lang) ? lang : "kk";

  if (!question) return res.status(400).json({ error: "Question is required" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY жоқ",
      hint: "Vercel → Project → Settings → Environment Variables → OPENAI_API_KEY қосып, Production/Preview/Development таңда да Redeploy жаса."
    });
  }

  // Auto-detect mode
  const q = question.toLowerCase();
  const isTest =
    q.includes("тест") || q.includes("test") ||
    q.includes("multiple choice") || q.includes("вариант") ||
    q.includes("mcq") || q.includes("жауап кілті") ||
    q.includes("10 сұрақ") || q.includes("20 сұрақ") ||
    q.includes("10 вопросов") || q.includes("20 вопросов");

  const isTask =
    q.includes("тапсырма") || q.includes("task") ||
    q.includes("pisa") || q.includes("есеп") ||
    q.includes("дескриптор") || q.includes("бағалау") ||
    q.includes("rubric") || q.includes("критерий");

  let mode = "chat";
  if (isTest) mode = "test";
  else if (isTask) mode = "task";

  const baseRules = `
Сен AI-TANYM — география пәні бойынша AI көмекшісің (оқушы + мұғалім үшін).
Қазақстан географиясына басымдық бер.
Егер сұрақ анық емес болса — 1 нақтылау сұрағын қой.
Ойдан сан/дерек ойлап таппа. Сенімсіз болса "нақты дерек керек" деп белгіле.
Тіл: ${language}.
`.trim();

  let systemPrompt = "";
  if (mode === "chat") {
    systemPrompt = `
${baseRules}
Жауап форматы:
1) Қысқа жауап
2) Түсіндіру (қадамдап)
3) Соңында 1 қысқа тексеру сұрағы
`.trim();
  } else if (mode === "test") {
    systemPrompt = `
${baseRules}
Сен мұғалімге арналған тест генераторысың.
- 4 нұсқа (A, B, C, D)
- Дұрыс жауап + қысқа түсіндірме
- Соңында "Жауап кілті" бөлек тізім
`.trim();
  } else {
    systemPrompt = `
${baseRules}
Сен оқушыларға арналған тапсырма құрастырасың.
Әр тапсырмада:
- Тапсырма мәтіні
- Шешімі (қадамдап)
- Дескриптор (2–4 пункт)
`.trim();
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 900,
        temperature: 0.5
      })
    });

    const raw = await r.text();
    let data;
    try { data = JSON.parse(raw); }
    catch {
      return res.status(502).json({ error: "OpenAI JSON емес жауап қайтарды", hint: raw.slice(0, 200) });
    }

    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || "OpenAI API error",
        hint: r.status === 429 ? "429: квота/лимит. Billing/Usage тексер." : "OpenAI error. API key/модель тексер."
      });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim() || "Жауап табылмады";
    return res.status(200).json({ answer, mode });

  } catch (e) {
    return res.status(500).json({ error: "Server error", hint: String(e?.message || e) });
  }
};
