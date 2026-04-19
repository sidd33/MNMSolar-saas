const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      name: true,
      stage: true,
      currentDepartment: true,
      organizationId: true
    }
  });
  console.log('Project Visibility Debug:');
  console.table(projects);
  
  const users = await prisma.user.findMany({
      select: { email: true, role: true, department: true, organizationId: true }
  });
  console.log('\nUser Membership Debug:');
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
