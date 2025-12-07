import Container from "@/components/global/Container";
import { H3 } from "@/components/ui/headings";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import {
  useLoaderData,
  useParams,
  Await,
  Link,
  useRevalidator,
  useNavigate,
} from "react-router-dom";
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
import { getBookingById } from "@/api/bookings";
import {
  approveQuote,
  getQuotesForServiceOrder,
  rejectQuote,
} from "@/api/quotes";
import { toast } from "sonner";
import CountdownTimer from "@/components/global/CountdownTimer";
import background from "@/assets/cool-motorcycle-indoors.png";
import { ArrowLeft } from "lucide-react";

function loader({ params, request }) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page"), 10) || 1;
  const limit = 10;

  return {
    bookingPromise: getBookingById(params.id).then(async (booking) => {
      if (booking.serviceOrderId) {
        const quotesData = await getQuotesForServiceOrder(
          booking.serviceOrderId,
          page,
          limit
        );
        return { booking, quotesData };
      }
      return { booking, quotesData: null };
    }),
  };
}

const QUOTE_PENDING_MINUTES = 30;

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
    header: "Đếm ngược",
    accessorKey: "pendingCountdown",
    cell: ({ row }) => {
      const quote = row.original;
      
      // Chỉ hiển thị đếm ngược khi quote ở trạng thái pending
      if (quote.status !== "pending") {
        return <span className="text-muted-foreground">-</span>;
      }

      // giả sử backend trả về createdAt, ta đếm ngược 30 phút từ thời điểm tạo
      const createdAt = quote.createdAt;
      if (!createdAt) {
        return <span className="text-muted-foreground">-</span>;
      }

      const targetTime =
        new Date(createdAt).getTime() + QUOTE_PENDING_MINUTES * 60 * 1000;

      return <CountdownTimer targetTime={targetTime} label="Còn lại" compact />;
    },
  },
  {
    header: "Ngày tạo",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      return formatDateTime(row.original.createdAt);
    },
  },
  {
    header: "Lý do từ chối",
    accessorKey: "rejectedReason",
    cell: ({ row }) => {
      const quote = row.original;
      if (quote.status === "rejected" && quote.rejectedReason) {
        const maxLength = 50; // Giới hạn hiển thị 50 ký tự
        const reason = quote.rejectedReason;
        const truncatedReason = reason.length > maxLength 
          ? reason.substring(0, maxLength) + "..." 
          : reason;
        
        return (
          <span 
            className="text-sm text-muted-foreground italic block max-w-xs truncate"
            title={reason} // Tooltip hiển thị toàn bộ lý do
          >
            {truncatedReason}
          </span>
        );
      }
      return <span className="text-muted-foreground">-</span>;
    },
  },
];

const BookingQuotesContent = ({ data }) => {
  const { quotesData, booking } = data;
  const revalidator = useRevalidator();
  const bookingServiceOrderId = booking?.serviceOrderId
    ? booking.serviceOrderId.toString()
    : null;
  const serviceOrderContext = bookingServiceOrderId
    ? {
        id: bookingServiceOrderId,
        customerName: booking.customer?.customerName,
        licensePlate: booking.vehicle?.licensePlate,
        orderNumber: `#${bookingServiceOrderId.slice(-6)}`,
      }
    : null;

  const handleViewDetail = async (quote) => {
    try {
      // Revalidate data first to ensure we have the latest quote status
      await revalidator.revalidate();
      
      // Re-fetch quotes to get latest data
      const latestQuotesData = await getQuotesForServiceOrder(
        bookingServiceOrderId,
        1,
        10
      );
      
      // Find the quote in the latest data to ensure it still exists and get latest status
      const latestQuote = latestQuotesData?.quotes?.find(q => q.id === quote.id);
      
      if (!latestQuote) {
        toast.error("Báo giá không còn tồn tại. Đang tải lại danh sách...");
        revalidator.revalidate();
        return;
      }

      // Only allow accept/reject for pending quotes
      const canAcceptReject = latestQuote.status === "pending";

      // Use the latest quote data
      const result = await NiceModal.show(ViewQuoteDetailModal, {
        quoteId: latestQuote.id,
        allowAcceptReject: canAcceptReject,
        serviceOrder: serviceOrderContext,
      });

      if (result.action === "accept") {
        const confirmPromise = approveQuote(latestQuote.id);
        await toast
          .promise(confirmPromise, {
            loading: "Đang phê duyệt báo giá...",
            success: "Phê duyệt báo giá thành công!",
            error: "Phê duyệt báo giá thất bại.",
          })
          .unwrap();
        // Revalidate after approve
        revalidator.revalidate();
      } else if (result.action === "reject") {
        const rejectPromise = rejectQuote(latestQuote.id, result.reason);

        await toast
          .promise(rejectPromise, {
            loading: "Đang từ chối báo giá...",
            success: "Từ chối báo giá thành công!",
            error: "Từ chối báo giá thất bại.",
          })
          .unwrap();
        // Revalidate after reject to get updated quotes list
        revalidator.revalidate();
      }
    } catch (error) {
      // Only log if it's not a modal close error
      if (error?.message && !error.message.includes("Modal closed") && !error.message.includes("rejected")) {
        console.error("Error in handleViewDetail:", error);
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
        // Revalidate on error to ensure data is fresh
        revalidator.revalidate();
      }
    }
  };

  if (!quotesData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Lệnh sửa chữa chưa được tạo. Báo giá sẽ có sẵn sau khi xe được kiểm tra.
      </div>
    );
  }

  if (!quotesData.quotes || quotesData.quotes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Chưa có báo giá nào cho lệnh sửa chữa này.
      </div>
    );
  }

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

const BookingQuotes = () => {
  const { bookingPromise } = useLoaderData();
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div
      className="w-full min-h-screen flex justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${background})`,
        backgroundPosition: "65% 35%",
      }}
    >
      <Container className="my-8 w-full max-w-7xl">
        <Card className="p-0">
          <div className="p-4 md:p-6">
            <button
              type="button"
              onClick={() => navigate("/booking-tracking")}
              className="inline-flex items-center gap-2 text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 transition-colors border border-gray-200 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">
                Quay lại danh sách tiến độ sửa xe
              </span>
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <H3 className="text-gray-900 m-0">CHI TIẾT ĐƠN</H3>
              <Tabs value="quotes">
                <TabsList>
                  <TabsTrigger value="progress">
                    <Link to={`/booking/${id}`}>Tiến độ</Link>
                  </TabsTrigger>
                  <TabsTrigger value="quotes">
                    <Link to={`/booking/${id}/quotes`}>Báo giá</Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <hr className="border-t border-gray-200 my-0" />
          <div className="px-4 md:px-6 py-4 md:py-6">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-8 w-8" />
                </div>
              }
            >
              <Await
                resolve={bookingPromise}
                errorElement={
                  <div className="text-center py-8 text-destructive">
                    Không thể tải thông tin báo giá
                  </div>
                }
              >
                {(data) => <BookingQuotesContent data={data} />}
              </Await>
            </Suspense>
          </div>
        </Card>
      </Container>
    </div>
  );
};

BookingQuotes.loader = loader;

export default BookingQuotes;
