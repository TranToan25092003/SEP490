import Container from "@/components/global/Container";
import BackButton from "@/components/global/BackButton";
import { H3 } from "@/components/ui/headings";
import { Suspense } from "react";
import {
  useLoaderData,
  useParams,
  useRevalidator,
  Await,
  Link,
} from "react-router-dom";
import { getQuotesForServiceOrder, approveQuote } from "@/api/quotes";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CRUDTable from "@/components/global/CRUDTable";
import { AdminPagination } from "@/components/global/AdminPagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatPrice } from "@/lib/utils";
import NiceModal from "@ebay/nice-modal-react";
import ViewQuoteDetailModal from "@/components/staff/service-order-detail/ViewQuoteDetailModal";
import {
  getQuoteStatusBadgeVariant,
  translateQuoteStatus,
} from "@/utils/enumsTranslator";
import { getServiceOrderById } from "@/api/serviceOrders";
import { toast } from "sonner";
import background from "@/assets/cool-motorcycle-indoors.png";

async function loader({ params, request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page"), 10) || 1;
  const limit = 10;

  return {
    quotesPromise: getQuotesForServiceOrder(params.id, page, limit),
    serviceOrder: await getServiceOrderById(params.id),
  };
}

const quotesTableDefinition = [
  {
    header: "Mã báo giá",
    accessorKey: "id",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.id.slice(-8)}</span>
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
      <Badge
        className="rounded-full"
        variant={getQuoteStatusBadgeVariant(row.original.status)}
      >
        {translateQuoteStatus(row.original.status)}
      </Badge>
    ),
  },
  {
    header: "Ngày tạo",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      return formatDateTime(row.original.createdAt);
    },
  },
];

const ServiceOrderDetailQuotesContent = ({
  quotesData,
  serviceOrder,
  revalidator,
}) => {
  const allowStaffConfirm = Boolean(serviceOrder?.isWalkIn);
  const handleViewDetail = async (quote) => {
    try {
      const result = await NiceModal.show(ViewQuoteDetailModal, {
        quoteId: quote.id,
        allowStaffConfirm,
        serviceOrder,
      });
      if (result?.action === "staff-confirm") {
        const approveTask = approveQuote(quote.id);
        await toast
          .promise(approveTask, {
            loading: "Đang xác nhận báo giá...",
            success: "Đã xác nhận báo giá cho khách!",
            error: "Không thể xác nhận báo giá",
          })
          .unwrap();
        revalidator.revalidate();
      }
    } catch (error) {
      console.log("Modal closed:", error);
    }
  };

  return (
    <div className="space-y-4">
      <CRUDTable columns={quotesTableDefinition} data={quotesData.quotes}>
        {(row) => {
          return (
            <Button onClick={() => handleViewDetail(row)}>Xem chi tiết</Button>
          );
        }}
      </CRUDTable>

      {quotesData.pagination && quotesData.pagination.totalPages > 0 && (
        <AdminPagination pagination={quotesData.pagination} />
      )}
    </div>
  );
};

const ServiceOrderDetailQuotes = () => {
  const { quotesPromise, serviceOrder } = useLoaderData();
  const revalidator = useRevalidator();
  const { id } = useParams();

  return (
    // <div
    //   className="min-h-screen bg-cover bg-center bg-fixed"
    //   style={{
    //     backgroundImage: `linear-gradient(135deg, rgba(8,8,8,0.82), rgba(8,8,8,0.35)), url(${background})`,
    //   }}
    // >
    <Container pageContext="admin" className="py-8">
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-6 space-y-6">
        <BackButton
          to="/staff/service-order"
          label="Quay lại trang quản lý lệnh"
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              MotorMate Workshop
            </p>
            <H3>Chi Tiết Lệnh Sửa Chữa - Báo Giá</H3>
          </div>
          <Tabs value="quotes">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="main">
                <Link to={`/staff/service-order/${id}`}>Thông tin chung</Link>
              </TabsTrigger>
              <TabsTrigger value="quotes">
                <Link to={`/staff/service-order/${id}/quotes`}>Báo giá</Link>
              </TabsTrigger>
              <TabsTrigger value="progress">
                <Link to={`/staff/service-order/${id}/progress`}>
                  Tiến trình sửa chữa
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-10 w-10 text-primary" />
            </div>
          }
        >
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
                serviceOrder={serviceOrder}
                serviceOrderId={id}
              />
            )}
          </Await>
        </Suspense>
      </div>
    </Container>
    // </div>
  );
};

ServiceOrderDetailQuotes.loader = loader;

export default ServiceOrderDetailQuotes;
