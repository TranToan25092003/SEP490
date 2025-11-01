import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  useSearchParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

/**
 * @typedef {object} PaginationInfo
 * @property {number} currentPage - Current active page number (1-indexed)
 * @property {number} totalPages - Total number of pages available
 * @property {number} [itemsPerPage=10] - Number of items displayed per page
 * @property {number} [totalItems] - Total number of items in the dataset
 */

/**
 * AdminPagination Component
 *
 * A pagination component with Vietnamese text display showing current page info
 * and navigation controls for admin interfaces.
 *
 * @param {object} props - Component props
 * @param {PaginationInfo} props.pagination - Pagination information object
 *
 * @example
 * <AdminPagination
 *   pagination={{
 *     currentPage: 1,
 *     totalPages: 5,
 *     itemsPerPage: 10,
 *     totalItems: 50
 *   }}
 * />
 */
export function AdminPagination({
  pagination = {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0,
  }
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    currentPage = searchParams.get("page")
      ? parseInt(searchParams.get("page"), 10) || 1
      : 1,
    totalPages,
    itemsPerPage,
    totalItems,
  } = pagination;


  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    const url = `${location.pathname}?${params.toString()}`;
    navigate(url);
  };

  return <PaginationControl
    pagination={{
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems,
    }}
    onPageChange={handlePageChange}
  />;
}

export function PaginationControl({
  pagination = {
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    totalItems: 0,
  },
  onPageChange,
}) {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
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
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-foreground">
        Hiện thị {startItem}-{endItem} từ {totalDisplayItems} dữ liệu
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem disabled={currentPage <= 1}>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
            />
          </PaginationItem>

          {[...Array(totalPages)].map((_, i) => {
            const pageNumber = i + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
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
