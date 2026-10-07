// Typed client for the GovSOP AI backend.
import type {
  DirectoryResponse,
  DocumentDetail,
  ExtractionResponse,
  DocumentSummary,
  SearchResponse,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
    throw new ApiError(0, `Cannot reach the API at ${API_BASE}. Is it running?`);
  }

  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      if (body && typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // Non-JSON error body; keep statusText.
    }
    throw new ApiError(resp.status, detail);
  }

  return (await resp.json()) as T;
}

export function getHealth(): Promise<{ status: string }> {
  return request("/health");
}

export function getDocuments(department?: string): Promise<DirectoryResponse> {
  const query = department
    ? `?department=${encodeURIComponent(department)}`
    : "";
  return request(`/documents${query}`);
}

export function getDocument(docId: string): Promise<DocumentDetail> {
  return request(`/documents/${encodeURIComponent(docId)}`);
}

export function search(q: string, limit = 10): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return request(`/search?${params.toString()}`);
}

export function getExtraction(docId?: string): Promise<ExtractionResponse> {
  const path = docId
    ? `/extraction/${encodeURIComponent(docId)}`
    : "/extraction";
  return request(path);
}

export function uploadDocument(file: File): Promise<DocumentSummary> {
  const form = new FormData();
  form.append("file", file);
  return request("/documents", { method: "POST", body: form });
}
