import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "https://placeholder.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(url, anon);

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
] as const;

export async function getPosts(site?: string) {
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (site) q = q.eq("site", site);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPost(id: string) {
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Post;
}

export async function savePost(post: Partial<Post> & { id?: string }) {
  const now = new Date().toISOString();
  if (post.id) {
    const { data, error } = await supabase
      .from("posts").update({ ...post, updated_at: now }).eq("id", post.id).select().single();
    if (error) throw error;
    return data as Post;
  }
  const { data, error } = await supabase
    .from("posts").insert({ ...post, created_at: now, updated_at: now }).select().single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadImage(file: File, site: string): Promise<string> {
  const ext  = file.name.split(".").pop();
  const name = `${site}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(name, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("post-images").getPublicUrl(name);
  return data.publicUrl;
}
