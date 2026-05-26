"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, ImagePlus, X, Plus, Globe, AlertTriangle,
} from "lucide-react";
import { getPost, savePost, uploadImage, SITES, isOfflineMode, type Post } from "@/lib/supabase";
import slugify from "slugify";

const TiptapEditor = dynamicImport(() => import("@/components/TiptapEditor"), { ssr: false,
  loading: () => <div className="h-[450px] bg-gray-50 rounded-xl border border-gray-200 animate-pulse" />,
});

const CATEGORIES: Record<string, string[]> = {
  "civismo-digital":  ["Análisis", "Observatorio", "Propuesta", "Comunicado", "Documental"],
  "impulso-sinaloa":  ["Noticias", "Proyectos", "Comunidad", "Gobierno", "Cultura"],
  "brilloalsur":      ["Comunicado", "Economía", "Agenda", "Propuesta", "Turismo", "Infraestructura"],
  "yumbalam":         ["Comunicado", "Propuesta", "Medio Ambiente", "Comunidad"],
};

const empty = (): Partial<Post> => ({
  site: "civismo-digital", title: "", slug: "", excerpt: "",
  content: "", cover_image: "", images: [], category: "",
  author: "Redacción", read_time: "5 min", status: "draft",
});

export default function PostEditor() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const searchParams = useSearchParams();
  const isNew       = id === "new";

  const [post, setPost]       = useState<Partial<Post>>(empty());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverRef  = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) {
      const site = searchParams.get("site") ?? "civismo-digital";
      setPost({ ...empty(), site });
      return;
    }
    getPost(id).then(setPost).catch(() => router.replace("/")).finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof Post, v: unknown) => {
    setPost(p => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const autoSlug = (title: string) =>
    slugify(title, { lower: true, strict: true, locale: "es" });

  const handleSave = async (status?: "draft" | "published") => {
    setSaving(true);
    try {
      const payload = { ...post, status: status ?? post.status };
      if (!payload.slug && payload.title) payload.slug = autoSlug(payload.title);
      const saved_ = await savePost(isNew ? payload : { ...payload, id });
      if (isNew) router.replace(`/posts/${saved_.id}`);
      setSaved(true);
    } catch (e) { alert("Error al guardar: " + String(e)); }
    setSaving(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverUploading(true);
    try { set("cover_image", await uploadImage(file, post.site!)); }
    catch { alert("Error al subir portada"); }
    setCoverUploading(false); e.target.value = "";
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = await Promise.all(files.map(f => uploadImage(f, post.site!)));
    set("images", [...(post.images ?? []), ...urls]);
    e.target.value = "";
  };

  const removeImage = (url: string) =>
    set("images", (post.images ?? []).filter(u => u !== url));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
    </div>
  );

  const cats = CATEGORIES[post.site ?? "civismo-digital"] ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline mode banner */}
      {isOfflineMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Modo sin conexión</strong> — Los artículos se guardan en este navegador. Configura Supabase para persistir en la nube.
          </p>
        </div>
      )}
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link href="/" className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 truncate max-w-xs">
            {post.title || "Nuevo artículo"}
          </span>
          {saved && <span className="text-xs text-green-500 font-medium">✓ Guardado</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Site selector */}
          <select
            value={post.site}
            onChange={e => { set("site", e.target.value); }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {SITES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {/* Status toggle */}
          <button
            onClick={() => handleSave(post.status === "published" ? "draft" : "published")}
            disabled={saving}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              post.status === "published"
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {post.status === "published" ? <><Eye className="w-3.5 h-3.5" />Publicado</> : <><EyeOff className="w-3.5 h-3.5" />Borrador</>}
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <input
              type="text"
              value={post.title ?? ""}
              onChange={e => {
                set("title", e.target.value);
                if (isNew || !post.slug) set("slug", autoSlug(e.target.value));
              }}
              placeholder="Título del artículo…"
              className="w-full text-2xl font-bold text-gray-900 placeholder:text-gray-300 border-none outline-none bg-transparent"
            />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <Globe className="w-3.5 h-3.5 text-gray-300" />
              <span className="text-gray-400 text-xs">Slug:</span>
              <input
                type="text"
                value={post.slug ?? ""}
                onChange={e => set("slug", e.target.value)}
                placeholder="url-del-articulo"
                className="flex-1 text-xs text-blue-600 border-none outline-none bg-transparent font-mono"
              />
            </div>
          </div>

          {/* Image-in-editor tip */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-start gap-3">
            <ImagePlus className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Imágenes posicionadas:</strong> coloca el cursor en el texto donde quieras la imagen,
              luego usa el botón <span className="font-mono bg-blue-100 px-1 rounded">📷</span> del editor.
              También puedes <strong>arrastrar</strong> imágenes o <strong>pegar</strong> capturas (Cmd+V) directamente.
            </p>
          </div>

          {/* Editor */}
          <TiptapEditor
            content={post.content ?? ""}
            onChange={v => set("content", v)}
            site={post.site ?? "civismo-digital"}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Cover image */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700 text-sm">Portada</h3>
            </div>
            {post.cover_image ? (
              <div className="relative group">
                <img src={post.cover_image} alt="" className="w-full h-44 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => coverRef.current?.click()}
                    className="bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >Cambiar</button>
                  <button
                    onClick={() => set("cover_image", "")}
                    className="bg-white rounded-lg p-1.5 text-gray-700 hover:bg-gray-50"
                  ><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => coverRef.current?.click()}
                disabled={coverUploading}
                className="w-full h-36 flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-gray-400 hover:bg-gray-50 transition-colors"
              >
                {coverUploading
                  ? <Loader2 className="w-6 h-6 animate-spin" />
                  : <><ImagePlus className="w-8 h-8" /><span className="text-xs font-medium">Subir portada</span></>
                }
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700 text-sm">Metadatos</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Categoría</label>
                <select
                  value={post.category ?? ""}
                  onChange={e => set("category", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">— Sin categoría —</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Autor</label>
                <input
                  type="text" value={post.author ?? ""}
                  onChange={e => set("author", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tiempo de lectura</label>
                <input
                  type="text" value={post.read_time ?? ""}
                  onChange={e => set("read_time", e.target.value)}
                  placeholder="5 min"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Resumen / Excerpt</label>
                <textarea
                  rows={3} value={post.excerpt ?? ""}
                  onChange={e => set("excerpt", e.target.value)}
                  placeholder="Breve descripción del artículo…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Extra images */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-700 text-sm">Galería del artículo</h3>
                <p className="text-xs text-gray-400 mt-0.5">Arrástralas al editor para posicionarlas</p>
              </div>
              <button
                onClick={() => imagesRef.current?.click()}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
            </div>
            <div className="p-4">
              {(post.images ?? []).length === 0 ? (
                <button
                  onClick={() => imagesRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl h-20 flex items-center justify-center text-gray-300 hover:border-gray-300 hover:text-gray-400 transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(post.images ?? []).map(url => (
                    <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-50">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => imagesRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
              <input ref={imagesRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesUpload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
