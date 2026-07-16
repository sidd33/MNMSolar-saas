const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("No organization found. Please sign in first.");
    return;
  }

  await prisma.project.create({
    data: {
      name: "TEST-ALPHA-PROCUREMENT",
      clientName: "Demo Solar Corp",
      organizationId: org.id,
      stage: "MATERIAL_PROCUREMENT", 
      currentDepartment: "PROCUREMENT",
      isPreliminary: false
    }
  });

  await prisma.project.create({
    data: {
      name: "TEST-BETA-RETURNS",
      clientName: "Eco Industries",
      organizationId: org.id,
      stage: "FINAL_HANDOVER", 
      currentDepartment: "PROCUREMENT",
      isPreliminary: false
    }
  });

  console.log("Created test projects successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
