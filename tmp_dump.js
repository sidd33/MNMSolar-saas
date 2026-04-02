const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const files = await prisma.projectFile.findMany();
  console.log(JSON.stringify(files.slice(0, 5), null, 2));
  console.log("Total Files:", files.length);
}
run();
