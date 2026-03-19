import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bitcode.dev" },
    update: {},
    create: {
      email: "admin@bitcode.dev",
      password,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created:", admin.email);
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
