"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      router.replace("/");
    } else {
      setErr("Contraseña incorrecta");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Blog Admin</h1>
          <p className="text-slate-400 text-sm mt-1">MWX · Panel de contenidos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-4">
          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Contraseña de acceso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {err && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{err}</p>}

          <button
            type="submit"
            disabled={loading || !pw}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando…</> : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
