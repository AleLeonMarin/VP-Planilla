
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.vpg_clock_logs.findMany({
    where: {
      clock_logs_employee_id: 2
    },
    orderBy: {
      clock_logs_timestamp: 'asc'
    }
  });
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
