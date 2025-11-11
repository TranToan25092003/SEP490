import CRUDTable from "@/components/global/CRUDTable";
import Container from "@/components/global/Container";
import { AdminPagination } from "@/components/global/AdminPagination";
import { StatusBadge } from "@/components/global/StatusBadge";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link, useLoaderData, Await, useSearchParams, useRevalidator } from "react-router-dom";
import { H3 } from "@/components/ui/headings";
import { formatDateTime } from "@/lib/utils";
import { getAllServiceOrders } from "@/api/serviceOrders";
import { Suspense } from "react";
import { translateServiceOrderStatus, getServiceOrderStatusOptions } from "@/utils/enumsTranslator";
import { Spinner } from "@/components/ui/spinner";
import Filters from "@/components/global/Filter";

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

function loader({ request }) {
  const url = new URL(request.url);
  const params = {
    customerName: url.searchParams.get("customerName"),
    status: url.searchParams.get("status"),
    startTimestamp: url.searchParams.get("startTimestamp"),
    endTimestamp: url.searchParams.get("endTimestamp"),
    page: parseInt(url.searchParams.get("page"), 10) || 1,
    limit: parseInt(url.searchParams.get("limit"), 10) || 20,
  };

  return {
    serviceOrders: getAllServiceOrders(params),
  };
}

const ServiceOrderList = () => {
  const { serviceOrders } = useLoaderData();
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilters = (newFilters) => {
    const params = searchParams;

    if (newFilters.customerName) {
      params.set("customerName", newFilters.customerName);
    } else {
      params.delete("customerName");
    }

    if (newFilters.status) {
      params.set("status", newFilters.status);
    } else {
      params.delete("status");
    }

    if (newFilters.dateRange) {
      if (newFilters.dateRange.start) {
        params.set("startTimestamp", newFilters.dateRange.start.getTime());
      } else {
        params.delete("startTimestamp");
      }

      if (newFilters.dateRange.end) {
        params.set("endTimestamp", newFilters.dateRange.end.getTime());
      } else {
        params.delete("endTimestamp");
      }
    } else {
      params.delete("startTimestamp");
      params.delete("endTimestamp");
    }

    setSearchParams(params);
  };

  const filters = {};

  if (searchParams.get("customerName")) {
    filters.customerName = searchParams.get("customerName");
  }

  if (searchParams.get("status")) {
    filters.status = searchParams.get("status");
  }

  if (searchParams.get("startTimestamp")) {
    if (!filters.dateRange) {
      filters.dateRange = {};
    }
    filters.dateRange.start = new Date(parseInt(searchParams.get("startTimestamp"), 10));
  }

  if (searchParams.get("endTimestamp")) {
    if (!filters.dateRange) {
      filters.dateRange = {};
    }
    filters.dateRange.end = new Date(parseInt(searchParams.get("endTimestamp"), 10));
  }

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

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <Await
          errorElement={
            <CRUDTable
              isLoading={false}
              isError={true}
              columns={serviceOrderListColumnDefinitions}
              onRetry={() => revalidator.revalidate()}
            />
          }
          resolve={serviceOrders}
        >
          {(data) => (
            <>
              <Filters filters={filters} onFiltersChange={setFilters}>
                <Filters.StringFilter
                  filterKey="customerName"
                  label={"Tên khách hàng"}
                  placeholder={"Nhập tên khách hàng"}
                />
                <Filters.DropdownFilter
                  filterKey="status"
                  label={"Trạng thái"}
                  placeholder={"Chọn trạng thái"}
                  options={getServiceOrderStatusOptions()}
                />
                <Filters.DateRangeFilter
                  filterKey="dateRange"
                  label={"Khoảng ngày tạo"}
                />
              </Filters>

              <CRUDTable
                data={data.serviceOrders}
                columns={serviceOrderListColumnDefinitions}
                getRowId={(row) => row.id}
              >
                {(row) => (
                  <div className="flex justify-center">
                    <Link to={`/staff/service-order/${row.id}`}>
                      <Button
                        variant="outline"
                        className="flex-1 cursor-pointer"
                      >
                        <EyeIcon />
                      </Button>
                    </Link>
                  </div>
                )}
              </CRUDTable>

              {data.pagination.totalItems > 0 && <AdminPagination
                pagination={data.pagination}
              />}
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
