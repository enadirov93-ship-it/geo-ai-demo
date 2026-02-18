export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, lang } = req.body || {};
  const language = ["kk","ru","en"].includes(lang) ? lang : "kk";

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question is required" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY not set",
      hint: "Vercel → Project Settings → Environment Variables → OPENAI_API_KEY қосып, Redeploy жаса."
    });
  }

  const systemPrompt = `
Сен AI-TANYM география көмекшісісің.
Негізгі бағытың: география, Қазақстан географиясы, PISA форматындағы тапсырмалар, карта/диаграмма/статистика талдау.
Жауап: түсінікті, қысқа + қажет болса қадамдап.
Тіл: ${language}.
  `.trim();

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 700,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      // Частая ошибка: quota 429
      const msg = data?.error?.message || "OpenAI API error";
      return res.status(r.status).json({
        error: msg,
        hint: r.status === 429
          ? "OpenAI лимит/квота таусылған болуы мүмкін (429). Billing/usage тексер."
          : "OpenAI error. Модель атауын немесе кілтті тексер."
      });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim() || "Жауап табылмады";
    return res.status(200).json({ answer });

  } catch (e) {
    return res.status(500).json({ error: "Server error", hint: String(e?.message || e) });
  }
}
