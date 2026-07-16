const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log("No organization found to attach projects to.");
    return;
  }

  // Project for BOM Review
  await prisma.project.create({
    data: {
      name: "Sunrise Villa Complex",
      clientName: "Mr. Sharma",
      capacityKw: 15,
      stage: "HANDOVER_TO_EXECUTION",
      organizationId: org.id
    }
  });

  // Project for Purchase Orders & Dispatch
  await prisma.project.create({
    data: {
      name: "TechPark Corporate Roof",
      clientName: "TechPark Inc",
      capacityKw: 150,
      stage: "MATERIAL_PROCUREMENT",
      organizationId: org.id
    }
  });

  // Project for Site Returns
  await prisma.project.create({
    data: {
      name: "Blue Ridge School",
      clientName: "Blue Ridge Edu",
      capacityKw: 50,
      stage: "FINAL_HANDOVER",
      organizationId: org.id
    }
  });

  console.log("Successfully seeded Procurement projects!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
