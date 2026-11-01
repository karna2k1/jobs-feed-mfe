/** Axios-compatible client injected by the shell (carries auth + token refresh). */
export interface HttpClient {
  get<T = unknown>(url: string, config?: { params?: Record<string, unknown> }): Promise<{ data: T }>;
  patch<T = unknown>(url: string, body?: unknown): Promise<{ data: T }>;
}

export type MatchStatus = 'NEW' | 'SAVED' | 'IGNORED';

export interface Match {
  id: number;
  jobId: number;
  source: string | null;
  company: string;
  title: string;
  location: string | null;
  remote: boolean;
  url: string;
  finalScore: number;
  keywordScore: number;
  embeddingScore: number | null;
  llmScore: number | null;
  reasons: string[];
  matchedSkills: string[];
  skillGaps: string[];
  status: MatchStatus;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
