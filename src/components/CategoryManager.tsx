"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Category } from "./types";
import { categoryColorCss } from "@/lib/colors";
import { GripIcon, TrashIcon, PlusIcon, CheckIcon } from "./icons";

export default function CategoryManager({
  categories,
  onClose,
  onAdd,
  onDelete,
}: {
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");

  function add() {
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  }

  return (
    <Modal
      title="管理分类"
      sub="增删资源分类。已有资源的分类不能直接删除。"
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
          return (
            <div className="cat-row" key={c.id}>
              <span className="grip">
                <GripIcon size={15} />
              </span>
              <span className="cdot" style={{ background: categoryColorCss(c.color) }} />
              <span className="cname">{c.name}</span>
              <span className="ccount">{count} 项</span>
              <button
                className="cdel"
                aria-label="删除分类"
                disabled={count > 0}
                title={count > 0 ? "有资源，不能删除" : "删除分类"}
                onClick={() => onDelete(c.id)}
              >
                <TrashIcon size={15} />
              </button>
            </div>
          );
        })}
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
