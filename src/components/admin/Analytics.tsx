import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { apiClient } from "@/services/api";
import { Button } from "@/components/ui/button";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a4de6c"];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30); // default 30 days

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.getSalesAnalytics(period);
        setAnalytics(res.analytics);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  if (loading) return <p>Loading analytics...</p>;
  if (!analytics) return <p>No analytics data available</p>;

  const dailySalesData = analytics.dailySales.map((d: any) => ({
    date: d.date, // API already sends correct format
    sales: d.sales,
    orders: d.orders,
  }));

  const monthlySalesData = analytics.monthlySales.map((m: any) => ({
    month: m.month,
    sales: m.sales,
    orders: m.orders,
  }));

  const categorySalesData = analytics.categorySales.map((c: any) => ({
    category: c.category,
    sales: c.sales,
    itemsSold: c.itemsSold,
  }));

  const productSalesData = analytics.productSales.map((p: any) => ({
    name: `${p.product}${p.variant ? ` (${p.variant})` : ""}`,
    sales: p.sales,
    quantity: p.quantity,
  }));

  // KPI Highlights
  const totalRevenue = analytics.dailySales.reduce((acc: number, d: any) => acc + d.sales, 0);
  const totalOrders = analytics.dailySales.reduce((acc: number, d: any) => acc + d.orders, 0);
  const unitsSold = analytics.categorySales.reduce((acc: number, c: any) => acc + c.itemsSold, 0);
  const avgRating = 4.5; // Optional: compute from product ratings if available

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        {[7, 30, 90].map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            Last {p} days
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Sales (Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySalesData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#8884d8" name="Revenue (₹)" />
              <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Sales (Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#4CAF50" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Month</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySalesData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#ffc658" name="Revenue (₹)" />
              <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category-wise Sales (Pie Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Category-wise Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categorySalesData}
                dataKey="sales"
                nameKey="category"
                outerRadius={120}
                label
              >
                {categorySalesData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product-wise Sales (Pie Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Product-wise Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productSalesData}
                dataKey="sales"
                nameKey="name"
                outerRadius={120}
                label
              >
                  {productSalesData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
        {/* KPI Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-secondary">₹{totalRevenue}</p>
              <p className="text-sm text-neutral-medium">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{totalOrders}</p>
              <p className="text-sm text-neutral-medium">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{unitsSold}</p>
              <p className="text-sm text-neutral-medium">Units Sold</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{avgRating}★</p>
              <p className="text-sm text-neutral-medium">Avg. Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
