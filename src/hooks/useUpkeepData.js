import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  completeUpkeepTaskRecord,
  createUpkeepTaskRecord,
  loadUpkeepTasks,
  updateUpkeepTaskRecord,
} from "../services/upkeepService";

import { canAccessAreaCode } from "../utils/areaAccess";

export function useUpkeepData({
  profile,
  enabled,
}) {
  const profileId = profile?.id ?? null;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] =
    useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !profileId) {
      setTasks([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextTasks =
        await loadUpkeepTasks();

      setTasks(nextTasks);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Upkeep schedules could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, profileId]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [refresh]);

  const createTask = useCallback(
    async (formData) => {
      if (!profileId) {
        throw new Error(
          "An authenticated profile is required.",
        );
      }

      if (
        !canAccessAreaCode(
          profile,
          formData.areaCode,
        )
      ) {
        throw new Error(
          "You cannot create an upkeep schedule for this area.",
        );
      }

      const createdTask =
        await createUpkeepTaskRecord({
          ...formData,
          createdBy: profileId,
        });

      setTasks((currentTasks) =>
        [...currentTasks, createdTask].sort(
          (firstTask, secondTask) =>
            new Date(firstTask.nextDue).getTime() -
            new Date(secondTask.nextDue).getTime(),
        ),
      );

      return createdTask;
    },
    [profile, profileId],
  );

  const updateTask = useCallback(
    async (formData) => {
      if (
        !canAccessAreaCode(
          profile,
          formData.areaCode,
        )
      ) {
        throw new Error(
          "You cannot update an upkeep schedule for this area.",
        );
      }
      const updatedTask =
        await updateUpkeepTaskRecord(formData);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id
            ? updatedTask
            : task,
        ),
      );

      return updatedTask;
    },
    [profile],
  );

  const completeTask = useCallback(
    async ({
      taskId,
      note = "",
    }) => {
      const task = tasks.find(
        (currentTask) =>
          currentTask.id === taskId,
      );

      if (
        !task ||
        !canAccessAreaCode(
          profile,
          task.areaCode,
        )
      ) {
        throw new Error(
          "You cannot complete an upkeep task for this area.",
        );
      }
      const completedTask =

        await completeUpkeepTaskRecord({
          taskId,
          note,
        });

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === completedTask.id
            ? completedTask
            : task,
        ),
      );

      return completedTask;
    },
    [profile, tasks],
  );

  return {
    tasks,
    loading,
    error,
    refresh,
    createTask,
    updateTask,
    completeTask,
  };
}