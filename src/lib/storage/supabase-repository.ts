"use client";
/**
 * Cloud mode repository backed by Supabase (Postgres + Storage).
 * All access is governed by Row Level Security (see supabase/migrations).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Asset, Folder, Page, ProjectDoc, ProjectSummary, ShareVisibility, TemplateDef } from "@/lib/design/types";
import { uuid } from "@/lib/utils/id";
import { ConflictError, type DataRepository, type ProjectListFilter, type ShareInfo, type UserProfile } from "./types";

const CLOUD_QUOTA = 1024 * 1024 * 1024; // 1 GB advisory per-user quota
const SIGNED_URL_TTL = 60 * 60; // 1h

type ProjectRow = {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string | null;
  folder_id: string | null;
  starred: boolean;
  trashed: boolean;
  thumbnail: string | null;
  revision: number;
  visibility: ShareVisibility;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

const SUMMARY_COLS = "id,name,width,height,category,folder_id,starred,trashed,thumbnail,revision,visibility,created_at,updated_at";

function rowToSummary(r: ProjectRow, pageCount = 0): ProjectSummary {
  return {
    id: r.id,
    name: r.name,
    width: r.width,
    height: r.height,
    thumbnail: r.thumbnail,
    starred: r.starred,
    trashed: r.trashed,
    folderId: r.folder_id,
    category: r.category ?? undefined,
    pageCount,
    updatedAt: r.updated_at,
    createdAt: r.created_at,
    visibility: r.visibility,
  };
}

function randomToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class SupabaseRepository implements DataRepository {
  readonly mode = "cloud" as const;
  private signed = new Map<string, { url: string; exp: number }>();

  constructor(private sb: SupabaseClient, private userId: string, private email: string | null) {}

  private check<T>(res: { data: T; error: { message: string; code?: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }

  async getProfile(): Promise<UserProfile> {
    const { data } = await this.sb.from("profiles").select("display_name,avatar_url").eq("id", this.userId).maybeSingle();
    return {
      id: this.userId,
      email: this.email,
      displayName: data?.display_name || this.email?.split("@")[0] || "Designer",
      avatarUrl: data?.avatar_url ?? null,
    };
  }

  async updateProfile(patch: Partial<Pick<UserProfile, "displayName" | "avatarUrl">>) {
    this.check(
      await this.sb.from("profiles").upsert({
        id: this.userId,
        ...(patch.displayName !== undefined ? { display_name: patch.displayName.slice(0, 80) } : {}),
        ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {}),
      }),
    );
    return this.getProfile();
  }

  async listProjects(filter: ProjectListFilter = {}) {
    let q = this.sb.from("projects").select(`${SUMMARY_COLS},project_pages(count)`).eq("owner_id", this.userId);
    const view = filter.view ?? "all";
    q = q.eq("trashed", view === "trash");
    if (view === "starred") q = q.eq("starred", true);
    if (filter.folderId !== undefined) q = filter.folderId === null ? q.is("folder_id", null) : q.eq("folder_id", filter.folderId);
    if (filter.search) q = q.ilike("name", `%${filter.search.replace(/[%_]/g, "")}%`);
    q = q.order("updated_at", { ascending: false }).limit(filter.limit ?? 200);
    const rows = this.check(await q) as unknown as (ProjectRow & { project_pages: { count: number }[] })[];
    return rows.map((r) => rowToSummary(r, r.project_pages?.[0]?.count ?? 0));
  }

  async getProject(id: string) {
    const row = this.check(await this.sb.from("projects").select(SUMMARY_COLS).eq("id", id).maybeSingle()) as ProjectRow | null;
    if (!row) return null;
    const pages = this.check(
      await this.sb.from("project_pages").select("id,name,background,elements,position").eq("project_id", id).order("position"),
    ) as (Page & { position: number })[];
    const doc: ProjectDoc = {
      id: row.id,
      name: row.name,
      width: row.width,
      height: row.height,
      category: row.category ?? undefined,
      pages: pages.map(({ id, name, background, elements }) => ({ id, name: name ?? undefined, background, elements })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      revision: row.revision,
    };
    return { doc, summary: rowToSummary(row, pages.length) };
  }

  async createProject(doc: ProjectDoc, opts?: { folderId?: string | null }) {
    const row = this.check(
      await this.sb
        .from("projects")
        .insert({ id: doc.id, owner_id: this.userId, name: doc.name, width: doc.width, height: doc.height, category: doc.category ?? null, folder_id: opts?.folderId ?? null })
        .select(SUMMARY_COLS)
        .single(),
    ) as ProjectRow;
    // write pages via the atomic RPC (revision 0 → 1)
    await this.saveProject({ ...doc, revision: 0 });
    return rowToSummary({ ...row, revision: 1 }, doc.pages.length);
  }

  async saveProject(doc: ProjectDoc, thumbnail?: string | null) {
    const { data, error } = await this.sb.rpc("save_project", {
      p_project_id: doc.id,
      p_name: doc.name,
      p_width: doc.width,
      p_height: doc.height,
      p_category: doc.category ?? null,
      p_pages: doc.pages,
      p_expected_revision: doc.revision,
      p_thumbnail: thumbnail ?? null,
    });
    if (error) {
      const m = /revision_conflict:(\d+)/.exec(error.message);
      if (m) throw new ConflictError(Number(m[1]));
      throw new Error(error.message);
    }
    const row = (Array.isArray(data) ? data[0] : data) as { revision: number; updated_at: string };
    return { revision: row.revision, updatedAt: row.updated_at };
  }

  async updateProjectMeta(id: string, patch: Partial<Pick<ProjectSummary, "name" | "starred" | "trashed" | "folderId">>) {
    const upd: Record<string, unknown> = {};
    if (patch.name !== undefined) upd.name = patch.name.slice(0, 200);
    if (patch.starred !== undefined) upd.starred = patch.starred;
    if (patch.trashed !== undefined) {
      upd.trashed = patch.trashed;
      upd.trashed_at = patch.trashed ? new Date().toISOString() : null;
    }
    if (patch.folderId !== undefined) upd.folder_id = patch.folderId;
    this.check(await this.sb.from("projects").update(upd).eq("id", id));
  }

  async duplicateProject(id: string) {
    const found = await this.getProject(id);
    if (!found) throw new Error("Project not found");
    const now = new Date().toISOString();
    const doc: ProjectDoc = { ...structuredClone(found.doc), id: uuid(), name: `${found.doc.name} (copy)`, createdAt: now, updatedAt: now, revision: 0 };
    const summary = await this.createProject(doc, { folderId: found.summary.folderId });
    if (found.summary.thumbnail) {
      await this.sb.from("projects").update({ thumbnail: found.summary.thumbnail }).eq("id", doc.id);
      summary.thumbnail = found.summary.thumbnail;
    }
    return summary;
  }

  async deleteProjectForever(id: string) {
    this.check(await this.sb.from("projects").delete().eq("id", id));
  }

  async emptyTrash() {
    this.check(await this.sb.from("projects").delete().eq("owner_id", this.userId).eq("trashed", true));
  }

  async listFolders(): Promise<Folder[]> {
    const rows = this.check(await this.sb.from("folders").select("id,name,created_at").order("name")) as { id: string; name: string; created_at: string }[];
    return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
  }

  async createFolder(name: string) {
    const r = this.check(await this.sb.from("folders").insert({ name: name.slice(0, 80), owner_id: this.userId }).select("id,name,created_at").single()) as {
      id: string;
      name: string;
      created_at: string;
    };
    return { id: r.id, name: r.name, createdAt: r.created_at };
  }

  async renameFolder(id: string, name: string) {
    this.check(await this.sb.from("folders").update({ name: name.slice(0, 80) }).eq("id", id));
  }

  async deleteFolder(id: string) {
    this.check(await this.sb.from("folders").delete().eq("id", id));
  }

  async listAssets(opts?: { search?: string; folder?: string | null }) {
    let q = this.sb.from("assets").select("*").order("created_at", { ascending: false }).limit(500);
    if (opts?.search) q = q.ilike("name", `%${opts.search.replace(/[%_]/g, "")}%`);
    if (opts?.folder !== undefined) q = opts.folder === null ? q.is("folder", null) : q.eq("folder", opts.folder);
    const rows = this.check(await q) as {
      id: string; name: string; storage_path: string; mime: string; size: number; width: number | null; height: number | null; folder: string | null; created_at: string; source: Asset["source"];
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      src: `sb-asset:${r.storage_path}`,
      mime: r.mime,
      size: r.size,
      width: r.width ?? undefined,
      height: r.height ?? undefined,
      folder: r.folder,
      createdAt: r.created_at,
      source: r.source,
    }));
  }

  async uploadAsset(file: Blob, meta: { name: string; width?: number; height?: number; source?: Asset["source"]; folder?: string | null }) {
    const id = uuid();
    const ext = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" } as Record<string, string>)[file.type] ?? "bin";
    const path = `${this.userId}/${id}.${ext}`;
    const up = await this.sb.storage.from("assets").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (up.error) throw new Error(up.error.message);
    const row = {
      id,
      owner_id: this.userId,
      name: meta.name.slice(0, 200),
      storage_path: path,
      mime: file.type,
      size: file.size,
      width: meta.width ?? null,
      height: meta.height ?? null,
      folder: meta.folder ?? null,
      source: meta.source ?? "upload",
    };
    const ins = await this.sb.from("assets").insert(row).select("created_at").single();
    if (ins.error) {
      await this.sb.storage.from("assets").remove([path]);
      throw new Error(ins.error.message);
    }
    return {
      id, name: row.name, src: `sb-asset:${path}`, mime: row.mime, size: row.size, width: meta.width, height: meta.height,
      folder: row.folder, createdAt: ins.data.created_at as string, source: row.source,
    } satisfies Asset;
  }

  async deleteAsset(id: string) {
    const row = this.check(await this.sb.from("assets").select("storage_path").eq("id", id).maybeSingle()) as { storage_path: string } | null;
    if (row) await this.sb.storage.from("assets").remove([row.storage_path]);
    this.check(await this.sb.from("assets").delete().eq("id", id));
  }

  async resolveAssetSrc(src: string) {
    if (!src.startsWith("sb-asset:")) return src;
    const path = src.slice("sb-asset:".length);
    const hit = this.signed.get(path);
    if (hit && hit.exp > Date.now() + 60_000) return hit.url;
    const { data, error } = await this.sb.storage.from("assets").createSignedUrl(path, SIGNED_URL_TTL);
    if (error || !data) throw new Error(error?.message ?? "Unable to sign asset URL");
    this.signed.set(path, { url: data.signedUrl, exp: Date.now() + SIGNED_URL_TTL * 1000 });
    return data.signedUrl;
  }

  async getStorageUsage() {
    const rows = this.check(await this.sb.from("assets").select("size")) as { size: number }[];
    return { usedBytes: rows.reduce((s, r) => s + Number(r.size), 0), quotaBytes: CLOUD_QUOTA };
  }

  async listUserTemplates(): Promise<TemplateDef[]> {
    const rows = this.check(await this.sb.from("templates").select("*").eq("owner_id", this.userId).order("created_at", { ascending: false })) as {
      id: string; name: string; category: TemplateDef["category"]; width: number; height: number; tags: string[]; pages: Page[]; created_at: string;
    }[];
    return rows.map((r) => ({ id: r.id, name: r.name, category: r.category, width: r.width, height: r.height, tags: r.tags, pages: r.pages, custom: true, createdAt: r.created_at }));
  }

  async saveTemplate(t: TemplateDef) {
    const id = /^[0-9a-f-]{36}$/.test(t.id) ? t.id : uuid();
    this.check(
      await this.sb.from("templates").upsert({ id, owner_id: this.userId, name: t.name, category: t.category, width: t.width, height: t.height, tags: t.tags, pages: t.pages }),
    );
    return { ...t, id, custom: true };
  }

  async deleteTemplate(id: string) {
    this.check(await this.sb.from("templates").delete().eq("id", id));
  }

  async listFavoriteTemplateIds() {
    const rows = this.check(await this.sb.from("template_favorites").select("template_id")) as { template_id: string }[];
    return rows.map((r) => r.template_id);
  }

  async setTemplateFavorite(templateId: string, favorite: boolean) {
    if (favorite) this.check(await this.sb.from("template_favorites").upsert({ user_id: this.userId, template_id: templateId }));
    else this.check(await this.sb.from("template_favorites").delete().eq("template_id", templateId).eq("user_id", this.userId));
  }

  async getShare(projectId: string): Promise<ShareInfo> {
    const r = this.check(await this.sb.from("projects").select("visibility,share_token").eq("id", projectId).single()) as {
      visibility: ShareVisibility;
      share_token: string | null;
    };
    return { visibility: r.visibility, token: r.share_token };
  }

  async setShare(projectId: string, visibility: ShareVisibility): Promise<ShareInfo> {
    const cur = await this.getShare(projectId);
    const token = visibility === "private" ? cur.token : cur.token ?? randomToken();
    this.check(await this.sb.from("projects").update({ visibility, share_token: token }).eq("id", projectId));
    return { visibility, token };
  }
}
