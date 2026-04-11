const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const projects = await prisma.project.findMany({
    where: { currentDepartment: 'ENGINEERING' },
    select: { id: true, name: true, stage: true, currentDepartment: true, organizationId: true }
  });
  console.log('Projects in ENGINEERING:', JSON.stringify(projects, null, 2));
  
  const leads = await prisma.lead.findMany({
    where: { status: 'SITE_VISIT_SCHEDULED' },
    select: { id: true, name: true, status: true }
  });
  console.log('Leads in SITE_VISIT_SCHEDULED:', JSON.stringify(leads, null, 2));
}

check();
