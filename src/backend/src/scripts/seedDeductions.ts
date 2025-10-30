import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertDeduction(name: string, description: string, percentage?: number, fixed_amount?: number) {
  const existing = await prisma.vpg_deductions.findFirst({ where: { deductions_name: name } });
  if (existing) return existing;
  return prisma.vpg_deductions.create({
    data: {
      deductions_name: name,
      deductions_description: description,
      deductions_percentage: percentage != null ? percentage : null,
      deductions_fixed_amount: fixed_amount != null ? fixed_amount : null,
      deductions_version: 1,
    },
  });
}

async function ensureAssignment(employeeId: number, deductionId: number) {
  const exists = await prisma.vpg_deductions_per_employee.findFirst({
    where: {
      deductions_per_employee_employee_id: employeeId,
      deductions_per_employee_deduction_id: deductionId,
    },
  });
  if (exists) return exists;
  return prisma.vpg_deductions_per_employee.create({
    data: {
      deductions_per_employee_employee_id: employeeId,
      deductions_per_employee_deduction_id: deductionId,
      deductions_per_employee_version: 1,
    },
  });
}

async function main() {
  console.log("Seeding deductions and assignments...");
  // Create standard deductions
  const ccss = await upsertDeduction("CCSS", "Aporte CCSS 10.67%", 10.67);
  const impuesto = await upsertDeduction("Impuesto", "Impuesto Renta 10%", 10);
  const sem = await upsertDeduction("SEM", "Seguro SEM 5.5%", 5.5);
  const ivm = await upsertDeduction("IVM", "IVM 2.84%", 2.84);

  const employees = [2, 5];
  const deductions = [ccss, impuesto, sem, ivm];

  for (const empId of employees) {
    for (const d of deductions) {
      await ensureAssignment(empId, d.deductions_id);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
