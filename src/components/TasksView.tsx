"use client";

import { useMemo } from "react";
import type { WeekInfo, WeekNote } from "./types";
import { formatWeekRange, formatWeekTitle, excerpt } from "@/lib/week";
import { ChevronRightIcon, DotIcon } from "./icons";

function taskCount(content: string): number {
  return (content.match(/^\s*-\s+/gm) || []).length;
}

export default function TasksView({
  weekNotes,
  currentWeek,
  content,
  saveState,
  onContentChange,
  onBlurSave,
  onOpenWeek,
}: {
  weekNotes: WeekNote[];
  currentWeek: WeekInfo;
  content: string;
  saveState: "idle" | "saving" | "saved";
  onContentChange: (v: string) => void;
  onBlurSave: () => void;
  onOpenWeek: (n: WeekNote) => void;
}) {
  const isCurrent = (n: { isoYear: number; isoWeek: number }) =>
    n.isoYear === currentWeek.isoYear && n.isoWeek === currentWeek.isoWeek;

  const currentNote: WeekNote = useMemo(() => {
    const existing = weekNotes.find(isCurrent);
    return {
      id: existing?.id ?? "__current__",
      isoYear: currentWeek.isoYear,
      isoWeek: currentWeek.isoWeek,
      startDate: existing?.startDate ?? "",
      endDate: existing?.endDate ?? "",
      content,
      updatedAt: existing?.updatedAt ?? new Date().toISOString(),
    };
  }, [weekNotes, currentWeek, content]);

  const list = useMemo(() => {
    const has = weekNotes.some(isCurrent);
    const base = has ? weekNotes : [currentNote, ...weekNotes];
    return [...base].sort((a, b) =>
      a.isoYear === b.isoYear ? b.isoWeek - a.isoWeek : b.isoYear - a.isoYear
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekNotes, currentNote]);

  const years = useMemo(() => {
    const map = new Map<number, WeekNote[]>();
    for (const n of list) {
      const arr = map.get(n.isoYear) ?? [];
      arr.push(n);
      map.set(n.isoYear, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [list]);

  return (
    <div className="view">
      <div className="topbar">
        <nav className="crumb" aria-label="面包屑">
          <span>任务周记</span>
          <ChevronRightIcon size={14} />
          <span className="cur">{formatWeekTitle(currentWeek.isoYear, currentWeek.isoWeek)}</span>
        </nav>
        <div className="spacer" />
      </div>

      <div className="task-wrap">
        <header className="task-head">
          <div className="tt">
            <h2>
              <span className="bar" />
              任务周记
            </h2>
            <p className="wk-sub">
              {formatWeekTitle(currentWeek.isoYear, currentWeek.isoWeek)} ·{" "}
              {formatWeekRange(currentWeek.isoYear, currentWeek.isoWeek)}（本周）
            </p>
          </div>
        </header>

        <section className="week-editor" aria-label="本周任务编辑">
          <div className="we-head">
            <span className="chip-week">{currentWeek.label}</span>
            <span className="rng">{formatWeekRange(currentWeek.isoYear, currentWeek.isoWeek)}</span>
            {saveState === "saved" ? (
              <span className="saved">
                <span className="d" />
                已自动保存
              </span>
            ) : saveState === "saving" ? (
              <span className="saved">保存中…</span>
            ) : null}
          </div>
          <label className="sr-only" htmlFor="week-current">
            本周任务内容
          </label>
          <textarea
            id="week-current"
            spellCheck={false}
            placeholder="## 本周重点&#10;- [ ] 记录你本周要做的任务…"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={onBlurSave}
          />
          <div className="we-foot">
            <span>Markdown</span>
            <span>失焦自动保存到当前周</span>
          </div>
        </section>

        <section className="history" aria-label="历史周记录">
          <h3 className="history-title">历史记录</h3>

          {years.map(([year, notes]) => (
            <div className="year-group" key={year}>
              <div className="year-label">{year}</div>
              {notes.map((n) => {
                const cur = isCurrent(n);
                const inner = (
                  <>
                    <span className="wno">W{n.isoWeek}</span>
                    <span className="wmeta">
                      <span className="wrange">{formatWeekRange(n.isoYear, n.isoWeek)}</span>
                      <span className="wexcerpt">{excerpt(n.content) || "（空白）"}</span>
                    </span>
                    {cur ? (
                      <span className="wtag cur">
                        <DotIcon size={12} />
                        本周
                      </span>
                    ) : (
                      <span className="wtag">{taskCount(n.content)} 项</span>
                    )}
                    <span className="chev">
                      <ChevronRightIcon size={18} />
                    </span>
                  </>
                );
                return cur ? (
                  <div className="week-row current" key={n.id}>
                    {inner}
                  </div>
                ) : (
                  <button className="week-row" key={n.id} onClick={() => onOpenWeek(n)}>
                    {inner}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
