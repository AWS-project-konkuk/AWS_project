import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '../components/ui/pagination';

const visiblePageCount = 10;

export function BoardPagination({
  page,
  totalPages,
  pageSearch,
}: {
  page: number;
  totalPages: number;
  pageSearch: (target: number) => URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const count = Math.min(visiblePageCount, totalPages);
  const start = Math.max(1, Math.min(page - Math.floor(count / 2), totalPages - count + 1));
  const pages = Array.from({ length: count }, (_, index) => start + index);
  const pageLink = (target: number) => ({ search: '?' + pageSearch(target).toString() });

  return (
    <Pagination className="mt-6" aria-label="게시판 페이지">
      <PaginationContent>
        <PaginationItem>
          <PaginationLink to={pageLink(1)} disabled={page === 1} aria-label="첫 페이지">
            <ChevronFirst size={16} aria-hidden />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            to={pageLink(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="이전"
          >
            <ChevronLeft size={16} aria-hidden />
          </PaginationLink>
        </PaginationItem>
        {pages.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink
              to={pageLink(number)}
              isActive={number === page}
              aria-label={number + '페이지'}
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationLink
            to={pageLink(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="다음"
          >
            <ChevronRight size={16} aria-hidden />
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            to={pageLink(totalPages)}
            disabled={page === totalPages}
            aria-label="마지막 페이지"
          >
            <ChevronLast size={16} aria-hidden />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
