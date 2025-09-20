import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search, Filter, CreditCard, Smartphone } from 'lucide-react';
import apiClient from '@/services/api';

interface Order {
  _id: string;
  user: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  orderItems: Array<{
    _id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  paymentMethod: string; // cod, razorpay, phonepe
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

const getOrderStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'processing': return 'default';
    case 'shipped': return 'outline';
    case 'delivered': return 'default';
    default: return 'secondary';
  }
};

// ✅ Separate OrderRow component
const OrderRow = ({ order, updateOrderStatus }: { order: Order; updateOrderStatus: (id: string, s: Order['status']) => void }) => (
  <TableRow key={order.orderId}>
    <TableCell className="font-medium">{order.orderId}</TableCell>
    <TableCell>
      {order.user ? (
        <div>
          <div className="font-medium">{order.user.name}</div>
          <div className="text-sm text-gray-500">{order.user.email}</div>
        </div>
      ) : (
        <span className="text-gray-400">Guest User</span>
      )}
    </TableCell>
    <TableCell>{order.user?.phone || '—'}</TableCell>
    <TableCell>
      <ul className="space-y-1">
        {order.orderItems.slice(0, 2).map(item => (
          <li key={item._id}>
            {item.name} × {item.quantity}
          </li>
        ))}
        {order.orderItems.length > 2 && (
          <span className="text-gray-400">+{order.orderItems.length - 2} more</span>
        )}
      </ul>
    </TableCell>
    <TableCell>₹{order.totalPrice}</TableCell>
    <TableCell className="capitalize">{order.paymentMethod}</TableCell>
    <TableCell>
      <Badge variant={getOrderStatusColor(order.status) as any}>{order.status}</Badge>
    </TableCell>
    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
    <TableCell>
      <Select
        value={order.status}
        onValueChange={(value: Order['status']) => updateOrderStatus(order._id, value)}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>
  </TableRow>
);

const OrderManager = () => {
  const [ordersData, setOrdersData] = useState<any>(null); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // ✅ Fetch orders from backend
useEffect(() => {
  async function fetchOrders() {
    try {
      const data = await apiClient.getAllOrdersAdmin(page); // pass page
      console.log("📦 Orders API response:", data);
      setOrders(data.orders);
      setOrdersData(data);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("❌ Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }
  fetchOrders();
  //console.log("📦 Orders count from API:", data.orders.length);
}, [page]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaymentProvider, setFilterPaymentProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
  try {
    // Update in DB
    await apiClient.updateOrderStatus(orderId, newStatus);

    // Optimistic UI update
    setOrders(prev =>
      prev.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
  } catch (error) {
    console.error("Failed to update order status:", error);
  }
};
  const updatePaymentStatus = (orderId: string, newStatus: Order['paymentStatus']) => {
    setOrders(orders.map(order => 
      order._id === orderId ? { ...order, paymentStatus: newStatus } : order
    ));
  };

const filteredOrders = useMemo(() => {
  return orders.filter(order => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPaymentProvider =
      filterPaymentProvider === 'all' || order.paymentMethod === filterPaymentProvider;

    const matchesStatus =
      filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesPaymentProvider && matchesStatus;
  });
}, [orders, searchQuery, filterPaymentProvider, filterStatus]);

const downloadCSV = () => {
  const csvContent = [
    ['Order ID', 'Customer', 'Email', 'Phone', 'Total', 'Payment Method', 'Status', 'Date', 'Items'],
    ...filteredOrders.map(order => [
      order.orderId,
      order.user?.name || order.shippingAddress?.fullName || 'Guest',
      order.user?.email || order.shippingAddress?.email || '',
      order.user?.phone || order.shippingAddress?.phone || '',
      order.totalPrice.toString(),
      order.paymentMethod,
      order.status,
      new Date(order.createdAt).toLocaleDateString(),
      order.orderItems.map(item => `${item.name} (${item.quantity})`).join('; ')
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

 const getOrderStatusColor = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'shipped': return 'outline';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  }; 

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'paid': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  }; 

 /* const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "warning";
      case "shipped":
        return "info";
      case "delivered":
        return "success";
      default:
        return "secondary";
    }
  }; */

  if (loading) {
    return <div className="p-4">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-playfair font-bold">Order Management</h2>
        <Button onClick={downloadCSV} variant="outline">
          <Download size={16} className="mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterPaymentProvider} onValueChange={setFilterPaymentProvider}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{ordersData?.total ?? 0}</div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
{/* COD Orders */}
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">
      {orders.filter(o => o.paymentMethod === 'cod').length}
    </div>
    <p className="text-sm text-muted-foreground">COD Orders</p>
  </CardContent>
</Card>

{/* Razorpay Orders */}
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">
      {orders.filter(o => o.paymentMethod === 'razorpay').length}
    </div>
    <p className="text-sm text-muted-foreground">Razorpay</p>
  </CardContent>
</Card>

{/* PhonePe Orders */}
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold">
      {orders.filter(o => o.paymentMethod === 'phonepe').length}
    </div>
    <p className="text-sm text-muted-foreground">PhonePe</p>
  </CardContent>
</Card>
      </div>

      {/* Orders Table */}<Card>
  <CardHeader>
    <CardTitle>Orders List ({filteredOrders.length})</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
	  <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredOrders.map((order) => (
<TableRow key={order.orderId}>
  {/* Order ID */}
  <TableCell className="font-medium">{order.orderId}</TableCell>

            {/* Customer */}
            <TableCell>
              {order.user ? (
                <div>
                  <div className="font-medium">{order.user.name}</div>
                  <div className="text-sm text-gray-500">{order.user.email}</div>
                </div>
              ) : (
                <span className="text-gray-400">Guest User</span>
              )}
            </TableCell>
	    {/* Name */}
            <TableCell>
            {order.shippingAddress?.fullName || (
            <span className="text-gray-400">Guest</span>
            )}
           </TableCell>

           {/* Email */}
           <TableCell>
          {order.shippingAddress?.email || (
            <span className="text-gray-400">—</span>
          )}
          </TableCell>

            {/* Contact */}
            <TableCell>{order.user?.phone || order.shippingAddress?.phone || '—'}</TableCell>

            {/* Products */}
            <TableCell>
              <ul className="space-y-1">
                {order.orderItems.map((item) => (
                  <li key={item._id} className="flex items-center space-x-2">
                    <span>{item.name} × {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </TableCell>

            {/* Total */}
            <TableCell>₹{order.totalPrice}</TableCell>

            {/* Payment Method */}
            <TableCell className="capitalize">{order.paymentMethod}</TableCell>

            {/* Status */}
            <TableCell>
              <Badge variant={getOrderStatusColor(order.status) as any}>
                {order.status}
              </Badge>
            </TableCell>

            {/* Date */}
            <TableCell>
              {new Date(order.createdAt).toLocaleDateString()}
            </TableCell>

            {/* Actions */}
            <TableCell>
              <Select
                value={order.status}
                onValueChange={(value: Order['status']) =>
                  updateOrderStatus(order._id, value)
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
  {/* Download Invoice */}
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    try {
      const blob = await apiClient.downloadInvoice(order._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("❌ Error downloading invoice:", err);
    }
  }}
>
  <Download size={14} className="mr-1" /> Invoice
</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
<div className="flex justify-center items-center gap-4 mt-4">
  <Button
    variant="outline"
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
  >
    Previous
  </Button>
  <span>
    Page {page} of {totalPages}
  </span>
  <Button
    variant="outline"
    disabled={page === totalPages}
    onClick={() => setPage(page + 1)}
  >
    Next
  </Button>
</div>
  </CardContent>
</Card> 
   </div>
  );
};

export default OrderManager;

