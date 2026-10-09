export enum UserRole {
  REQUESTER = 'requester',
  AGENT = 'agent',
  SUPERVISOR = 'supervisor',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum RequestStatus {
  OPEN = 'open',
  IN_ANALYSIS = 'in_analysis',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CommentVisibility {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}
