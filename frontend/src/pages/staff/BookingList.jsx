import { Link, useLoaderData, useRevalidator, Await, useSearchParams } from "react-router-dom";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Clock, EyeIcon } from "lucide-react";
import CRUDTable from "@/components/global/CRUDTable";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Suspense } from "react";
import { getAllBookings } from "@/api/bookings";
import StatusBadge from "@/components/global/StatusBadge";
import { Button } from "@/components/ui/button";
import { getBookingStatusOptions, translateBookingStatus } from "@/utils/enumsTranslator";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Filters from "@/components/global/Filter";
import { useEffect } from "react";

const formatTimeSlot = (startTime, endTime) => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours().toString().padStart(2, "0");
    const startMinute = start.getMinutes().toString().padStart(2, "0");
    const endHour = end.getHours().toString().padStart(2, "0");
    const endMinute = end.getMinutes().toString().padStart(2, "0");
    return `${startHour}:${startMinute} - ${endHour}:${endMinute}`;
  } catch {
    return "N/A";
  }
};

const renderServiceBadges = (services) => {
  if (!Array.isArray(services) || services.length === 0) {
    return <span className="text-muted-foreground">Không có dịch vụ</span>;
  }

  if (services.length <= 2) {
    return (
      <div className="flex flex-wrap gap-1">
        {services.map((service) => (
          <StatusBadge key={service} status={service} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {services.slice(0, 2).map((service) => (
        <StatusBadge key={service} status={service} />
      ))}
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
        +{services.length - 2}
      </span>
    </div>
  );
};

const bookingListColumnDefinitions = [
  {
    accessorKey: "customerName",
    header: "Tên khách hàng",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "services",
    header: "Dịch vụ",
    cell: (info) => renderServiceBadges(info.getValue()),
  },
  {
    accessorKey: "slotStartTime",
    header: "Slot thời gian",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {formatTimeSlot(row.slotStartTime, row.slotEndTime)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: (info) => {
      const status = info.getValue();
      const vietnameseStatus = translateBookingStatus(status);
      return <StatusBadge status={vietnameseStatus} colorKey={status} />;
    },
  },
];

function loader({ params }) {
  return {
    bookingList: getAllBookings({
      customerName: params.customerName,
      status: params.status,
      startTimestamp: params.startTimestamp,
      endTimestamp: params.endTimestamp,
      page: parseInt(params.page, 10) || 1,
      limit: parseInt(params.limit, 10) || 20,
    })
  };
}

const BookingList = () => {
  const { bookingList } = useLoaderData();
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

  if (searchParams.get("startTimestamp") || searchParams.get("endTimestamp")) {
    filters.dateRange = {
      start: new Date(parseInt(searchParams.get("startTimestamp"), 10)),
      end: new Date(parseInt(searchParams.get("endTimestamp"), 10)),
    };
  }

  return (
    <Container pageContext="admin">
      <div className="flex justify-between items-center">
        <H3>Quản lý đặt lịch</H3>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <Await
          resolve={bookingList}
          errorElement={
            <CRUDTable
              isLoading={false}
              isError={true}
              columns={bookingListColumnDefinitions}
              onRetry={() => revalidator.revalidate()}
            />
          }
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
                  options={getBookingStatusOptions()}
                />
                <Filters.DateRangeFilter
                  filterKey="dateRange"
                  label={"Khoảng ngày đặt lịch"}
                />
              </Filters>

              <CRUDTable data={data} columns={bookingListColumnDefinitions}>
                {(row) => {
                  return (
                    <div className="flex justify-center">
                      <Link to={`/staff/booking/${row.id}`}>
                        <Button
                          variant="outline"
                          className="flex-1 cursor-pointer"
                        >
                          <EyeIcon />
                        </Button>
                      </Link>
                    </div>
                  );
                }}
              </CRUDTable>

              <AdminPagination
                pagination={{
                  totalPages: 10,
                  itemsPerPage: 50,
                  totalItems: 1000,
                }}
              />
            </>
          )}
        </Await>
      </Suspense>
    </Container>
  );
}

BookingList.displayName = "BookingList";
BookingList.loader = loader;

export default BookingList;
