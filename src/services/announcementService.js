import { supabase } from "../lib/supabase";

const ANNOUNCEMENT_SELECT = `
  id,
  title,
  body,
  is_active,
  created_at,
  area:areas!announcements_area_id_fkey (
    id,
    code,
    name,
    type
  ),
  author:profiles!announcements_created_by_fkey (
    id,
    full_name
  )
`;

function mapAnnouncement(row) {
  return {
    id: row.id,
    areaCode: row.area?.code ?? null,
    title: row.title,
    body: row.body,
    createdBy:
      row.author?.full_name ??
      "Villa administration",
    createdAt: row.created_at,
    isActive: row.is_active,
  };
}

export async function loadAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("is_active", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Announcements could not be loaded: ${error.message}`,
    );
  }

  return (data ?? []).map(mapAnnouncement);
}

async function loadAreaByCode(areaCode) {
  const { data, error } = await supabase
    .from("areas")
    .select("id, code, name, type")
    .eq("code", areaCode)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error(
      "You cannot post an announcement to that area.",
    );
  }

  return data;
}

export async function createAnnouncementRecord({
  areaCode,
  title,
  body,
  createdBy,
}) {
  const area = await loadAreaByCode(areaCode);

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      area_id: area.id,
      title: title.trim(),
      body: body.trim(),
      created_by: createdBy,
      is_active: true,
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();

  if (error || !data) {
    throw new Error(
      `Announcement could not be posted: ${
        error?.message ?? "Unknown error"
      }`,
    );
  }

  return mapAnnouncement(data);
}