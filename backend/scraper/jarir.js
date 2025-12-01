import { PrismaClient, StockStatus } from "@prisma/client";

// --- GLOBAL CONFIGURATION ---
const prisma = new PrismaClient();
const DOMAIN = "https://www.jarir.com";
const STORE_NAME_FIXED = "Jarir";

// Jarir Specific Selectors
const PRODUCT_TILE_SELECTOR = ".product-tile__item--spacer";
const PRODUCT_LOAD_URL_FRAGMENT = "/search/GetProductsList";

// --- CONCURRENCY SETTING ---
const CONCURRENT_LIMIT = 5;

// -------------------------------------------------------------------
// --- UNIFIED FUNCTION: SCRAPE STOCK ONLY ---
// -------------------------------------------------------------------

async function getStockStatus(browser, url) {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  let stockStatus = StockStatus.OUT_OF_STOCK; // Safety default

  try {
    // Optimization: Block heavy resources to speed up checking
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "font", "stylesheet", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    // 1. WAIT for the Add to Cart section to ensure the button is rendered
    try {
      // We wait for the container that holds the button
      await page.waitForSelector(".add-to-cart", { timeout: 10000 });
    } catch (e) {
      // If it times out, the page might be weird, but we proceed to check what's there
    }

    // --- IN-BROWSER LOGIC ---
    const isAvailable = await page.evaluate(() => {
      // PRIORITY 1: Check for the specific "Add to Cart" test ID (Found in your HTML)
      const addToCartTestId = document.querySelector(
        '[data-testid="addToCart"]'
      );
      if (addToCartTestId) return true;

      // PRIORITY 2: Check for the specific class used for the add button
      const addToCartClass = document.querySelector(".button--add-to-cart");
      if (addToCartClass) return true;

      // PRIORITY 3: Check text content of buttons inside the add-to-cart container
      const container = document.querySelector(".add-to-cart");
      if (container && container.innerText.includes("Add to Cart")) {
        return true;
      }

      // If none of these exist, it's Out of Stock (Notify Me / Not Available)
      return false;
    });

    // Set Status based on boolean
    stockStatus = isAvailable ? StockStatus.IN_STOCK : StockStatus.OUT_OF_STOCK;
  } catch (e) {
    console.warn(`\n⚠️ Failed details for ${url}: ${e.message}`);
    stockStatus = StockStatus.OUT_OF_STOCK;
  } finally {
    await page.close();
  }

  return stockStatus;
}

// -------------------------------------------------------------------

async function scrapeProducts(browser, TARGET_URL, CATEGORY_NAME) {
  let allProductsData = [];
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // We use the SHARED browser passed from master.js
  const categoryPage = await browser.newPage();
  categoryPage.setDefaultTimeout(120000);
  await categoryPage.setViewport({ width: 1280, height: 1080 });

  try {
    const cleanUrl = TARGET_URL.split("?")[0];
    console.log(
      `🚀 Starting JARIR scraper for ${CATEGORY_NAME} at ${cleanUrl}`
    );

    await categoryPage.goto(cleanUrl, { waitUntil: "networkidle2" });

    try {
      await categoryPage.waitForSelector(PRODUCT_TILE_SELECTOR, {
        timeout: 20000,
      });
    } catch (e) {
      console.log("No products found initially.");
    }

    // --- INFINITE SCROLL LOGIC ---
    let scrollAttempts = 0;
    const MAX_SCROLLS = 100;
    let previousCount = 0;
    let sameCountRetries = 0;

    console.log("⬇️  Loading all products via scroll...");

    while (scrollAttempts < MAX_SCROLLS) {
      scrollAttempts++;
      await categoryPage.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );

      try {
        await categoryPage.waitForResponse(
          (res) =>
            res.url().includes(PRODUCT_LOAD_URL_FRAGMENT) &&
            res.status() === 200,
          { timeout: 4000 }
        );
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        await new Promise((r) => setTimeout(r, 2000));
      }

      const currentCount = await categoryPage.$$eval(
        PRODUCT_TILE_SELECTOR,
        (els) => els.length
      );

      if (currentCount > previousCount) {
        process.stdout.write(`\r   Loaded ${currentCount} products...`);
        previousCount = currentCount;
        sameCountRetries = 0;
      } else {
        sameCountRetries++;
        if (sameCountRetries >= 3) break;
      }
    }
    console.log("\n✅ Scroll complete.");

    // --- EXTRACT BASIC DATA ---
    allProductsData = await categoryPage.$$eval(
      PRODUCT_TILE_SELECTOR,
      (tiles, domain, store, category) => {
        const cleanPrice = (txt) =>
          parseFloat(txt.replace(/[^0-9.]/g, "").replace(/,/g, "")) || 0;

        return tiles
          .map((tile) => {
            try {
              const linkEl = tile.querySelector("a.product-tile__link");
              const titleEl = tile.querySelector(".product-title__title");
              const priceEl = tile.querySelector(
                ".price-box .price span:last-child"
              );
              const imgEl =
                tile.querySelector("img[data-cs-capture]") ||
                tile.querySelector("img");

              const rawUrl = linkEl ? linkEl.getAttribute("href") : "";
              const productUrl = rawUrl
                ? rawUrl.startsWith("http")
                  ? rawUrl
                  : `${domain}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
                : "N/A";

              const title = titleEl ? titleEl.textContent.trim() : "N/A";
              const price = priceEl ? cleanPrice(priceEl.textContent) : 0;

              let imageUrl = "";
              if (imgEl) {
                const srcset = imgEl.getAttribute("srcset");
                if (srcset)
                  imageUrl = srcset.split(",")[0].trim().split(" ")[0];
                else imageUrl = imgEl.getAttribute("src");
              }

              return {
                storeName: store,
                category,
                title,
                price,
                imageUrl,
                productUrl,
              };
            } catch (e) {
              return null;
            }
          })
          .filter(
            (p) =>
              p && p.title !== "N/A" && p.productUrl !== "N/A" && p.price > 0
          );
      },
      DOMAIN,
      STORE_NAME_FIXED,
      CATEGORY_NAME
    );
  } catch (error) {
    console.error("Scrape Error:", error);
  } finally {
    await categoryPage.close();
  }

  const uniqueProducts = [
    ...new Map(allProductsData.map((item) => [item.productUrl, item])).values(),
  ];
  skippedCount = allProductsData.length - uniqueProducts.length;

  console.log(
    `\nStarting stock check for ${uniqueProducts.length} products...`
  );

  // --- CONCURRENT PROCESSING ---
  const productUpdateTask = async (product) => {
    // Check Stock ONLY (Description removed)
    const stock = await getStockStatus(browser, product.productUrl);

    // --- LOGGING ---
    if (stock === StockStatus.OUT_OF_STOCK) {
      console.log(`🔴 [OOS] ${product.title.substring(0, 35)}...`);
    } else {
      console.log(`🟢 [IN]  ${product.title.substring(0, 35)}...`);
    }
    // --------------

    const upsertData = {
      title: product.title,
      description: "", // Description check removed as requested
      category: product.category,
      price: product.price,
      imageUrl: product.imageUrl,
      stock: stock,
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
    });

    return { result, isNew: result.createdAt > new Date(Date.now() - 5000) };
  };

  for (let i = 0; i < uniqueProducts.length; i += CONCURRENT_LIMIT) {
    const batch = uniqueProducts.slice(i, i + CONCURRENT_LIMIT);
    console.log(
      `\n➡️  Batch ${Math.ceil((i + 1) / CONCURRENT_LIMIT)}/${Math.ceil(
        uniqueProducts.length / CONCURRENT_LIMIT
      )}`
    );

    const results = await Promise.allSettled(
      batch.map((p) => productUpdateTask(p))
    );

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        if (res.value.isNew) createdCount++;
        else updatedCount++;
      } else {
        errorCount++;
        console.error("Product Error:", res.reason);
      }
    });
  }

  console.log(`\n=== SUMMARY: ${CATEGORY_NAME} ===`);
  console.log(
    `Saved/Updated: ${createdCount + updatedCount} | Errors: ${errorCount}`
  );
}

export default scrapeProducts;
