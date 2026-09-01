"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { WeekNote } from "./types";
import { formatWeekRange, formatWeekTitle } from "@/lib/week";
import { CheckIcon } from "./icons";

export default function WeekDetailModal({
  note,
  onClose,
  onSave,
}: {
  note: WeekNote;
  onClose: () => void;
  onSave: (content: string) => void;
}) {
  const [content, setContent] = useState(note.content);

  return (
    <Modal
      title={formatWeekTitle(note.isoYear, note.isoWeek)}
      sub={formatWeekRange(note.isoYear, note.isoWeek)}
      onClose={onClose}
      maxWidth={560}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={() => onSave(content)}>
            <CheckIcon size={15} /> 保存修改
          </button>
        </>
      }
    >
      <label className="sr-only" htmlFor="week-modal-content">
        历史周任务内容（可编辑）
      </label>
      <textarea
        id="week-modal-content"
        className="week-content"
        spellCheck={false}
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </Modal>
  );
}
