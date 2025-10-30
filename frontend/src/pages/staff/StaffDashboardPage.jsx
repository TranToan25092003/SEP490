import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { ShoppingCart, FileText, DollarSign, Users, TrendingUp } from 'lucide-react';

// --- Mock Data (Replace with data from loader) ---
const mockStats = {
    orders: 432,
    requests: 525,
    revenue: 100000000, // Example: 100M+
    customers: 320,
};

const mockLineChartData = [
    { name: 'Jan', YêuCầu: 400 }, { name: 'Feb', YêuCầu: 300 }, { name: 'Mar', YêuCầu: 450 },
    { name: 'Apr', YêuCầu: 280 }, { name: 'May', YêuCầu: 500 }, { name: 'Jun', YêuCầu: 600 },
    { name: 'Jul', YêuCầu: 550 }, { name: 'Aug', YêuCầu: 700 }, { name: 'Sep', YêuCầu: 650 },
    { name: 'Oct', YêuCầu: 750 }, { name: 'Nov', YêuCầu: 800 }, { name: 'Dec', YêuCầu: 900 },
];

const mockBarChartData = [
    { month: 'Jan', DoanhThu: 30000000 }, { month: 'Feb', DoanhThu: 20000000 }, { month: 'Mar', DoanhThu: 40000000 },
    { month: 'Apr', DoanhThu: 35000000 }, { month: 'May', DoanhThu: 45000000 }, { month: 'Jun', DoanhThu: 70000000 },
    { month: 'Jul', DoanhThu: 50000000 }, { month: 'Aug', DoanhThu: 30000000 }, { month: 'Sep', DoanhThu: 40000000 },
    { month: 'Oct', DoanhThu: 38000000 }, { month: 'Nov', DoanhThu: 42000000 }, { month: 'Dec', DoanhThu: 60000000 },
];

const mockPieChartData = [
    { name: 'Rửa xe', value: 55 },
    { name: 'Sửa xe', value: 45 },
    { name: 'Thay dầu phanh', value: 45 }, 
];
const COLORS = ['#DC2626', '#1F2937', '#6B7280']; 

const mockPotentialCustomers = [
    { id: '#123456', name: 'Nguyễn Văn A', spent: 3000000, phone: '0123456789' },
    { id: '#123457', name: 'Trần Thị B', spent: 2500000, phone: '0987654321' },
    { id: '#123458', name: 'Lê Văn C', spent: 4000000, phone: '0123123123' },
    { id: '#123459', name: 'Phạm Thị D', spent: 1500000, phone: '0345678901' },
];

// Function to format currency
const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const formatCompactCurrency = (value) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B+`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M+`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K+`;
    return `${value}+`;
};

// --- Custom Active Shape for Pie Chart ---
const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={16} fontWeight="bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${(percent * 100).toFixed(0)}%`}</text>
        </g>
    );
};


export default function StaffDashboardPage() {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

            {/* Stat Cards Row 1 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đơn Hàng</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.orders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yêu Cầu</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.requests}</div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1"> {/* Spans 1 column on large screens */}
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yêu cầu (Trend)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="h-[60px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockLineChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                <Line type="monotone" dataKey="YêuCầu" stroke="#DC2626" strokeWidth={2} dot={false} />
                                <Tooltip contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            {/* Stat Cards Row 2 */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(mockStats.revenue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Khách Hàng</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockStats.customers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Doanh Thu Bán Hàng</CardTitle>
                            <p className="text-sm text-muted-foreground">345,678 VND <span className="text-green-600">(+10%)</span></p>
                        </div>
                        <Select defaultValue="this-month">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Xem theo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this-month">Tháng này</SelectItem>
                                <SelectItem value="last-month">Tháng trước</SelectItem>
                                <SelectItem value="this-year">Năm nay</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockBarChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                            <Bar dataKey="DoanhThu" fill="#FEE2E2" radius={[4, 4, 0, 0]} barSize={30}>
                                {/* Highlight June */}
                                {mockBarChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.month === 'Jun' ? '#DC2626' : '#FEE2E2'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Bottom Row: Pie Chart and Table */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Pie Chart */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Lệnh Sửa Chữa</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={mockPieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    onMouseEnter={onPieEnter}
                                >
                                    {mockPieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                {/* Potential Customers Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Khách Hàng Tiềm Năng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Số Khách Hàng</TableHead>
                                    <TableHead>Họ Tên</TableHead>
                                    <TableHead>Đã Chi</TableHead>
                                    <TableHead>Số Điện Thoại</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockPotentialCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>{customer.id}</TableCell>
                                        <TableCell>{customer.name}</TableCell>
                                        <TableCell>{formatCurrency(customer.spent)}</TableCell>
                                        <TableCell>{customer.phone}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
