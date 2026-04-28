
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const adjustments = await prisma.vpg_clock_log_adjustments.findMany({
    where: {
      adjustment_employee_id: 2
    }
  });
  console.log(JSON.stringify(adjustments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
