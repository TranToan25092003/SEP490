import { Link, useLoaderData, useRevalidator, Await } from "react-router-dom";
import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Clock, EyeIcon } from "lucide-react";
import CRUDTable from "@/components/global/CRUDTable";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Suspense } from "react";
import { getAllBookings } from "@/api/bookings";
import StatusBadge from "@/components/global/StatusBadge";
import { Button } from "@/components/ui/button";
import { translateBookingStatus } from "@/utils/enumsTranslator";
import { memo } from "react";

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

function loader() {
  return {
    bookingList: getAllBookings()
  };
}

const LoadingSkeleton = memo(() => {
  return <CRUDTable isLoading={true} columns={bookingListColumnDefinitions} />;
});

const BookingList = () => {
  const { bookingList } = useLoaderData();
  const revalidator = useRevalidator();

  return (
    <Container pageContext="admin">
      <div className="flex justify-between items-center">
        <H3>Quản lý đặt lịch</H3>
      </div>

      <Suspense
        fallback={<LoadingSkeleton />}
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
            <CRUDTable
              data={data}
              columns={bookingListColumnDefinitions}
            >
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
          )}
        </Await>
      </Suspense>

      <AdminPagination
        pagination={{
          totalPages: 10,
          itemsPerPage: 50,
          totalItems: 1000,
        }}
      />
    </Container>
  );
}

BookingList.displayName = "BookingList";
BookingList.loader = loader;

export default BookingList;
