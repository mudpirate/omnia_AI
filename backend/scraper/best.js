import puppeteer from "puppeteer";
import { PrismaClient, StockStatus } from "@prisma/client";

// --- GLOBAL CONFIGURATION ---
const prisma = new PrismaClient();
const PRODUCT_SELECTOR = "best-product-grid-item"; // Selector for product tiles
const DOMAIN = "https://best.com.kw";
const STORE_NAME_FIXED = "Best.kw";

// --- CONCURRENCY SETTING ---
const CONCURRENT_LIMIT = 10;

// -------------------------------------------------------------------
// --- UNIFIED FUNCTION: SCRAPE STOCK AND DESCRIPTION (BEST.KW SPECIFIC) ---
// -------------------------------------------------------------------

/**
 * Executes a dedicated page navigation to scrape both stock and description efficiently.
 *
// -------------------------------------------------------------------
// --- UNIFIED FUNCTION: SCRAPE STOCK AND DESCRIPTION (BEST.KW SPECIFIC) ---
// -------------------------------------------------------------------

/**
 * Executes a dedicated page navigation to scrape both stock and description efficiently.
 *
 * @param {puppeteer.Browser} browser - The shared browser instance.
 * @param {string} url - The URL of the product page.
 * @returns {Promise<{stock: StockStatus, description: string}>} The determined status and cleaned description.
 */
async function getStockAndDescription(browser, url) {
  const page = await browser.newPage();
  // Increased timeout because Angular sites can be slow to render specific components
  page.setDefaultTimeout(45000);

  let stockStatus = StockStatus.IN_STOCK;
  let description = "";

  try {
    // 1. Navigate
    await page.goto(url, { waitUntil: "networkidle2" });

    // 2. WAIT for the product summary to ensure the DOM is populated
    await page.waitForSelector("best-product-summary", { timeout: 20000 });

    // --- IN-BROWSER LOGIC ---
    const pageDetails = await page.evaluate(() => {
      let isOutOfStock = false;
      let rawDescription = "";

      // --- CHECK 1: BUTTON STATE (Stock Check) ---
      const addToCartBtn = document.querySelector("button.add-to-cart-btn");
      const buyNowBtn = document.querySelector("button.buy-now-btn");

      const isCartDisabled = addToCartBtn
        ? addToCartBtn.hasAttribute("disabled")
        : false;
      const isBuyDisabled = buyNowBtn
        ? buyNowBtn.hasAttribute("disabled")
        : false;

      // --- CHECK 2: EXPLICIT TEXT CLASS (Stock Check) ---
      const outOfStockLabel = document.querySelector(".outofstock");

      if (isCartDisabled || isBuyDisabled || outOfStockLabel) {
        isOutOfStock = true;
      }

      // --- DESCRIPTION SCRAPING ---

      // Target the specific container from your HTML snippet:
      // <best-product-details-tab ...> <div class="container-fluid"> <ul>...
      const descriptionContainer = document.querySelector(
        "best-product-details-tab .container-fluid"
      );

      if (descriptionContainer) {
        // Option A: If it is a list (<ul>), join items with a separator
        const listItems = Array.from(
          descriptionContainer.querySelectorAll("li")
        );
        if (listItems.length > 0) {
          rawDescription = listItems
            .map((li) => li.innerText.replace(/\s+/g, " ").trim()) // Clean individual lines
            .join(" | "); // Join with a separator
        } else {
          // Option B: If no list, just take the paragraph text
          rawDescription = descriptionContainer.innerText;
        }
      }

      // Fallback: Try the summary description if the tab is empty
      if (!rawDescription) {
        const summaryDesc = document.querySelector(
          ".best-product-summary .description"
        );
        if (summaryDesc) {
          rawDescription = summaryDesc.innerText;
        }
      }

      return { isOutOfStock, rawDescription: rawDescription || "" };
    });

    // --- Node.js Side Processing ---
    if (pageDetails.isOutOfStock) {
      stockStatus = StockStatus.OUT_OF_STOCK;
    }

    // Final clean up of the string
    description = pageDetails.rawDescription
      .replace(/(\r\n|\n|\r)/gm, " ") // Remove newlines
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()
      .substring(0, 1000); // Truncate to safe database length
  } catch (e) {
    console.warn(`\n⚠️ Failed details for ${url}: ${e.message}`);
    // Default to OUT_OF_STOCK on error to avoid false positives
    stockStatus = StockStatus.OUT_OF_STOCK;
    description = "";
  } finally {
    await page.close();
  }

  return { stock: stockStatus, description: description };
}
// -------------------------------------------------------------------

/**
 * Main function to launch the browser, navigate, scrape, and save to DB.
 *
 * @param {puppeteer.Browser} browser - The shared browser instance.
 * @param {string} TARGET_URL - The starting URL for the category or search page.
 * @param {string} CATEGORY_NAME - The category slug for the DB (e.g., 'desktops').
 */
/**
 * Main function to launch the browser, navigate, scrape, and save to DB.
 */
async function scrapeProducts(browser, TARGET_URL, CATEGORY_NAME) {
  let allProductsData = [];
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalProcessed = 0;

  // --- Initial Category Page Crawl Logic ---
  const categoryPage = await browser.newPage();
  categoryPage.setDefaultTimeout(90000);
  await categoryPage.setViewport({ width: 1280, height: 800 });

  try {
    console.log(
      `🚀 Starting category scrape for ${CATEGORY_NAME} at ${TARGET_URL}`
    );

    let currentUrl = TARGET_URL;
    let pageNum = 1;
    let hasNextPage = true;

    // --- WHILE LOOP: KEEP GOING UNTIL NO NEXT PAGE ---
    while (hasNextPage) {
      console.log(`\n➡️ Processing Page ${pageNum}: ${currentUrl}`);

      try {
        await categoryPage.goto(currentUrl, { waitUntil: "networkidle2" });

        // Wait for product grid OR valid empty state
        try {
          await categoryPage.waitForSelector(PRODUCT_SELECTOR, {
            timeout: 20000,
          });
        } catch (e) {
          console.warn(
            "⚠️ No products found on this page (selector timeout). checking if pagination exists..."
          );
        }

        // 1. Scroll to trigger lazy loading
        await categoryPage.evaluate(async () => {
          const scrollStep = 500;
          let totalHeight = 0;
          const bodyHeight = document.body.scrollHeight;
          while (totalHeight < bodyHeight) {
            window.scrollBy(0, scrollStep);
            totalHeight += scrollStep;
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          window.scrollTo(0, 0);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        });

        // 2. Extract Data
        const pageProducts = await categoryPage.$$eval(
          PRODUCT_SELECTOR,
          (tiles, domain, category, store) => {
            // ... (This internal extraction logic remains exactly the same as your script) ...
            const extractProductData = (tile) => {
              try {
                const cleanPrice = (txt) =>
                  parseFloat(txt.replace("KD", "").replace(/,/g, "").trim()) ||
                  0;
                const linkElement = tile.querySelector(
                  'a.cx-product-name, a[class="cx-product-name"]'
                );
                const relativeUrl = linkElement?.getAttribute("href");
                const productUrl = relativeUrl
                  ? relativeUrl.startsWith("http")
                    ? relativeUrl
                    : `${domain}${relativeUrl}`
                  : "N/A";
                const title = linkElement?.textContent.trim() || "N/A";

                let imageUrl = "https://example.com/placeholder-image.png";
                const imgElement =
                  tile.querySelector("cx-media img") ||
                  tile.querySelector("img");
                if (imgElement) {
                  const src = imgElement.getAttribute("src");
                  if (src && src.startsWith("http")) imageUrl = src;
                }

                const currentPriceElement =
                  tile.querySelector(".cx-product-price");
                const price = currentPriceElement
                  ? cleanPrice(currentPriceElement.textContent)
                  : 0;

                return {
                  storeName: store,
                  category: category,
                  title,
                  price,
                  imageUrl,
                  productUrl,
                };
              } catch (e) {
                return null;
              }
            };
            return tiles
              .map(extractProductData)
              .filter((data) => data && data.price > 0 && data.title !== "N/A");
          },
          DOMAIN,
          CATEGORY_NAME,
          STORE_NAME_FIXED
        );

        if (pageProducts.length === 0) {
          console.log(`⚠️ Page ${pageNum} loaded but found zero products.`);
        } else {
          console.log(
            `   ✅ Scraped ${pageProducts.length} products from page ${pageNum}.`
          );
          allProductsData = allProductsData.concat(pageProducts);
        }

        // 3. CHECK FOR NEXT PAGE (The Fix)
        const nextPageInfo = await categoryPage.evaluate(() => {
          // Select the "Next" button (The right arrow)
          const nextBtn = document.querySelector(".cx-pagination a.next");

          if (nextBtn) {
            // Check if it has the "disabled" class (as seen in your HTML)
            const isDisabled = nextBtn.classList.contains("disabled");
            const href = nextBtn.getAttribute("href");
            return { exists: true, isDisabled, href };
          }
          return { exists: false };
        });

        if (
          nextPageInfo.exists &&
          !nextPageInfo.isDisabled &&
          nextPageInfo.href
        ) {
          // Prepare URL for next loop
          if (nextPageInfo.href.startsWith("http")) {
            currentUrl = nextPageInfo.href;
          } else {
            // Ensure we don't double slash if domain ends with / and href starts with /
            const baseUrl = "https://best.com.kw";
            currentUrl = `${baseUrl}${
              nextPageInfo.href.startsWith("/") ? "" : "/"
            }${nextPageInfo.href}`;
          }
          pageNum++;
          hasNextPage = true;
        } else {
          console.log(
            `🛑 Reached last page (Next button is disabled or missing). Stopping crawl.`
          );
          hasNextPage = false;
        }
      } catch (e) {
        console.error(`⚠️ Error on page ${pageNum}: ${e.message}`);
        hasNextPage = false; // Stop on critical error
      }
    } // End While Loop
  } catch (error) {
    throw error;
  } finally {
    if (categoryPage) await categoryPage.close();
  }

  // --- THE REST OF YOUR DB SAVING LOGIC REMAINS THE SAME ---
  // ...
  const validProducts = allProductsData.filter(
    (product) =>
      product.title &&
      product.title !== "N/A" &&
      product.productUrl &&
      product.price > 0
  );

  skippedCount = allProductsData.length - validProducts.length;

  console.log(
    `\nStarting concurrent stock/description check for ${validProducts.length} valid products...`
  );

  // (Keep your batch processing loop exactly as it was)
  // ...

  // Reuse your existing productUpdateTask and batch loop here...
  // I will just summarize the batch loop execution for brevity,
  // ensure you paste your existing DB saving code here.

  // --- CONCURRENT BATCH PROCESSING FOR STOCK/DESCRIPTION CHECK & DB SAVE ---
  const productUpdateTask = async (product, index) => {
    // ... (Your existing code)
    const { stock: currentStockStatus, description } =
      await getStockAndDescription(browser, product.productUrl);

    const upsertData = {
      title: product.title,
      description: description,
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: currentStockStatus,
      lastSeenAt: new Date(),
    };

    const result = await prisma.product.upsert({
      where: {
        storeName_productUrl: {
          storeName: product.storeName,
          productUrl: product.productUrl,
        },
      },
      update: upsertData,
      create: {
        ...upsertData,
        storeName: product.storeName,
        productUrl: product.productUrl,
        scrapedAt: new Date(),
      },
      select: { id: true, createdAt: true, title: true, stock: true },
    });

    return {
      result,
      status: currentStockStatus,
      isNew: result.createdAt.getTime() > Date.now() - 5000,
    };
  };

  for (let i = 0; i < validProducts.length; i += CONCURRENT_LIMIT) {
    const batch = validProducts.slice(i, i + CONCURRENT_LIMIT);
    console.log(
      `\n➡️ Processing batch ${Math.ceil((i + 1) / CONCURRENT_LIMIT)}...`
    );
    const batchPromises = batch.map((product, indexInBatch) =>
      productUpdateTask(product, i + indexInBatch)
    );
    const batchResults = await Promise.allSettled(batchPromises);

    for (const stockResult of batchResults) {
      totalProcessed++;
      if (stockResult.status === "fulfilled") {
        const res = stockResult.value;
        if (res.isNew) createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
      }
    }
  }

  // Final Summary
  console.log(`\n=== JOB SUMMARY: ${CATEGORY_NAME} ===`);
  console.log(
    `Total Found: ${allProductsData.length} | Saved/Updated: ${
      createdCount + updatedCount
    }`
  );
}

export default scrapeProducts;
// Export the main function with the new signature
