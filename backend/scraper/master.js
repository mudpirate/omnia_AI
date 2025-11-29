// runner.js
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import scrapeProducts from "./xcite.js"; // Adjust path as necessary

const SCRAPING_JOBS = [
  {
    url: "https://www.xcite.com/tablets/c",
    category: "tablets",
  },
  {
    url: "https://www.xcite.com/laptops/c",
    category: "laptops",
  },
  {
    url: "https://www.xcite.com/mobile-phones/c",
    category: "mobilephones",
  },
  {
    url: "https://www.xcite.com/headphones/c",
    category: "headphones",
  },
  {
    url: "https://www.xcite.com/earphones/c",
    category: "earphones",
  },
];

async function runAllScrapers() {
  const prisma = new PrismaClient();
  let browser = null;

  console.log(`\n======================================`);
  console.log(
    `🤖 Starting Master Scraper Runner (${SCRAPING_JOBS.length} jobs)`
  );
  console.log(`======================================`);

  try {
    // ⚡ OPTIMIZATION: Launch the Puppeteer browser ONLY ONCE
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    console.log("✅ Puppeteer browser launched successfully.");

    // Use Promise.all to run jobs concurrently if desired,
    // but running them sequentially (await in loop) is safer for site stability
    for (const job of SCRAPING_JOBS) {
      console.log(`\n--- Executing Job: ${job.category.toUpperCase()} ---`);

      // Pass the SHARED browser instance to the scraper
      await scrapeProducts(browser, job.url, job.category);

      console.log(`✅ Job ${job.category} finished its execution block.`);
    }

    console.log(`\n======================================`);
    console.log(`🎉 All scraping jobs completed.`);
    console.log(`======================================`);
  } catch (error) {
    console.error(`\n--- MASTER RUNNER CRITICAL FAILURE ---`);
    console.error(error);
  } finally {
    if (browser) {
      // Close the browser only when ALL jobs are done
      await browser.close();
      console.log("🔒 Puppeteer browser closed.");
    }
    // Close the database connection once, at the very end of the master script
    await prisma.$disconnect();
    console.log("🔒 Database connection closed.");
  }
}

runAllScrapers();
