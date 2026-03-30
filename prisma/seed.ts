import { PrismaClient, PipelineStage, LiasoningStage, ExecutionStage, FileCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting hardcoded refined seed...')

  const realOrgId = 'org_2teK2lsX6XODc7ImxRX1hwttrJqIc6d4fe'
  const realUserId = 'user_2teK2lsX6XODc7ImxRX1hwttrJqIc6d4fe' // Correcting based on standard Clerk pattern/previous logs

  console.log(`🔗 Using hardcoded Org: ${realOrgId}`)
  console.log(`🔗 Using hardcoded User: ${realUserId}`)

  // Ensure Org exists
  await prisma.organization.upsert({
    where: { id: realOrgId },
    update: { name: 'MNMSOLAR' },
    create: { id: realOrgId, name: 'MNMSOLAR' }
  })

  // Ensure User exists
  await prisma.user.upsert({
    where: { id: realUserId },
    update: { 
      role: 'OWNER', 
      isSuperAdmin: true, 
      department: 'OVERALL',
      organizationId: realOrgId
    },
    create: {
      id: realUserId,
      email: 'siddharthaswamy08@gmail.com',
      role: 'OWNER',
      isSuperAdmin: true,
      department: 'OVERALL',
      organizationId: realOrgId
    }
  })

  // 2. Create 'Ruby Mills' Project under the REAL Org
  // Wipe any existing one first to avoid unique constraint issues if any
  await prisma.project.deleteMany({ where: { name: 'Ruby Mills Solar Installation' } })

  const project = await prisma.project.create({
    data: {
      name: 'Ruby Mills Solar Installation',
      clientName: 'Ruby Mills Ltd.',
      address: 'Ruby Mills Compound, Dadar West, Mumbai, Maharashtra 400028',
      dcCapacity: '250 kWp',
      sanctionedLoad: '200 kW',
      stage: PipelineStage.DETAILED_ENGG,
      liasoningStage: LiasoningStage.L1_APPROVED,
      executionStage: ExecutionStage.STRUCTURE,
      currentDepartment: 'ENGINEERING',
      isBottlenecked: false,
      organizationId: realOrgId,
      
      // Handoff logs (Pulse)
      handoffLogs: {
        create: [
          {
            fromDept: 'SALES',
            toDept: 'ENGINEERING',
            fromStage: PipelineStage.PRELIMINARY_QUOTE,
            toStage: PipelineStage.DETAILED_ENGG,
            userId: realUserId,
            comment: 'Site survey complete. Engineering to start detailed drawings for structural approval.',
            organizationId: realOrgId,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            fromDept: 'ENGINEERING',
            toDept: 'LIAISONING',
            fromStage: PipelineStage.DETAILED_ENGG,
            toStage: PipelineStage.DETAILED_ENGG,
            userId: realUserId,
            comment: 'L1 diagrams submitted to MSEDCL for feasibility review.',
            organizationId: realOrgId,
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            fromDept: 'ADMIN',
            toDept: 'ENGINEERING',
            fromStage: PipelineStage.DETAILED_ENGG,
            toStage: PipelineStage.DETAILED_ENGG,
            userId: realUserId,
            comment: 'Urgent: Structural load certificates needed by Friday for final approval pulse.',
            organizationId: realOrgId,
            createdAt: new Date() // Just now
          }
        ]
      },

      // Project Files (Vault)
      projectFiles: {
        create: [
          {
            name: 'L1 Feasibility Report.pdf',
            category: FileCategory.LIAISONING,
            content: 'Sample content for L1 report',
            organizationId: realOrgId
          },
          {
            name: 'Structure Load Diagram.dwg',
            category: FileCategory.TECHNICAL,
            content: 'Sample CAD data',
            organizationId: realOrgId
          },
          {
            name: 'Work Order #RM-2026-001.pdf',
            category: FileCategory.COMMERCIAL,
            content: 'Official work order contents',
            organizationId: realOrgId
          }
        ]
      }
    }
  })

  console.log(`✅ Hardcoded Seed complete! Created project: ${project.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
