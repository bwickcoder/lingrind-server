import { fetchTranscript } from './fetchYoutubeTranscript.js';
import transcriptToFlashcards from './transcriptToFlashcards.js';
import fs from 'fs';

async function generateFlashcardsFromVideo(url) {
  try {
    const transcript = await fetchTranscript(url);
    console.log("✅ Transcript fetched. Converting to flashcards...");

    const flashcards = transcriptToFlashcards(transcript);
    console.log("✅ Flashcards generated:");

    // ✅ Write flashcards to a JSON file
    fs.writeFileSync("output.json", JSON.stringify(flashcards, null, 2), "utf-8");

    // Optional: Log to terminal for preview
    console.log(flashcards.slice(0, 3)); // preview first few
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Replace this with the video you want to test
const videoUrl = "https://www.youtube.com/watch?v=meYTWia_upA";

generateFlashcardsFromVideo(videoUrl);
