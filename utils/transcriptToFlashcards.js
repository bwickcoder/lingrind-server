// /backend/utils/transcriptToFlashcards.js


export default function transcriptToFlashcards(transcript) {
  if (!Array.isArray(transcript)) return [];

  return transcript
    .filter((entry) => entry.jp && entry.jp.trim().length > 0) // ✅ USE `jp`
    .map((entry, index) => ({
      jp: entry.jp.trim(),
      romaji: "",
      en: "[Translate this to English]",
      formal: "",
      audio: "",
      source: "yt",
      level: "user-imported",
      category: "youtube",
    }))
    .slice(0, 1000);
}
