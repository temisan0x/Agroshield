import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const farmer = await prisma.user.create({
    data: {
      email: "farmer@test.com",
      role: "FARMER",
    },
  })

  console.log("Created farmer:", farmer)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })