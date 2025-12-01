import puppeteer from "puppeteer";

const PRODUCT_URL =
  "https://www.jarir.com/kw-en/apple-iphone-17-pro-max-smartphones-666747.html";

(async () => {
  // Launch the browser
  const browser = await puppeteer.launch({
    headless: "new",
    // Jarir often blocks automated requests, so we need to set a realistic user agent
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set a standard User Agent to avoid detection
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  try {
    console.log(`Checking stock for: ${PRODUCT_URL}`);

    // Navigate to the page and wait for network activity to settle
    await page.goto(PRODUCT_URL, { waitUntil: "networkidle2", timeout: 60000 });

    // Evaluate the page content based on the HTML structure provided
    const stockStatus = await page.evaluate(() => {
      // Logic based on your provided HTML:
      // 1. Check for "Notify Me" button text
      const buttons = Array.from(document.querySelectorAll("button"));
      const notifyButton = buttons.find((btn) =>
        btn.innerText.includes("Notify Me When It’s Available")
      );

      // 2. Check for the specific "Not available online" notification text
      const notificationDiv = document.querySelector(".notification__title");
      const isNotAvailableText =
        notificationDiv &&
        notificationDiv.innerText.includes("Not available online");

      // 3. Check for "Add to Cart" button (usually indicates in stock)
      const addToCartButton = buttons.find((btn) =>
        btn.innerText.includes("Add to Cart")
      );

      if (notifyButton || isNotAvailableText) {
        return "OUT OF STOCK";
      } else if (addToCartButton) {
        return "IN STOCK";
      } else {
        return "UNKNOWN (Could not find specific buttons)";
      }
    });

    console.log("--------------------------------");
    console.log(`Stock Status: ${stockStatus}`);
    console.log("--------------------------------");
  } catch (error) {
    console.error("Error scraping Jarir:", error.message);
  } finally {
    await browser.close();
  }
})();
