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

// Определяем пути для статических файлов
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "frontend")));

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Отдаём главный HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Основной endpoint для AI
app.post("/ask", async (req, res) => {
  const { question, lang } = req.body;

  // Поддержка 3 языков: kk, ru, en
  const language = ["kk", "ru", "en"].includes(lang) ? lang : "kk";

  const systemPrompt = `
Ты эксперт по географии и AI-помощник.
Отвечай пошагово, понятно и дружелюбно.
Если вопрос связан с географией — давай подробное объяснение, карты, статистику.
Если вопрос не про географию — отвечай общими знаниями, но дружелюбно.
Отвечай на языке: ${language}.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // или gpt-4 если есть доступ
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 600
    });

    const answer = completion.choices[0].message?.content || "Жауап табылмады";
    res.json({ answer });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Ошибка сервера, смотри консоль" });
  }
});

// Порт для Render / локального запуска
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend работает на порту ${PORT}`);
});
