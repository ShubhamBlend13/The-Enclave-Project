import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createManagedUser,
  loadVisibleUsers,
  resetManagedUserPassword,
  setManagedUserActive,
} from "../services/userService";

export function useUserData({
  profile,
  enabled,
}) {
  const profileId = profile?.id ?? null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] =
    useState(enabled);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !profileId) {
      setUsers([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const visibleUsers =
        await loadVisibleUsers();

      setUsers(visibleUsers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Accounts could not be loaded.",
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

  const createUser = useCallback(
    async (formData) => {
      const createdUser =
        await createManagedUser(formData);

      setUsers((currentUsers) =>
        [...currentUsers, createdUser].sort(
          (firstUser, secondUser) =>
            firstUser.fullName.localeCompare(
              secondUser.fullName,
            ),
        ),
      );

      return createdUser;
    },
    [],
  );

  const resetPassword = useCallback(
    async ({
      userId,
      temporaryPassword,
    }) => {
      const result =
        await resetManagedUserPassword({
          userId,
          temporaryPassword,
        });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
              ...user,
              mustChangePassword: true,
            }
            : user,
        ),
      );

      return result;
    },
    [],
  );

  const setUserActive = useCallback(
    async ({
      userId,
      isActive,
    }) => {
      const result =
        await setManagedUserActive({
          userId,
          isActive,
        });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
              ...user,
              isActive,
            }
            : user,
        ),
      );

      return result;
    },
    [],
  );

  return {
    users,
    loading,
    error,
    refresh,
    createUser,
    resetPassword,
    setUserActive,
  };
}