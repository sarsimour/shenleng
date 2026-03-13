import { authedProxyFetch } from "@/lib/chatbot-api";

export type KnowledgeDocType = "web" | "file" | "picture";
export type KnowledgeAccess = "public" | "org" | "secret";

export interface KnowledgeDoc {
  name: string;
  doc_type: KnowledgeDocType;
  accessibility: KnowledgeAccess;
  file_path?: string | null;
  description?: string | null;
}

type AddDocInput = {
  name: string;
  orgId: string;
  accessibility: KnowledgeAccess;
  docType: KnowledgeDocType;
  description?: string;
  file?: File | null;
};

type UpdateDocInput = {
  name: string;
  orgId: string;
  accessibility: KnowledgeAccess;
  docType: KnowledgeDocType;
  description?: string;
  refreshContent?: boolean;
  file?: File | null;
};

function toFormData(input: Record<string, string | boolean | File | null | undefined>): FormData {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "boolean") {
      form.append(key, value ? "true" : "false");
      return;
    }
    form.append(key, value);
  });
  return form;
}

async function parseError(res: Response): Promise<Error> {
  const text = await res.text();
  return new Error(text || `Request failed (${res.status})`);
}

export async function fetchMyOrganizationId(): Promise<string | null> {
  const res = await authedProxyFetch("/users/me/organization");
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  const orgId = data?.organization_id;
  return typeof orgId === "string" && orgId ? orgId : null;
}

export async function listKnowledgeDocs(orgId: string): Promise<KnowledgeDoc[]> {
  const params = new URLSearchParams({ org_id: orgId });
  const res = await authedProxyFetch(`/knowledge/get_docs?${params.toString()}`);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function addKnowledgeDoc(input: AddDocInput): Promise<void> {
  const form = toFormData({
    name: input.name,
    org_id: input.orgId,
    accessibility: input.accessibility,
    doc_type: input.docType,
    description: input.description ?? "",
    file: input.file ?? null,
  });
  const res = await authedProxyFetch("/knowledge/add_doc", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw await parseError(res);
}

export async function updateKnowledgeDoc(input: UpdateDocInput): Promise<void> {
  const form = toFormData({
    name: input.name,
    org_id: input.orgId,
    accessibility: input.accessibility,
    doc_type: input.docType,
    description: input.description ?? "",
    refresh_content: !!input.refreshContent,
    file: input.file ?? null,
  });
  const res = await authedProxyFetch("/knowledge/update_doc", {
    method: "PUT",
    body: form,
  });
  if (!res.ok) throw await parseError(res);
}

export async function deleteKnowledgeDoc(
  name: string,
  orgId: string,
  accessibility: KnowledgeAccess,
): Promise<void> {
  const form = toFormData({
    name,
    org_id: orgId,
    accessibility,
  });
  const res = await authedProxyFetch("/knowledge/delete_doc", {
    method: "DELETE",
    body: form,
  });
  if (!res.ok) throw await parseError(res);
}
