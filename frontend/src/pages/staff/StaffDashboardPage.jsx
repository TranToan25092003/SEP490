import React from 'react';
import { useLoaderData } from 'react-router-dom'; // Import useLoaderData
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import { ShoppingCart, FileText, DollarSign, Users, TrendingUp } from 'lucide-react';

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
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
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

const COLORS = ['#DC2626', '#1F2937', '#6B7280', '#F59E0B', '#10B981']; // Expanded colors

const fallbackDashboardData = {
    stats: {
        orders: 0,
        requests: 0,
        revenue: 0,
        customers: 0,
    },
    lineChartData: [
        { name: 'T1', 'YêuCầu': 0 },
        { name: 'T2', 'YêuCầu': 0 },
        { name: 'T3', 'YêuCầu': 0 },
    ],
    barChartData: [
        { month: 'T1', DoanhThu: 0 },
        { month: 'T2', DoanhThu: 0 },
        { month: 'T3', DoanhThu: 0 },
    ],
    pieChartData: [],
    potentialCustomers: [],
};

export async function staffDashboardLoader() {
    return fallbackDashboardData;
}

export default function StaffDashboardPage() {
    // 1. Lấy dữ liệu thật từ loader
    const loaderData = useLoaderData() || fallbackDashboardData;
    const {
        stats,
        lineChartData,
        barChartData,
        pieChartData,
        potentialCustomers
    } = loaderData;

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
                        <CardTitle className="text-sm font-medium">Đơn Hàng Hoàn Thành</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.orders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yêu Cầu Đang Xử Lý</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.requests}</div>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Xu hướng Yêu cầu (Năm nay)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="h-[60px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                        <CardTitle className="text-sm font-medium">Tổng Doanh Thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCompactCurrency(stats.revenue)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng Khách Hàng</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.customers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Doanh Thu Bán Hàng (Theo Tháng)</CardTitle>
                            {/* <p className="text-sm text-muted-foreground">345,678 VND <span className="text-green-600">(+10%)</span></p> */}
                        </div>
                        <Select defaultValue="this-year">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Xem theo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this-year">Năm nay</SelectItem>
                                {/* TODO: Implement filtering logic later */}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000000}M`} />
                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ fontSize: '12px', padding: '4px 8px' }} />
                            <Bar dataKey="DoanhThu" fill="#FEE2E2" radius={[4, 4, 0, 0]} barSize={30}>
                                {barChartData.map((entry, index) => (
                                    // Highlight current month (simplified logic)
                                    <Cell key={`cell-${index}`} fill={index === barChartData.length - 1 ? '#DC2626' : '#FEE2E2'} />
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
                        <CardTitle>Dịch Vụ Phổ Biến</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        activeIndex={activeIndex}
                                        activeShape={renderActiveShape}
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        onMouseEnter={onPieEnter}
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    {/* <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" /> */}
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500">Chưa có dữ liệu dịch vụ</div>
                        )}
                    </CardContent>
                </Card>

                {/* Potential Customers Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Top 5 Khách Hàng Tiềm Năng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã KH</TableHead>
                                    <TableHead>Họ Tên</TableHead>
                                    <TableHead>Tổng Chi Tiêu</TableHead>
                                    <TableHead>Số Điện Thoại</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {potentialCustomers.length > 0 ? (
                                    potentialCustomers.map((customer, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{customer.id}</TableCell>
                                            <TableCell>{customer.name}</TableCell>
                                            <TableCell className="font-medium text-green-600">{formatCurrency(customer.spent)}</TableCell>
                                            <TableCell>{customer.phone}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">Chưa có dữ liệu khách hàng.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}