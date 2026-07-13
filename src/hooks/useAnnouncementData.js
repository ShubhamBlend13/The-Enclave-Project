import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createAnnouncementRecord,
  loadAnnouncements,
} from "../services/announcementService";

export function useAnnouncementData({
  profile,
  enabled,
}) {
  const profileId = profile?.id ?? null;

  const [announcements, setAnnouncements] =
    useState([]);

  const [loading, setLoading] =
    useState(enabled);

  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !profileId) {
      setAnnouncements([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextAnnouncements =
        await loadAnnouncements();

      setAnnouncements(nextAnnouncements);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Announcements could not be loaded.",
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

  const createAnnouncement = useCallback(
    async (formData) => {
      if (!profileId) {
        throw new Error(
          "An authenticated profile is required.",
        );
      }

      const createdAnnouncement =
        await createAnnouncementRecord({
          areaCode: formData.areaCode,
          title: formData.title,
          body: formData.body,
          createdBy: profileId,
        });

      setAnnouncements(
        (currentAnnouncements) => [
          createdAnnouncement,
          ...currentAnnouncements,
        ],
      );

      return createdAnnouncement;
    },
    [profileId],
  );

  return {
    announcements,
    loading,
    error,
    refresh,
    createAnnouncement,
  };
}