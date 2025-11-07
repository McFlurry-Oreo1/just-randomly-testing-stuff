import { db } from "./db";
import { products } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if products already exist
  const existingProducts = await db.select().from(products);
  
  if (existingProducts.length === 0) {
    // Insert initial chair product
    await db.insert(products).values({
      name: "Premium Luxury Chair",
      description: "An exquisite handcrafted chair with premium materials and elegant design. Perfect for your home or office.",
      price: 500,
      imageUrl: null,
    });

    console.log("✓ Seeded initial product: Premium Luxury Chair (500 diamonds)");
  } else {
    console.log("✓ Products already exist, skipping seed");
  }

  console.log("Seed completed!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
