import { config } from "dotenv";
import OpenAI from "openai";

config(); // Load .env

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translateText(text) {
  try {
    const prompt = `Translate the following Japanese text to natural English:\n\n"${text}"`;

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return chat.choices[0].message.content.trim();
  } catch (err) {
    console.error("Translation error:", err.message);
    return "[Translation error]";
  }
}
