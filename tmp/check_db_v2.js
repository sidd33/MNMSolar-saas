const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, stage: true, currentDepartment: true }
  });
  console.log('ALL PROJECTS:');
  projects.forEach(p => console.log(`- ${p.name} | Dept: ${p.currentDepartment} | Stage: ${p.stage}`));
  
  const leads = await prisma.lead.findMany({
    select: { id: true, name: true, status: true }
  });
  console.log('ALL LEADS:');
  leads.forEach(l => console.log(`- ${l.name} | Status: ${l.status}`));
}

check();
