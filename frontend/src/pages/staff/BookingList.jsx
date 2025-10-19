import { cva } from "class-variance-authority";
import { CheckCircle2, Clock3, XCircle, ShieldCheck } from "lucide-react";
import CRUDTable from "@/components/global/CRUDTable";
import Container from "@/components/global/Container";
import { createColumnHelper } from "@tanstack/react-table";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
  {
    variants: {
      status: {
        Pending: "bg-amber-100 text-amber-700",
        Confirmed: "bg-emerald-100 text-emerald-700",
        Cancelled: "bg-rose-100 text-rose-700",
        Warranty: "bg-indigo-100 text-indigo-700",
        Default: "bg-slate-100 text-slate-700",
      },
    },
    defaultVariants: {
      status: "Default",
    },
  },
);

const statusIcons = {
  Pending: Clock3,
  Confirmed: CheckCircle2,
  Cancelled: XCircle,
  Warranty: ShieldCheck,
  Default: Clock3,
};

const statusLabels = {
  Pending: "Chờ xử lý",
  Confirmed: "Đã xác nhận",
  Cancelled: "Đã hủy",
  Warranty: "Bảo hành",
  Default: "Không xác định",
};

const StatusBadge = ({ status }) => {
  const Icon = statusIcons[status] ?? statusIcons.Default;
  const label = statusLabels[status] ?? statusLabels.Default;

  return (
    <span className={statusBadgeVariants({ status })}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const helper = createColumnHelper();

const posts = [
  {
    id: 1,
    customerName: "Nguyen Van A",
    date: "2024-10-01",
    status: "Pending",
  },
  {
    id: 2,
    customerName: "Tran Thi B",
    date: "2024-10-02",
    status: "Confirmed",
  }
]

const columnDefs = [
  helper.accessor("id", {
    header: "ID",
    cell: info => info.getValue(),
  }),
  helper.accessor("customerName", {
    header: "Họ tên khách hàng",
    cell: info => info.getValue(),
  }),
  helper.accessor("date", {
    header: "Ngày đặt",
    cell: info => info.getValue(),
  }),
  helper.accessor("status", {
    header: "Loại lệnh",
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
]

const BookingList = () => {
  return (
    <Container className="space-y-3 mt-4">
      <h1 className="font-bold text-3xl">Quản lý lệnh</h1>

      <CRUDTable
        data={posts}
        columns={columnDefs}
        getRowId={(row) => row.id}
      >
        {(row) => (
          <div className="flex">
            <Button variant="outline" className="flex-1">
              <EyeIcon />
            </Button>
          </div>
        )}
      </CRUDTable>

      <AdminPagination
        pagination={{
          totalPages: 10,
          itemsPerPage: 50,
          totalItems: 1000
        }}
      />
    </Container>
  );
};

BookingList.displayName = "BookingList";
export default BookingList;
