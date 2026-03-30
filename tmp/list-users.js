const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const orgs = await prisma.organization.findMany()
  const users = await prisma.user.findMany()
  console.log('DEBUG: Organizations Found:', orgs.length)
  console.log(JSON.stringify(orgs, null, 2))
  console.log('DEBUG: Users Found:', users.length)
  console.log(JSON.stringify(users, null, 2))
}

main().finally(() => prisma.$disconnect())
