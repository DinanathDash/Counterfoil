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
import ReactECharts from "echarts-for-react";

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
  const inactiveCustomers =
    customers.total - (customers.active + customers.lead);

  const challanChartOption = {
    tooltip: { trigger: "item" },
    grid: { left: "0%", right: "0%", bottom: "0%", top: "10%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["Draft", "Confirmed"],
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: { type: "value", show: false },
    series: [
      {
        data: [
          { value: challans.draft, itemStyle: { color: "#3b82f6", borderRadius: [4, 4, 0, 0] } },
          { value: challans.confirmed, itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] } },
        ],
        type: "bar",
        barWidth: "40%",
      },
    ],
  };

  const customerChartOption = {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["60%", "90%"],
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        data: [
          { value: customers.active, name: "Active", itemStyle: { color: "#3b82f6" } },
          { value: customers.lead, name: "Lead", itemStyle: { color: "#f59e0b" } },
          { value: inactiveCustomers, name: "Inactive", itemStyle: { color: "#ef4444" } },
        ],
      },
    ],
  };

  return (
    <div className="pb-8 tracking-[0.01em] space-y-8">
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-[13px] leading-tight">
            Welcome to Counterfoil Overview.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Stat Tiles */}
          <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
              <CardTitle className="text-[12px] font-medium text-muted-foreground">
                Total customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-2xl font-bold">{customers.total}</div>
              <p className="text-xs text-muted-foreground">
                {customers.active} active, {customers.lead} leads
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
              <CardTitle className="text-[12px] font-medium text-muted-foreground">
                Total products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-2xl font-bold">{products.total}</div>
              <p className="text-xs text-muted-foreground">
                {products.lowStock} running low
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
              <CardTitle className="text-[12px] font-medium text-muted-foreground">
                Challans today
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-2xl font-bold">{challans.todayCount}</div>
              <p className="text-xs text-muted-foreground">Created today</p>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
              <CardTitle className="text-[12px] font-medium text-muted-foreground">
                Pending drafts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" strokeWidth={1} />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="text-2xl font-bold">{challans.draft}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting confirmation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Charts */}
        <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-[12px] font-medium text-muted-foreground">Challan distribution</CardTitle>
            <CardDescription className="text-[13px] leading-tight">Current state of all challans</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-[250px] w-full">
              <ReactECharts
                option={challanChartOption}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-[12px] font-medium text-muted-foreground">Customer status</CardTitle>
            <CardDescription className="text-[13px] leading-tight">Breakdown of customer base</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center px-5 pb-5">
            <div className="h-[250px] w-full">
              <ReactECharts
                option={customerChartOption}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Actionable Lists */}
        <Card className="flex flex-col bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="flex items-center text-destructive text-[12px] font-medium">
              <AlertTriangle className="mr-2 h-4 w-4" strokeWidth={1} /> Low stock items
            </CardTitle>
            <CardDescription className="text-[13px] leading-tight">
              Products at or below their minimum stock threshold.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 px-5 pb-5">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" strokeWidth={1} />
                No low stock items. All good!
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b-[0.5px] border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-[13px] leading-tight">{item.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        SKU: {item.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive text-[13px] leading-tight">
                        {item.currentStock}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        Min: {item.minStockAlert}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {lowStockItems.length > 5 && (
            <div className="p-4 border-t-[0.5px] border-border/50 text-center mt-auto rounded-b-2xl">
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

        <Card className="flex flex-col bg-card shadow-sm border-[0.5px] border-border/50 rounded-2xl">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="flex items-center text-amber-500 text-[12px] font-medium">
              <CalendarCheck className="mr-2 h-4 w-4" strokeWidth={1} /> Follow-ups due
            </CardTitle>
            <CardDescription className="text-[13px] leading-tight">
              Customers requiring attention this week.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 px-5 pb-5">
            {followUpsDue.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" strokeWidth={1} />
                No pending follow-ups. Great job!
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {followUpsDue.slice(0, 5).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between border-b-[0.5px] border-border/50 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-[13px] leading-tight">{customer.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {customer.businessName || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] leading-tight font-medium text-amber-600">
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
