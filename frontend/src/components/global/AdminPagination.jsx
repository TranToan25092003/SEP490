import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

/**
 * AdminPagination Component
 *
 * A pagination component with Vietnamese text display showing current page info
 * and navigation controls for admin interfaces.
 *
 * @param {Object} props - Component props
 * @param {Object} props.pagination - Pagination configuration object
 * @param {number} props.pagination.currentPage - Current active page number (1-indexed)
 * @param {number} props.pagination.totalPages - Total number of pages available
 * @param {number} [props.pagination.itemsPerPage=10] - Number of items displayed per page
 * @param {number} [props.pagination.totalItems] - Total number of items in the dataset
 * @param {function} [props.onPageChange] - Callback function called when page changes
 *
 * @example
 * <AdminPagination
 *   pagination={{
 *     currentPage: 1,
 *     totalPages: 5,
 *     itemsPerPage: 10,
 *     totalItems: 50
 *   }}
 *   onPageChange={(page) => console.log('Page changed to:', page)}
 * />
 */
export function AdminPagination({ pagination, onPageChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    currentPage = searchParams.get("page")
      ? parseInt(searchParams.get("page")) || 1
      : 1,
    totalPages,
    itemsPerPage = 10,
    totalItems,
  } = pagination;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(
    currentPage * itemsPerPage,
    totalItems || totalPages * itemsPerPage
  );
  const totalDisplayItems = totalItems || totalPages * itemsPerPage;

  const handlePageChange = (page) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      const params = new URLSearchParams(searchParams);
      params.set("page", page);
      const url = `${location.pathname}?${params.toString()}`;
      navigate(url);
    }
  };

  const firstPageUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage - 1);
    return `${location.pathname}?${params.toString()}`;
  };

  const lastPageUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage + 1);
    return `${location.pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Hiện thị {startItem}-{endItem} từ {totalDisplayItems} dữ liệu
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem disabled={currentPage <= 1}>
            <PaginationPrevious
              href={firstPageUrl()}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, i) => {
            const pageNumber = i + 1;
            const params = new URLSearchParams(searchParams);
            params.set("page", pageNumber);
            const url = `${location.pathname}?${params.toString()}`;

            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href={url}
                  isActive={currentPage === pageNumber}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem disabled={currentPage >= totalPages}>
            <PaginationNext
              href={lastPageUrl()}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
