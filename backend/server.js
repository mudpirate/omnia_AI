import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 4000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// --- ENHANCED CATEGORY DEFINITIONS (Updated to include REQUIRED/EXCLUDE) ---
const PRODUCT_CATEGORIES = {
  MOBILE_PHONE: {
    name: "mobile_phone",
    keywords: [
      "phone",
      "mobile",
      "smartphone",
      "cell phone",
      "cellular",
      "samsung",
      "galaxy",
      "android",
    ],
    brands: [
      "samsung",
      "xiaomi",
      "huawei",
      "oppo",
      "vivo",
      "oneplus",
      "realme",
      "nokia",
      "motorola",
      "google",
      "pixel",
      "honor",
      "tecno",
      "infinix",
      "redmi",
      "poco",
    ],
    specs: ["gb", "ram", "camera", "mp", "mah", "inch", "display", "5g", "4g"],
    // STRICT exclusions - anything with these terms is NOT a phone
    exclude: [
      "case",
      "cover",
      "protector",
      "screen guard",
      "tempered glass",
      "charger",
      "cable",
      "holder",
      "stand",
      "adapter",
      "pouch",
      "headphone",
      "earphone",
      "earbuds",
      "airpods",
      "earpods",
      "speaker",
      "tablet",
      "tab",
      "controller",
      "microphone",
      "mic",
      "watch",
      "smartwatch",
      "band",
      "strap",
      "shell",
      "bumper",
      "skin",
      "sticker",
      "mount",
      "cradle",
      "dock",
    ],
    // Must contain at least one of these to be considered a phone
    required: [
      "phone",
      "smartphone",
      "mobile",

      "galaxy",
      "pixel",
      "android",

      "5g phone",
      "4g phone",
    ],
  },
  LAPTOP: {
    name: "laptop",
    keywords: [
      "laptop",
      "notebook",
      "ultrabook",
      "chromebook",
      "macbook",
      "gaming laptop",
      "workstation",
      "2-in-1 laptop",
    ],
    brands: [
      "dell",
      "hp",
      "lenovo",
      "asus",
      "acer",
      "msi",
      "razer",
      "apple",
      "microsoft",
      "surface",
      "alienware",
      "thinkpad",
      "pavilion",
      "predator",
      "rog",
      "legion",
      "ideapad",
    ],
    specs: [
      "intel",
      "amd",
      "ryzen",
      "core i",
      "processor",
      "cpu",
      "ssd",
      "hdd",
      "ram",
      "gb",
      "tb",
      "nvidia",
      "rtx",
      "gtx",
      "graphics",
      "gpu",
      "display",
      "inch",
      "hz",
      "fhd",
      "4k",
    ],
    exclude: [
      "bag",
      "case",
      "sleeve",
      "charger",
      "adapter",
      "mouse",
      "keyboard",
      "stand",
      "cooler",
      "cooling pad",
      "skin",
      "sticker",
      "backpack",
      "cable",
      "dock",
    ],
    required: [
      "laptop",
      "notebook",
      "ultrabook",
      "chromebook",
      "macbook",
      "workstation",
    ],
  },
  HEADPHONE: {
    name: "headphone",
    keywords: [
      "headphone",
      "headphones",
      "headset",
      "over-ear",
      "on-ear",
      "gaming headset",
      "studio headphones",
      "wireless headphones",
    ],
    brands: [
      "sony",
      "bose",
      "jbl",
      "sennheiser",
      "beats",
      "anker",
      "soundcore",
      "jabra",
      "skullcandy",
      "audio-technica",
      "logitech",
      "hyperx",
      "razer",
      "corsair",
      "steelseries",
    ],
    specs: [
      "wireless",
      "bluetooth",
      "noise cancelling",
      "anc",
      "bass",
      "mic",
      "microphone",
      "battery",
      "playtime",
      "hours",
      "driver",
      "mm",
      "over-ear",
      "on-ear",
    ],
    exclude: [
      "case only",
      "pouch only",
      "stand only",
      "holder only",
      "adapter only",
      "cable only",
      "replacement pads",
      "cushion only",
      "foam tips",
      "earbuds",
      "earpods",
      "in-ear",
    ],
    required: ["headphone", "headphones", "headset", "over-ear", "on-ear"],
  },
  EARPHONE: {
    name: "earphone",
    keywords: [
      "earphone",
      "earphones",
      "earbuds",
      "earpods",
      "airpods",
      "tws",
      "wireless earbuds",
      "true wireless",
      "in-ear",
    ],
    brands: [
      "apple",
      "samsung",
      "sony",
      "jbl",
      "anker",
      "soundcore",
      "jabra",
      "beats",
      "bose",
      "xiaomi",
      "realme",
      "oppo",
      "oneplus",
      "nothing",
      "huawei",
    ],
    specs: [
      "wireless",
      "bluetooth",
      "tws",
      "true wireless",
      "anc",
      "noise cancelling",
      "battery",
      "playtime",
      "hours",
      "in-ear",
      "bass",
      "mic",
    ],
    exclude: [
      "case only",
      "pouch only",
      "holder only",
      "adapter only",
      "cable only",
      "replacement tips",
      "foam tips only",
      "headphone",
      "headset",
      "over-ear",
      "on-ear",
    ],
    required: [
      "earphone",
      "earbuds",
      "earpods",
      "airpods",
      "tws",
      "wireless earbuds",
      "in-ear",
      "true wireless",
    ],
  },
  DESKTOP: {
    name: "desktop",
    keywords: [
      "desktop",
      "pc",
      "computer",
      "gaming pc",
      "workstation pc",
      "tower",
      "mini pc",
      "all-in-one",
    ],
    brands: [
      "dell",
      "hp",
      "lenovo",
      "asus",
      "acer",
      "msi",
      "alienware",
      "cyberpowerpc",
      "corsair",
      "nzxt",
      "apple",
      "imac",
    ],
    specs: [
      "intel",
      "amd",
      "ryzen",
      "core i",
      "processor",
      "cpu",
      "ssd",
      "hdd",
      "ram",
      "gb",
      "tb",
      "nvidia",
      "rtx",
      "gtx",
      "graphics",
      "gpu",
      "tower",
      "atx",
    ],
    exclude: [
      "monitor",
      "keyboard",
      "mouse",
      "speaker",
      "case only",
      "cable",
      "adapter",
      "stand",
      "riser",
      "pad",
    ],
    required: ["desktop", "pc", "computer", "tower", "all-in-one", "mini pc"],
  },
  TABLET: {
    name: "tablet",
    keywords: ["tablet", "ipad", "tab", "galaxy tab", "surface tablet"],
    brands: [
      "apple",
      "samsung",
      "microsoft",
      "lenovo",
      "huawei",
      "xiaomi",
      "amazon",
      "fire",
      "surface",
    ],
    specs: [
      "inch",
      "display",
      "storage",
      "gb",
      "wifi",
      "cellular",
      "lte",
      "5g",
      "stylus",
      "pencil",
    ],
    exclude: [
      "case",
      "cover",
      "protector",
      "screen guard",
      "tempered glass",
      "stand",
      "holder",
      "keyboard only",
      "stylus only",
      "charger",
      "cable",
      "adapter",
    ],
    required: ["tablet", "ipad", "tab"],
  },
};

// Store names to search for (case-insensitive)
const STORE_NAMES = ["xcite", "jarir", "best.kw", "noon.kw", "noon", "best"];

// helper: build Prisma-insensitive 'contains' filters array
function containsFiltersFor(field, words) {
  return words.map((w) => ({ [field]: { contains: w, mode: "insensitive" } }));
}

// --- STORE EXTRACTION (NEW FUNCTION) ---
function extractStoreName(userMessage) {
  const msg = userMessage.toLowerCase();

  for (const store of STORE_NAMES) {
    // Look for boundary-aware matches to avoid false positives (e.g., 'best' in 'best phone')
    // We explicitly check for 'store' or 'shop' context.
    const pattern = new RegExp(`\\b${store}(?:\\s+store|\\s+shop|\\b)`, "i");
    if (pattern.test(msg)) {
      console.log(`[Store Extraction] Found store: ${store}`);
      // Standardize the name to the one used in the DB (assuming 'xcite', 'jarir', 'best.kw', 'noon.kw' in DB)
      if (store.startsWith("noon")) return "Noon.kw";
      if (store.startsWith("best")) return "Best.kw";
      return store;
    }
  }

  // Also check for the keyword 'from' followed by one of the store names without a space
  const fromMatch = msg.match(/from\s*(\S+)/i);
  if (fromMatch) {
    const wordAfterFrom = fromMatch[1].toLowerCase().replace(/[.,]/g, ""); // Remove trailing punctuation
    for (const store of STORE_NAMES) {
      if (wordAfterFrom.includes(store.split(".")[0])) {
        // Check for 'xcite' in 'fromxcite'
        console.log(`[Store Extraction] Found store via 'from': ${store}`);
        if (store.startsWith("noon")) return "Noon.kw";
        if (store.startsWith("best")) return "Best.kw";
        return store;
      }
    }
  }

  console.log("[Store Extraction] No store name found");
  return null;
}

// --- PRICE EXTRACTION (Unchanged) ---
function extractPriceRange(userMessage) {
  const msg = userMessage.toLowerCase();

  // Pattern 1: "under X", "below X", "less than X"
  const underMatch = msg.match(
    /(?:under|below|less than|max|maximum)\s*(\d+)/i
  );
  if (underMatch) {
    return { max: parseFloat(underMatch[1]), min: 0 };
  }

  // Pattern 2: "between X and Y", "from X to Y"
  const rangeMatch = msg.match(
    /(?:between|from)\s*(\d+)\s*(?:and|to)\s*(\d+)/i
  );
  if (rangeMatch) {
    return {
      min: parseFloat(rangeMatch[1]),
      max: parseFloat(rangeMatch[2]),
    };
  }

  // Pattern 3: "above X", "over X", "more than X"
  const aboveMatch = msg.match(/(?:above|over|more than|min|minimum)\s*(\d+)/i);
  if (aboveMatch) {
    return { min: parseFloat(aboveMatch[1]), max: Infinity };
  }

  // Pattern 4: Just a number with "kwd" or currency context
  const priceMatch = msg.match(/(\d+)\s*(?:kwd|dinar|kd)/i);
  if (priceMatch) {
    return { max: parseFloat(priceMatch[1]), min: 0 };
  }

  console.log("[Price Extraction] No price range found");
  return null;
}

// --- CATEGORY DETECTION (Unchanged) ---
function detectProductCategory(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // Force patterns for specific categories
  const forcePatterns = {
    mobile_phone:
      /\b(android|smartphone|smart phone|cell phone|iphone|galaxy phone)\b/i,
    laptop: /\b(laptop|notebook|macbook|chromebook|ultrabook)\b/i,
    desktop: /\b(desktop|desktop pc|gaming pc|tower pc|all-in-one pc)\b/i,
    headphone: /\b(headphone|headphones|headset|over-ear|on-ear)\b/i,
    earphone:
      /\b(earphone|earphones|earbuds|airpods|earpods|tws|wireless earbuds)\b/i,
    tablet: /\b(tablet|ipad|galaxy tab)\b/i,
  };

  // Check force patterns first
  for (const [category, pattern] of Object.entries(forcePatterns)) {
    if (pattern.test(msg)) {
      console.log(
        `[Category Detection] Forced ${category} due to explicit mention`
      );
      return category;
    }
  }

  // Score-based detection
  let categoryScores = {};

  Object.values(PRODUCT_CATEGORIES).forEach((category) => {
    categoryScores[category.name] = 0;

    // Check keywords
    category.keywords.forEach((keyword) => {
      if (msg.includes(keyword)) {
        categoryScores[category.name] += 10;
      }
    });

    // Check brands
    category.brands.forEach((brand) => {
      if (msg.includes(brand)) {
        categoryScores[category.name] += 5;
      }
    });

    // Check specs
    category.specs.forEach((spec) => {
      if (msg.includes(spec)) {
        categoryScores[category.name] += 3;
      }
    });
  });

  const detectedCategory = Object.entries(categoryScores).reduce(
    (max, [cat, score]) => (score > max.score ? { category: cat, score } : max),
    { category: null, score: 0 }
  );

  console.log(`[Category Detection] Scores:`, categoryScores);
  console.log(
    `[Category Detection] Detected: ${detectedCategory.category} (score: ${detectedCategory.score})`
  );

  // Only return categories with a positive score
  return detectedCategory.score > 0 ? detectedCategory.category : null;
}

// --- ENHANCED KEYWORD EXTRACTION (Unchanged) ---
function extractSmartKeywords(userMessage, detectedCategory) {
  const msg = userMessage.toLowerCase().trim();
  const keywords = [];

  if (!detectedCategory) {
    // Fallback to generic extraction
    const words = msg
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 3 &&
          ![
            "under",
            "cheapest",
            "cheap",
            "best",
            "want",
            "need",
            "looking",
            "the",
          ].includes(w)
      );
    return words.slice(0, 5);
  }

  const category = Object.values(PRODUCT_CATEGORIES).find(
    (c) => c.name === detectedCategory
  );
  if (!category) return ["product"];

  // Add primary category keywords
  keywords.push(category.keywords[0]);

  // Extract brand
  category.brands.forEach((brand) => {
    if (msg.includes(brand)) {
      keywords.push(brand);
    }
  });

  // Extract model numbers (iPhone 17, Galaxy S23, etc.)
  const modelMatch = msg.match(/\b(\d+)\b/g);
  if (modelMatch) {
    modelMatch.forEach((num) => keywords.push(num));
  }

  // Extract variants (Pro, Max, Plus, Ultra, etc.)
  const variants = [
    "pro",
    "max",
    "plus",
    "ultra",
    "fold",
    "flip",
    "mini",
    "air",
    "gaming",
    "lite",
  ];
  variants.forEach((variant) => {
    if (msg.includes(variant)) {
      keywords.push(variant);
    }
  });

  // Extract storage/RAM
  const storageMatch = msg.match(/(\d+)(gb|tb)/gi);
  if (storageMatch) {
    storageMatch.forEach((s) => keywords.push(s.toLowerCase()));
  }

  // Extract processor for laptops
  if (detectedCategory === "laptop") {
    const processors = [
      "intel",
      "amd",
      "ryzen",
      "core i3",
      "core i5",
      "core i7",
      "core i9",
    ];
    processors.forEach((proc) => {
      if (msg.includes(proc)) {
        keywords.push(proc);
      }
    });
  }

  // If we have very few keywords, add some specs
  if (keywords.length < 3) {
    category.specs.forEach((spec) => {
      if (msg.includes(spec) && keywords.length < 5) {
        keywords.push(spec);
      }
    });
  }

  console.log(
    `[Keyword Extraction] Category: ${detectedCategory}, Keywords: ${keywords.join(
      ", "
    )}`
  );

  return keywords.length > 0 ? keywords : [category.keywords[0]];
}

// --- ENHANCED DATABASE SEARCH WITH STORE FILTERING (UPDATED) ---
async function execute_db_search(
  keywords,
  max_results,
  category = null,
  priceRange = null,
  storeName = null // NEW parameter
) {
  console.log(
    `[DB Search] Keywords: ${keywords.join(", ")}, Category: ${
      category || "any"
    }, Price Range:`,
    priceRange,
    `, Store: ${storeName || "any"}` // Log storeName
  );

  const cleanedKeywords = keywords
    .map((k) => k.trim())
    .filter(
      (k) =>
        k.length > 0 &&
        !["cheapest", "cheap", "budget", "best", "the", "kwd"].includes(
          k.toLowerCase()
        )
    );

  if (cleanedKeywords.length === 0) {
    console.warn("[DB Search] No valid keywords after cleaning");
    return JSON.stringify([]);
  }

  const categoryConfig = category
    ? Object.values(PRODUCT_CATEGORIES).find((c) => c.name === category)
    : null;

  if (!categoryConfig) {
    console.warn("[DB Search] No category config found for strict filtering");
    // Fallback search with just keywords if no strict category can be applied
    return JSON.stringify([]);
  }

  try {
    // Build WHERE clause with STRICT category filtering
    const whereConditions = {
      AND: [
        // Must match keywords (OR condition for keywords)
        {
          OR: cleanedKeywords.flatMap((keyword) => [
            { title: { contains: keyword, mode: "insensitive" } },
            { category: { contains: keyword, mode: "insensitive" } },
          ]),
        },
        // Must contain at least one REQUIRED term (this ensures it's actually the product type)
        {
          OR: categoryConfig.required.map((term) => ({
            title: { contains: term, mode: "insensitive" },
          })),
        },
        // Must NOT contain any excluded terms
        ...categoryConfig.exclude.map((term) => ({
          NOT: { title: { contains: term, mode: "insensitive" } },
        })),
        // Price range filter
        ...(priceRange
          ? [
              ...(priceRange.min > 0
                ? [{ price: { gte: priceRange.min } }]
                : []),
              ...(priceRange.max < Infinity
                ? [{ price: { lte: priceRange.max } }]
                : []),
            ]
          : []),
        // STORE FILTER (NEW CONDITION)
        ...(storeName
          ? [
              {
                storeName: {
                  contains: storeName,
                  mode: "insensitive", // Case-insensitive store search
                },
              },
            ]
          : []),
      ],
    };

    const results = await prisma.product.findMany({
      where: whereConditions,
      select: {
        title: true,
        price: true,
        storeName: true,
        productUrl: true,
        category: true,
        imageUrl: true,
      },
      // Note: Reverting to 'desc' initially helps in getting more premium/relevant results
      // but 'asc' is better for "cheapest" queries. Using 'desc' here, and let the
      // post-filter handle "cheapest" intent sorting.
      orderBy: {
        price: "desc",
      },
      take: Math.min(max_results, 100),
    });

    console.log(`[DB Search] Found ${results.length} products`);

    // Additional post-filter validation (kept for safety/consistency)
    const validatedResults = results.filter((product) => {
      const title = product.title.toLowerCase();
      const productStore = product.storeName.toLowerCase();

      // Must have at least one required term
      const hasRequiredTerm = categoryConfig.required.some((term) =>
        title.includes(term.toLowerCase())
      );

      // Must NOT have any excluded terms
      const hasExcludedTerm = categoryConfig.exclude.some((term) =>
        title.includes(term.toLowerCase())
      );

      // Price validation
      let withinPriceRange = true;
      if (priceRange) {
        withinPriceRange =
          product.price >= priceRange.min && product.price <= priceRange.max;
      }

      // Store validation (NEW POST-FILTER CHECK)
      let matchesStore = true;
      if (storeName) {
        matchesStore = productStore.includes(storeName.toLowerCase());
      }

      return (
        hasRequiredTerm && !hasExcludedTerm && withinPriceRange && matchesStore
      );
    });

    console.log(
      `[DB Search] After validation: ${validatedResults.length} products`
    );

    return JSON.stringify(validatedResults);
  } catch (dbError) {
    console.error("Prisma DB Error:", dbError);
    return JSON.stringify({ error: "Database search failed." });
  }
}

// --- INTENT CLASSIFICATION (Unchanged) ---
async function classifyIntent(userMessage) {
  const msg = userMessage.toLowerCase();

  // Fast path: Specific model = HIGH
  const hasSpecificModel =
    /\b(iphone|galaxy|pixel)\s*\d+/i.test(msg) ||
    /\b\d+gb\b/i.test(msg) ||
    /(pro max|pro|plus|ultra|fold|flip)/i.test(msg);

  const hasBrandAndType =
    /(samsung|apple|iphone|dell|hp|sony|bose).*(phone|laptop|headphone|earphone|tablet)/i.test(
      msg
    ) ||
    /(phone|laptop|headphone|earphone|tablet).*(samsung|apple|iphone|dell|hp|sony|bose)/i.test(
      msg
    );

  const isGeneral =
    /what|how|which|tell me|recommend|advice|trend|should i|best for/i.test(
      msg
    ) && !hasSpecificModel;

  if (isGeneral && !hasSpecificModel) {
    console.log("[Intent] LOW (general question)");
    return "LOW";
  }

  if (hasSpecificModel) {
    console.log("[Intent] HIGH (specific model)");
    return "HIGH";
  }

  if (hasBrandAndType) {
    console.log("[Intent] MEDIUM (brand + type)");
    return "MEDIUM";
  }

  // Default to MEDIUM for shopping queries
  return "MEDIUM";
}

// --- SMART PRODUCT FILTERING (UPDATED: Remove store diversity if a store is specified) ---
function filterAndRankProducts(
  products,
  userQuery,
  productCount,
  category,
  priceRange = null,
  storeName = null // NEW parameter
) {
  const query = userQuery.toLowerCase();
  const hasCheapest =
    query.includes("cheapest") ||
    query.includes("cheap") ||
    query.includes("budget");

  // Get category config
  const categoryConfig = category
    ? Object.values(PRODUCT_CATEGORIES).find((c) => c.name === category)
    : null;

  if (!categoryConfig) {
    console.warn("[Filtering] No category config found. Returning raw slice.");
    // Sort by price ascending if cheapest is in query, otherwise price descending
    products.sort((a, b) =>
      hasCheapest ? a.price - b.price : b.price - a.price
    );
    return products.slice(0, productCount);
  }

  // STRICT filtering - remove anything that doesn't belong (redundant if DB search is perfect, but safe)
  let filteredProducts = products.filter((product) => {
    const title = product.title.toLowerCase();
    const productStore = product.storeName.toLowerCase();

    // Must have at least one required term
    const hasRequiredTerm = categoryConfig.required.some((term) =>
      title.includes(term.toLowerCase())
    );

    // Must NOT have any excluded terms
    const hasExcludedTerm = categoryConfig.exclude.some((term) =>
      title.includes(term.toLowerCase())
    );

    // Price range validation
    let withinPriceRange = true;
    if (priceRange) {
      withinPriceRange =
        product.price >= priceRange.min && product.price <= priceRange.max;
    }

    // Store validation (NEW POST-FILTER CHECK)
    let matchesStore = true;
    if (storeName) {
      matchesStore = productStore.includes(storeName.toLowerCase());
    }

    return (
      hasRequiredTerm && !hasExcludedTerm && withinPriceRange && matchesStore
    );
  });

  console.log(
    `[Filtering] After strict filtering: ${filteredProducts.length}/${products.length} products`
  );

  // Score remaining products
  const scoredProducts = filteredProducts.map((product) => {
    let score = 0;
    const title = product.title.toLowerCase();
    const queryWords = query
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 2 &&
          !categoryConfig.exclude.includes(w) &&
          !categoryConfig.required.includes(w)
      );

    // Exact phrase match
    if (title.includes(query)) score += 100;

    // Keyword matching
    queryWords.forEach((word) => {
      if (title.includes(word)) score += 10;
    });

    // Model number matching
    const modelMatch = query.match(/\d+/g);
    if (modelMatch) {
      modelMatch.forEach((num) => {
        if (title.includes(num)) score += 50;
      });
    }

    // Brand bonus
    categoryConfig.brands.forEach((brand) => {
      if (query.includes(brand) && title.includes(brand)) {
        score += 30;
      }
    });

    // Required term bonus
    categoryConfig.required.forEach((term) => {
      if (title.includes(term.toLowerCase())) {
        score += 20;
      }
    });

    // Price factor for budget queries
    if (hasCheapest) {
      // Small products have low price, so use price directly
      score += 10000 / (product.price + 1); // Prefer lower price
    } else {
      // General queries prefer better/premium products (higher price is a proxy)
      score += product.price / 10;
    }

    // Demote if price is near max bound and query was not specific about max price
    if (priceRange && priceRange.max < Infinity && !hasCheapest) {
      if (product.price > priceRange.max * 0.95) {
        // within 5% of max
        score -= 50; // slightly demote
      }
    }

    return { ...product, score };
  });

  // Sort by score (descending), then by price (ascending if looking for cheap, descending otherwise)
  scoredProducts.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 50) return b.score - a.score; // Primary sort: Score
    return hasCheapest ? a.price - b.price : b.price - a.price; // Secondary sort: Price
  });

  let selectedProducts = [];

  if (storeName) {
    // If a specific store is named, don't worry about diversity, just take the top products
    selectedProducts = scoredProducts.slice(0, productCount);
    console.log(
      `[Filtering] Specific store requested. Taking top ${selectedProducts.length} results.`
    );
  } else {
    // Original store diversity logic
    const storeCount = { xcite: 0, jarir: 0, "best.kw": 0, "noon.kw": 0 };
    const maxPerStore = Math.ceil(productCount / 4);

    // First pass: diversity
    for (const product of scoredProducts) {
      const productStoreName = product.storeName
        ? product.storeName.toLowerCase()
        : "";
      const storeKey = productStoreName.includes("xcite")
        ? "xcite"
        : productStoreName.includes("jarir")
        ? "jarir"
        : productStoreName.includes("best") // Covers 'Best.kw'
        ? "best.kw"
        : productStoreName.includes("noon") // Covers 'Noon.kw'
        ? "noon.kw"
        : null;

      if (
        storeKey &&
        storeCount[storeKey] < maxPerStore &&
        selectedProducts.length < productCount
      ) {
        selectedProducts.push(product);
        storeCount[storeKey]++;
      }
    }

    // Second pass: fill remaining slots
    for (const product of scoredProducts) {
      if (
        !selectedProducts.includes(product) &&
        selectedProducts.length < productCount
      ) {
        selectedProducts.push(product);
      }
    }
  }

  console.log(
    `[Filtering] Final selection: ${selectedProducts.length}/${productCount} products`
  );

  if (selectedProducts.length > 0) {
    console.log(
      `[Filtering] Selected Products Details:\n`,
      selectedProducts.map((p) => ({
        title: p.title,
        price: p.price,
        store: p.storeName,
        score: p.score,
      }))
    );
  }

  return selectedProducts.slice(0, productCount);
}

// --- MESSAGE CREATION (Unchanged) ---
const createLlmMessages = (
  userMessage,
  systemInstruction,
  initialAssistantMessage = null,
  toolResponses = []
) => {
  const messages = [{ role: "system", content: systemInstruction }];
  if (initialAssistantMessage) messages.push(initialAssistantMessage);
  toolResponses.forEach((res) => messages.push(res));
  messages.push({ role: "user", content: userMessage });
  return messages;
};

// --- TOOL SCHEMA (UPDATED: Added store_name) ---
const product_search_tool_schema = {
  type: "function",
  function: {
    name: "search_products",
    description:
      "Searches the product database. Extract precise keywords matching the detected category.",
    parameters: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          description:
            "Search keywords including brand, model, specs. For phones: ['iPhone', '17', 'Pro']. For laptops: ['Dell', 'gaming', 'laptop']. For headphones: ['Sony', 'wireless', 'headphone'].",
          items: { type: "string" },
        },
        max_results: {
          type: "integer",
          description: "20 for MEDIUM intent, 30 for HIGH intent.",
          default: 30,
        },
        category: {
          type: "string",
          enum: Object.values(PRODUCT_CATEGORIES).map((c) => c.name), // Dynamically update enum
          description: "Detected product category for filtering.",
        },
        // NEW PROPERTY
        store_name: {
          type: "string",
          enum: ["xcite", "jarir", "best.kw", "noon.kw"], // Explicit stores to guide LLM
          description:
            "Specific store to search in, if mentioned in the query (e.g., 'xcite' or 'jarir').",
        },
      },
      required: ["keywords", "max_results"],
    },
  },
};

// --- MAIN CHAT ROUTE (UPDATED: Added storeName extraction and passing) ---
app.post("/chat", async (req, res) => {
  const { query: message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const userMessageObject = { role: "user", content: message };
  const responseHistory = [userMessageObject];

  try {
    // STEP 1: Detect Category
    console.log("[Step 1] Detecting product category...");
    const detectedCategory = detectProductCategory(message);

    // STEP 2: Classify Intent
    console.log("[Step 2] Classifying intent...");
    const intent = await classifyIntent(message);

    // STEP 2.5: Extract Price Range and Store Name (UPDATED STEP)
    console.log("[Step 2.5] Extracting price range and store name...");
    const priceRange = extractPriceRange(message);
    const storeName = extractStoreName(message); // NEW extraction

    if (priceRange) {
      console.log(
        `[Price Range] Min: ${priceRange.min}, Max: ${priceRange.max}`
      );
    }
    if (storeName) {
      console.log(`[Store Name] Found: ${storeName}`);
    }

    // STEP 3: Handle LOW Intent (Unchanged)
    if (intent === "LOW") {
      console.log("[Step 3] LOW intent - General response");
      const lowIntentSystem = `You are Omnia AI, a shopping assistant for Kuwait electronics (Xcite, Jarir, Best.kw, Noon.kw).
Provide helpful, friendly advice about shopping or product categories. Keep it under 150 words.`;

      const lowIntentMessages = createLlmMessages(message, lowIntentSystem);
      const lowIntentResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: lowIntentMessages,
        temperature: 0.5,
        max_tokens: 250,
      });

      const finalContent = lowIntentResponse.choices[0].message.content;
      responseHistory.push({ role: "assistant", content: finalContent });

      return res.json({
        reply: finalContent,
        history: [...history, ...responseHistory],
        intent: "LOW",
        category: detectedCategory,
      });
    }

    // STEP 4: Extract Keywords
    console.log("[Step 4] Extracting keywords...");
    const smartKeywords = extractSmartKeywords(message, detectedCategory);

    const searchSystemPrompt = `You are a keyword extraction expert.

User Query: "${message}"
Detected Category: ${detectedCategory || "unknown"}
Suggested Keywords: ${smartKeywords.join(", ")}
${
  priceRange
    ? `Price Range: Between ${priceRange.min} and ${
        priceRange.max < Infinity ? priceRange.max : "Infinity"
      } KWD.`
    : ""
}
${
  storeName
    ? `STORE FILTER: The user is only interested in products from ${storeName}. Pass this exact store name in the 'store_name' parameter.`
    : ""
}

Extract the BEST search keywords. Include:
- Product category (phone/laptop/headphone/tablet/desktop/earphone)
- Brand name
- Model number/name
- Specifications (storage, RAM, etc.)

NEVER include: 'cheapest', 'best', 'under X KWD' (these are handled separately)
NEVER include: the store name in the 'keywords' array. Pass it in the 'store_name' parameter.

Set category to "${detectedCategory || "mobile_phone"}"
Set max_results to ${intent === "HIGH" ? "15" : "10"}`;

    const searchMessages = createLlmMessages(message, searchSystemPrompt);

    let initialResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: searchMessages,
      tools: [product_search_tool_schema],
      tool_choice: { type: "function", function: { name: "search_products" } },
      temperature: 0.2,
    });

    const initialResponseMessage = initialResponse.choices[0].message;

    // STEP 5: Execute Search
    console.log("[Step 5] Executing search...");

    let toolOutput;
    if (
      !initialResponseMessage.tool_calls ||
      initialResponseMessage.tool_calls.length === 0
    ) {
      // Fallback
      toolOutput = await execute_db_search(
        smartKeywords,
        intent === "HIGH" ? 30 : 20,
        detectedCategory,
        priceRange,
        storeName // PASS storeName
      );
      responseHistory.push(
        { role: "assistant", content: "" },
        {
          role: "tool",
          tool_call_id: "fallback",
          name: "search_products",
          content: toolOutput,
        }
      );
    } else {
      const toolCall = initialResponseMessage.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(
        `[Tool Args] Keywords: ${JSON.stringify(
          functionArgs.keywords
        )}, Category: ${functionArgs.category || detectedCategory}, Store: ${
          functionArgs.store_name || "none"
        }` // Log store_name
      );

      toolOutput = await execute_db_search(
        functionArgs.keywords,
        functionArgs.max_results,
        functionArgs.category || detectedCategory,
        priceRange,
        functionArgs.store_name || storeName // Use LLM's store name if provided, otherwise use the extracted one
      );

      responseHistory.push(initialResponseMessage, {
        role: "tool",
        tool_call_id: toolCall.id,
        name: "search_products",
        content: toolOutput,
      });
    }

    // STEP 6: Filter and Generate Response
    console.log("[Step 6] Generating final response...");

    const productCount = intent === "MEDIUM" ? 12 : 20;
    const lastToolResponse = responseHistory[responseHistory.length - 1];

    let allProducts = [];
    try {
      allProducts = JSON.parse(lastToolResponse.content);
      if (allProducts.error) throw new Error(allProducts.error);
    } catch (e) {
      console.error("[Error] Failed to parse products:", e.message);
      return res
        .status(500)
        .json({ error: "Failed to retrieve products.", details: e.message });
    }

    const finalStoreName =
      initialResponse.choices[0].message.tool_calls &&
      initialResponse.choices[0].message.tool_calls.length > 0
        ? JSON.parse(
            initialResponse.choices[0].message.tool_calls[0].function.arguments
          ).store_name || storeName
        : storeName;

    const filteredProducts = filterAndRankProducts(
      allProducts,
      message,
      productCount,
      detectedCategory,
      priceRange,
      finalStoreName // PASS storeName
    );

    const categoryName = detectedCategory
      ? detectedCategory.replace("_", " ")
      : "products";

    const finalSystemPrompt = `You are Omnia AI for Kuwait electronics (Xcite, Jarir, Best.kw, Noon.kw).

**USER QUERY**: "${message}"
**CATEGORY**: ${categoryName}
**INTENT**: ${intent}
**PRODUCTS**: ${filteredProducts.length} pre-filtered ${categoryName}
${finalStoreName ? `**FILTERED BY STORE**: ${finalStoreName}` : ""}

Create JSON with EXACTLY ${productCount} products.

{
  "message": "Friendly 2-3 sentence intro",
  "intent_level": "${intent}",
  "products": [
    {
      "product_name": "from title",
      "store_name": "exact store name",
      "price_kwd": number,
      "product_url": "exact URL",
      "image_url": "exact image URL",
      "spec_highlights": ["1-2 key specs"]
    }
  ],
  "disclaimer": "if needed"
}

Products:
${JSON.stringify(
  filteredProducts.map((p) => ({
    title: p.title,
    price: p.price,
    storeName: p.storeName,
    productUrl: p.productUrl,
    imageUrl: p.imageUrl,
  })),
  null,
  2
)}`;

    const finalMessages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: `Create JSON for: "${message}"` },
    ];

    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: finalMessages,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const finalContent = finalResponse.choices[0].message.content;
    const parsedJson = JSON.parse(finalContent);

    if (!parsedJson.products || !Array.isArray(parsedJson.products)) {
      throw new Error("Invalid products array");
    }

    console.log(
      `[Success] Generated ${parsedJson.products.length} ${categoryName}`
    );

    responseHistory.push({ role: "assistant", content: finalContent });

    res.json({
      reply: JSON.stringify(parsedJson, null, 2),
      history: [...history, ...responseHistory],
      intent,
      category: detectedCategory,
      productCount: parsedJson.products.length,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "An error occurred.",
      details: error.message,
    });
  }
});

// --- HEALTH CHECK ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Shopping assistant running" });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
