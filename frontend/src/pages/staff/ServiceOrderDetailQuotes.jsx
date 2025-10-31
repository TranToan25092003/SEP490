import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense } from "react";
import { useLoaderData, useParams, useRevalidator, Await, Link } from "react-router-dom";
import { getQuotesForServiceOrder } from "@/api/quotes";
import { Spinner } from "@/components/ui/spinner";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import CRUDTable from "@/components/global/CRUDTable";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import NiceModal from "@ebay/nice-modal-react";
import ViewQuoteDetailModal from "@/components/staff/service-order-detail/ViewQuoteDetailModal";

function loader({ params, request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page"), 10) || 1;
  const limit = 10;

  return {
    quotesPromise: getQuotesForServiceOrder(params.id, page, limit)
  };
}

const statusBadgeVariant = {
  pending: "secondary",
  approved: "success",
  rejected: "destructive",
};

const statusText = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const quotesTableDefinition = [
  {
    header: "Mã báo giá",
    accessorKey: "id",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {row.original.id.slice(-8)}
      </span>
    ),
  },
  {
    header: "Tổng tiền",
    accessorKey: "grandTotal",
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatPrice(row.original.grandTotal)}
      </span>
    ),
  },
  {
    header: "Trạng thái",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge className="rounded-full" variant={statusBadgeVariant[row.original.status]}>
        {statusText[row.original.status]}
      </Badge>
    ),
  },
  {
    header: "Ngày tạo",
    accessorKey: "createdAt",
    cell: ({ row }) => (
      new Date(row.original.createdAt).toLocaleString("vi-VN")
    ),
  },
];

const ServiceOrderDetailQuotesContent = ({ quotesData }) => {
  const handleViewDetail = async (quote) => {
    try {
      await NiceModal.show(ViewQuoteDetailModal, {
        quoteId: quote.id
      });
    } catch (error) {
      console.log("Modal closed:", error);
    }
  };

  return (
    <div className="space-y-4">
      <CRUDTable
        columns={quotesTableDefinition}
        data={quotesData.quotes}
      >
        {(row) => {
          return (
            <Button onClick={() => handleViewDetail(row)}>
              Xem chi tiết
            </Button>
          )
        }}
      </CRUDTable>

      {quotesData.pagination && quotesData.pagination.totalPages > 0 && (
        <AdminPagination pagination={quotesData.pagination} />
      )}
    </div>
  );
};

const ServiceOrderDetailQuotes = () => {
  const { quotesPromise } = useLoaderData();
  const revalidator = useRevalidator();
  const { id } = useParams();

  return (
    <Container pageContext="admin">
      <BackButton to="/staff/service-order" label="Quay lại trang quản lý lệnh" />
      <div className="flex justify-between">
        <H3>Chi Tiết Lệnh Sửa Chữa - Báo Giá</H3>
        <Tabs value="quotes">
          <TabsList>
            <TabsTrigger value="main">
              <Link to={`/staff/service-order/${id}`}>
                Thông tin chung
              </Link>
            </TabsTrigger>
            <TabsTrigger value="quotes">
              <Link to={`/staff/service-order/${id}/quotes`}>
                Báo giá
              </Link>
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Link to={`/staff/service-order/${id}/progress`}>
                Tiến trình sửa chữa
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Suspense fallback={
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      }>
        <Await
          resolve={quotesPromise}
          errorElement={
            <div className="text-center py-8 text-destructive">
              Không thể tải thông tin báo giá
            </div>
          }
        >
          {(quotesData) => (
            <ServiceOrderDetailQuotesContent
              quotesData={quotesData}
              revalidator={revalidator}
              serviceOrderId={id}
            />
          )}
        </Await>
      </Suspense>
    </Container>
  );
};

ServiceOrderDetailQuotes.loader = loader;

export default ServiceOrderDetailQuotes;
