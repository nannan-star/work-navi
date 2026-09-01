"use client";

import { useMemo, useRef, useState } from "react";
import type { Category, Project, Resource, WeekInfo, WeekNote } from "./types";
import Sidebar from "./Sidebar";
import ProjectView from "./ProjectView";
import TasksView from "./TasksView";
import ProjectForm, { type ProjectFormData } from "./ProjectForm";
import ResourceForm, { type ResourceFormData } from "./ResourceForm";
import CategoryManager from "./CategoryManager";
import WeekDetailModal from "./WeekDetailModal";

export interface InitialData {
  projects: Project[];
  categories: Category[];
  weekNotes: WeekNote[];
  currentWeek: WeekInfo;
}

async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data as T;
}

export default function Home({ initialData }: { initialData: InitialData }) {
  const [projects, setProjects] = useState<Project[]>(initialData.projects);
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [weekNotes, setWeekNotes] = useState<WeekNote[]>(initialData.weekNotes);
  const currentWeek = initialData.currentWeek;

  const [view, setView] = useState<"project" | "tasks">("project");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    initialData.projects[0]?.id ?? null
  );
  const [query, setQuery] = useState("");

  const [currentContent, setCurrentContent] = useState<string>(() => {
    return (
      initialData.weekNotes.find(
        (n) => n.isoYear === initialData.currentWeek.isoYear && n.isoWeek === initialData.currentWeek.isoWeek
      )?.content ?? ""
    );
  });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  const [projectModal, setProjectModal] = useState<{ mode: "create" | "edit"; project?: Project } | null>(null);
  const [resourceModal, setResourceModal] = useState<{ projectId: string; categoryId?: string; resource?: Resource } | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [weekModal, setWeekModal] = useState<WeekNote | null>(null);

  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const toastTimer = useRef<number | null>(null);

  function notify(msg: string, err = false) {
    setToast({ msg, err });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of projects) {
      for (const r of p.resources ?? []) m.set(r.categoryId, (m.get(r.categoryId) ?? 0) + 1);
    }
    return m;
  }, [projects]);

  function upsertWeekNote(note: WeekNote) {
    setWeekNotes((prev) => {
      const exists = prev.some((n) => n.isoYear === note.isoYear && n.isoWeek === note.isoWeek);
      return exists
        ? prev.map((n) => (n.isoYear === note.isoYear && n.isoWeek === note.isoWeek ? note : n))
        : [note, ...prev];
    });
  }

  // ---- 周记 ----
  async function saveCurrentWeek() {
    setSaveState("saving");
    try {
      const note = await api<WeekNote>(`/api/weeknotes/${currentWeek.key}`, {
        method: "PUT",
        body: JSON.stringify({ content: currentContent }),
      });
      upsertWeekNote(note);
      setSaveState("saved");
    } catch (e) {
      setSaveState("idle");
      notify((e as Error).message, true);
    }
  }

  async function saveWeekNote(note: WeekNote, content: string) {
    try {
      const updated = await api<WeekNote>(`/api/weeknotes/${note.isoYear}-${note.isoWeek}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      upsertWeekNote(updated);
      setWeekModal(null);
      notify("已保存");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  function handleContentChange(v: string) {
    setCurrentContent(v);
    setSaveState("idle");
  }

  // ---- 项目 ----
  async function createProject(d: ProjectFormData) {
    try {
      const p = await api<Project>("/api/projects", { method: "POST", body: JSON.stringify(d) });
      setProjects((prev) => [...prev, p]);
      setActiveProjectId(p.id);
      setView("project");
      setProjectModal(null);
      notify("项目已创建");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function updateProject(d: ProjectFormData) {
    if (!projectModal?.project) return;
    try {
      const p = await api<Project>(`/api/projects/${projectModal.project.id}`, {
        method: "PATCH",
        body: JSON.stringify(d),
      });
      setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
      setProjectModal(null);
      notify("项目已更新");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function deleteProject() {
    const id = projectModal?.project?.id;
    if (!id) return;
    if (!window.confirm("确定删除该项目及其所有资源？此操作不可撤销。")) return;
    try {
      await api(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((x) => x.id !== id));
      setActiveProjectId((prev) => (prev === id ? null : prev));
      setProjectModal(null);
      notify("项目已删除");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  // ---- 资源 ----
  async function createResource(d: ResourceFormData) {
    if (!resourceModal) return;
    try {
      const r = await api<Resource>("/api/resources", {
        method: "POST",
        body: JSON.stringify({ ...d, projectId: resourceModal.projectId }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === r.projectId ? { ...p, resources: [...(p.resources ?? []), r] } : p
        )
      );
      setResourceModal(null);
      notify("资源已添加");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function updateResource(d: ResourceFormData) {
    if (!resourceModal?.resource) return;
    try {
      const r = await api<Resource>(`/api/resources/${resourceModal.resource.id}`, {
        method: "PATCH",
        body: JSON.stringify(d),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === r.projectId
            ? { ...p, resources: (p.resources ?? []).map((x) => (x.id === r.id ? { ...x, ...r } : x)) }
            : p
        )
      );
      setResourceModal(null);
      notify("资源已更新");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`删除资源「${resource.title}」？`)) return;
    try {
      await api(`/api/resources/${resource.id}`, { method: "DELETE" });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === resource.projectId
            ? { ...p, resources: (p.resources ?? []).filter((x) => x.id !== resource.id) }
            : p
        )
      );
      notify("资源已删除");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  // ---- 分类 ----
  async function addCategory(name: string) {
    try {
      const c = await api<Category>("/api/categories", { method: "POST", body: JSON.stringify({ name }) });
      setCategories((prev) => [...prev, c]);
      notify("分类已添加");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  async function deleteCategory(id: string) {
    try {
      await api(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      notify("分类已删除");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }

  // ---- 视图/弹窗开关 ----
  function selectProject(id: string) {
    setActiveProjectId(id);
    setView("project");
  }

  return (
    <>
      <a href="#main" className="sr-only">
        跳到主内容
      </a>
      <div className="app">
        <Sidebar
          projects={projects}
          view={view}
          activeProjectId={activeProjectId}
          currentWeekLabel={currentWeek.label}
          query={query}
          onQueryChange={setQuery}
          onShowTasks={() => setView("tasks")}
          onSelectProject={selectProject}
          onNewProject={() => setProjectModal({ mode: "create" })}
        />

        <div className="main" id="main">
          {view === "project" ? (
            activeProject ? (
              <ProjectView
                project={activeProject}
                categories={categories}
                currentWeek={currentWeek}
                content={currentContent}
                saveState={saveState}
                query={query}
                onEditProject={() => setProjectModal({ mode: "edit", project: activeProject })}
                onOpenResource={(categoryId) => setResourceModal({ projectId: activeProject.id, categoryId })}
                onOpenCategoryManager={() => setCategoryOpen(true)}
                onEditResource={(r) => setResourceModal({ projectId: r.projectId, resource: r })}
                onDeleteResource={deleteResource}
                onNotify={notify}
                onContentChange={handleContentChange}
                onBlurSave={saveCurrentWeek}
                onGotoTasks={() => setView("tasks")}
              />
            ) : (
              <div className="empty" style={{ margin: "80px auto", maxWidth: 420 }}>
                <p>还没有项目。点击左侧「新建项目」开始记录资源与环境。</p>
              </div>
            )
          ) : (
            <TasksView
              weekNotes={weekNotes}
              currentWeek={currentWeek}
              content={currentContent}
              saveState={saveState}
              onContentChange={handleContentChange}
              onBlurSave={saveCurrentWeek}
              onOpenWeek={(n) => setWeekModal(n)}
            />
          )}
        </div>

        {projectModal && (
          <ProjectForm
            mode={projectModal.mode}
            initial={
              projectModal.project
                ? { name: projectModal.project.name, desc: projectModal.project.desc, color: projectModal.project.color }
                : null
            }
            onClose={() => setProjectModal(null)}
            onSubmit={(d) => (projectModal.mode === "create" ? createProject(d) : updateProject(d))}
            onDelete={projectModal.mode === "edit" ? deleteProject : undefined}
          />
        )}

        {resourceModal && (
          <ResourceForm
            categories={categories}
            defaultCategoryId={resourceModal.categoryId}
            initial={resourceModal.resource ?? null}
            onClose={() => setResourceModal(null)}
            onSubmit={(d) => (resourceModal.resource ? updateResource(d) : createResource(d))}
          />
        )}

        {categoryOpen && (
          <CategoryManager
            categories={categories.map((c) => ({
              ...c,
              _count: { resources: categoryCounts.get(c.id) ?? 0 },
            }))}
            onClose={() => setCategoryOpen(false)}
            onAdd={addCategory}
            onDelete={deleteCategory}
          />
        )}

        {weekModal && (
          <WeekDetailModal
            note={weekModal}
            onClose={() => setWeekModal(null)}
            onSave={(content) => saveWeekNote(weekModal, content)}
          />
        )}

        {toast && (
          <div className={`toast${toast.err ? " err" : ""}`} role="status">
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
