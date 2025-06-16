import puppeteer from "puppeteer";

export async function fetchTranscript(videoUrl) {
  const browser = await puppeteer.launch({
    headless: "new", // safer in recent Puppeteer
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    timeout: 0,
  });

  let page;

  try {
    page = await browser.newPage();

    await page.goto(videoUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Step 1: Expand the description
    await page.mouse.click(120, 590);
    await new Promise(res => setTimeout(res, 1500));

    // Step 2: Scroll down to expose transcript button
    await page.evaluate(() => window.scrollBy(0, 1600));
    await new Promise(res => setTimeout(res, 2500));
    // Step 3: Click "Show transcript"
    const transcriptBtnClicked = await page.evaluate(() => {
      const span = [...document.querySelectorAll("span")].find(el =>
        el.textContent.trim() === "Show transcript"
      );
      if (span) {
        span.click();
        return true;
      }
      return false;
    });

    console.log(transcriptBtnClicked ? "✅ Clicked 'Show transcript'" : "❌ Transcript button not found");

    if (!transcriptBtnClicked) throw new Error("Show transcript button not found");

    // Step 4: Wait for transcript content
    await page.waitForFunction(() => {
      const el = document.querySelector("yt-formatted-string.segment-text");
      return el && el.textContent.trim().length > 0;
    }, { timeout: 30000 });

    // Step 5: Reveal hidden items
    await page.evaluate(() => {
      document.querySelectorAll('[aria-hidden="true"]').forEach(el => {
        el.removeAttribute("aria-hidden");
      });
    });

    // Step 6: Scrape
    const transcript = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("ytd-transcript-segment-renderer")).map(seg => {
        const text = seg.querySelector(".segment-text")?.textContent.trim() || "";
        const time = seg.querySelector(".segment-timestamp")?.textContent.trim() || "";
        return {
          jp: text,
          romaji: "",
          en: "[Translate this to English]",
          formal: "",
          audio: "",
          source: "yt",
          level: "user-imported",
          category: "youtube",
          time
        };
      });
    });

    console.log(`✅ Transcript length: ${transcript.length}`);
    return transcript;
  } catch (err) {
    console.error("❌ Scraping error:", err.message);

    // Only take screenshot if page still exists
    if (page && !page.isClosed()) {
      try {
        await page.screenshot({ path: "debug_error.png", fullPage: true });
      } catch (screenshotErr) {
        console.warn("⚠️ Failed to take error screenshot:", screenshotErr.message);
      }
    }

    return [];
  } finally {
    if (browser && browser.isConnected()) await browser.close();
  }
}
