import CRUDTable from "@/components/global/CRUDTable";
import Container from "@/components/global/Container";
import { AdminPagination } from "@/components/global/AdminPagination";
import { StatusBadge } from "@/components/global/StatusBadge";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link, useLoaderData, Await } from "react-router-dom";
import { H3 } from "@/components/ui/headings";
import { formatDateTime } from "@/lib/utils";
import { getAllServiceOrders } from "@/api/serviceOrders";
import { Suspense } from "react";
import { translateServiceOrderStatus } from "@/utils/enumsTranslator";
import { Spinner } from "@/components/ui/spinner";

/**
 * Column definitions for service order list table
 * @type {Array<Object>}
 */
const serviceOrderListColumnDefinitions = [
  {
    accessorKey: "licensePlate",
    header: "Biển số xe",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "customerName",
    header: "Họ tên khách hàng",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: (info) => formatDateTime(info.getValue()),
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: (info) => {
      const status = info.row.original.status;
      const statusLabel = translateServiceOrderStatus(status);
      return <StatusBadge status={statusLabel} />;
    },
  },
];

function loader() {
  return {
    serviceOrders: getAllServiceOrders(),
  };
}

const ServiceOrderList = () => {
  const { serviceOrders } = useLoaderData();

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

      <Suspense fallback={
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      }>
        <Await resolve={serviceOrders}>
          {(data) => (
            <>
              <CRUDTable
                data={data}
                columns={serviceOrderListColumnDefinitions}
                getRowId={(row) => row.id}
              >
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
                  totalPages: 1,
                  itemsPerPage: data.length,
                  totalItems: data.length,
                }}
              />
            </>
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderList.displayName = "ServiceOrderList";
ServiceOrderList.loader = loader;
export default ServiceOrderList;
