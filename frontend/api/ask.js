export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, lang } = req.body || {};

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY жоқ"
      });
    }

    const language = ["kk","ru","en"].includes(lang) ? lang : "kk";

    const systemPrompt = `
Сен AI-TANYM география көмекшісісің.
Жауап құрылымы:
1) Қысқа жауап
2) Түсіндіру
3) Соңында тексеру сұрағы
Тіл: ${language}.
`.trim();

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": Bearer ${apiKey},
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question }
          ],
          max_tokens: 800
        })
      }
    );

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(500).json({
        error: data.error?.message || "OpenAI error"
      });
    }

    return res.status(200).json({
      answer: data.choices[0].message.content
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      detail: err.message
    });
  }
}
