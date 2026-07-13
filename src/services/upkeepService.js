import { supabase } from "../lib/supabase";

import { isPastEnclaveDate } from "../utils/date";

const UPKEEP_SELECT = `
  id,
  title,
  icon,
  frequency,
  next_due,
  last_completed_at,
  is_active,
  created_at,
  updated_at,
  area:areas!upkeep_tasks_area_id_fkey (
    id,
    code,
    name,
    type
  ),
  history:upkeep_history (
    id,
    completed_at,
    note,
    completed_by,
    completed_by_profile:profiles!upkeep_history_completed_by_fkey (
      id,
      full_name
    )
  )
`;

function validateNextDue(nextDue) {
    if (!nextDue) {
        throw new Error(
            "Choose a next due date.",
        );
    }

    const dateValue = String(nextDue).slice(0, 10);

    if (isPastEnclaveDate(dateValue)) {
        throw new Error(
            "Next due date cannot be in the past.",
        );
    }
}

function mapUpkeepTask(row) {
    const history = [...(row.history ?? [])]
        .sort(
            (first, second) =>
                new Date(second.completed_at).getTime() -
                new Date(first.completed_at).getTime(),
        )
        .map((entry) => ({
            id: entry.id,
            completedAt: entry.completed_at,
            note: entry.note ?? "",
            completedById: entry.completed_by,
            completedBy:
                entry.completed_by_profile?.full_name ??
                "Enclave upkeep",
        }));

    return {
        id: row.id,
        areaCode: row.area?.code ?? null,
        title: row.title,
        icon: row.icon,
        frequency: row.frequency,
        nextDue: row.next_due,
        lastCompletedAt: row.last_completed_at,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        history,
    };
}

export async function loadUpkeepTasks() {
    const { data, error } = await supabase
        .from("upkeep_tasks")
        .select(UPKEEP_SELECT)
        .eq("is_active", true)
        .order("next_due", {
            ascending: true,
        });

    if (error) {
        throw new Error(
            `Upkeep schedules could not be loaded: ${error.message}`,
        );
    }

    return (data ?? []).map(mapUpkeepTask);
}

async function loadAreaByCode(areaCode) {
    const { data, error } = await supabase
        .from("areas")
        .select("id, code")
        .eq("code", areaCode)
        .eq("is_active", true)
        .single();

    if (error || !data) {
        throw new Error(
            "The selected upkeep area is not available.",
        );
    }

    return data;
}

export async function createUpkeepTaskRecord({
    areaCode,
    title,
    icon,
    frequency,
    nextDue,
    createdBy,
}) {
    validateNextDue(nextDue);

    const area = await loadAreaByCode(areaCode);

    const { data, error } = await supabase
        .from("upkeep_tasks")
        .insert({
            area_id: area.id,
            title: title.trim(),
            icon: icon || "🛠️",
            frequency,
            next_due: nextDue,
            last_completed_at: null,
            is_active: true,
            created_by: createdBy,
        })
        .select(UPKEEP_SELECT)
        .single();

    if (error || !data) {
        throw new Error(
            `Upkeep schedule could not be created: ${error?.message ?? "Unknown error"
            }`,
        );
    }

    return mapUpkeepTask(data);
}

export async function updateUpkeepTaskRecord({
    taskId,
    areaCode,
    title,
    icon,
    frequency,
    nextDue,
}) {
    validateNextDue(nextDue);

    const area = await loadAreaByCode(areaCode);

    const { data, error } = await supabase
        .from("upkeep_tasks")
        .update({
            area_id: area.id,
            title: title.trim(),
            icon: icon || "🛠️",
            frequency,
            next_due: nextDue,
        })
        .eq("id", taskId)
        .select(UPKEEP_SELECT)
        .single();

    if (error || !data) {
        throw new Error(
            `Upkeep schedule could not be updated: ${error?.message ?? "Unknown error"
            }`,
        );
    }

    return mapUpkeepTask(data);
}

export async function completeUpkeepTaskRecord({
    taskId,
    note = "",
}) {
    const { error } = await supabase.rpc(
        "complete_upkeep_task",
        {
            p_task_id: taskId,
            p_note: note,
        },
    );

    if (error) {
        throw new Error(
            `Upkeep task could not be completed: ${error.message}`,
        );
    }

    const { data, error: loadError } = await supabase
        .from("upkeep_tasks")
        .select(UPKEEP_SELECT)
        .eq("id", taskId)
        .single();

    if (loadError || !data) {
        throw new Error(
            `Completed upkeep task could not be reloaded: ${loadError?.message ?? "Unknown error"
            }`,
        );
    }

    return mapUpkeepTask(data);
}