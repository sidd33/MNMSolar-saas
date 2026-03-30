import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const stages = [
    { stage: "PROSPECT", expectedDays: 3, label: "Prospect" },
    { stage: "SITE_SURVEY", expectedDays: 4, label: "Site Survey" },
    { stage: "PRELIMINARY_QUOTE", expectedDays: 5, label: "Preliminary Quote" },
    { stage: "DETAILED_ENGG", expectedDays: 10, label: "Detailed Engg" },
    { stage: "WORK_ORDER", expectedDays: 5, label: "Work Order" },
    { stage: "HANDOVER_TO_EXECUTION", expectedDays: 1, label: "Handover to Execution" },
    { stage: "MATERIAL_PROCUREMENT", expectedDays: 7, label: "Material Procurement" },
    { stage: "STRUCTURE_ERECTION", expectedDays: 5, label: "Structure Erection" },
    { stage: "PV_PANEL_INSTALLATION", expectedDays: 5, label: "PV Panel Installation" },
    { stage: "AC_DC_INSTALLATION", expectedDays: 5, label: "AC/DC Installation" },
    { stage: "NET_METERING", expectedDays: 8, label: "Net Metering" },
    { stage: "FINAL_HANDOVER", expectedDays: 2, label: "Final Handover" },
  ];

  console.log("Seeding StageConfig...");

  for (const s of stages) {
    try {
      await (prisma as any).stageConfig.upsert({
        where: { stage: s.stage },
        update: s,
        create: s,
      });
      console.log(`- Seeded ${s.stage}`);
    } catch (err) {
      console.error(`- Failed ${s.stage}:`, err);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
