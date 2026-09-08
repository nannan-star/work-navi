"use client";

import { useEffect, useState } from "react";
import type { Project } from "./types";
import { projectColorCss } from "@/lib/colors";
import { ChevronRightIcon } from "./icons";

function firstLine(content: string, max = 40): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "（空）";
  return flat.length > max ? flat.slice(0, max) + "…" : flat;
}

export default function NotesView({
  projects,
  onSaveMemo,
}: {
  projects: Project[];
  onSaveMemo: (projectId: string, memo: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0] ?? null;

  // 切换项目时载入对应笔记
  useEffect(() => {
    setDraft(selected?.memo ?? "");
    setSaveState("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function saveDraft() {
    if (!selected) return;
    setSaveState("saving");
    try {
      await onSaveMemo(selected.id, draft);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }

  return (
    <div className="view">
      <div className="topbar">
        <nav className="crumb" aria-label="面包屑">
          <span>开发笔记</span>
          <ChevronRightIcon size={14} />
          <span className="cur">{selected ? selected.name : "暂无项目"}</span>
        </nav>
        <div className="spacer" />
      </div>

      {projects.length === 0 ? (
        <div className="empty" style={{ margin: "80px auto", maxWidth: 420 }}>
          <p>还没有项目。点击左侧「新建项目」创建项目后，即可在此按项目记录开发笔记。</p>
        </div>
      ) : (
        <div className="notes-layout">
          <aside className="notes-list" aria-label="选择项目">
            {projects.map((p) => (
              <button
                key={p.id}
                className={`notes-item${p.id === selectedId ? " active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <span className="dot" style={{ background: projectColorCss(p.color) }} />
                <span className="nm">
                  <span className="name">{p.name}</span>
                  <span className="ex">{firstLine(p.memo)}</span>
                </span>
              </button>
            ))}
          </aside>

          <section className="notes-editor" aria-label="项目开发笔记">
            <div className="ne-head">
              <span className="dot" style={{ background: projectColorCss(selected.color) }} />
              <h2>{selected.name}</h2>
              <span className="spacer" />
              {saveState === "saved" ? (
                <span className="saved">
                  <span className="d" />
                  已自动保存
                </span>
              ) : saveState === "saving" ? (
                <span className="saved">保存中…</span>
              ) : null}
            </div>
            <label className="sr-only" htmlFor="notes-current">
              开发笔记内容
            </label>
            <textarea
              id="notes-current"
              spellCheck={false}
              placeholder={"## 日常备忘\n- 常用网站 / 接口地址\n- 业务判断改哪张表、哪个字段…"}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setSaveState("idle");
              }}
              onBlur={() => {
                if (selected && draft !== selected.memo) void saveDraft();
              }}
            />
            <div className="ne-foot">
              <span>Markdown</span>
              <span>失焦自动保存到「{selected.name}」</span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
