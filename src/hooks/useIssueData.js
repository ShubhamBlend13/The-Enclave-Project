import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { loadAccessibleAreas } from "../services/areaService";
import {
  addIssueUpdateRecord,
  createIssueRecord,
  loadIssues,
} from "../services/issueService";

export function useIssueData({
  profile,
  enabled,
}) {
  const [areas, setAreas] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] =
    useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !profile?.id) {
      setAreas([]);
      setIssues([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextAreas, nextIssues] =
        await Promise.all([
          loadAccessibleAreas(),
          loadIssues(),
        ]);

      setAreas(nextAreas);
      setIssues(nextIssues);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Issue data could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, profile?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createIssue = useCallback(
    async (formData) => {
      const area = areas.find(
        (item) =>
          item.code === formData.areaCode,
      );

      if (!area) {
        throw new Error(
          "You cannot report an issue for that area.",
        );
      }

      const createdIssue =
        await createIssueRecord({
          areaId: area.id,
          reportedBy: profile.id,
          category: formData.category,
          location: formData.location,
          description: formData.description,
          priority: formData.priority,
        });

      setIssues((currentIssues) => [
        createdIssue,
        ...currentIssues,
      ]);

      return createdIssue;
    },
    [areas, profile?.id],
  );

  const applyIssueUpdate = useCallback(
    async (updatedIssue) => {
      const currentIssue = issues.find(
        (issue) =>
          issue.id === updatedIssue.id,
      );

      if (!currentIssue) {
        throw new Error(
          "The issue could not be found.",
        );
      }

      const latestUpdate =
        updatedIssue.updates?.at(-1);

      if (!latestUpdate?.message?.trim()) {
        throw new Error(
          "An update message is required.",
        );
      }

      const newStatus =
        updatedIssue.status !==
        currentIssue.status
          ? updatedIssue.status
          : null;

      const refreshedIssue =
        await addIssueUpdateRecord({
          issueId: updatedIssue.id,
          message:
            latestUpdate.message.trim(),
          newStatus,
        });

      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === refreshedIssue.id
            ? refreshedIssue
            : issue,
        ),
      );

      return refreshedIssue;
    },
    [issues],
  );

  return {
    areas,
    issues,
    loading,
    error,
    refresh,
    createIssue,
    applyIssueUpdate,
  };
}