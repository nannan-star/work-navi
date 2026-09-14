"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "./types";
import { projectColorCss } from "@/lib/colors";
import { LogoIcon, SearchIcon, CheckCircleIcon, NoteIcon, PlusIcon, SunIcon, MoonIcon, GripIcon } from "./icons";

export default function Sidebar({
  projects,
  view,
  activeProjectId,
  currentWeekLabel,
  query,
  onQueryChange,
  onShowNotes,
  onShowTasks,
  onSelectProject,
  onNewProject,
  onReorderProjects,
}: {
  projects: Project[];
  view: "project" | "tasks" | "notes";
  activeProjectId: string | null;
  currentWeekLabel: string;
  query: string;
  onQueryChange: (q: string) => void;
  onShowNotes: () => void;
  onShowTasks: () => void;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onReorderProjects: (ids: string[]) => void;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // 主题切换: 内联脚本可能在 hydration 前已设置 data-theme,这里同步一次。
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "light" || t === "dark") setTheme(t);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  };

  // 快捷键 "/" 聚焦搜索框
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;

  // 搜索过滤后列表只是子集,此时重排会打乱其余项目的顺序 —— 过滤状态下禁用拖拽。
  const dragActive = !q;

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (dragId && dragId !== id) setOverId(id);
  }

  function handleDrop(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (!dragId || dragId === id) return;
    const ids = projects.map((p) => p.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(id);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    onReorderProjects(ids);
    setDragId(null);
    setOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  return (
    <aside className="sidebar" aria-label="项目导航">
      <div className="brand">
        <div className="logo" aria-hidden="true">
          <LogoIcon size={19} />
        </div>
        <div>
          <h1>work-navi</h1>
          <div className="sub">项目资源导航台</div>
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "切换到明亮模式" : "切换到暗黑模式"}
          title={theme === "dark" ? "切换到明亮模式" : "切换到暗黑模式"}
        >
          {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      <div className="side-search">
        <div className="box">
          <SearchIcon size={15} />
          <input
            ref={searchRef}
            type="text"
            placeholder="搜索项目 / 资源…"
            aria-label="搜索项目或资源"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <kbd>/</kbd>
        </div>
      </div>

      <nav className="side-nav" aria-label="主导航">
        <button className={`nav-item${view === "notes" ? " active" : ""}`} onClick={onShowNotes}>
          <NoteIcon size={17} />
          <span className="name">开发笔记</span>
        </button>
        <button className={`nav-item${view === "tasks" ? " active" : ""}`} onClick={onShowTasks}>
          <CheckCircleIcon size={17} />
          <span className="name">任务周记</span>
          <span className="wk-badge">{currentWeekLabel}</span>
        </button>
      </nav>

      <div className="side-label">
        <span>我的项目</span>
        <span className="count">{filtered.length}</span>
      </div>

      <ul className="proj-list">
        {filtered.map((p) => (
          <li
            key={p.id}
            className={`${dragId === p.id ? "dragging" : ""}${overId === p.id ? " drag-over" : ""}`}
            draggable={dragActive}
            onDragStart={(e) => handleDragStart(e, p.id)}
            onDragOver={(e) => handleDragOver(e, p.id)}
            onDragLeave={() => setOverId((v) => (v === p.id ? null : v))}
            onDrop={(e) => handleDrop(e, p.id)}
            onDragEnd={handleDragEnd}
          >
            <button
              className={`proj-item${view === "project" && activeProjectId === p.id ? " active" : ""}`}
              onClick={() => onSelectProject(p.id)}
            >
              <span className="dot" style={{ background: projectColorCss(p.color) }} />
              <span className="name">{p.name}</span>
              {dragActive && (
                <span className="grip" title="拖拽排序" aria-hidden="true">
                  <GripIcon size={14} />
                </span>
              )}
              <span className="n">{p.resources?.length ?? 0}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="no-projects">没有匹配的项目</li>}
      </ul>

      <div className="side-foot">
        <button className="btn-new" onClick={onNewProject}>
          <PlusIcon size={16} />
          新建项目
        </button>
      </div>
    </aside>
  );
}
