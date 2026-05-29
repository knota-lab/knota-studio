export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalItems: number;
  page: number;
  pageSize: number;
}

/** Default page size for all list endpoints. */
// biome-ignore lint/style/useNamingConvention: global constant
export const DEFAULT_PAGE_SIZE = 30;

/**
 * Common pagination query parameters shared by all list endpoints.
 * All fields optional — `page` defaults to 1, `pageSize` defaults to {@link DEFAULT_PAGE_SIZE}.
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
