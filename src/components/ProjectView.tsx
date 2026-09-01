"use client";

import { useMemo, useState } from "react";
import type { Category, Project, Resource, WeekInfo } from "./types";
import { categoryColorCss, projectColorCss } from "@/lib/colors";
import ResourceCard from "./ResourceCard";
import {
  EditIcon,
  CalendarIcon,
  ClockIcon,
  ChevronRightIcon,
  PlusIcon,
  SettingsIcon,
  DotIcon,
} from "./icons";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

export default function ProjectView({
  project,
  categories,
  currentWeek,
  content,
  saveState,
  query,
  onEditProject,
  onOpenResource,
  onOpenCategoryManager,
  onEditResource,
  onDeleteResource,
  onNotify,
  onContentChange,
  onBlurSave,
  onGotoTasks,
}: {
  project: Project;
  categories: Category[];
  currentWeek: WeekInfo;
  content: string;
  saveState: "idle" | "saving" | "saved";
  query: string;
  onEditProject: () => void;
  onOpenResource: (categoryId: string) => void;
  onOpenCategoryManager: () => void;
  onEditResource: (r: Resource) => void;
  onDeleteResource: (r: Resource) => void;
  onNotify: (msg: string) => void;
  onContentChange: (v: string) => void;
  onBlurSave: () => void;
  onGotoTasks: () => void;
}) {
  const [filter, setFilter] = useState<string | null>(null); // null = 全部
  const resources = project.resources ?? [];
  const q = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const r of resources) {
      if (q) {
        const hay = `${r.title} ${r.url ?? ""} ${r.note ?? ""} ${r.username ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (filter && r.categoryId !== filter) continue;
      const arr = map.get(r.categoryId) ?? [];
      arr.push(r);
      map.set(r.categoryId, arr);
    }
    return map;
  }, [resources, q, filter]);

  const visibleCategories = categories.filter((c) => (grouped.get(c.id)?.length ?? 0) > 0);
  const total = resources.length;

  return (
    <div className="view">
      <div className="topbar">
        <nav className="crumb" aria-label="面包屑">
          <span>项目</span>
          <ChevronRightIcon size={14} />
          <span className="cur">{project.name}</span>
        </nav>
        <div className="spacer" />
        <button className="chip" onClick={onEditProject}>
          <EditIcon size={16} />
          编辑项目
        </button>
      </div>

      <header className="proj-head">
        <div className="proj-title">
          <span className="pdot" style={{ background: projectColorCss(project.color) }} />
          <h2>{project.name}</h2>
        </div>
        {project.desc && <p className="proj-desc">{project.desc}</p>}
        <div className="proj-meta">
          <span className="m">
            <CalendarIcon size={14} /> 资源 <b>{total}</b> 条
          </span>
          <span className="m">
            <ClockIcon size={14} /> 更新于 <b>{timeAgo(project.updatedAt)}</b>
          </span>
        </div>
      </header>

      <div className="content">
        <section aria-label="资源列表">
          <div className="filters" role="group" aria-label="按分类筛选">
            <button className={`chip${filter === null ? " on" : ""}`} onClick={() => setFilter(null)}>
              <span>全部</span>
              <span className="num">{total}</span>
            </button>
            {categories.map((c) => {
              const count = resources.filter((r) => r.categoryId === c.id).length;
              return (
                <button
                  key={c.id}
                  className={`chip${filter === c.id ? " on" : ""}`}
                  onClick={() => setFilter(filter === c.id ? null : c.id)}
                >
                  <span className="dot" style={{ background: categoryColorCss(c.color) }} />
                  {c.name}
                  <span className="num">{count}</span>
                </button>
              );
            })}
            <button className="chip chip-manage" onClick={onOpenCategoryManager} aria-label="管理分类">
              <SettingsIcon size={14} />
              管理分类
            </button>
          </div>

          {visibleCategories.length === 0 && (
            <div className="empty">
              {q ? "没有匹配的资源。" : "还没有资源，点击分类区的「添加」按钮开始记录。"}
            </div>
          )}

          {visibleCategories.map((c) => (
            <div className="cat" key={c.id}>
              <div className="cat-head">
                <span className="bar" style={{ background: categoryColorCss(c.color) }} />
                <h3>{c.name}</h3>
                <span className="num">{grouped.get(c.id)?.length ?? 0}</span>
                <button className="add" onClick={() => onOpenResource(c.id)}>
                  <PlusIcon size={13} />
                  添加
                </button>
              </div>
              <div className="cards">
                {(grouped.get(c.id) ?? []).map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onEdit={onEditResource}
                    onDelete={onDeleteResource}
                    onNotify={onNotify}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside className="notes" aria-label="本周任务速记">
          <div className="notes-head">
            <span className="bar" />
            <h3>本周任务</h3>
            {saveState === "saved" ? (
              <span className="saved">
                <span className="d" />
                已保存
              </span>
            ) : saveState === "saving" ? (
              <span className="saved">保存中…</span>
            ) : null}
            <button className="mini-link" onClick={onGotoTasks}>
              历史 →
            </button>
          </div>
          <label className="sr-only" htmlFor="task-notes">
            本周任务内容（可直接编辑）
          </label>
          <textarea
            id="task-notes"
            spellCheck={false}
            placeholder={`## 本周（${currentWeek.label} · ${currentWeek.range}）\n- 记录你本周要做的任务…`}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={onBlurSave}
          />
          <div className="notes-foot">
            <span>
              {currentWeek.label} · {currentWeek.range}
            </span>
            <span>直接编辑 · 失焦自动保存</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
