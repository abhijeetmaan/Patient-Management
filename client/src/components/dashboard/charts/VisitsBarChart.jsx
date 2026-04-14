import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const VisitsBarChart = ({ data, theme = "light" }) => {
  const isDark = theme === "dark";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            cursor={{
              fill: isDark
                ? "rgba(30, 64, 175, 0.2)"
                : "rgba(37, 99, 235, 0.08)",
            }}
            contentStyle={{
              borderRadius: 12,
              borderColor: isDark ? "#334155" : "#bfdbfe",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#e2e8f0" : "#0f172a",
              fontSize: 12,
            }}
            formatter={(value) => [value, "Visits"]}
          />
          <Bar
            dataKey="visits"
            fill={isDark ? "#60a5fa" : "#2563eb"}
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VisitsBarChart;
