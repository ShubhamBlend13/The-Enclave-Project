import { supabase } from "../lib/supabase";

const ISSUE_SELECT = `
  id,
  category,
  location,
  description,
  priority,
  status,
  created_at,
  updated_at,
  resolved_at,
  area:areas!issues_area_id_fkey (
    id,
    code,
    name,
    type
  ),
  reporter:profiles!issues_reported_by_fkey (
    id,
    full_name
  ),
  updates:issue_updates (
    id,
    message,
    old_status,
    new_status,
    created_at,
    author:profiles!issue_updates_created_by_fkey (
      id,
      full_name
    )
  )
`;

function mapIssue(row) {
  const timeline = [...(row.updates ?? [])]
    .sort(
      (first, second) =>
        new Date(first.created_at).getTime() -
        new Date(second.created_at).getTime(),
    )
    .map((update) => ({
      id: update.id,
      message: update.message,
      oldStatus: update.old_status,
      newStatus: update.new_status,
      createdAt: update.created_at,

      // Some roles may not have permission to read every
      // author's complete profile.
      createdBy:
        update.author?.full_name ??
        "Enclave team",
    }));

  return {
    id: row.id,
    areaCode: row.area?.code ?? null,
    category: row.category,
    location: row.location ?? "",
    description: row.description,
    priority: row.priority,
    status: row.status,
    reportedBy:
      row.reporter?.full_name ?? "Resident",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    updates: timeline,
  };
}

export async function loadIssues() {
  const { data, error } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Issues could not be loaded: ${error.message}`,
    );
  }

  return (data ?? []).map(mapIssue);
}

export async function loadIssue(issueId) {
  const { data, error } = await supabase
    .from("issues")
    .select(ISSUE_SELECT)
    .eq("id", issueId)
    .single();

  if (error || !data) {
    throw new Error(
      `Issue could not be loaded: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  return mapIssue(data);
}

export async function createIssueRecord({
  areaId,
  reportedBy,
  category,
  location,
  description,
  priority,
}) {
  const { data, error } = await supabase
    .from("issues")
    .insert({
      area_id: areaId,
      reported_by: reportedBy,
      category,
      location: location || null,
      description,
      priority,
      status: "open",
      resolved_at: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `Issue could not be submitted: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  // The database trigger has now created the first timeline entry.
  return loadIssue(data.id);
}

export async function addIssueUpdateRecord({
  issueId,
  message,
  newStatus = null,
}) {
  const { error } = await supabase.rpc(
    "add_issue_update",
    {
      p_issue_id: issueId,
      p_message: message,
      p_new_status: newStatus,
    },
  );

  if (error) {
    throw new Error(
      `Issue could not be updated: ${error.message}`,
    );
  }

  return loadIssue(issueId);
}