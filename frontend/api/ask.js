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

    // ====== 1) “Всегда актуально” — проверка для Казахстана ======
    // Ловим вопросы “сколько областей/регионов/облыс/облыстар в Казахстане”
    const isKZRegionsCountQuestion = (() => {
      const s = q;
      const hasKazakhstan =
        s.includes("казахстан") || s.includes("қазақстан") || s.includes("kазақстан") || s.includes("kz") || s.includes("kazakhstan");
      const hasCount =
        s.includes("сколько") || s.includes("қанша") || s.includes("how many") || s.includes("number of");
      const hasRegionWord =
        s.includes("област") || s.includes("облыс") || s.includes("region") || s.includes("регион") || s.includes("province");

      return hasKazakhstan && hasCount && hasRegionWord;
    })();

    // SPARQL: берём актуальное значение quantity (P1114) для “region of Kazakhstan” (Q836672)
    // Берём самое “свежее” по start time (P580); если есть end time (P582), то это старое.
    async function fetchKZRegionCountFromWikidata() {
      const endpoint = "https://query.wikidata.org/sparql";
      const sparql = `
SELECT ?qty ?start ?end WHERE {
  wd:Q836672 p:P1114 ?st .
  ?st ps:P1114 ?qty .
  OPTIONAL { ?st pq:P580 ?start . }
  OPTIONAL { ?st pq:P582 ?end . }
}
ORDER BY DESC(?start)
LIMIT 10
`.trim();

      const url = `${endpoint}?format=json&query=${encodeURIComponent(sparql)}`;

      const r = await fetch(url, {
        headers: {
          // важный заголовок для Wikidata Query Service
          "Accept": "application/sparql+json",
          "User-Agent": "geo-ai-demo/1.0 (Vercel serverless; contact: none)"
        }
      });

      if (!r.ok) throw new Error(`Wikidata SPARQL error: ${r.status}`);

      const data = await r.json();
      const rows = data?.results?.bindings || [];

      // Выбираем актуальную строку: без end или end в будущем
      const now = new Date();
      for (const row of rows) {
        const qtyStr = row?.qty?.value;
        const endStr = row?.end?.value;

        const qty = qtyStr ? Number(qtyStr) : NaN;
        if (!Number.isFinite(qty)) continue;

        if (!endStr) {
          return { qty, source: "Wikidata(Q836672,P1114)", checkedAt: new Date().toISOString() };
        }

        // если вдруг end указан, но позже текущей даты — считаем актуальным
        const endDate = new Date(endStr);
        if (Number.isFinite(endDate.getTime()) && endDate > now) {
          return { qty, source: "Wikidata(Q836672,P1114)", checkedAt: new Date().toISOString() };
        }
      }

      // fallback: первая валидная
      const first = rows[0]?.qty?.value;
      const qty = first ? Number(first) : NaN;
      if (Number.isFinite(qty)) {
        return { qty, source: "Wikidata(Q836672,P1114)", checkedAt: new Date().toISOString() };
      }

      throw new Error("Wikidata returned no qty");
    }

    // Если это вопрос про число областей РК — сначала достаём факт
    let verifiedFactsText = "";
    let verifiedMode = null;

    if (isKZRegionsCountQuestion) {
      try {
        const info = await fetchKZRegionCountFromWikidata();

        if (language === "ru") {
          verifiedFactsText =
            `ПРОВЕРЕННЫЙ ФАКТ (обновляется из Wikidata): в Казахстане сейчас ${info.qty} областей (регионов). ` +
            `Проверено: ${info.checkedAt}. Источник: ${info.source}.`;
        } else if (language === "en") {
          verifiedFactsText =
            `VERIFIED FACT (from Wikidata): Kazakhstan currently has ${info.qty} regions (oblast-level). ` +
            `Checked: ${info.checkedAt}. Source: ${info.source}.`;
        } else {
          // kk
          verifiedFactsText =
            `ТЕКСЕРІЛГЕН ДЕРЕК (Wikidata): Қазақстанда қазір ${info.qty} облыс бар. ` +
            `Тексерілген уақыты: ${info.checkedAt}. Дереккөз: ${info.source}.`;
        }

        // Можно вообще ответить сразу без модели (самый надежный вариант):
        // Но оставим “красивое объяснение” через модель, дав ей факт железобетонно.
        verifiedMode = "verified_fact";
      } catch (e) {
        // если проверка сломалась — не падаем, просто продолжим через модель
        verifiedFactsText = "";
        verifiedMode = "verification_failed";
      }
    }

    // ====== 2) System prompt (как у тебя, + правило “не врать про актуальные числа”) ======
    let systemPrompt = "";

    if (mode === "chat") {
      systemPrompt = `
Сен AI-TANYM — география пәні бойынша AI көмекшісің (оқушы + мұғалім үшін).
Ереже:
- География сұрағына нақты, түсінікті жауап бер.
- Қазақстан географиясына басымдық бер.
- Егер сұрақ анық емес болса — 1 нақтылау сұрағын қой.
- Егер "ПРОВЕРЕННЫЙ ФАКТ / ТЕКСЕРІЛГЕН ДЕРЕК / VERIFIED FACT" берілсе — соны дәл қолдан, басқа сан ойлап таппа.
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
Егер "ПРОВЕРЕННЫЙ ФАКТ / ТЕКСЕРІЛГЕН ДЕРЕК / VERIFIED FACT" берілсе — соны дәл қолдан.
Тіл: ${language}.
`.trim();
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // ====== 3) OpenAI request ======
    // Если у нас есть verifiedFactsText — добавляем как отдельное сообщение перед вопросом
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    if (verifiedFactsText) {
      messages.push({ role: "system", content: verifiedFactsText });
    }

    messages.push({ role: "user", content: question });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
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
    return res.status(200).json({
      answer,
      mode,
      verification: verifiedMode,          // "verified_fact" | "verification_failed" | null
      verifiedFactsUsed: Boolean(verifiedFactsText)
    });

  } catch (e) {
    return res.status(500).json({ error: "Function crashed", hint: String(e?.message || e) });
  }
};
