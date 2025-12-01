import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function showXciteCategories() {
  try {
    console.log("📊 Fetching categories from database...");

    // This groups products by their 'category' field
    // and counts how many products are in each.
    const categories = await prisma.product.groupBy({
      by: ["category"],
      where: {
        // Filter specifically for Xcite store
        // (Make sure this matches the 'storeName' you saved in your DB)
        storeName: {
          contains: "Xcite",
          // mode: 'insensitive' // Uncomment if you want case-insensitive search
        },
      },
      _count: {
        id: true, // Count product IDs in this category
      },
      orderBy: {
        _count: {
          id: "desc", // Sort by most products first
        },
      },
    });

    if (categories.length === 0) {
      console.log("⚠️ No categories found for 'Xcite' in the database.");
      console.log(
        "Check if you have scraped products and if the storeName is saved as 'Xcite'."
      );
    } else {
      console.log(
        `✅ Found ${categories.length} unique categories for Xcite:\n`
      );

      // Transform data for a cleaner table view
      const displayData = categories.map((c) => ({
        Category: c.category,
        "Product Count": c._count.id,
      }));

      console.table(displayData);
    }
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

showXciteCategories();
