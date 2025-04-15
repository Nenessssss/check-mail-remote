const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  console.log("🔁 Uruchamiam Puppeteer...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://w-dacie.netlify.app/check-mail.html", {
    waitUntil: "networkidle2"
  });

  console.log("🕐 Poczekajmy chwilę na JS...");
  await page.waitForTimeout(5000);

  await browser.close();
  console.log("✅ Puppeteer zamknięty.");

  res.send("Maile sprawdzone ✔️");
});

app.listen(PORT, () => {
  console.log(`🌍 Serwer działa na porcie ${PORT}`);
});
