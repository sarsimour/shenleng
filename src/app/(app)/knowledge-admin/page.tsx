"use client";

import { useEffect, useState } from "react";

import {
  KnowledgeAccess,
  KnowledgeDoc,
  KnowledgeDocType,
  addKnowledgeDoc,
  deleteKnowledgeDoc,
  fetchMyOrganizationId,
  listKnowledgeDocs,
  updateKnowledgeDoc,
} from "@/lib/knowledge-api";

const ACCESS_OPTIONS: KnowledgeAccess[] = ["org", "public", "secret"];
const TYPE_OPTIONS: KnowledgeDocType[] = ["file", "web", "picture"];

function EmptyDocForm() {
  return {
    name: "",
    accessibility: "org" as KnowledgeAccess,
    docType: "file" as KnowledgeDocType,
    description: "",
    file: null as File | null,
    refreshContent: false,
  };
}

export default function KnowledgeAdminPage() {
  const [orgId, setOrgId] = useState("");
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState(EmptyDocForm());
  const [updateForm, setUpdateForm] = useState(EmptyDocForm());
  const [deleteName, setDeleteName] = useState("");
  const [deleteAccess, setDeleteAccess] = useState<KnowledgeAccess>("org");

  const loadDocs = async (targetOrgId: string) => {
    if (!targetOrgId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listKnowledgeDocs(targetOrgId.trim());
      setDocs(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const autoOrgId = await fetchMyOrganizationId();
        if (mounted && autoOrgId) {
          setOrgId(autoOrgId);
          await loadDocs(autoOrgId);
        }
      } catch {
        // Ignore auto-load errors; manual org input remains available.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const resetStatus = () => {
    setMessage(null);
    setError(null);
  };

  const handleAdd = async () => {
    resetStatus();
    if (!orgId.trim() || !addForm.name.trim()) {
      setError("请填写 org_id 和文档名");
      return;
    }
    if ((addForm.docType === "file" || addForm.docType === "picture") && !addForm.file) {
      setError("file/picture 类型需要上传文件");
      return;
    }

    setLoading(true);
    try {
      await addKnowledgeDoc({
        name: addForm.name.trim(),
        orgId: orgId.trim(),
        accessibility: addForm.accessibility,
        docType: addForm.docType,
        description: addForm.description.trim(),
        file: addForm.file,
      });
      setMessage("文档新增成功");
      setAddForm(EmptyDocForm());
      await loadDocs(orgId.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "新增失败");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    resetStatus();
    if (!orgId.trim() || !updateForm.name.trim()) {
      setError("请填写 org_id 和待更新文档名");
      return;
    }

    setLoading(true);
    try {
      await updateKnowledgeDoc({
        name: updateForm.name.trim(),
        orgId: orgId.trim(),
        accessibility: updateForm.accessibility,
        docType: updateForm.docType,
        description: updateForm.description.trim(),
        refreshContent: updateForm.refreshContent,
        file: updateForm.file,
      });
      setMessage("文档更新成功");
      setUpdateForm(EmptyDocForm());
      await loadDocs(orgId.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    resetStatus();
    if (!orgId.trim() || !deleteName.trim()) {
      setError("请填写 org_id 和待删除文档名");
      return;
    }

    setLoading(true);
    try {
      await deleteKnowledgeDoc(deleteName.trim(), orgId.trim(), deleteAccess);
      setMessage("文档删除成功");
      setDeleteName("");
      await loadDocs(orgId.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">知识库管理（VerseCore）</h1>
          <p className="mt-2 text-sm text-slate-600">
            用于管理组织知识文档（增删改查）。请求会自动携带 `X-App-ID=logistics-web`。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="org_id"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            />
            <button
              onClick={() => loadDocs(orgId)}
              className="rounded-md bg-brand-deep px-4 py-2 text-sm font-semibold text-white"
              disabled={loading}
            >
              刷新列表
            </button>
          </div>
        </div>

        {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">{message}</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">新增文档</h2>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="文档名（web 类型填 URL）"
                value={addForm.name}
                onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
              />
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="描述"
                value={addForm.description}
                onChange={(e) => setAddForm((s) => ({ ...s, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={addForm.docType}
                  onChange={(e) =>
                    setAddForm((s) => ({ ...s, docType: e.target.value as KnowledgeDocType, file: null }))
                  }
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={addForm.accessibility}
                  onChange={(e) => setAddForm((s) => ({ ...s, accessibility: e.target.value as KnowledgeAccess }))}
                >
                  {ACCESS_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              {(addForm.docType === "file" || addForm.docType === "picture") && (
                <input
                  className="w-full text-sm"
                  type="file"
                  onChange={(e) => setAddForm((s) => ({ ...s, file: e.target.files?.[0] ?? null }))}
                />
              )}
              <button
                onClick={handleAdd}
                className="w-full rounded-md bg-brand-deep px-4 py-2 text-sm font-semibold text-white"
                disabled={loading}
              >
                新增
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">更新文档</h2>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="文档名"
                value={updateForm.name}
                onChange={(e) => setUpdateForm((s) => ({ ...s, name: e.target.value }))}
              />
              <textarea
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="描述"
                value={updateForm.description}
                onChange={(e) => setUpdateForm((s) => ({ ...s, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={updateForm.docType}
                  onChange={(e) =>
                    setUpdateForm((s) => ({ ...s, docType: e.target.value as KnowledgeDocType, file: null }))
                  }
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={updateForm.accessibility}
                  onChange={(e) =>
                    setUpdateForm((s) => ({ ...s, accessibility: e.target.value as KnowledgeAccess }))
                  }
                >
                  {ACCESS_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              {(updateForm.docType === "file" || updateForm.docType === "picture") && (
                <input
                  className="w-full text-sm"
                  type="file"
                  onChange={(e) => setUpdateForm((s) => ({ ...s, file: e.target.files?.[0] ?? null }))}
                />
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={updateForm.refreshContent}
                  onChange={(e) => setUpdateForm((s) => ({ ...s, refreshContent: e.target.checked }))}
                />
                refresh_content（重新解析内容）
              </label>
              <button
                onClick={handleUpdate}
                className="w-full rounded-md bg-brand-deep px-4 py-2 text-sm font-semibold text-white"
                disabled={loading}
              >
                更新
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">删除文档</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              placeholder="文档名"
              value={deleteName}
              onChange={(e) => setDeleteName(e.target.value)}
            />
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={deleteAccess}
              onChange={(e) => setDeleteAccess(e.target.value as KnowledgeAccess)}
            >
              {ACCESS_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDelete}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            删除
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">文档列表</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-2 py-2">name</th>
                  <th className="px-2 py-2">type</th>
                  <th className="px-2 py-2">access</th>
                  <th className="px-2 py-2">description</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={`${doc.name}-${doc.doc_type}`} className="border-b border-slate-100">
                    <td className="px-2 py-2 font-medium text-slate-900">{doc.name}</td>
                    <td className="px-2 py-2">{doc.doc_type}</td>
                    <td className="px-2 py-2">{doc.accessibility}</td>
                    <td className="px-2 py-2 text-slate-600">{doc.description || "-"}</td>
                  </tr>
                ))}
                {!docs.length && (
                  <tr>
                    <td className="px-2 py-4 text-slate-500" colSpan={4}>
                      暂无文档
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
