import axiosInstance from '../utils/axios-instance';


export interface EmailSecurityRequest {
  domain_name: string;
  dkim_selectors?: string[];
}

export interface SPFRequest {
  domain_name: string;
}

export interface DKIMRequest {
  domain_name: string;
  selectors?: string[];
}

export interface DMARCRequest {
  domain_name: string;
}


export interface SPFMechanism {
  qualifier: string;
  mechanism: string;
  value: string | null;
}

export interface SPFParsed {
  raw: string;
  mechanisms: SPFMechanism[];
  dns_lookup_count: number;
  all_qualifier?: string;
}

export interface SPFResult {
  record: string | null;
  parsed: SPFParsed | Record<string, never>;
  status: 'OK' | 'MISSING' | 'WARNING' | 'ERROR';
  issues: string[];
  recommendations: Recommendation[];
}

export interface DKIMEntry {
  selector: string;
  domain: string;
  raw: string;
  tags: Record<string, string>;
  key_type: string;
  revoked: boolean;
  estimated_key_bits?: number;
}

export interface DKIMResult {
  records: DKIMEntry[];
  selectors_checked: string[];
  status: 'OK' | 'MISSING' | 'WARNING' | 'ERROR';
  issues: string[];
  recommendations: Recommendation[];
}

export interface DMARCParsed {
  raw: string;
  tags: Record<string, string>;
  tag_descriptions: Record<string, string>;
  policy: string;
  subdomain_policy?: string;
  percentage?: number;
  has_aggregate_reporting: boolean;
  has_forensic_reporting: boolean;
  dkim_alignment: string;
  spf_alignment: string;
}

export interface DMARCResult {
  record: string | null;
  parsed: DMARCParsed | Record<string, never>;
  status: 'OK' | 'MISSING' | 'WARNING' | 'ERROR';
  issues: string[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  issue: string;
  recommendation: string;
}

export interface EmailSecurityResponse {
  domain: string;
  score: number;
  grade: string;
  spf: SPFResult;
  dkim: DKIMResult;
  dmarc: DMARCResult;
  recommendations: Recommendation[];
}


export const emailSecurityAnalysis = (data: EmailSecurityRequest) =>
  axiosInstance.post<EmailSecurityResponse>('/email-tools/analyze/', data);

export const spfAnalysis = (data: SPFRequest) =>
  axiosInstance.post<SPFResult>('/email-tools/spf/', data);

export const dkimAnalysis = (data: DKIMRequest) =>
  axiosInstance.post<DKIMResult>('/email-tools/dkim/', data);

export const dmarcAnalysis = (data: DMARCRequest) =>
  axiosInstance.post<DMARCResult>('/email-tools/dmarc/', data);
