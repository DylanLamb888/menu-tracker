import { db, users, categories, tags } from "../lib/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Create users
  const usersData = [
    { name: "Dylan", password: "dylan", role: "admin" as const },
    { name: "Raffy", password: "raffy", role: "designer" as const },
    { name: "Ludo", password: "ludo", role: "approver" as const },
    { name: "Amélie", password: "amelie", role: "reviewer" as const },
  ];

  console.log("Creating users...");
  for (const userData of usersData) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    await db
      .insert(users)
      .values({
        name: userData.name,
        passwordHash,
        role: userData.role,
      })
      .onConflictDoNothing();
    console.log(`  ✓ ${userData.name} (${userData.role}) - password: ${userData.password}`);
  }

  // Create categories
  const categoriesData = [
    { name: "À La Carte", sortOrder: 1 },
    { name: "Breakfast", sortOrder: 2 },
    { name: "Drinks", sortOrder: 3 },
    { name: "Wine", sortOrder: 4 },
    { name: "Dessert", sortOrder: 5 },
  ];

  console.log("\nCreating categories...");
  for (const category of categoriesData) {
    await db.insert(categories).values(category).onConflictDoNothing();
    console.log(`  ✓ ${category.name}`);
  }

  // Create tags
  const tagsData = [
    { name: "Seasonal", colour: "#F59E0B" },
    { name: "Event-specific", colour: "#8B5CF6" },
    { name: "Standard", colour: "#9CA3AF" },
  ];

  console.log("\nCreating tags...");
  for (const tag of tagsData) {
    await db.insert(tags).values(tag).onConflictDoNothing();
    console.log(`  ✓ ${tag.name}`);
  }

  console.log("\n✅ Seed complete!\n");
  console.log("You can now log in with any of these passwords:");
  console.log("  • dylan (admin)");
  console.log("  • raffy (designer)");
  console.log("  • ludo (approver)");
  console.log("  • amelie (reviewer)\n");

  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
