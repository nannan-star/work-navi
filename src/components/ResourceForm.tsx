"use client";

import { useState } from "react";
import Modal from "./Modal";
import type { Category, Resource } from "./types";
import { CheckIcon, EyeIcon, EyeOffIcon } from "./icons";

export interface ResourceFormData {
  categoryId: string;
  title: string;
  url: string;
  note: string;
  username: string;
  password: string;
}

export default function ResourceForm({
  categories,
  defaultCategoryId,
  initial,
  onClose,
  onSubmit,
}: {
  categories: Category[];
  defaultCategoryId?: string;
  initial?: Resource | null;
  onClose: () => void;
  onSubmit: (d: ResourceFormData) => void;
}) {
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? ""
  );
  const [title, setTitle] = useState(initial?.title ?? "生产环境 · 后台");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setErr(true);
      return;
    }
    onSubmit({
      categoryId,
      title: title.trim(),
      url: url.trim(),
      note: note.trim(),
      username: username.trim(),
      password,
    });
  }

  return (
    <Modal
      title={initial ? "编辑资源" : "添加资源"}
      sub={initial ? "修改这条资源信息。" : "记录一条资源地址，可附带备注和账号密码。"}
      onClose={onClose}
      maxWidth={520}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" form="res-form" className="btn-primary">
            <CheckIcon size={15} /> 保存资源
          </button>
        </>
      }
    >
      <form id="res-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="r-cat">
            分类 <span className="req">*</span>
          </label>
          <select id="r-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="r-title">
            标题 <span className="req">*</span>
          </label>
          <input
            id="r-title"
            type="text"
            placeholder="生产环境 · 后台"
            maxLength={60}
            autoFocus
            className={err && !title.trim() ? "err" : ""}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErr(false);
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="r-url">地址 URL</label>
          <input
            id="r-url"
            type="text"
            placeholder="https:// 或 IP:端口（选填）"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="hint">填了 http(s) 地址就能点标题直接跳转。</p>
        </div>

        <div className="field">
          <label htmlFor="r-note">备注</label>
          <textarea
            id="r-note"
            rows={2}
            placeholder="使用说明、注意事项等（选填）"
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="r-user">用户名</label>
          <textarea
            id="r-user"
            rows={2}
            placeholder="账号（选填，多个可每行一个）"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className="hint">多个账号可每行填一个，卡片上会换行显示。</p>
        </div>

        <div className="field">
          <label htmlFor="r-pass">密码</label>
          <div className="pass-wrap">
            <input
              id="r-pass"
              type={show ? "text" : "password"}
              placeholder="密码（选填）"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="pass-toggle"
              aria-label={show ? "隐藏密码" : "显示密码"}
              onClick={() => setShow((v) => !v)}
            >
              {show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
