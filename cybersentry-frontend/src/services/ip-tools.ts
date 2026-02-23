import axiosInstance from '../utils/axios-instance';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

// WHOIS Lookup
export interface WhoisLookupRequest {
  query: string;
}

export interface WhoisLookupResponse {
  query: string;
  result: Record<string, unknown>;
}

// IP Reputation & Geolocation
export interface IpReputationRequest {
  ip_address: string;
}

export interface IpGeolocation {
  continent: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  region_code: string | null;
  city: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

export interface IpNetwork {
  isp: string | null;
  org: string | null;
  as_number: string | null;
  as_name: string | null;
  reverse_dns: string | null;
}

export interface IpReputationResponse {
  ip: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  is_proxy: boolean;
  is_hosting: boolean;
  is_mobile: boolean;
  geolocation: IpGeolocation;
  network: IpNetwork;
}

// Reverse IP
export interface ReverseIpRequest {
  ip_address: string;
}

export interface ReverseIpResponse {
  ip: string;
  hostname: string | null;
  domains_count: number;
  domains: string[];
}

/* ------------------------------------------------------------------ */
/*  API calls                                                          */
/* ------------------------------------------------------------------ */

export const whoisLookup = (data: WhoisLookupRequest) =>
  axiosInstance.post<WhoisLookupResponse>('/ip-tools/whois/', data);

export const ipReputation = (data: IpReputationRequest) =>
  axiosInstance.post<IpReputationResponse>('/ip-tools/reputation/', data);

export const reverseIp = (data: ReverseIpRequest) =>
  axiosInstance.post<ReverseIpResponse>('/ip-tools/reverse/', data);
