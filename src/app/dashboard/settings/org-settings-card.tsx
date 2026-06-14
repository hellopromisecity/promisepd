"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ImageUp,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

import { Card } from "@/components/admin/ui";
import { uploadImage } from "@/app/actions/upload-image";
import { saveOrgSettings } from "@/app/actions/admin-settings";

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3 py-2.5 text-sm outline-none focus:border-brand-blue/50";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-brand)] transition-colors hover:bg-brand-blue-dark disabled:opacity-60";

export function OrgSettingsCard({
  siteName: initialSiteName,
  logoUrl: initialLogoUrl,
}: {
  siteName: string;
  logoUrl: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [siteName, setSiteName] = useState(initialSiteName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);

  const [saving, startSaving] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function submit() {
    setErr(null);
    setOk(null);
    if (!siteName.trim()) {
      setErr("Site name is required.");
      return;
    }
    startSaving(async () => {
      const res = await saveOrgSettings({ siteName, logoUrl });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setOk(res.message ?? "Saved.");
      router.refresh();
    });
  }

  async function onPickLogo(file: File) {
    setErr(null);
    setOk(null);
    setUploading(true);
    try {
      // MUST RULE — the logo also goes through the WebP pipeline.
      const fd = new FormData();
      fd.append("image", file);
      fd.append("folder", "branding");
      const up = await uploadImage(fd);
      if (!up.ok) {
        setErr(up.error);
        return;
      }
      setLogoUrl(up.url);
      setOk("Logo uploaded — remember to save.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-blue-tint text-brand-blue">
          <Building2 className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-fg">Organisation</h2>
          <p className="text-xs text-fg-muted">Site name and logo. Admins only.</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block max-w-md">
          <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Site name</span>
          <input
            className={inputCls}
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Promise Property Development Ltd."
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-fg-muted">Logo</span>
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-bg-soft">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="h-full w-full object-contain" />
              ) : (
                <ImageUp className="h-6 w-6 text-fg-faint" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-bg px-3 py-2 text-xs font-semibold text-fg transition-colors hover:border-brand-blue/40 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageUp className="h-3.5 w-3.5" />
              )}
              {logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickLogo(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

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
          <button type="button" onClick={submit} disabled={saving || uploading} className={primaryBtn}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save organisation settings
          </button>
        </div>
      </div>
    </Card>
  );
}
