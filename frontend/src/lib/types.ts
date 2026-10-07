// Types mirroring the FastAPI backend response schemas.

export type ReviewStatus = "current" | "needs_review" | "outdated_clause";
export type BadgeSeverity = "warning" | "none";

export interface Badge {
  label: string;
  severity: BadgeSeverity;
}

export interface DocumentSummary {
  doc_id: string;
  title: string;
  department: string;
  effective_date: string;
  review_status: ReviewStatus;
  badges: Badge[];
}

export interface DirectoryResponse {
  total: number;
  departments: string[];
  documents: DocumentSummary[];
}

export interface SectionView {
  section_title: string;
  text: string;
  order: number;
}

export interface DocumentDetail {
  doc_id: string;
  title: string;
  department: string;
  effective_date: string;
  review_status: ReviewStatus;
  badges: Badge[];
  sections: SectionView[];
}

export interface Citation {
  doc_id: string;
  title: string;
  section_title: string;
  order: number;
}

export interface SearchResult {
  doc_id: string;
  title: string;
  section_title: string;
  order: number;
  snippet: string;
  score: number;
  citation: Citation;
}

export interface SearchResponse {
  query: string;
  answer: string | null;
  results: SearchResult[];
}

export interface SourceRef {
  doc_id: string;
  title: string;
}

export interface ExtractedItem {
  text: string;
  source: SourceRef;
}

export interface ExtractedDeadline {
  label: string;
  date: string;
  source: SourceRef;
}

export interface ExtractedDepartment {
  department: string;
  sources: SourceRef[];
}

export interface ExtractionResponse {
  action_items: ExtractedItem[];
  deadlines: ExtractedDeadline[];
  responsible_departments: ExtractedDepartment[];
  policy_changes: ExtractedItem[];
}
