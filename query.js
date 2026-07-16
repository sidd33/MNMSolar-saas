const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findFirst({
    where: { name: { contains: 'GREEN VALLEY' } }
  });
  console.log(p);
}

main().finally(() => prisma.$disconnect());
