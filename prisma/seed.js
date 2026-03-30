const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting plain JS seed...')

  // Find ANY organization that isn't the default one
  let org = await prisma.organization.findFirst({
    where: { NOT: { id: 'default-org-id' } }
  })

  // If none found, use the first one available
  if (!org) {
    org = await prisma.organization.findFirst()
  }

  if (!org) {
    console.error('❌ No organization found in DB. Please refresh the dashboard first.')
    return
  }

  // Find ANY user
  const user = await prisma.user.findFirst({
    where: { organizationId: org.id }
  })

  if (!user) {
    console.error(`❌ No user found for org ${org.id}. Please refresh the dashboard first.`)
    return
  }

  console.log(`🔗 Using Org: ${org.id}`)
  console.log(`🔗 Using User: ${user.id}`)

  // Ensure user is OWNER
  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'OWNER', isSuperAdmin: true }
  })

  // WIPE existing Ruby Mills project to prevent duplicates
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Ruby Mills Solar Installation' }
  })

  if (existingProject) {
    console.log(`🧹 Cleaning up existing project: ${existingProject.id}`)
    await prisma.projectFile.deleteMany({ where: { projectId: existingProject.id } })
    await prisma.handoffLog.deleteMany({ where: { projectId: existingProject.id } })
    await prisma.project.delete({ where: { id: existingProject.id } })
  }

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: 'Ruby Mills Solar Installation',
      clientName: 'Ruby Mills Ltd.',
      address: 'Ruby Mills Compound, Dadar West, Mumbai, Maharashtra 400028',
      dcCapacity: '250 kWp',
      sanctionedLoad: '200 kW',
      stage: 'DETAILED_ENGG',
      liasoningStage: 'NOT_STARTED',
      executionStage: 'SURVEY',
      currentDepartment: 'ENGINEERING',
      isBottlenecked: false,
      organizationId: org.id,
      
      // Handoff logs
      handoffLogs: {
        create: [
          {
            fromDept: 'SALES',
            toDept: 'ENGINEERING',
            fromStage: 'PRELIMINARY_QUOTE',
            toStage: 'DETAILED_ENGG',
            userId: user.id,
            comment: 'Site survey complete. Engineering to start detailed drawings.',
            organizationId: org.id,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            fromDept: 'ENGINEERING',
            toDept: 'ENGINEERING',
            fromStage: 'DETAILED_ENGG',
            toStage: 'DETAILED_ENGG',
            userId: user.id,
            comment: 'Structural analysis in progress.',
            organizationId: org.id,
            createdAt: new Date()
          }
        ]
      },

      // Project Files
      projectFiles: {
        create: [
          {
            name: 'Site-Layout-V1.pdf',
            category: 'TECHNICAL',
            content: 'Sample content',
            organizationId: org.id
          }
        ]
      }
    }
  })

  console.log(`✅ Seed Complete! Ruby Mills is live in Org ${org.id}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
