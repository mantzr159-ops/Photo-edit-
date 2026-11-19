import type { Asset, Folder, ProjectDoc, ProjectSummary, ShareVisibility, TemplateDef } from "@/lib/design/types";

export type ProjectListFilter = {
  view?: "all" | "recent" | "starred" | "trash";
  folderId?: string | null;
  search?: string;
  limit?: number;
};

export type UserProfile = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl?: string | null;
};

export type StorageUsage = { usedBytes: number; quotaBytes: number };

export type ShareInfo = { visibility: ShareVisibility; token: string | null };

/**
 * Data access abstraction. The UI only ever talks to this interface, so the
 * app runs identically against IndexedDB (local mode) or Supabase (cloud mode).
 */
export interface DataRepository {
  readonly mode: "local" | "cloud";

  getProfile(): Promise<UserProfile>;
  updateProfile(patch: Partial<Pick<UserProfile, "displayName" | "avatarUrl">>): Promise<UserProfile>;

  listProjects(filter?: ProjectListFilter): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<{ doc: ProjectDoc; summary: ProjectSummary } | null>;
  createProject(doc: ProjectDoc, opts?: { folderId?: string | null }): Promise<ProjectSummary>;
  /** Persist the full document. Throws `ConflictError` when the stored revision is newer. */
  saveProject(doc: ProjectDoc, thumbnail?: string | null): Promise<{ revision: number; updatedAt: string }>;
  updateProjectMeta(id: string, patch: Partial<Pick<ProjectSummary, "name" | "starred" | "trashed" | "folderId">>): Promise<void>;
  duplicateProject(id: string): Promise<ProjectSummary>;
  deleteProjectForever(id: string): Promise<void>;
  emptyTrash(): Promise<void>;

  listFolders(): Promise<Folder[]>;
  createFolder(name: string): Promise<Folder>;
  renameFolder(id: string, name: string): Promise<void>;
  deleteFolder(id: string): Promise<void>;

  listAssets(opts?: { search?: string; folder?: string | null }): Promise<Asset[]>;
  uploadAsset(file: Blob, meta: { name: string; width?: number; height?: number; source?: Asset["source"]; folder?: string | null }): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;
  /** Turn a `local-asset:` / `sb-asset:` reference into a loadable URL. */
  resolveAssetSrc(src: string): Promise<string>;
  getStorageUsage(): Promise<StorageUsage>;

  listUserTemplates(): Promise<TemplateDef[]>;
  saveTemplate(t: TemplateDef): Promise<TemplateDef>;
  deleteTemplate(id: string): Promise<void>;
  listFavoriteTemplateIds(): Promise<string[]>;
  setTemplateFavorite(templateId: string, favorite: boolean): Promise<void>;

  getShare(projectId: string): Promise<ShareInfo>;
  setShare(projectId: string, visibility: ShareVisibility): Promise<ShareInfo>;
}

export class ConflictError extends Error {
  constructor(public remoteRevision: number) {
    super("This project was changed elsewhere.");
  }
}

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
