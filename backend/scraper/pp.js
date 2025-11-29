import puppeteer from "puppeteer";

const productUrl =
  "https://www.xcite.com/lenovo-ideacentre-aio-desktop-intel-core-i5-8gb-ram-512gb-ssd-integrated-intel-uhd-graphics-23-8-fhd-windows-11-home-f0hn000kax-grey/p";

async function scrapeProductPage(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });

    const productData = await page.evaluate(() => {
      // Find the main product container using the itemscope attribute
      const productSchema = document.querySelector(
        '[itemtype="https://schema.org/Product"]'
      );
      if (!productSchema) {
        return { error: "Could not find product schema on the page." };
      } // Function to safely extract content from a meta tag based on itemprop

      const getMetaContent = (itemprop) => {
        const element = productSchema.querySelector(`[itemprop="${itemprop}"]`);
        return element ? element.getAttribute("content") : null;
      }; // Extract main product details

      const name = getMetaContent("name");
      const description = getMetaContent("description");
      const sku = getMetaContent("sku"); // Extract brand

      const brandElement = productSchema.querySelector(
        '[itemprop="brand"] [itemprop="name"]'
      );
      const brand = brandElement ? brandElement.getAttribute("content") : null; // Extract offer details (price, currency)

      const offersSchema = productSchema.querySelector('[itemprop="offers"]');
      const price = offersSchema
        ? offersSchema
            .querySelector('[itemprop="price"]')
            .getAttribute("content")
        : null;
      const priceCurrency = offersSchema
        ? offersSchema
            .querySelector('[itemprop="priceCurrency"]')
            .getAttribute("content")
        : null;

      // ====================================================================
      // --- CORRECTED AVAILABILITY EXTRACTION ---
      let availability = "N/A";

      // 1. Check the visible, explicitly styled 'Out of stock' element first
      const outOfStockElement = document.querySelector(
        ".typography-small.text-functional-red-800"
      );
      if (
        outOfStockElement &&
        outOfStockElement.textContent
          .trim()
          .toLowerCase()
          .includes("out of stock")
      ) {
        availability = outOfStockElement.textContent.trim(); // e.g., "Out of stock online"
      } else {
        // 2. Fallback to Schema.org microdata (for the in-stock case)
        const availabilityMap = {
          "https://schema.org/InStock": "In Stock",
          "https://schema.org/OutOfStock": "Out of Stock",
        };
        const availabilitySchema = offersSchema
          ? offersSchema
              .querySelector('[itemprop="availability"]')
              ?.getAttribute("content")
          : null;

        availability = availabilitySchema
          ? availabilityMap[availabilitySchema] || availabilitySchema
          : availability; // If not found, keeps the initial 'N/A' or the default in-stock text if the element was found.
      } // Extract Images (an array of URLs)
      // ====================================================================

      const imageContent = getMetaContent("image");
      let images = [];
      if (imageContent) {
        // The content attribute contains a JSON string of image URLs
        try {
          images = JSON.parse(imageContent.replace(/&quot;/g, '"'));
        } catch (e) {
          console.error("Error parsing image JSON:", e);
        }
      } // --- Extract Specifications from the visible list (ul/li structure) ---

      // (Specification extraction logic remains unchanged)
      const specList = document.querySelector(
        ".ProductOverview_list__7LEwB ul"
      );
      const specifications = {};
      if (specList) {
        const specItems = specList.querySelectorAll("li");
        specItems.forEach((item) => {
          const text = item.textContent.trim();
          const parts = text.split(":").map((p) => p.trim());
          if (parts.length >= 2) {
            const key = parts[0].replace(":", "");
            const value = parts.slice(1).join(":").trim();
            specifications[key] = value;
          }
        });
      }

      return {
        name,
        brand,
        sku,
        price,
        priceCurrency,
        availability, // Now will correctly be "Out of stock online" or "In Stock"
        description,
        images,
        specifications,
      };
    });

    console.log("✅ Scraping Complete. Extracted Data:");
    console.log(productData);
  } catch (error) {
    console.error("An error occurred during scraping:", error.message);
  } finally {
    await browser.close();
  }
}

scrapeProductPage(productUrl);
