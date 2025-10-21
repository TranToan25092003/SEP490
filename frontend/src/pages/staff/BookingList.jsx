import CRUDTable from "@/components/global/CRUDTable";
import Container from "@/components/global/Container";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { H3 } from "@/components/ui/headings";

const stringToHue = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const getStatusColors = (status) => {
  const hue = stringToHue(status || "");
  return {
    background: `hsl(${hue}, 80%, 92%)`,
    foreground: `hsl(${hue}, 45%, 32%)`,
  };
};

const StatusBadge = ({ status, colorKey }) => {
  const { background, foreground } = getStatusColors(colorKey ?? "");

  return (
    <p
      className={
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
      }
      style={{ backgroundColor: background, color: foreground }}
    >
      {status}
    </p>
  );
};

const posts = [
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

const columnDefs = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "customerName",
    header: "Họ tên khách hàng",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "date",
    header: "Ngày đặt",
    cell: (info) => info.getValue(),
  },
  {
    id: "status",
    header: "Loại lệnh",
    cell: (info) => {
      const services = info.row.original.serviceTypes;
      const badges = services.map((service, index) => (
        <StatusBadge key={index} status={service} colorKey={service} />
      ));

      return <div className="flex flex-wrap gap-2">{badges}</div>;
    },
  },
];

const BookingList = () => {
  return (
    <Container pageContext="admin">
      <div className="flex justify-between items-center">
        <H3>Quản lý lệnh</H3>
        <Link to={"/staff/booking/add"}>
          <Button>
            <Plus />
            Thêm lệnh mới
          </Button>
        </Link>
      </div>

      <CRUDTable data={posts} columns={columnDefs} getRowId={(row) => row.id}>
        {(row) => (
          <div className="flex justify-center">
            <Link to={`/staff/booking/${row.id}`}>
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
    </Container>
  );
};

BookingList.displayName = "BookingList";
export default BookingList;
