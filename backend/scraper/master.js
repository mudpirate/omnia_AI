// runner.js
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import scrapeProducts from "./jarir.js"; // Adjust path as necessary

const SCRAPING_JOBS = [
  {
    url: "https://www.jarir.com/kw-en/2-in-1-laptops.html",
    category: "lop",
  },
  // {
  //   url: "https://best.com.kw/en/c/tablets-nn",
  //   category: "tablets",
  // },
  // {
  //   url: "https://best.com.kw/en/c/laptops-nn?query=:relevance:allCategories:laptops-nn:category:macbooks-nn",
  //   category: "macbooks",
  // },
  // {
  //   url: "https://best.com.kw/en/c/tablets-nn?query=:relevance:allCategories:tablets-nn:category:apple-tablets-nn:brand:apple",
  //   category: "ipads",
  // },
  // {
  //   url: "https://best.com.kw/en/c/mobiles-nn",
  //   category: "mobilephones",
  // },
  // {
  //   url: "https://best.com.kw/en/c/wired-nn",
  //   category: "headphones",
  // },
  // {
  //   url: "https://best.com.kw/en/c/wireless-nn",
  //   category: "headphones",
  // },
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
