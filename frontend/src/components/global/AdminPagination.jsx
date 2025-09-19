import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
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

export function PaginationAdmin({ pagination }) {
  const { currentPage, totalPages } = pagination;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const firstPageUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage - 1);

    const url = `${location.pathname}?${params.toString()}`;

    return url;
  };

  const lastPageUrl = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage + 1);

    const url = `${location.pathname}?${params.toString()}`;

    return url;
  };

  return (
    <Pagination>
      <PaginationContent>
        {currentPage <= 1 ? (
          ""
        ) : (
          <PaginationItem>
            <PaginationPrevious href={firstPageUrl()} />
          </PaginationItem>
        )}
        {[...Array(totalPages)].map((_, i) => {
          const params = new URLSearchParams(searchParams);
          params.set("page", i + 1);

          const url = `${location.pathname}?${params.toString()}`;

          return (
            <PaginationItem>
              <PaginationLink
                href={url}
                isActive={currentPage == i + 1 ? true : false}
              >
                {i + 1}{" "}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        {currentPage >= totalPages ? (
          ""
        ) : (
          <PaginationItem>
            <PaginationNext href={lastPageUrl()} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
