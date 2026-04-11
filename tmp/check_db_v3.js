const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.findMany({
    where: { currentDepartment: 'ENGINEERING' },
    select: { id: true, name: true, stage: true, currentDepartment: true }
  });
  console.log('--- PROJECTS IN ENGINEERING ---');
  projects.forEach(p => console.log(`ID: ${p.id} | NAME: ${p.name} | STAGE: ${p.stage}`));
  
  const leads = await prisma.lead.findMany({
    where: { status: 'SITE_VISIT_SCHEDULED' },
    select: { id: true, name: true, status: true }
  });
  console.log('--- LEADS IN SURVEY TRANSIT ---');
  leads.forEach(l => console.log(`ID: ${l.id} | NAME: ${l.name} | STATUS: ${l.status}`));
}

check();
