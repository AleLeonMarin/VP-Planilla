-- CreateTable
CREATE TABLE "vpg_payroll_param_snapshots" (
    "id" TEXT NOT NULL,
    "payroll_id" INTEGER NOT NULL,
    "param_key" TEXT NOT NULL,
    "param_value" DECIMAL(65,30) NOT NULL,
    "param_valid_from" TIMESTAMP(3) NOT NULL,
    "source_decree" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vpg_payroll_param_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_vpg_payroll_param_snapshots_payroll_id" ON "vpg_payroll_param_snapshots"("payroll_id");

-- CreateIndex
CREATE UNIQUE INDEX "vpg_payroll_param_snapshots_payroll_id_param_key_key" ON "vpg_payroll_param_snapshots"("payroll_id", "param_key");

-- AddForeignKey
ALTER TABLE "vpg_payroll_param_snapshots" ADD CONSTRAINT "vpg_payroll_param_snapshots_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "vpg_payrolls"("payrolls_id") ON DELETE RESTRICT ON UPDATE CASCADE;
