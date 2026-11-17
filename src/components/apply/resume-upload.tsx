"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { easeOutSoft } from "@/components/motion/easing";
import { resumeRules } from "@/content/student-application";
import type { ResumeMeta } from "@/lib/applications/student";
import { looksLikePdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

const THUMB_KEY = "core:resume-thumb";
const THUMB_WIDTH = 240;

/** Renders the first page of a PDF to a small JPEG, in the browser. */
async function renderFirstPage(file: File): Promise<{ src: string; pages: number } | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (THUMB_WIDTH * 2) / base.width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pages = doc.numPages;
    await doc.destroy();
    return { src: canvas.toDataURL("image/jpeg", 0.82), pages };
  } catch {
    return null;
  }
}

function readThumb(id: string | undefined) {
  if (!id) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(THUMB_KEY) ?? "null");
    return saved?.id === id && typeof saved.src === "string" ? (saved.src as string) : null;
  } catch {
    return null;
  }
}

function writeThumb(id: string, src: string) {
  try {
    localStorage.setItem(THUMB_KEY, JSON.stringify({ id, src }));
  } catch {}
}

/**
 * Choose, drop or paste a PDF. It's checked in the browser, uploaded
 * right away, and shown back as a preview of its first page.
 */
export function ResumeUpload({
  id,
  value,
  onChange,
  onError,
  describedBy,
}: {
  id: string;
  value: ResumeMeta | null;
  onChange: (r: ResumeMeta | null) => void;
  onError: (msg: string | null) => void;
  describedBy?: string;
}) {
  const reduce = !!useReducedMotion();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const xhr = React.useRef<XMLHttpRequest | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [pendingName, setPendingName] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [thumb, setThumb] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = readThumb(value?.id);
    if (saved) setThumb(saved);
  }, [value?.id]);
  React.useEffect(() => () => xhr.current?.abort(), []);

  const take = React.useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      onError(null);
      if (file.type.startsWith("image/")) return onError("That's an image. Paste or drop the PDF itself.");
      if (file.size > resumeRules.maxBytes) return onError("That file is over 5 MB.");
      const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      if (!looksLikePdf(head)) return onError("That file isn't a PDF. Export your resume as a PDF and try again.");

      xhr.current?.abort();
      setPendingName(file.name);
      setProgress(0);
      const preview = renderFirstPage(file);

      const body = new FormData();
      body.set("file", file);
      const req = new XMLHttpRequest();
      xhr.current = req;
      req.upload.onprogress = (e) => e.lengthComputable && setProgress(e.loaded / e.total);
      req.onload = async () => {
        let res: { error?: string; resume?: ResumeMeta } = {};
        try {
          res = JSON.parse(req.responseText);
        } catch {}
        if (req.status >= 200 && req.status < 300 && res.resume?.id) {
          setProgress(1);
          const rendered = await preview;
          if (rendered) writeThumb(res.resume.id, rendered.src);
          setThumb(rendered?.src ?? null);
          setProgress(null);
          onChange({ ...res.resume, pages: rendered?.pages ?? res.resume.pages });
        } else {
          setProgress(null);
          onError(res.error ?? "Upload failed. Try again.");
        }
      };
      req.onerror = () => {
        setProgress(null);
        onError("Upload failed. Check your connection and try again.");
      };
      req.open("POST", "/api/uploads/resume");
      req.send(body);
    },
    [onChange, onError]
  );

  // Paste a PDF anywhere on this screen.
  React.useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = e.clipboardData?.files?.[0];
      if (!file) return;
      e.preventDefault();
      take(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [take]);

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      take(e.dataTransfer.files?.[0]);
    },
  };

  const state = progress !== null ? "uploading" : value?.id ? "done" : "empty";

  return (
    <div {...dropProps}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {state === "empty" && (
          <motion.button
            key="empty"
            id={id}
            type="button"
            autoFocus
            aria-labelledby="question"
            aria-describedby={describedBy}
            onClick={() => inputRef.current?.click()}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: easeOutSoft }}
            className={cn(
              "group relative flex w-full items-center gap-5 overflow-hidden rounded-2xl border p-5 text-left outline-none transition-[border-color,background-color] duration-300 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              dragging ? "border-cta bg-columbia-soft" : "border-input hover:border-columbia"
            )}
          >
            <Sheet lifted={dragging} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-medium text-foreground">
                {dragging ? "Let go to upload" : "Choose your resume"}
              </span>
              <span className="mt-1 block text-[13.5px] leading-relaxed text-muted-foreground">
                <span className="sm:hidden">A PDF from your phone or drive</span>
                <span className="hidden sm:inline">
                  Or drop it here, or press <Kbd>⌘V</Kbd>
                </span>
              </span>
            </span>
          </motion.button>
        )}

        {state === "uploading" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: easeOutSoft }}
            className="flex items-center gap-5 rounded-2xl border border-input p-5"
            aria-live="polite"
          >
            <Sheet scanning={!reduce} fill={progress ?? 0} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15.5px] font-medium text-foreground">{pendingName}</span>
              <span className="mt-1 block text-[13.5px] tabular-nums text-muted-foreground">
                {progress !== null && progress >= 1 ? "Reading it" : `Uploading ${Math.round((progress ?? 0) * 100)}%`}
              </span>
              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-muted">
                <motion.span
                  className="block h-full origin-left rounded-full bg-cta"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.max(progress ?? 0, 0.04) }}
                  transition={{ duration: 0.5, ease: easeOutSoft }}
                />
              </span>
            </span>
          </motion.div>
        )}

        {state === "done" && value && (
          <motion.div
            key={`done-${value.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: easeOutSoft }}
            className={cn(
              "flex items-center gap-5 rounded-2xl border p-4 transition-colors duration-300 sm:p-5",
              dragging ? "border-cta bg-columbia-soft" : "border-input"
            )}
          >
            <motion.span
              initial={reduce ? false : { rotate: -4, y: 8 }}
              animate={{ rotate: 0, y: 0 }}
              transition={{ duration: 0.8, ease: easeOutSoft }}
              className="relative block h-[118px] w-[92px] shrink-0 overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(15,44,74,0.08),0_8px_24px_-8px_rgba(15,44,74,0.25)] ring-1 ring-black/5"
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="First page of your resume" className="size-full object-cover object-top" />
              ) : (
                <SheetLines />
              )}
            </motion.span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15.5px] font-medium text-foreground">{value.name}</span>
              <span className="mt-1 block text-[13.5px] text-muted-foreground">
                {value.pages ? `${value.pages} ${value.pages === 1 ? "page" : "pages"}, ready to go` : "Ready to go"}
              </span>
              <span className="mt-3 flex flex-wrap gap-1.5">
                <button
                  id={id}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="h-8 rounded-full bg-muted px-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-columbia-soft"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="h-8 rounded-full px-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Remove
                </button>
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-input bg-muted px-1 py-px font-sans text-[11.5px] text-foreground">{children}</kbd>
  );
}

function SheetLines({ fill = 1 }: { fill?: number }) {
  const widths = [52, 88, 70, 92, 60, 84, 46, 78];
  return (
    <span className="absolute inset-0 flex flex-col gap-[7px] px-3 pt-3.5">
      <span className="mb-1 h-[5px] w-[44%] rounded-full bg-columbia-deep/50" />
      {widths.map((w, i) => (
        <span
          key={i}
          className="h-[3px] rounded-full bg-black/10 transition-[width] duration-700 ease-out"
          style={{ width: `${(i / widths.length < fill ? w : w * 0.35)}%` }}
        />
      ))}
    </span>
  );
}

/** A small paper sheet. Lifts when you drag over, scans while uploading. */
function Sheet({ lifted, scanning, fill = 1 }: { lifted?: boolean; scanning?: boolean; fill?: number }) {
  return (
    <span className="relative h-[86px] w-[68px] shrink-0" aria-hidden="true">
      <span className="absolute inset-0 translate-x-1.5 translate-y-1 rotate-[5deg] rounded-md bg-columbia-soft ring-1 ring-columbia/60" />
      <motion.span
        animate={{ y: lifted ? -6 : 0, rotate: lifted ? -3 : 0 }}
        transition={{ duration: 0.5, ease: easeOutSoft }}
        className="absolute inset-0 overflow-hidden rounded-md bg-white shadow-[0_6px_18px_-8px_rgba(15,44,74,0.3)] ring-1 ring-black/5 transition-transform group-hover:-translate-y-0.5"
      >
        <SheetLines fill={fill} />
        {scanning && (
          <motion.span
            className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-cta/25 to-transparent"
            initial={{ top: "-25%" }}
            animate={{ top: "105%" }}
            transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.15 }}
          />
        )}
      </motion.span>
    </span>
  );
}
