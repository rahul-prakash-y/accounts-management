import React from "react";
import { TrendingUp, TrendingDown, AlertCircle, Package } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { clsx } from "clsx";

const DATA = [
  { name: "Mon", total: 1200 },
  { name: "Tue", total: 2100 },
  { name: "Wed", total: 800 },
  { name: "Thu", total: 1600 },
  { name: "Fri", total: 2400 },
  { name: "Sat", total: 1700 },
  { name: "Sun", total: 3100 },
];

function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <Icon size={20} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <p
          className={clsx(
            "text-xs font-medium flex items-center gap-1",
            trend === "up"
              ? "text-green-500"
              : trend === "down"
                ? "text-red-500"
                : "text-muted-foreground",
          )}
        >
          {trend === "up" && <TrendingUp size={14} />}
          {trend === "down" && <TrendingDown size={14} />}
          {subtext}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue (Today)"
          value="$1,240.50"
          subtext="+12% from yesterday"
          icon={TrendingUp}
          trend="up"
        />
        <KPICard
          title="Total Orders"
          value="24"
          subtext="+4 new orders"
          icon={Package}
          trend="up"
        />
        <KPICard
          title="Low Stock Items"
          value="3"
          subtext="Requires attention"
          icon={AlertCircle}
          trend="down"
        />
        <KPICard
          title="Expenses (This Month)"
          value="$4,320.00"
          subtext="Within budget"
          icon={TrendingDown}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity / Chart Placeholder */}
        <div className="bg-card border border-border rounded-xl p-6 h-[400px] flex flex-col">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions or Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 h-[400px]">
          <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Wireless Mouse M305</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: WM-305-BLK
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-destructive">2 left</p>
                  <button className="text-xs text-primary hover:underline">
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
