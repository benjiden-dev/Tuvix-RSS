"use client";

import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type UsersByPlanChartProps = {
  data: Record<string, number>;
};

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function UsersByPlanChart({ data }: UsersByPlanChartProps) {
  const chartData = Object.entries(data)
    .filter((entry) => Number(entry[1]) > 0)
    .map(([plan, count], index) => {
      const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
      return {
        plan: planName,
        planKey: plan.toLowerCase(),
        count,
        fill: chartColors[index % chartColors.length],
      };
    });

  const chartConfig: ChartConfig = chartData.reduce((acc, item) => {
    acc[item.planKey] = {
      label: item.plan,
      color: item.fill,
    };
    return acc;
  }, {} as ChartConfig);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users by Plan</CardTitle>
          <CardDescription>Distribution across plan tiers</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Users by Plan</CardTitle>
        <CardDescription>Distribution across plan tiers</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="plan" />}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="plan" />}
              verticalAlign="bottom"
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="plan"
              cx="50%"
              cy="50%"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
