import CRUDTable from "@/components/global/CRUDTable";
import Container from "@/components/global/Container";
import { AdminPagination } from "@/components/global/AdminPagination";
import { StatusBadge } from "@/components/global/StatusBadge";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { H3 } from "@/components/ui/headings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import usePageParamsStore from "@/hooks/use-page-params-store";

/**
 * Sample service orders data
 * @type {Array<Object>}
 */
const customerServiceOrders = [
  {
    id: 1,
    customerName: "Nguyen Van A",
    date: "2024-10-01",
    serviceTypes: ["Sửa xe", "Bảo dưỡng"],
  },
  {
    id: 2,
    customerName: "Trankkkkn Thi B",
    date: "2024-10-02",
    serviceTypes: ["Thay nhớt"],
  },
];

/**
 * Column definitions for service order list table
 * @type {Array<Object>}
 */
const serviceOrderListColumnDefinitions = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "customerName",
    header: "Họ tên khách hàng",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "date",
    header: "Ngày đặt",
    cell: (info) => info.getValue(),
  },
  {
    id: "status",
    header: "Loại lệnh",
    cell: (info) => {
      const services = info.row.original.serviceTypes;
      const badges = services.map((service) => (
        <StatusBadge key={service} status={service} colorKey={service} />
      ));

      return <div className="flex flex-wrap gap-2">{badges}</div>;
    },
  },
];

/**
 * Sample change requests data
 * @type {Array<Object>}
 */
const changeRequests = [
  {
    id: 101,
    orderId: 1,
    title: "Yêu cầu thay đổi lịch hẹn",
    customerName: "Le Thi C",
    dateRequested: "2024-10-03",
  },
  {
    id: 102,
    orderId: 2,
    title: "Yêu cầu thay đổi dịch vụ",
    customerName: "Pham Van D",
    dateRequested: "2024-10-04",
  },
];

/**
 * Column definitions for change requests table
 * @type {Array<Object>}
 */
const changeRequestsColumnDefinitions = [
  {
    accessorKey: "id",
    header: "ID Yêu cầu",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "orderId",
    header: "ID Lệnh",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "customerName",
    header: "Tên khách hàng",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "dateRequested",
    header: "Ngày yêu cầu",
    cell: (info) => info.getValue(),
  },
];


/**
 * ServiceOrderList Component
 * Page for listing and managing service orders
 * @component
 * @returns {JSX.Element} The service order list page
 */
const ServiceOrderList = () => {
  const [viewName, switchPageParams] = usePageParamsStore({
    viewNames: ["all", "change_requests"],
    defaultViewName: "all"
  });

  return (
    <Container pageContext="admin">
      <div className="flex justify-between items-center">
        <H3>Quản lý lệnh</H3>
        <Link to={"/staff/service-order/add"}>
          <Button>
            <Plus />
            Thêm lệnh mới
          </Button>
        </Link>
      </div>

      <Tabs value={viewName} onValueChange={(value) => {
        switchPageParams(value);
      }}>
        <TabsList>
          <TabsTrigger value="all">Tất cả các lệnh</TabsTrigger>
          <TabsTrigger value="change_requests">Yêu cầu sửa đổi từ khách hàng</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-3" value="all">
          <CRUDTable data={customerServiceOrders} columns={serviceOrderListColumnDefinitions} getRowId={(row) => row.id}>
            {(row) => (
              <div className="flex justify-center">
                <Link to={`/staff/service-order/${row.id}`}>
                  <Button variant="outline" className="flex-1 cursor-pointer">
                    <EyeIcon />
                  </Button>
                </Link>
              </div>
            )}
          </CRUDTable>

          <AdminPagination
            pagination={{
              totalPages: 10,
              itemsPerPage: 50,
              totalItems: 1000,
            }}
          />
        </TabsContent>
        <TabsContent className="space-y-3" value="change_requests">
          <CRUDTable data={changeRequests} columns={changeRequestsColumnDefinitions} getRowId={(row) => row.id}>
            {(row) => (
              <div className="flex justify-center">
                <Link to={`/staff/service-order/${row.id}`}>
                  <Button variant="outline" className="flex-1 cursor-pointer">
                    <EyeIcon />
                  </Button>
                </Link>
              </div>
            )}
          </CRUDTable>

          <AdminPagination
            pagination={{
              totalPages: 5,
              itemsPerPage: 50,
              totalItems: 250,
            }}
          />
        </TabsContent>
      </Tabs>

    </Container>
  );
};

ServiceOrderList.displayName = "ServiceOrderList";
export default ServiceOrderList;
