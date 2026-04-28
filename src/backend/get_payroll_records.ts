
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.vpg_payroll_employee.findMany({
    where: {
      payroll_employee_employee_id: 2
    },
    include: {
      vpg_payrolls: true
    }
  });
  console.log(JSON.stringify(records, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
