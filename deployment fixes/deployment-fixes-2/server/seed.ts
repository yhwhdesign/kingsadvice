import { db } from "./db";
import { admins } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");
  
  // Check if admin already exists
  const [existingAdmin] = await db.select().from(admins).where(eq(admins.username, "admin")).limit(1);
  
  if (!existingAdmin) {
    const hashedPassword = await hashPassword("admin123");
    await db.insert(admins).values({
      username: "admin",
      password: hashedPassword,
    });
    console.log("Default admin created (username: admin, password: admin123)");
  } else {
    console.log("Admin already exists, skipping...");
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
