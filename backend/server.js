import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Пути для статики (frontend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "frontend")));

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ====== GEO FUNCTIONS (точные вычисления) ======
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // радиус Земли в км

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function initialBearingDeg(lat1, lon1, lat2, lon2) {
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
}

// ====== TOOLS (function calling) ======
const tools = [
  {
    type: "function",
    function: {
      name: "geo_distance",
      description:
        "Вычисляет расстояние между двумя точками по широте/долготе в километрах.",
      parameters: {
        type: "object",
        properties: {
          lat1: { type: "number", description: "Широта точки 1" },
          lon1: { type: "number", description: "Долгота точки 1" },
          lat2: { type: "number", description: "Широта точки 2" },
          lon2: { type: "number", description: "Долгота точки 2" },
        },
        required: ["lat1", "lon1", "lat2", "lon2"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "geo_bearing",
      description:
        "Вычисляет азимут (начальный курс) от точки 1 к точке 2 в градусах 0..360.",
      parameters: {
        type: "object",
        properties: {
          lat1: { type: "number", description: "Широта точки 1" },
          lon1: { type: "number", description: "Долгота точки 1" },
          lat2: { type: "number", description: "Широта точки 2" },
          lon2: { type: "number", description: "Долгота точки 2" },
        },
        required: ["lat1", "lon1", "lat2", "lon2"],
      },
    },
  },
];

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ====== AI endpoint ======
app.post("/ask", async (req, res) => {
  const { question, lang } = req.body;

  // Языки: kk, ru, en
  const language = ["kk", "ru", "en"].includes(lang) ? lang : "kk";

  const systemPrompt = `
Ты эксперт по географии и AI-помощник учителя.
Отвечай дружелюбно и понятно, можно пошагово.

ВАЖНО:
- Если нужна математика/расчёты/точность (расстояние, азимут, координаты) — используй tools, НЕ угадывай.
- Если данных не хватает — задай 1-2 коротких уточняющих вопроса.
- Если ученик просит подсказку — сначала подсказка, а не готовый ответ.

Отвечай на языке: ${language}.
`.trim();

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini"; // можно поменять в .env

  try {
    // 1) первый запрос (модель может вызвать tool)
    const first = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      tools,
      tool_choice: "auto",
      max_tokens: 900,
    });

    const msg = first.choices?.[0]?.message;

    if (!msg) {
      return res.json({ answer: "Жауап табылмады" });
    }

    // Если tools не нужны — сразу отдаём ответ
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return res.json({ answer: msg.content || "Жауап табылмады" });
    }

    // 2) выполняем tool calls
    const toolMessages = [];

    for (const call of msg.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        // если вдруг пришло не JSON
        args = {};
      }

      if (call.function.name === "geo_distance") {
        const km = haversineKm(args.lat1, args.lon1, args.lat2, args.lon2);
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ km: Number(km.toFixed(3)) }),
        });
      }

      if (call.function.name === "geo_bearing") {
        const bearing = initialBearingDeg(args.lat1, args.lon1, args.lat2, args.lon2);
        toolMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ bearing_deg: Number(bearing.toFixed(2)) }),
        });
      }
    }

    // 3) второй запрос — модель получает результат tools и формирует финальный ответ
    const second = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
        msg,
        ...toolMessages,
      ],
      max_tokens: 900,
    });

    const answer = second.choices?.[0]?.message?.content || "Жауап табылмады";
    res.json({ answer });
  } catch (error) {
    console.error(error?.response?.data || error?.message || error);
    res.status(500).json({ error: "Ошибка сервера, смотри консоль" });
  }
});

// Порт
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend работает на порту ${PORT}`);
});
