import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const emp = await prisma.vpg_employees.findFirst({
    where: { employee_first_name: { contains: 'Test', mode: 'insensitive' } }
  });
  
  if (emp) {
    console.log('Employee found:');
    console.log('ID:', emp.employee_id);
    console.log('Name:', emp.employee_first_name, emp.employee_last_name);
    console.log('Required Hours (Biweekly):', emp.employee_required_hours_biweekly);
  } else {
    console.log('Employee not found');
  }
} finally {
  await prisma.$disconnect();
}
