"use client";
/**
 * Local mode repository — persists everything to IndexedDB in this browser.
 * Used automatically when Supabase is not configured, so the app is fully
 * functional (and testable) without a backend.
 */
import type { Asset, Folder, ProjectDoc, ProjectSummary, TemplateDef } from "@/lib/design/types";
import { uuid } from "@/lib/utils/id";
import { idbAll, idbDelete, idbGet, idbSet } from "./idb";
import { ConflictError, type DataRepository, type ProjectListFilter, type ShareInfo, type UserProfile } from "./types";

const LOCAL_QUOTA = 500 * 1024 * 1024; // advisory quota shown in the UI

const objectUrls = new Map<string, string>();

function summaryFromDoc(doc: ProjectDoc, prev?: Partial<ProjectSummary>): ProjectSummary {
  return {
    id: doc.id,
    name: doc.name,
    width: doc.width,
    height: doc.height,
    thumbnail: prev?.thumbnail ?? null,
    starred: prev?.starred ?? false,
    trashed: prev?.trashed ?? false,
    folderId: prev?.folderId ?? null,
    category: doc.category,
    pageCount: doc.pages.length,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    visibility: "private",
  };
}

export class LocalRepository implements DataRepository {
  readonly mode = "local" as const;

  async getProfile(): Promise<UserProfile> {
    const p = await idbGet<UserProfile>("meta", "profile");
    return p ?? { id: "local-user", email: null, displayName: "Guest designer", avatarUrl: null };
  }

  async updateProfile(patch: Partial<Pick<UserProfile, "displayName" | "avatarUrl">>) {
    const next = { ...(await this.getProfile()), ...patch };
    await idbSet("meta", "profile", next);
    return next;
  }

  async listProjects(filter: ProjectListFilter = {}) {
    let list = await idbAll<ProjectSummary>("projects");
    const view = filter.view ?? "all";
    list = list.filter((p) => (view === "trash" ? p.trashed : !p.trashed));
    if (view === "starred") list = list.filter((p) => p.starred);
    if (filter.folderId !== undefined) list = list.filter((p) => p.folderId === filter.folderId);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return filter.limit ? list.slice(0, filter.limit) : list;
  }

  async getProject(id: string) {
    const [doc, summary] = await Promise.all([idbGet<ProjectDoc>("docs", id), idbGet<ProjectSummary>("projects", id)]);
    if (!doc || !summary) return null;
    return { doc, summary };
  }

  async createProject(doc: ProjectDoc, opts?: { folderId?: string | null }) {
    const summary = summaryFromDoc(doc, { folderId: opts?.folderId ?? null });
    await idbSet("docs", doc.id, doc);
    await idbSet("projects", doc.id, summary);
    return summary;
  }

  async saveProject(doc: ProjectDoc, thumbnail?: string | null) {
    const prevDoc = await idbGet<ProjectDoc>("docs", doc.id);
    if (prevDoc && prevDoc.revision > doc.revision) throw new ConflictError(prevDoc.revision);
    const prev = await idbGet<ProjectSummary>("projects", doc.id);
    const updatedAt = new Date().toISOString();
    const revision = (prevDoc?.revision ?? doc.revision) + 1;
    const next: ProjectDoc = { ...doc, updatedAt, revision };
    await idbSet("docs", doc.id, next);
    await idbSet("projects", doc.id, { ...summaryFromDoc(next, prev), thumbnail: thumbnail ?? prev?.thumbnail ?? null });
    return { revision, updatedAt };
  }

  async updateProjectMeta(id: string, patch: Partial<Pick<ProjectSummary, "name" | "starred" | "trashed" | "folderId">>) {
    const prev = await idbGet<ProjectSummary>("projects", id);
    if (!prev) return;
    await idbSet("projects", id, { ...prev, ...patch });
    if (patch.name) {
      const doc = await idbGet<ProjectDoc>("docs", id);
      if (doc) await idbSet("docs", id, { ...doc, name: patch.name });
    }
  }

  async duplicateProject(id: string) {
    const found = await this.getProject(id);
    if (!found) throw new Error("Project not found");
    const now = new Date().toISOString();
    const doc: ProjectDoc = { ...structuredClone(found.doc), id: uuid(), name: `${found.doc.name} (copy)`, createdAt: now, updatedAt: now, revision: 0 };
    const summary = { ...summaryFromDoc(doc, { folderId: found.summary.folderId }), thumbnail: found.summary.thumbnail };
    await idbSet("docs", doc.id, doc);
    await idbSet("projects", doc.id, summary);
    return summary;
  }

  async deleteProjectForever(id: string) {
    await idbDelete("docs", id);
    await idbDelete("projects", id);
  }

  async emptyTrash() {
    const trashed = await this.listProjects({ view: "trash" });
    await Promise.all(trashed.map((p) => this.deleteProjectForever(p.id)));
  }

  async listFolders() {
    const f = await idbAll<Folder>("folders");
    return f.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createFolder(name: string) {
    const folder: Folder = { id: uuid(), name: name.slice(0, 80), createdAt: new Date().toISOString() };
    await idbSet("folders", folder.id, folder);
    return folder;
  }

  async renameFolder(id: string, name: string) {
    const f = await idbGet<Folder>("folders", id);
    if (f) await idbSet("folders", id, { ...f, name: name.slice(0, 80) });
  }

  async deleteFolder(id: string) {
    const projects = await idbAll<ProjectSummary>("projects");
    await Promise.all(projects.filter((p) => p.folderId === id).map((p) => idbSet("projects", p.id, { ...p, folderId: null })));
    await idbDelete("folders", id);
  }

  async listAssets(opts?: { search?: string; folder?: string | null }) {
    let list = await idbAll<Asset>("assets");
    if (opts?.search) list = list.filter((a) => a.name.toLowerCase().includes(opts.search!.toLowerCase()));
    if (opts?.folder !== undefined) list = list.filter((a) => (a.folder ?? null) === opts.folder);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async uploadAsset(file: Blob, meta: { name: string; width?: number; height?: number; source?: Asset["source"]; folder?: string | null }) {
    const id = uuid();
    await idbSet("blobs", id, file);
    const asset: Asset = {
      id,
      name: meta.name.slice(0, 120),
      src: `local-asset:${id}`,
      mime: file.type,
      size: file.size,
      width: meta.width,
      height: meta.height,
      folder: meta.folder ?? null,
      createdAt: new Date().toISOString(),
      source: meta.source ?? "upload",
    };
    await idbSet("assets", id, asset);
    return asset;
  }

  async deleteAsset(id: string) {
    await idbDelete("assets", id);
    await idbDelete("blobs", id);
    const url = objectUrls.get(id);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(id);
  }

  async resolveAssetSrc(src: string) {
    if (!src.startsWith("local-asset:")) return src;
    const id = src.slice("local-asset:".length);
    const cached = objectUrls.get(id);
    if (cached) return cached;
    const blob = await idbGet<Blob>("blobs", id);
    if (!blob) throw new Error("Asset missing");
    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);
    return url;
  }

  async getStorageUsage() {
    const assets = await idbAll<Asset>("assets");
    const used = assets.reduce((s, a) => s + a.size, 0);
    let quota = LOCAL_QUOTA;
    try {
      const est = await navigator.storage?.estimate?.();
      if (est?.quota) quota = Math.min(est.quota, LOCAL_QUOTA);
    } catch {
      /* ignore */
    }
    return { usedBytes: used, quotaBytes: quota };
  }

  async listUserTemplates() {
    const t = await idbAll<TemplateDef>("templates");
    return t.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }

  async saveTemplate(t: TemplateDef) {
    const tpl = { ...t, custom: true, createdAt: t.createdAt ?? new Date().toISOString() };
    await idbSet("templates", tpl.id, tpl);
    return tpl;
  }

  async deleteTemplate(id: string) {
    await idbDelete("templates", id);
  }

  async listFavoriteTemplateIds() {
    return (await idbGet<string[]>("meta", "favorites")) ?? [];
  }

  async setTemplateFavorite(templateId: string, favorite: boolean) {
    const cur = new Set(await this.listFavoriteTemplateIds());
    if (favorite) cur.add(templateId);
    else cur.delete(templateId);
    await idbSet("meta", "favorites", [...cur]);
  }

  async getShare(): Promise<ShareInfo> {
    return { visibility: "private", token: null };
  }

  async setShare(): Promise<ShareInfo> {
    throw new Error("Sharing requires cloud mode. Configure Supabase to enable shareable links.");
  }
}
