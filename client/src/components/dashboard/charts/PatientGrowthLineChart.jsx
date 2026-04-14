import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PatientGrowthLineChart = ({ data, theme = "light" }) => {
  const isDark = theme === "dark";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: -14, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={isDark ? "#334155" : "#e2e8f0"}
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: isDark ? "#cbd5e1" : "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              borderColor: isDark ? "#334155" : "#bfdbfe",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#e2e8f0" : "#0f172a",
              fontSize: 12,
            }}
            formatter={(value) => [value, "Total Patients"]}
          />
          <Line
            type="monotone"
            dataKey="totalPatients"
            stroke={isDark ? "#a5b4fc" : "#4f46e5"}
            strokeWidth={3}
            dot={{ r: 4, fill: isDark ? "#a5b4fc" : "#4f46e5" }}
            activeDot={{ r: 6, fill: isDark ? "#c7d2fe" : "#312e81" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PatientGrowthLineChart;
