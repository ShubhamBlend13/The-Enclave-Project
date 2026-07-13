import { supabase } from "../lib/supabase";

export async function loadAccessibleAreas() {
  const { data, error } = await supabase
    .from("areas")
    .select(
      `
        id,
        code,
        name,
        type,
        is_active
      `,
    )
    .eq("is_active", true)
    .order("code");

  if (error) {
    throw new Error(
      `Areas could not be loaded: ${error.message}`,
    );
  }

  return data ?? [];
}