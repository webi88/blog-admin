import { createClient } from "@supabase/supabase-js";

const sbUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const sbAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const SUPABASE_READY = sbUrl.startsWith("https://") && !sbUrl.includes("placeholder") && sbAnon.length > 20;

export const supabase = createClient(
  SUPABASE_READY ? sbUrl : "https://placeholder.supabase.co",
  SUPABASE_READY ? sbAnon : "placeholder",
);

export const isOfflineMode = !SUPABASE_READY;

const LS_KEY = "blog_admin_posts";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function lsGetAll(): Post[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function lsSave(posts: Post[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(posts));
}

export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  site: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  images: string[];
  category: string;
  author: string;
  read_time: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export const SITES = [
  { id: "civismo-digital",  label: "Civismo Digital",   color: "bg-cyan-500",   url: "civismodigital.mx" },
  { id: "impulso-sinaloa",  label: "Impulso Sinaloa",   color: "bg-orange-500", url: "impulsosinaloa.com" },
  { id: "brilloalsur",      label: "Brillo al Sur",     color: "bg-yellow-500", url: "brilloalsur.com" },
  { id: "yumbalam",         label: "Frente Yum Balam",  color: "bg-green-600",  url: "frenteproyumbalam.org" },
  { id: "voces-mahahual",   label: "Voces de Mahahual", color: "bg-sky-500",    url: "voces-mahahual.mwx.app" },
] as const;

export async function getPosts(site?: string): Promise<Post[]> {
  if (!SUPABASE_READY) {
    const all = lsGetAll();
    return site ? all.filter(p => p.site === site) : all;
  }
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (site) q = q.eq("site", site);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Post[];
}

export async function getPost(id: string): Promise<Post> {
  if (!SUPABASE_READY) {
    const p = lsGetAll().find(p => p.id === id);
    if (!p) throw new Error("Post no encontrado");
    return p;
  }
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);
  return data as Post;
}

export async function savePost(post: Partial<Post> & { id?: string }): Promise<Post> {
  const now = new Date().toISOString();
  if (!SUPABASE_READY) {
    const all = lsGetAll();
    if (post.id) {
      const idx = all.findIndex(p => p.id === post.id);
      const updated = { ...all[idx], ...post, updated_at: now } as Post;
      all[idx] = updated;
      lsSave(all);
      return updated;
    }
    const created: Post = { ...(post as Post), id: uid(), created_at: now, updated_at: now };
    lsSave([created, ...all]);
    return created;
  }
  if (post.id) {
    const { data, error } = await supabase
      .from("posts").update({ ...post, updated_at: now }).eq("id", post.id).select().single();
    if (error) throw new Error(error.message);
    return data as Post;
  }
  const { data, error } = await supabase
    .from("posts").insert({ ...post, created_at: now, updated_at: now }).select().single();
  if (error) throw new Error(error.message);
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  if (!SUPABASE_READY) {
    lsSave(lsGetAll().filter(p => p.id !== id));
    return;
  }
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uploadImage(file: File, site: string): Promise<string> {
  if (!SUPABASE_READY) throw new Error("offline");
  const ext  = file.name.split(".").pop();
  const name = `${site}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(name, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("post-images").getPublicUrl(name);
  return data.publicUrl;
}
