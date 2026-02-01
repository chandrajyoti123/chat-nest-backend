// src/common/response.handler.ts

export interface SuccessResponse<T> {
  status: string;
  message: string;
  data?: T;
}




export function successMessage<T>(
  message: string,
  data?: T,
): SuccessResponse<T> {
  return {
    status: 'success',
    message,
    data,
  };
}
