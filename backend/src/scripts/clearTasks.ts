import 'dotenv/config'
import prisma from '../lib/prisma'

async function main() {
  const result = await prisma.task.deleteMany()
  console.log(`Deleted ${result.count} tasks`)
  await prisma.$disconnect()
}

main()
