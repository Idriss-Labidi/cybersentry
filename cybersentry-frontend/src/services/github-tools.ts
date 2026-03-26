import axiosInstance from '../utils/axios-instance';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GitHubHealthCheckRequest {
  url: string;
  levels: string[];
  use_cache?: boolean;
  github_token?: string;
}

export interface RepositoryHistoryParams {
  url?: string;
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
/* ------------------------------------------------------------------ */

export const checkRepositoryHealth = <T = unknown>(data: GitHubHealthCheckRequest) =>
  axiosInstance.post<T>('/github-health/check_repository/', data);

export const getRepositoryHistory = <T = unknown>({ url }: RepositoryHistoryParams) =>
  axiosInstance.get<T>('/github-health/repository_history/', { params: { url } });

export const getRepositoryCheckResult = <T = unknown>(resultId: number) =>
  axiosInstance.get<T>('/github-health/get_check_result/', {
    params: { result_id: resultId },
  });

export const deleteRepositoryCheckResult = (id: number) =>
  axiosInstance.delete(`/github-health/check-results/${id}/`);

