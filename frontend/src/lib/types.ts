export type UserRole = 'requester' | 'agent' | 'supervisor';
export type Priority = 'low' | 'medium' | 'high';
export type RequestStatus = 'open' | 'in_analysis' | 'approved' | 'rejected';
export type CommentVisibility = 'internal' | 'external';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface Area {
  id: string;
  name: string;
}

export interface RequestSummary {
  id: string;
  title: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  area: Area;
  requester: { id: string; name: string };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HistoryEntry {
  id: string;
  status: RequestStatus;
  comment: string;
  createdAt: string;
  author: PublicUser;
}

export interface CommentEntry {
  id: string;
  content: string;
  visibility: CommentVisibility;
  createdAt: string;
  author: PublicUser;
}

export interface RequestDetail {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  area: Area;
  requester: PublicUser;
  resolvedBy: PublicUser | null;
  history: HistoryEntry[];
  comments: CommentEntry[];
}

export interface DashboardSummary {
  total: number;
  open: number;
  inAnalysis: number;
  approved: number;
  rejected: number;
  byPriority: { low: number; medium: number; high: number };
}
