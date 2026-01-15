import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const CustomersPagination = ({
  page,
  setPage,
  data,
}: {
  page: number;
  setPage: (page: number) => void;
  data: {
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}) => {
  return (
    <div className="flex justify-center py-6">
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
              aria-disabled={page === 1}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {[...Array(data.pagination.totalPages)].map((_, i) => {
            const pageNumber = i + 1;
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < data.pagination.totalPages) setPage(page + 1);
              }}
              aria-disabled={page === data.pagination.totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
