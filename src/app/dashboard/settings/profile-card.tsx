"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, User, Check, AlertCircle } from "lucide-react";

import { Card } from "@/components/admin/ui";
import { uploadImage } from "@/app/actions/upload-image";
import { updateProfile, saveAvatar } from "@/app/actions/admin-settings";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileCard({
  name: initialName,
  username: initialUsername,
  email: initialEmail,
  avatarUrl,
}: {
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [avatar, setAvatar] = useState(avatarUrl);

  const [saving, startSaving] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function submit() {
    setErr(null);
    setOk(null);
    startSaving(async () => {
      const res = await updateProfile({ name, username, email });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(res.message ?? "Saved.");
      router.refresh();
    });
  }

  async function onPickAvatar(file: File) {
    setErr(null);
    setOk(null);
    setUploading(true);
    try {
      // MUST RULE — every uploaded image goes through the WebP pipeline.
      // uploadImage runs optimizeUploadedFile + persists to Supabase
      // Storage and returns the public URL.
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "avatars");
      const up = await uploadImage(fd);
      if (!up.ok) {
        setErr(up.error);
        return;
      }
      const saved = await saveAvatar(up.url);
      if (!saved.ok) {
        setErr(saved.error);
        return;
      }
      setAvatar(up.url);
      setOk("Avatar updated.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-sm font-bold text-fg">Profile</h2>
        <p className="text-xs text-fg-muted">Your name, contact details and avatar.</p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Your avatar"
                className="h-24 w-24 rounded-2xl border border-border object-cover"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl border border-border bg-brand-blue-tint text-2xl font-bold text-brand-blue">
                {initials(name)}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-60"
          >
            <Camera className="h-3.5 w-3.5" /> Change
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickAvatar(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
                <User className="h-3.5 w-3.5" /> Full name
              </span>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Username</span>
              <input
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Email</span>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          {err && (
            <p className="flex items-center gap-1.5 text-sm text-brand-red-dark">
              <AlertCircle className="h-4 w-4 shrink-0" /> {err}
            </p>
          )}
          {ok && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-700">
              <Check className="h-4 w-4 shrink-0" /> {ok}
            </p>
          )}

          <div className="flex justify-end">
            <button type="button" onClick={submit} disabled={saving} className={primaryBtn}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
