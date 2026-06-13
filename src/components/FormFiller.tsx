"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Upload,
  X,
} from "lucide-react";
import { submitForm } from "@/app/actions/submit-form";
import type { FormDef, FormField } from "@/lib/forms";

// Render offsets applied to LINE fields (not boxed) in both the live
// preview and the PDF, so values shift slightly right and sit just
// ABOVE the dotted line instead of crossing it.
const LEFT_SHIFT = 1.3;
const LIFT = 0.4;
const SIG_FONT = `"Great Vibes","Hind Siliguri",cursive`;

const toBnDigits = (s: string) =>
  s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const onlyDigits = (s: string) => s.replace(/[^0-9০-৯]/g, "");

function todayBn() {
  const d = new Date();
  const s = `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
  return toBnDigits(s);
}

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });

export default function FormFiller({ form }: { form: FormDef }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({}); // ছবি box → dataURL
  const [docs, setDocs] = useState<Record<string, string>>({}); // NID/passport → dataURL
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [pageW, setPageW] = useState(760);
  const firstPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cursive signature font.
    const id = "gv-font";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    const el = firstPageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPageW(el.clientWidth || 760));
    ro.observe(el);
    setPageW(el.clientWidth || 760);
    return () => ro.disconnect();
  }, []);

  const groups = useMemo(() => {
    const m = new Map<string, FormField[]>();
    for (const f of form.fields) {
      if (!m.has(f.group)) m.set(f.group, []);
      m.get(f.group)!.push(f);
    }
    return [...m.entries()];
  }, [form.fields]);

  const set = (key: string, v: string) =>
    setValues((p) => ({ ...p, [key]: v }));

  const applicantName = values["name"] || "";
  const applicantPhone = values["mobile"] || "";
  const applicantEmail = values["email"] || "";
  const showSig = applicantName.trim().length > 0;
  const date = todayBn();

  function sigText(source: string, value?: string) {
    if (source === "fixed") return value || "";
    if (source === "today") return date;
    if (source === "applicantName") return applicantName;
    return "";
  }

  async function handleUpload(
    key: string,
    file: File | null | undefined,
    store: (u: (p: Record<string, string>) => Record<string, string>) => void,
    maxW: number,
  ) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("ফাইল ৫ MB এর কম হতে হবে।");
      setStatus("error");
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
      store((p) => ({ ...p, [key]: cv.toDataURL("image/jpeg", 0.85) }));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // Draw a photo into a box with cover-crop.
  function drawCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const ir = img.naturalWidth / img.naturalHeight;
    const br = w / h;
    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;
    if (ir > br) {
      sw = sh * br;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = sw / br;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  async function handleSubmit() {
    const missing = form.fields.filter(
      (f) => f.required && !(values[f.key] || "").trim(),
    );
    if (missing.length) {
      setStatus("error");
      setErrorMsg(`অনুগ্রহ করে পূরণ করুন: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setStatus("working");
    setErrorMsg("");
    try {
      const { jsPDF } = await import("jspdf");
      if (document.fonts?.ready) await document.fonts.ready;
      await document.fonts.load(`40px "Great Vibes"`).catch(() => {});

      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();

      // Pre-load uploaded photos as <img>.
      const photoImgs: Record<string, HTMLImageElement> = {};
      for (const k of Object.keys(photos)) photoImgs[k] = await loadImg(photos[k]);

      for (let pi = 0; pi < form.pages.length; pi++) {
        const bg = await loadImg(form.pages[pi]);
        const W = bg.naturalWidth || 1785;
        const H = bg.naturalHeight || 2525;
        const cv = document.createElement("canvas");
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext("2d")!;
        ctx.drawImage(bg, 0, 0, W, H);

        // Photos
        for (const ph2 of form.photos ?? []) {
          if (ph2.page !== pi + 1) continue;
          const im = photoImgs[ph2.key];
          if (!im) continue;
          drawCover(
            ctx,
            im,
            (ph2.left / 100) * W,
            (ph2.top / 100) * H,
            (ph2.width / 100) * W,
            (ph2.height / 100) * H,
          );
        }

        ctx.fillStyle = "#111827";
        // Field values
        for (const f of form.fields) {
          if (f.pos.page !== pi + 1) continue;
          const v = (values[f.key] || "").trim();
          if (!v) continue;
          if (f.pos.boxes) {
            const b = f.pos.boxes;
            const fpx = ((b.size ?? 1.5) / 100) * W;
            ctx.font = `${fpx}px "Hind Siliguri","Noto Sans Bengali",sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const cyPx = (b.cy / 100) * H;
            if (b.mode === "date" && b.cells) {
              const d = onlyDigits(v);
              const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)];
              b.cells.forEach((cx, i) => {
                if (parts[i]) ctx.fillText(parts[i], (cx / 100) * W, cyPx);
              });
            } else {
              const chars = onlyDigits(v).split("").slice(0, b.count ?? 20);
              chars.forEach((c, i) => {
                ctx.fillText(c, (((b.firstX ?? 0) + i * (b.pitch ?? 2)) / 100) * W, cyPx);
              });
            }
          } else {
            const fpx = ((f.pos.size ?? 1.7) / 100) * W;
            ctx.font = `${fpx}px "Hind Siliguri","Noto Sans Bengali",sans-serif`;
            ctx.textBaseline = "bottom"; // matches the preview's translateY(-100%)
            const maxW = (f.pos.width / 100) * W;
            const y = ((f.pos.top - LIFT) / 100) * H;
            if (f.pos.align === "center") {
              ctx.textAlign = "center";
              ctx.fillText(v, ((f.pos.left + LEFT_SHIFT) / 100) * W + maxW / 2, y, maxW);
            } else {
              ctx.textAlign = "left";
              ctx.fillText(v, ((f.pos.left + LEFT_SHIFT) / 100) * W, y, maxW);
            }
          }
        }

        // Signatures
        if (showSig) {
          for (const s of form.signatures ?? []) {
            if (s.page !== pi + 1) continue;
            const t = sigText(s.source, s.value);
            if (!t) continue;
            const fpx = (s.size / 100) * W;
            ctx.font = s.cursive
              ? `italic ${fpx}px ${SIG_FONT}`
              : `${fpx}px "Hind Siliguri",sans-serif`;
            ctx.fillStyle = s.cursive ? "#1a2a5e" : "#111827";
            ctx.textBaseline = "alphabetic";
            const maxW = (s.width / 100) * W;
            if (s.align === "center") {
              ctx.textAlign = "center";
              ctx.fillText(t, (s.left / 100) * W + maxW / 2, (s.top / 100) * H, maxW);
            } else {
              ctx.textAlign = "left";
              ctx.fillText(t, (s.left / 100) * W, (s.top / 100) * H, maxW);
            }
            ctx.fillStyle = "#111827";
          }
        }

        const data = cv.toDataURL("image/jpeg", 0.86);
        if (pi > 0) pdf.addPage();
        pdf.addImage(data, "JPEG", 0, 0, pw, ph);
      }

      // Appended ID-document pages (each on its own clean page).
      for (const d of form.documents ?? []) {
        const src = docs[d.key];
        if (!src) continue;
        const im = await loadImg(src);
        const W = 1240,
          H = 1754;
        const cv = document.createElement("canvas");
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#1847a1";
        ctx.font = `bold 42px "Hind Siliguri",sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(d.label, W / 2, 64);
        const m = 90;
        const availW = W - 2 * m;
        const availH = H - 230;
        const ir = im.naturalWidth / im.naturalHeight;
        let dw = availW,
          dh = availW / ir;
        if (dh > availH) {
          dh = availH;
          dw = availH * ir;
        }
        const ix = (W - dw) / 2;
        ctx.drawImage(im, ix, 170, dw, dh);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.strokeRect(ix, 170, dw, dh);
        pdf.addPage();
        pdf.addImage(cv.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, pw, ph);
      }

      const base64 = pdf.output("datauristring").split(",")[1];

      const res = await submitForm({
        formName: form.nameBn,
        applicantName,
        applicantPhone,
        applicantEmail: applicantEmail || undefined,
        pdfBase64: base64,
        fileName: `${form.slug}-${Date.now()}.pdf`,
      });
      if (res.ok) setStatus("done");
      else {
        setStatus("error");
        setErrorMsg(res.error || "জমা দেওয়া যায়নি।");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("ফরম তৈরিতে সমস্যা হয়েছে — আবার চেষ্টা করুন।");
    }
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-md">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-2xl font-bold">আপনার আবেদন জমা হয়েছে!</h2>
        <p className="mt-3 text-fg-muted leading-relaxed">
          সম্পূর্ণ পূরণকৃত <b>{form.nameBn}</b> আমাদের অফিসে পৌঁছে গেছে। আমরা খুব
          শীঘ্রই আপনার সাথে যোগাযোগ করব — ইন শা আল্লাহ।
        </p>
        <button
          onClick={() => {
            setValues({});
            setPhotos({});
            setDocs({});
            setStatus("idle");
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-sm font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark transition-colors"
        >
          আরেকটি আবেদন করুন
        </button>
      </div>
    );
  }

  const fontPx = (sizePct?: number) => ((sizePct ?? 1.7) / 100) * pageW;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-2 gap-8 lg:gap-12">
      {/* ── Data entry ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-6 w-6 text-brand-blue" />
          <h1 className="text-2xl sm:text-3xl font-bold">{form.nameBn}</h1>
        </div>
        <p className="text-sm text-fg-muted mb-6">{form.description}</p>

        {/* Photo uploads */}
        {form.photos && form.photos.length > 0 && (
          <div className="mb-7">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue mb-3">
              ছবি আপলোড
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {form.photos.map((p) => (
                <div key={p.key} className="rounded-xl border border-border bg-white p-3">
                  <div className="text-xs font-semibold text-fg-soft mb-1">
                    {p.label}
                  </div>
                  {photos[p.key] ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photos[p.key]}
                        alt={p.label}
                        className="h-24 w-full object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => setPhotos((pr) => { const n = { ...pr }; delete n[p.key]; return n; })}
                        className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-fg/80 text-white"
                        aria-label="ছবি সরান"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1 h-24 rounded-lg border-2 border-dashed border-border-strong cursor-pointer hover:border-brand-blue/50 transition-colors text-fg-muted">
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px] font-medium">ছবি বাছাই করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(p.key, e.target.files?.[0], setPhotos, 700)}
                      />
                    </label>
                  )}
                  <div className="mt-1 text-[10px] text-fg-faint">{p.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-7">
          {groups.map(([group, fields]) => (
            <div key={group}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue mb-3">
                {group}
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {fields.map((f) => (
                  <label key={f.key} className="block">
                    <span className="text-xs font-medium text-fg-soft">
                      {f.label}
                      {f.required && <span className="text-brand-red"> *</span>}
                    </span>
                    <input
                      type={f.type === "number" ? "text" : f.type}
                      inputMode={
                        f.type === "tel" || f.type === "number" || f.pos.boxes
                          ? "numeric"
                          : undefined
                      }
                      value={values[f.key] || ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-fg focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/25"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Document uploads (NID / passport) — appended as PDF pages */}
        {form.documents && form.documents.length > 0 && (
          <div className="mt-7">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-blue mb-3">
              ডকুমেন্ট আপলোড (NID / পাসপোর্ট)
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {form.documents.map((d) => (
                <div key={d.key} className="rounded-xl border border-border bg-white p-3">
                  <div className="text-xs font-semibold text-fg-soft mb-1">{d.label}</div>
                  {docs[d.key] ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={docs[d.key]}
                        alt={d.label}
                        className="h-28 w-full object-contain rounded-lg border border-border bg-bg-soft"
                      />
                      <button
                        onClick={() => setDocs((pr) => { const n = { ...pr }; delete n[d.key]; return n; })}
                        className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-fg/80 text-white"
                        aria-label="সরান"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1 h-28 rounded-lg border-2 border-dashed border-border-strong cursor-pointer hover:border-brand-blue/50 transition-colors text-fg-muted">
                      <Upload className="h-5 w-5" />
                      <span className="text-[11px] font-medium">ফাইল বাছাই করুন</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(d.key, e.target.files?.[0], setDocs, 1100)}
                      />
                    </label>
                  )}
                  <div className="mt-1 text-[10px] text-fg-faint">
                    NID/পাসপোর্টের স্পষ্ট ছবি · সর্বোচ্চ ৫ MB · জমার শেষে যুক্ত হবে
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-red/10 border border-brand-red/30 px-4 py-3 text-sm text-brand-red">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={status === "working"}
          className="mt-6 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-brand-blue px-7 py-3.5 text-base font-bold text-white shadow-[var(--shadow-brand)] hover:bg-brand-blue-dark hover:scale-[1.01] transition-all disabled:opacity-70"
        >
          {status === "working" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              জমা হচ্ছে...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              ফরম জমা দিন
            </>
          )}
        </button>
        <p className="mt-3 text-xs text-fg-faint">
          জমা দিলে সম্পূর্ণ পূরণকৃত ফরমটি সরাসরি আমাদের অফিসে ই-মেইলে চলে যাবে।
        </p>
      </div>

      {/* ── Live preview ───────────────────────────────────── */}
      <div className="lg:sticky lg:top-24 self-start">
        <div className="text-xs font-bold uppercase tracking-wider text-fg-faint mb-2">
          সরাসরি প্রিভিউ
        </div>
        <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
          {form.pages.map((src, pi) => (
            <div
              key={src}
              ref={pi === 0 ? firstPageRef : undefined}
              className="relative w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${form.nameBn} — পৃষ্ঠা ${pi + 1}`} className="block w-full" />

              {/* Photos */}
              {(form.photos ?? [])
                .filter((p) => p.page === pi + 1 && photos[p.key])
                .map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.key}
                    src={photos[p.key]}
                    alt={p.label}
                    className="absolute object-cover"
                    style={{
                      left: `${p.left}%`,
                      top: `${p.top}%`,
                      width: `${p.width}%`,
                      height: `${p.height}%`,
                    }}
                  />
                ))}

              {/* Field values */}
              {form.fields
                .filter((f) => f.pos.page === pi + 1 && (values[f.key] || "").trim())
                .flatMap((f) => {
                  const v = values[f.key].trim();
                  if (f.pos.boxes) {
                    const b = f.pos.boxes;
                    const cell = (txt: string, leftPct: number, i: number) => (
                      <span
                        key={f.key + i}
                        className="absolute text-fg"
                        style={{
                          left: `${leftPct}%`,
                          top: `${b.cy}%`,
                          transform: "translate(-50%,-50%)",
                          fontSize: `${fontPx(b.size)}px`,
                          lineHeight: 1,
                          fontFamily: "'Hind Siliguri','Noto Sans Bengali',sans-serif",
                        }}
                      >
                        {txt}
                      </span>
                    );
                    if (b.mode === "date" && b.cells) {
                      const d = onlyDigits(v);
                      const parts = [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)];
                      return b.cells
                        .map((cx, i) => (parts[i] ? cell(parts[i], cx, i) : null))
                        .filter(Boolean);
                    }
                    return onlyDigits(v)
                      .split("")
                      .slice(0, b.count ?? 20)
                      .map((c, i) => cell(c, (b.firstX ?? 0) + i * (b.pitch ?? 2), i));
                  }
                  return [
                    <span
                      key={f.key}
                      className="absolute whitespace-nowrap overflow-hidden text-fg"
                      style={{
                        left: `${f.pos.left + LEFT_SHIFT}%`,
                        top: `${f.pos.top - LIFT}%`,
                        width: `${f.pos.width}%`,
                        fontSize: `${fontPx(f.pos.size)}px`,
                        lineHeight: 1,
                        transform: "translateY(-100%)",
                        textAlign: f.pos.align ?? "left",
                        fontFamily: "'Hind Siliguri','Noto Sans Bengali',sans-serif",
                      }}
                    >
                      {v}
                    </span>,
                  ];
                })}

              {/* Signatures */}
              {showSig &&
                (form.signatures ?? [])
                  .filter((s) => s.page === pi + 1 && sigText(s.source, s.value))
                  .map((s) => (
                    <span
                      key={s.id}
                      className="absolute whitespace-nowrap overflow-hidden"
                      style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        width: `${s.width}%`,
                        fontSize: `${fontPx(s.size)}px`,
                        lineHeight: 1,
                        transform: "translateY(-100%)",
                        textAlign: s.align ?? "left",
                        fontStyle: s.cursive ? "italic" : "normal",
                        color: s.cursive ? "#1a2a5e" : "#111827",
                        fontFamily: s.cursive
                          ? "'Great Vibes','Hind Siliguri',cursive"
                          : "'Hind Siliguri',sans-serif",
                      }}
                    >
                      {sigText(s.source, s.value)}
                    </span>
                  ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
