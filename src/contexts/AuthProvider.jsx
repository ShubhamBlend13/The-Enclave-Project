import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { supabase } from "../lib/supabase";
import {
    changeCurrentPassword,
    loadCurrentProfile,
    signInWithIdentity,
    signOutCurrentSession,
} from "../services/authService";
import { AuthContext } from "./authContext";

function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] =
        useState("");

    const hydrateSession = useCallback(
        async (nextSession) => {
            setSession(nextSession);

            if (!nextSession) {
                setProfile(null);
                setProfileError("");
                setLoading(false);
                return;
            }

            setLoading(true);
            setProfileError("");

            try {
                const nextProfile =
                    await loadCurrentProfile(
                        nextSession.user.id,
                    );

                setProfile(nextProfile);
            } catch (error) {
                setProfile(null);
                setProfileError(
                    error instanceof Error
                        ? error.message
                        : "The profile could not be loaded.",
                );
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        let mounted = true;

        const initialiseSession = async () => {
            const { data, error } =
                await supabase.auth.getSession();

            if (!mounted) {
                return;
            }

            if (error) {
                setProfileError(
                    "The saved session could not be loaded.",
                );
                setLoading(false);
                return;
            }

            await hydrateSession(data.session);
        };

        void initialiseSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, nextSession) => {
                if (!mounted) {
                    return;
                }

                void hydrateSession(nextSession);
            },
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [hydrateSession]);

    const login = useCallback(
        async (credentials) => {
            setProfileError("");
            setLoading(true);

            try {
                const nextSession =
                    await signInWithIdentity(credentials);

                await hydrateSession(nextSession);
            } catch (error) {
                setLoading(false);
                throw error;
            }
        },
        [hydrateSession],
    );

    const completePasswordChange = useCallback(
        async (newPassword) => {
            await changeCurrentPassword(newPassword);

            setProfile((currentProfile) =>
                currentProfile
                    ? {
                        ...currentProfile,
                        mustChangePassword: false,
                    }
                    : currentProfile,
            );
        },
        [],
    );

    const logout = useCallback(async () => {
        await signOutCurrentSession();

        setSession(null);
        setProfile(null);
        setProfileError("");
    }, []);

    const retryProfile = useCallback(async () => {
        if (!session) {
            return;
        }

        await hydrateSession(session);
    }, [hydrateSession, session]);

    const value = useMemo(
        () => ({
            session,
            profile,
            loading,
            profileError,
            login,
            logout,
            completePasswordChange,
            retryProfile,
        }),
        [
            session,
            profile,
            loading,
            profileError,
            login,
            logout,
            completePasswordChange,
            retryProfile,
        ],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;