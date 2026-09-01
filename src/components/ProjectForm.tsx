"use client";

import { useState } from "react";
import Modal from "./Modal";
import { PROJECT_COLORS } from "@/lib/colors";
import { CheckIcon, TrashIcon } from "./icons";

export interface ProjectFormData {
  name: string;
  desc: string;
  color: string;
}

export default function ProjectForm({
  mode,
  initial,
  onClose,
  onSubmit,
  onDelete,
}: {
  mode: "create" | "edit";
  initial?: { name: string; desc: string | null; color: string } | null;
  onClose: () => void;
  onSubmit: (d: ProjectFormData) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [color, setColor] = useState(initial?.color ?? "indigo");
  const [err, setErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr(true);
      return;
    }
    onSubmit({ name: name.trim(), desc: desc.trim(), color });
  }

  return (
    <Modal
      title={mode === "create" ? "新建项目" : "编辑项目"}
      sub={
        mode === "create"
          ? "填写项目的基本信息，创建后可继续添加资源。"
          : "修改项目信息，保存后立即生效。"
      }
      onClose={onClose}
      footer={
        <>
          {mode === "edit" && onDelete && (
            <button type="button" className="btn-danger" onClick={onDelete}>
              <TrashIcon size={15} /> 删除项目
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="proj-form" className="btn-primary">
            <CheckIcon size={15} /> 保存项目
          </button>
        </>
      }
    >
      <form id="proj-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="f-name">
            项目名称 <span className="req">*</span>
          </label>
          <input
            id="f-name"
            type="text"
            placeholder="如：运营平台"
            maxLength={40}
            autoFocus
            className={err && !name.trim() ? "err" : ""}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr(false);
            }}
          />
          <p className="hint">在侧边栏显示，最多 40 字。</p>
        </div>

        <div className="field">
          <label htmlFor="f-desc">项目描述</label>
          <textarea
            id="f-desc"
            rows={3}
            placeholder="一句话说明这个项目是做什么的（可选）"
            maxLength={200}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <p className="hint">选填，帮助你日后回忆项目背景。</p>
        </div>

        <fieldset className="field">
          <legend>标识颜色</legend>
          <div className="swatches" role="radiogroup" aria-label="选择项目标识颜色">
            {PROJECT_COLORS.map((c) => (
              <label className="swatch" key={c.key} style={{ "--sw": c.css } as React.CSSProperties}>
                <input
                  type="radio"
                  name="color"
                  value={c.key}
                  checked={color === c.key}
                  onChange={() => setColor(c.key)}
                />
                <span aria-hidden="true" />
                <span className="sr-only">{c.label}</span>
              </label>
            ))}
          </div>
          <p className="hint">用于侧边栏和详情页的圆点标识。</p>
        </fieldset>
      </form>
    </Modal>
  );
}
