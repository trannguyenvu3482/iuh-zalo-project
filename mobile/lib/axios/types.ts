export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

export interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
