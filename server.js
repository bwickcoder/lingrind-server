import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { fetchTranscript } from "./utils/fetchYoutubeTranscript.js";
import transcriptToFlashcards from "./utils/transcriptToFlashcards.js";

const app = express();
app.use(cors());
app.use(express.json());



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



// ✅ TRANSLATION ENDPOINT
app.post("/api/translate", async (req, res) => {
  const { cards } = req.body;

  const cleanCards = (cards || [])
    .filter(c => c.jp && typeof c.jp === "string" && c.jp.trim().length > 0)
    .map(c => ({ jp: c.jp }));

  console.log("🔍 Translating", cleanCards.length, "cards");

  const BATCH_SIZE = 20;
  const allTranslations = [];

  for (let i = 0; i < cleanCards.length; i += BATCH_SIZE) {
    const batch = cleanCards.slice(i, i + BATCH_SIZE);

    const prompt = `
You are a Japanese teacher helping students build flashcards.
For each Japanese phrase, return an array of objects with this format:
[{ "jp": "...", "en": "...", "romaji": "...", "formal": "..." }]
Do not include any extra commentary or markdown code fences. Only return pure JSON.

Translate these:
${batch.map((c, j) => `${j + 1}. ${c.jp}`).join("\n")}
`.trim();

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      const content = completion?.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in OpenAI response");

      const cleanJson = content
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();

      let parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed)) throw new Error("Translation output was not an array");

      const valid = parsed.filter(c => c.jp && c.en);
      allTranslations.push(...valid);

      console.log(`✅ Batch ${i / BATCH_SIZE + 1}: ${valid.length} translated`);
      await new Promise(res => setTimeout(res, 1200)); // cooldown
    } catch (err) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, err.message);
    }
  }

  // ✅ Final response with all translations
  res.json({ translated: allTranslations });
});






// ✅ GENERATE FLASHCARDS FROM VIDEO
app.post("/api/generate", async (req, res) => {
  const { youtubeUrl, options } = req.body;

  try {
    let transcript = await fetchTranscript(youtubeUrl);

    if (options.prioritizeDialogue) {
      transcript = transcript.filter(t =>
        t.jp.includes("？") || t.jp.includes("「") || t.jp.includes("」")
      );
    }

    const flashcards = options.generateCards
      ? transcriptToFlashcards(transcript)
      : [];

    res.json({
      flashcards,
      transcript: options.includeTranscript ? transcript : [],
    });
  } catch (err) {
    console.error("❌ Error in /api/generate:", err.message);
    res.status(500).json({ error: "Processing failed" });
  }
});

app.listen(3001, () => console.log("🟢 Server running on http://localhost:3001"));
