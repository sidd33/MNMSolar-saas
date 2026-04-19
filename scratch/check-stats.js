const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stats = await prisma.project.groupBy({
    by: ['stage', 'currentDepartment'],
    _count: { id: true },
  });
  console.log('Project Stats:', JSON.stringify(stats, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
