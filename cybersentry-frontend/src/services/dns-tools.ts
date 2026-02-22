import axiosInstance from '../utils/axios-instance';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

// DNS Lookup
export interface DnsLookupRequest {
  domain_name: string;
  record_types: string[];
}

export interface DnsLookupResponse {
  domain: string;
  result: Record<string, string[] | string>;
}

// DNS Propagation
export interface DnsPropagationRequest {
  domain_name: string;
  record_types: string[];
  regions?: string[];
  timeout?: number;
  lifetime?: number;
  retries?: number;
  ip_version: 'IPV4' | 'IPV6';
}

export interface ResolverResult {
  status: 'ok' | 'no_answer' | 'timeout' | 'error';
  records?: string[];
  latency_ms?: number;
  attempts?: number;
  error?: string;
}

// { [resolverIp]: { [recordType]: ResolverResult } }
export type RegionResults = Record<string, Record<string, ResolverResult>>;

export interface DnsPropagationResponse {
  domain: string;
  record_types: string[];
  regions: string[] | string;
  timeout: number;
  lifetime: number;
  retries: number;
  propagation: Record<string, RegionResults>;
}

// DNS Health Check
export interface DnsHealthCheckRequest {
  domain_name: string;
}

export interface HealthCheckResult {
  status: string;
  severity?: string;
  impact?: string;
  ttl?: number;
  count?: number;
  records?: string[];
  policy?: string;
}

export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  recommendation: string;
}

export interface DnsHealthCheckResponse {
  domain: string;
  score: number;
  grade: string;
  checks: Record<string, HealthCheckResult>;
  recommendations: Recommendation[];
}

// DNS Server
export interface DnsServer {
  id: number;
  name: string;
  ip_address1: string;
  ip_address2: string;
  location: string;
  type: 'IPV4' | 'IPV6';
  country: string;
  region: string;
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
/* ------------------------------------------------------------------ */

export const dnsLookup = (data: DnsLookupRequest) =>
  axiosInstance.post<DnsLookupResponse>('/dns-tools/lookup/', data);

export const dnsPropagation = (data: DnsPropagationRequest) =>
  axiosInstance.post<DnsPropagationResponse>('/dns-tools/propagation/', data);

export const dnsHealthCheck = (data: DnsHealthCheckRequest) =>
  axiosInstance.post<DnsHealthCheckResponse>('/dns-tools/health/', data);

export const getDnsServers = () =>
  axiosInstance.get<DnsServer[]>('/dns-tools/dns-servers/');
