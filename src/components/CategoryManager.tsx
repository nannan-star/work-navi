"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Category } from "./types";
import { categoryColorCss, CATEGORY_COLORS } from "@/lib/colors";
import { GripIcon, TrashIcon, PlusIcon, CheckIcon, EditIcon, XIcon } from "./icons";

export default function CategoryManager({
  categories,
  onClose,
  onAdd,
  onDelete,
  onRename,
  onReorder,
}: {
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("other");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function add() {
    if (name.trim()) {
      onAdd(name.trim(), color);
      setName("");
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  function saveEdit(id: string) {
    const n = editName.trim();
    if (n) onRename(id, n);
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

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
    const ids = categories.map((c) => c.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(id);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    onReorder(ids);
    setDragId(null);
    setOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  return (
    <Modal
      title="管理分类"
      sub="增删资源分类。分类下还有资源时，请先删除或移走这些资源。拖拽可调整分类顺序。"
      onClose={onClose}
      maxWidth={460}
      footer={
        <button type="button" className="btn-primary" onClick={onClose}>
          <CheckIcon size={15} /> 完成
        </button>
      }
    >
      <div className="cat-list">
        {categories.map((c) => {
          const count = c._count?.resources ?? 0;
          const editing = editingId === c.id;
          return (
            <div
              className={`cat-row${dragId === c.id ? " dragging" : ""}${
                overId === c.id ? " drag-over" : ""
              }`}
              key={c.id}
              draggable={!editing}
              onDragStart={(e) => handleDragStart(e, c.id)}
              onDragOver={(e) => handleDragOver(e, c.id)}
              onDragLeave={() => setOverId((v) => (v === c.id ? null : v))}
              onDrop={(e) => handleDrop(e, c.id)}
              onDragEnd={handleDragEnd}
            >
              <span className="grip">
                <GripIcon size={15} />
              </span>
              <span className="cdot" style={{ background: categoryColorCss(c.color) }} />
              {editing ? (
                <>
                  <input
                    className="cedit-input"
                    autoFocus
                    aria-label="分类名称"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveEdit(c.id);
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelEdit();
                      }
                    }}
                  />
                  <button className="cedit-ok" aria-label="保存" onClick={() => saveEdit(c.id)}>
                    <CheckIcon size={14} />
                  </button>
                  <button className="cedit-x" aria-label="取消" onClick={cancelEdit}>
                    <XIcon size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="cname">{c.name}</span>
                  <span className="ccount">{count} 项</span>
                  <button
                    className="cedit"
                    aria-label="重命名分类"
                    title="重命名"
                    onClick={() => startEdit(c)}
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    className="cdel"
                    aria-label="删除分类"
                    title={count > 0 ? `分类下还有 ${count} 项资源，请先删除或移走` : "删除分类"}
                    onClick={() => onDelete(c.id)}
                  >
                    <TrashIcon size={15} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="swatches"
        role="radiogroup"
        aria-label="选择分类颜色"
        style={{ marginBottom: 10 }}
      >
        {CATEGORY_COLORS.map((c) => (
          <label className="swatch" key={c.key} style={{ "--sw": c.css } as React.CSSProperties}>
            <input
              type="radio"
              name="cat-color"
              value={c.key}
              checked={color === c.key}
              onChange={() => setColor(c.key)}
            />
            <span aria-hidden="true" />
            <span className="sr-only">{c.label}</span>
          </label>
        ))}
      </div>

      <div className="cat-add-row">
        <input
          type="text"
          placeholder="新分类名称，如：监控 / 文档"
          aria-label="新分类名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="cadd-btn" onClick={add}>
          <PlusIcon size={14} />
          添加
        </button>
      </div>
    </Modal>
  );
}
