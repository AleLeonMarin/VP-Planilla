
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const bonuses = await prisma.vpg_bonuses.findMany({
    where: {
      bonuses_employee_id: 2
    }
  });
  console.log(JSON.stringify(bonuses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
