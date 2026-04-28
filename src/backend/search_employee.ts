
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.vpg_employees.findMany({
    where: {
      OR: [
        { employee_first_name: { contains: 'Maria', mode: 'insensitive' } },
        { employee_last_name: { contains: 'Salas', mode: 'insensitive' } }
      ]
    },
    include: {
      vpg_positions: true
    }
  });
  console.log(JSON.stringify(employees, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
