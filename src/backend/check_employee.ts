import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the employee "Test Uno" / "Tester JR"
  const employee = await prisma.vpg_employees.findFirst({
    where: {
      employee_first_name: {
        contains: 'Test',
        mode: 'insensitive'
      }
    }
  });

  if (!employee) {
    console.log('Employee not found');
  } else {
    console.log('Employee found:');
    console.log(`ID: ${employee.employee_id}`);
    console.log(`Name: ${employee.employee_first_name} ${employee.employee_middle_name} ${employee.employee_last_name}`);
    console.log(`Required Hours (Biweekly): ${employee.employee_required_hours_biweekly}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
