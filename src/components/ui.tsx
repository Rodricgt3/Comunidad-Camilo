import React, { useEffect, useState, type ReactNode } from "react";
import { Flag, X, RefreshCw } from "lucide-react";
import { useSession } from "../session";
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "No se pudo completar la operación.";
export function AsyncState({
  loading,
  error,
  empty = false,
}: {
  loading: boolean;
  error: string;
  empty?: boolean;
}) {
  return loading ? (
    <p className="status">Conectando con el garage…</p>
  ) : error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : empty ? (
    <div className="empty">
      <Flag size={24} />
      <p>La próxima salida se prepara aquí.</p>
      <small>Camilo publicará las novedades del club.</small>
    </div>
  ) : null;
}
export function Action({
  children,
  onClick,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => Promise<unknown>;
  className?: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { notify } = useSession();
  return (
    <button
      disabled={disabled || busy}
      className={className}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } catch (e) {
          notify(errorText(e));
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Procesando…" : children}
    </button>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const box = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const elements = box.current?.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    box.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = overflow;
      prior?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={box}
        tabIndex={-1}
        className="modal glass"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Cerrar" className="icon" onClick={close}>
            <X />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function Timer({ until }: { until: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((until - now) / 1000));
  return (
    <span className="timer">
      {s
        ? `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
        : "FINALIZADO"}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  reload,
}: {
  eyebrow: string;
  title: string;
  reload?: () => void;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {reload && (
        <button className="icon" aria-label="Actualizar" onClick={reload}>
          <RefreshCw size={18} />
        </button>
      )}
    </div>
  );
}
