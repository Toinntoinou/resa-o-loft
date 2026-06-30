import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      capacity: 12,
      allowFullDay: true,
      allowHalfDay: true,
      openWeekends: false,
      maxAdvanceDays: 60,
    },
  });
  console.log("✅ Paramètres initialisés (capacité = 12 postes).");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
