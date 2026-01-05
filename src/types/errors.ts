/**
 * Unified error handling types for LLM provider interactions
 */

/**
 * Standard error response structure from providers
 */
export interface ProviderErrorResponse {
  code?: string | number;
  message?: string;
  type?: string;
}

/**
 * Extended error interface for API errors
 * Combines standard Error with provider-specific response data
 */
export interface ProviderApiError extends Error {
  /**
   * HTTP response data (if available)
   */
  response?: {
    status?: number;
    data?: {
      error?: ProviderErrorResponse | string;
    };
  };

  /**
   * Direct error object from provider
   */
  error?: ProviderErrorResponse | string;
}

/**
 * Type guard for ProviderApiError
 */
export function isProviderApiError(error: unknown): error is ProviderApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as ProviderApiError).response !== undefined
  );
}

/**
 * Type guard for ProviderErrorResponse
 */
export function isProviderErrorResponse(error: unknown): error is ProviderErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    ("code" in error || "message" in error || "type" in error)
  );
}
