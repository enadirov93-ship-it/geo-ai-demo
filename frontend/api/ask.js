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

    // ====== GEO FUNCTIONS (server-side, точные) ======
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const toRad = (x) => (x * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const initialBearingDeg = (lat1, lon1, lat2, lon2) => {
      const toRad = (x) => (x * Math.PI) / 180;
      const toDeg = (x) => (x * 180) / Math.PI;

      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δλ = toRad(lon2 - lon1);

      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

      const θ = Math.atan2(y, x);
      return (toDeg(θ) + 360) % 360;
    };

    // ✅ Авто-режим (как было у тебя)
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

    // ✅ system prompt (усилен: просим tools при расчётах)
    let systemPrompt = "";

    if (mode === "chat") {
      systemPrompt = `
Сен AI-TANYM — география пәні бойынша AI көмекшісің (оқушы + мұғалім үшін).
Ереже:
- География сұрағына нақты, түсінікті жауап бер.
- Қазақстан географиясына басымдық бер.
- Егер сұрақ анық емес болса — 1 нақтылау сұрағын қой.
- Егер есеп/координата/азимут/қашықтық сияқты дәл есеп керек болса — есепті "tools" арқылы жаса, жорамалдама.
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
Егер тапсырмада есептеу/координата/азимут/қашықтық керек болса — "tools" арқылы дәл есепте.
Тіл: ${language}.
`.trim();
    }

    // ====== TOOLS (function calling) ======
    const tools = [
      {
        type: "function",
        function: {
          name: "geo_distance",
          description: "Вычисляет расстояние между двумя точками по широте/долготе в километрах.",
          parameters: {
            type: "object",
            properties: {
              lat1: { type: "number" },
              lon1: { type: "number" },
              lat2: { type: "number" },
              lon2: { type: "number" }
            },
            required: ["lat1", "lon1", "lat2", "lon2"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "geo_bearing",
          description: "Вычисляет азимут (начальный курс) от точки 1 к точке 2 в градусах 0..360.",
          parameters: {
            type: "object",
            properties: {
              lat1: { type: "number" },
              lon1: { type: "number" },
              lat2: { type: "number" },
              lon2: { type: "number" }
            },
            required: ["lat1", "lon1", "lat2", "lon2"]
          }
        }
      }
    ];

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // ====== 1) First call to OpenAI (can request tools) ======
    const r1 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        tools,
        tool_choice: "auto",
        max_tokens: 900,
        temperature: 0.6
      })
    });

    const raw1 = await r1.text();
    let data1;
    try {
      data1 = JSON.parse(raw1);
    } catch {
      return res.status(502).json({
        error: `OpenAI JSON емес жауап қайтарды (status ${r1.status})`,
        hint: raw1.slice(0, 200)
      });
    }

    if (!r1.ok) {
      const msg = data1?.error?.message || "OpenAI API error";
      return res.status(r1.status).json({
        error: msg,
        hint: r1.status === 429
          ? "Лимит/квота таусылған (429). OpenAI Billing/Usage тексер."
          : "OpenAI error. Кілт/модель дұрыс па тексер."
      });
    }

    const msg1 = data1?.choices?.[0]?.message;
    if (!msg1) return res.status(200).json({ answer: "Жауап табылмады", mode });

    // If no tool calls => return answer
    if (!msg1.tool_calls || msg1.tool_calls.length === 0) {
      const answer = msg1?.content?.trim() || "Жауап табылмады";
      return res.status(200).json({ answer, mode });
    }

    // ====== 2) Execute tool calls on server ======
    const toolMessages = [];
    for (const call of msg1.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }

      if (call.function.name === "geo_distance") {
        const km = haversineKm(args.lat1, args.lon1, args.lat2, args.lon2);
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ km: Number(km.toFixed(3)) })
        });
      }

      if (call.function.name === "geo_bearing") {
        const bearing = initialBearingDeg(args.lat1, args.lon1, args.lat2, args.lon2);
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ bearing_deg: Number(bearing.toFixed(2)) })
        });
      }
    }

    // ====== 3) Second call: model gets tool results and answers ======
    const r2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
          msg1,
          ...toolMessages
        ],
        max_tokens: 900,
        temperature: 0.6
      })
    });

    const raw2 = await r2.text();
    let data2;
    try {
      data2 = JSON.parse(raw2);
    } catch {
      return res.status(502).json({
        error: `OpenAI JSON емес жауап қайтарды (status ${r2.status})`,
        hint: raw2.slice(0, 200)
      });
    }

    if (!r2.ok) {
      const msg = data2?.error?.message || "OpenAI API error";
      return res.status(r2.status).json({
        error: msg,
        hint: r2.status === 429
          ? "Лимит/квота таусылған (429). OpenAI Billing/Usage тексер."
          : "OpenAI error. Кілт/модель дұрыс па тексер."
      });
    }

    const answer = data2?.choices?.[0]?.message?.content?.trim() || "Жауап табылмады";
    return res.status(200).json({ answer, mode });

  } catch (e) {
    return res.status(500).json({ error: "Function crashed", hint: String(e?.message || e) });
  }
};
