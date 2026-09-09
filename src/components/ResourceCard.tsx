"use client";

import { useEffect, useRef, useState } from "react";
import type { Category, Resource } from "./types";
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
  MoveIcon,
  ChevronRightIcon,
} from "./icons";

function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default function ResourceCard({
  resource,
  categories,
  onEdit,
  onDelete,
  onMove,
  onNotify,
}: {
  resource: Resource;
  categories: Category[];
  onEdit: (r: Resource) => void;
  onDelete: (r: Resource) => void;
  onMove: (r: Resource, categoryId: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { title, note, username, password, category, links } = resource;
  const otherCategories = categories.filter((c) => c.id !== resource.categoryId);

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
          <h4 className="plain">{title}</h4>
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
              <button
                className="menu-item move-item"
                disabled={otherCategories.length === 0}
                title={otherCategories.length === 0 ? "没有其它分类可移动" : "移动到其它分类"}
                onClick={() => setMoveOpen((v) => !v)}
              >
                <span className="move-label">
                  <MoveIcon size={15} /> 移动到
                </span>
                <ChevronRightIcon className="arrow" size={13} />
              </button>
              {moveOpen && otherCategories.length > 0 && (
                <div className="move-list">
                  {otherCategories.map((c) => (
                    <button
                      key={c.id}
                      className="move-opt"
                      onClick={() => { setMenuOpen(false); setMoveOpen(false); onMove(resource, c.id); }}
                    >
                      <span className="dot" style={{ background: categoryColorCss(c.color) }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <button className="menu-item danger" onClick={() => { setMenuOpen(false); onDelete(resource); }}>
                <TrashIcon size={15} /> 删除
              </button>
            </div>
          )}
        </div>
      </div>

      {links.length > 0 && (
        <div className="links">
          {links.map((link) =>
            isHttp(link.url) ? (
              <a key={link.id} className="link-row" href={link.url} target="_blank" rel="noopener">
                <span className="link-label">{link.label || "地址"}</span>
                <ExternalLinkIcon className="ext" />
              </a>
            ) : (
              <div key={link.id} className="link-row">
                <span className="link-label">{link.label || "地址"}</span>
                <span className="link-url mono">{link.url}</span>
                <button
                  className={`icon-btn${copied === link.id ? " copied" : ""}`}
                  aria-label="复制链接"
                  onClick={() => copy(link.url, link.id)}
                >
                  <CopyIcon size={15} />
                </button>
              </div>
            )
          )}
        </div>
      )}

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
        <span className="tag" style={{ color: categoryColorCss(category?.color ?? "other") }}>
          {category?.name}
        </span>
      </div>
    </article>
  );
}
