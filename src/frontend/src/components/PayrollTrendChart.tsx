"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PayrollService } from "@/services/payrollService";
import { useTheme } from "@/hooks/useTheme";

const MONTH_ABBR = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getPeriodLabel(periodStart: string): string {
  const d = new Date(periodStart);
  const month = MONTH_ABBR[d.getUTCMonth()];
  return `${d.getUTCDate() <= 15 ? "Q1" : "Q2"} ${month}`;
}

function formatCRC(value: number): string {
  if (value >= 1_000_000) return `₡${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₡${Math.round(value / 1_000)}K`;
  return `₡${Math.round(value)}`;
}

interface ChartPoint {
  label: string;
  neto: number;
  deducciones: number;
  bruto: number;
  empleados: number;
  horasExtra: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  label?: string;
  isDark: boolean;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, isDark }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: isDark ? "#18181b" : "#ffffff",
        border: `1px solid ${isDark ? "#27272a" : "#e4e4e7"}`,
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 160,
      }}
    >
      <p style={{ color: isDark ? "#fafafa" : "#18181b", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>
        {d.label}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <p style={{ color: "#22c55e", fontSize: 11 }}>
          Neto: <strong>{formatCRC(d.neto)}</strong>
        </p>
        <p style={{ color: isDark ? "#71717a" : "#a1a1aa", fontSize: 11 }}>
          Deducciones: {formatCRC(d.deducciones)}
        </p>
        <p style={{ color: isDark ? "#a1a1aa" : "#71717a", fontSize: 11 }}>
          Bruto: {formatCRC(d.bruto)}
        </p>
        <p style={{ color: isDark ? "#a1a1aa" : "#71717a", fontSize: 11 }}>
          Empleados: {d.empleados}
        </p>
        {d.horasExtra > 0 && (
          <p style={{ color: "#f59e0b", fontSize: 11 }}>
            H. extra: {d.horasExtra.toFixed(1)} h
          </p>
        )}
      </div>
    </div>
  );
};

const SkeletonBar: React.FC = () => (
  <div className="px-4 pt-4 pb-2 space-y-2">
    <div className="flex items-end gap-2 h-[180px]">
      {[60, 80, 55, 90, 70, 85].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-zinc-200 dark:bg-zinc-800 animate-pulse"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex-1 h-2.5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      ))}
    </div>
  </div>
);

const PayrollTrendChart: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [latest, setLatest] = useState<ChartPoint | null>(null);

  useEffect(() => {
    PayrollService.getAllPayrolls()
      .then((payrolls) => {
        const sorted = [...payrolls]
          .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
          .slice(-6);

        const points: ChartPoint[] = sorted.map((p) => ({
          label: getPeriodLabel(p.period_start),
          neto: p.total_net ?? 0,
          deducciones: p.total_deductions ?? 0,
          bruto: p.total_gross ?? 0,
          empleados: p.total_employees ?? 0,
          horasExtra: p.total_overtime_hours ?? 0,
        }));

        setChartData(points);
        setLatest(points[points.length - 1] ?? null);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const gridColor = isDark ? "#3f3f46" : "#e4e4e7";
  const tickColor = isDark ? "#71717a" : "#a1a1aa";
  const cursorFill = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const deductionFill = isDark ? "#3f3f46" : "#d4d4d8";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Evolución de Planilla</h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {isLoading ? "Cargando..." : `Últimas ${chartData.length} quincenas`}
            </p>
          </div>
          {latest && !isLoading && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-green-600 dark:text-green-400">{formatCRC(latest.neto)}</p>
              <p className="text-[10px] text-zinc-400">neto {latest.label}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart area */}
      {isLoading ? (
        <SkeletonBar />
      ) : chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px]">
          <p className="text-xs text-zinc-400">Sin planillas registradas</p>
        </div>
      ) : (
        <>
          <div className="px-3 pt-4 pb-1">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={chartData}
                barSize={18}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              >
                <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: tickColor, fontSize: 9, fontFamily: "inherit" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip
                  content={<CustomTooltip isDark={isDark} />}
                  cursor={{ fill: cursorFill }}
                />
                <Bar dataKey="neto" stackId="planilla" fill="#16a34a" name="Neto" radius={[0, 0, 0, 0]} />
                <Bar dataKey="deducciones" stackId="planilla" fill={deductionFill} name="Deducciones" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="px-5 pb-4 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-green-700" />
              <span className="text-[10px] text-zinc-400">Neto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-zinc-300 dark:bg-zinc-600" />
              <span className="text-[10px] text-zinc-400">Deducciones</span>
            </div>
            {latest && latest.horasExtra > 0 && (
              <div className="ml-auto">
                <span className="text-[10px] text-amber-500 font-medium">
                  {latest.horasExtra.toFixed(1)} h extra
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollTrendChart;
