export interface DriveFolder {
  uid: string;
  name: string;
}
export interface DriveListing {
  folders: DriveFolder[];
  images: DriveImage[];
  videos: DriveImage[];
}
export interface DriveImage {
  uid: string;
  name: string;
  url: string;
}
export interface Source {
  subject?: string;
  id: string;
  url: string;
  name: string;
  width: number;
  height: number;
  productId?: string;
  instanceId?: string;
  productName?: string;
  productUrl?: string;
  sku?: string;
}
export interface Product {
  productUrl?: string;
  id: string;
  name: string;
  sku: string;
  photos: Source[];
}
export interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
}
export interface VideoModel {
  id: string;
  name: string;
  provider?: string;
  description?: string;
}
export interface ModelSchema {
  model: string;
  schema: {
    type?: string;
    required?: string[];
    properties: Record<
      string,
      {
        type?: string;
        enum?: unknown[];
        default?: unknown;
        minimum?: number;
        maximum?: number;
        description?: string;
      }
    >;
  };
}
export interface Quote {
  promptTemplate?: string;
  loop?: boolean;
  ticket?: string;
  kind?: "image" | "video";
  output?: {duration:number;resolution:string;aspectRatio:string};
  id: string;
  owner: string;
  subject: string;
  source?: Source;
  template: Template;
  model: string;
  params: Record<string, unknown>;
  total: number;
  createdAt: number;
  expiresAt: number;
  lines: { label: string; credits: number }[];
}
export type JobStatus =
  | "QUEUED"
  | "SUBMITTING"
  | "GENERATING"
  | "PERSISTING"
  | "REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "IMPORTING"
  | "SAVED"
  | "ATTACHING"
  | "ATTACHED"
  | "STOPPED"
  | "UNKNOWN_SUBMISSION"
  | "RECONCILIATION_REQUIRED"
  | "ORPHANED_SPEND"
  | "IMPORT_UNKNOWN";
export interface Job {
  welcome?: boolean;
  archivedAt?: number;
  detachedAt?: number;
  retainedIn?: "picsart-drive" | "legacy-private";
  hybridTest?: boolean;
  storageBackend?: "legacy-private";
  previewUrl?: string;
  id: string;
  owner: string;
  sessionId: string;
  subject: string;
  quote: Quote;
  maximum: number;
  approvalKey: string;
  approvedAt: number;
  status: JobStatus;
  upstream?: { workflow: string; id: string };
  outputUrl?: string;
  localFile?: string;
  charged: number | null;
  chargeBasis: "pending" | "quoted" | "unknown";
  reservation: number;
  reviewedAt?: number;
  reviewedBy?: string;
  reviewReason?: string;
  mediaId?: string;
  progress?: number;
  nextPollAt: number;
  attempts: number;
  importUrl?: string;
  events: { at: number; message: string }[];
}
export interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  csrf: string;
  instanceId?: string;
  wordpressUserId?: string;
  owner: string;
}
export interface State {
  welcomeOffer?: {status:'funding-unavailable';videos:2;durationSeconds:10;windowDays:30;model:string;canClaim:false;canGenerate:false};
  pendingAccountRecovery?:number;
  capabilities?: Record<string,{available:boolean;reason?:string;pricing?:string;creditCost?:number}>;
  notificationPreferences?: import("./notification-preferences").NotificationPreferences;
  savedTemplates?: import("./saved-template").SavedVideoTemplate[];
  quotes?: Quote[];
  auth: {
    authenticated: boolean;
    name?: string;
    subject?: string;
    canGenerate: boolean;
    requiresReconnect?: boolean;
    requiresSessionReset?: boolean;
    loginError?: string;
  };
  wordpress: { configured: boolean; connected: boolean };
  credits: { balance: number; total: number; nextResetDate?: string; packageUsage?: {used:number;allowance:number} } | null;
  creditError?: string;
  generationError?: string;
  reserved: number;
  jobs: Job[];
  sources: Source[];
  templates: Template[];
  csrf: string;
  setup: string[];
}
