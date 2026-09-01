"use client";

import { useEffect, useRef, useState } from "react";
import type { Resource } from "./types";
import { categoryColorCss } from "@/lib/colors";
import {
  categoryIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KebabIcon,
  ExternalLinkIcon,
  EditIcon,
  TrashIcon,
} from "./icons";

function isHttp(url: string | null): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

export default function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onNotify,
}: {
  resource: Resource;
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
  onNotify: (msg: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { title, url, note, username, password, category } = resource;
  const http = isHttp(url);

  // 点击菜单外部关闭
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* 忽略剪贴板异常 */
    }
    setCopied(key);
    onNotify("已复制到剪贴板");
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1200);
  }

  return (
    <article className="card">
      <div className="row1">
        <div className="favicon" aria-hidden="true">
          {categoryIcon(category?.color ?? "other")}
        </div>
        <div className="ttl">
          {http ? (
            <h4>
              <a className="h4-link" href={url} target="_blank" rel="noopener">
                {title}
                <ExternalLinkIcon className="ext" />
              </a>
            </h4>
          ) : (
            <h4 className="plain">{title}</h4>
          )}
          {url && (http ? (
            <a className="url" href={url} target="_blank" rel="noopener">
              {url}
            </a>
          ) : (
            <span className="url no-link mono">{url}</span>
          ))}
        </div>
        <div className="kebab-wrap" ref={menuRef}>
          <button className="kebab" aria-label="更多操作" onClick={() => setMenuOpen((v) => !v)}>
            <KebabIcon size={17} />
          </button>
          {menuOpen && (
            <div className="menu">
              <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit(resource); }}>
                <EditIcon size={15} /> 编辑
              </button>
              <button className="menu-item danger" onClick={() => { setMenuOpen(false); onDelete(resource); }}>
                <TrashIcon size={15} /> 删除
              </button>
            </div>
          )}
        </div>
      </div>

      {note && <p className="note">{note}</p>}

      {(username || password) && (
        <div className="cred">
          {username && (
            <div className="line">
              <span className="k">账号</span>
              <span className="v">{username}</span>
              <button
                className={`icon-btn${copied === "user" ? " copied" : ""}`}
                aria-label="复制账号"
                onClick={() => copy(username, "user")}
              >
                <CopyIcon size={15} />
              </button>
            </div>
          )}
          {password && (
            <div className="line">
              <span className="k">密码</span>
              <span className={`v${revealed ? "" : " masked"}`}>
                {revealed ? password : "••••••••"}
              </span>
              <button
                className="icon-btn"
                aria-label={revealed ? "隐藏密码" : "显示密码"}
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
              <button
                className={`icon-btn${copied === "pass" ? " copied" : ""}`}
                aria-label="复制密码"
                onClick={() => copy(password, "pass")}
              >
                <CopyIcon size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="foot">
        {url && !http && (
          <button
            className={`copy-conn${copied === "conn" ? " copied" : ""}`}
            onClick={() => copy(url, "conn")}
          >
            <CopyIcon size={14} /> 复制连接串
          </button>
        )}
        <span className="tag" style={{ color: categoryColorCss(category?.color ?? "other") }}>
          {category?.name}
        </span>
      </div>
    </article>
  );
}
