"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosts, SITES, type Post } from "@/lib/supabase";
import { PlusCircle, FileText, Globe, LogOut, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { deletePost, savePost } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const SITE_COLORS: Record<string, string> = {
  "civismo-digital": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "impulso-sinaloa": "bg-orange-100 text-orange-700 border-orange-200",
  "brilloalsur":     "bg-yellow-100 text-yellow-700 border-yellow-200",
  "yumbalam":        "bg-green-100  text-green-700  border-green-200",
};

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSite, setActiveSite] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPosts(activeSite === "all" ? undefined : activeSite);
      setPosts(data);
    } catch { setPosts([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeSite]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await deletePost(id);
    load();
  };

  const toggleStatus = async (post: Post) => {
    await savePost({ id: post.id, status: post.status === "published" ? "draft" : "published" });
    load();
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  };

  const filtered = posts;
  const stats = SITES.map(s => ({ ...s, count: posts.filter(p => p.site === s.id).length }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <h1 className="font-bold text-gray-900 text-lg">Blog Admin</h1>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500 text-sm">MWX</span>
        <div className="ml-auto flex gap-3">
          <Link href="/posts/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <PlusCircle className="w-4 h-4" /> Nuevo artículo
          </Link>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Site cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSite(activeSite === s.id ? "all" : s.id)}
              className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                activeSite === s.id ? "ring-2 ring-blue-400 border-blue-200" : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SITE_COLORS[s.id] ?? "bg-gray-100 text-gray-600"}`}>
                  {s.count}
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm">{s.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.url}</p>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">
            {activeSite === "all" ? "Todos los artículos" : SITES.find(s => s.id === activeSite)?.label}
            <span className="text-gray-400 font-normal ml-2 text-sm">({filtered.length})</span>
          </h2>
          {activeSite !== "all" && (
            <Link href={`/posts/new?site=${activeSite}`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors">
              <PlusCircle className="w-4 h-4" /> Nuevo en {SITES.find(s => s.id === activeSite)?.label}
            </Link>
          )}
        </div>

        {/* Posts table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Sin artículos todavía</p>
              <Link href="/posts/new" className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-semibold">
                + Crear el primero
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Artículo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Sitio</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {post.cover_image && (
                          <img src={post.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">{post.title || "(Sin título)"}</p>
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${SITE_COLORS[post.site] ?? "bg-gray-100 text-gray-600"}`}>
                        {SITES.find(s => s.id === post.site)?.label ?? post.site}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-500">{post.category || "—"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        post.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {post.status === "published" ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-xs text-gray-400">
                      {formatDistanceToNow(new Date(post.updated_at), { locale: es, addSuffix: true })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link href={`/posts/${post.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => toggleStatus(post)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          {post.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
