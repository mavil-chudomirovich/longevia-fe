export interface FieldError {
  field: string;
  message: string;
}

/** ASP.NET Core ProblemDetails with the Longevia business error code. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: FieldError[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}
