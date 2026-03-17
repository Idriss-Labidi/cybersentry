import type { AxiosError } from 'axios';

type ApiErrorPayload = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

function getFieldMessage(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return undefined;
}

export function getApiErrorMessage(error: unknown, fields: string[], fallback: string) {
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const data = axiosError.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  for (const field of fields) {
    const fieldMessage = getFieldMessage(data[field]);
    if (fieldMessage) {
      return fieldMessage;
    }
  }

  return fallback;
}
