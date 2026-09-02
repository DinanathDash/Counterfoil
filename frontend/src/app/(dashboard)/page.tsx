"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  FileText,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart } from "recharts";

const challanChartConfig = {
  count: { label: "Count" },
  draft: { label: "Draft", color: "hsl(var(--chart-1))" },
  confirmed: { label: "Confirmed", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const customerChartConfig = {
  active: { label: "Active", color: "hsl(var(--chart-1))" },
  lead: { label: "Lead", color: "hsl(var(--chart-2))" },
  inactive: { label: "Inactive", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-ink mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-muted-foreground">
          Could not fetch dashboard summary.
        </p>
      </div>
    );
  }

  const { customers, products, challans, lowStockItems, followUpsDue } = data;

  const challanChartData = [
    { name: "Draft", count: challans.draft, fill: "var(--color-draft)" },
    {
      name: "Confirmed",
      count: challans.confirmed,
      fill: "var(--color-confirmed)",
    },
  ];

  const inactiveCustomers =
    customers.total - (customers.active + customers.lead);
  const customerChartData = [
    { name: "Active", value: customers.active, fill: "var(--color-active)" },
    { name: "Lead", value: customers.lead, fill: "var(--color-lead)" },
    {
      name: "Inactive",
      value: inactiveCustomers,
      fill: "var(--color-inactive)",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome to Counterfoil Overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Tiles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.total}</div>
            <p className="text-xs text-muted-foreground">
              {customers.active} active, {customers.lead} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.total}</div>
            <p className="text-xs text-muted-foreground">
              {products.lowStock} running low
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Challans Today
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{challans.todayCount}</div>
            <p className="text-xs text-muted-foreground">Created today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Drafts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{challans.draft}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Challan Distribution</CardTitle>
            <CardDescription>Current state of all challans</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={challanChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart
                data={challanChartData}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Status</CardTitle>
            <CardDescription>Breakdown of customer base</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer
              config={customerChartConfig}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={customerChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Actionable Lists */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5" /> Low Stock Items
            </CardTitle>
            <CardDescription>
              Products at or below their minimum stock threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                No low stock items. All good!
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">
                        {item.currentStock}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.minStockAlert}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {lowStockItems.length > 5 && (
            <div className="p-4 border-t text-center mt-auto">
              <Link href="/products?lowStock=true">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary hover:text-primary/80"
                >
                  View All ({lowStockItems.length})
                </Button>
              </Link>
            </div>
          )}
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-500">
              <CalendarCheck className="mr-2 h-5 w-5" /> Follow-ups Due
            </CardTitle>
            <CardDescription>
              Customers requiring attention this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {followUpsDue.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                No pending follow-ups. Great job!
              </div>
            ) : (
              <div className="space-y-4">
                {followUpsDue.slice(0, 5).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.businessName || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-600">
                        {customer.followUpDate
                          ? format(new Date(customer.followUpDate), "MMM dd")
                          : ""}
                      </p>
                      <Link href={`/customers/${customer.id}`}>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs"
                        >
                          View CRM
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
