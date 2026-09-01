"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "./icons";

// 弹窗通用:Esc 关闭、锁定 body 滚动、卸载时归还焦点。
export function useModalClose(onClose: () => void) {
  const cb = useRef(onClose);
  cb.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, []);
}

export default function Modal({
  title,
  sub,
  onClose,
  children,
  footer,
  maxWidth,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  useModalClose(onClose);

  return (
    <div
      className="modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <header className="modal-head">
          <div className="modal-head-txt">
            <h3>{title}</h3>
            {sub && <p className="modal-sub">{sub}</p>}
          </div>
          <button className="modal-x" aria-label="关闭弹窗" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
