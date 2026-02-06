import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";

export type UserRole = "super_admin" | "admin" | "warehouse" | "sales";

interface User {
    id: string;
    email: string; // Store username here for admins if email is not available
    name: string;
    role: UserRole;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    adminSignIn: (username: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
    simpleSignIn: (role: UserRole) => void;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
    updateProfile: (name: string, role: UserRole) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,


            adminSignIn: async (username: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    console.log("🔐 Admin Sign In: Verifying credentials for:", username);

                    // 1. Verify against custom table
                    const { data, error } = await supabase
                        .from('admins')
                        .select('*')
                        .eq('username', username)
                        .eq('password', password) // Note: In production, use hashing!
                        .maybeSingle();

                    if (error) {
                        console.error("❌ Supabase Error checking admins table:", error);
                    }

                    if (!data) {
                        throw new Error("Invalid username or password");
                    }

                    // 2. Establish Supabase Session (Anonymous)
                    const { error: authError } = await supabase.auth.signInAnonymously();
                    if (authError) throw authError;

                    // 3. Sync Identity to Supabase Session Metadata
                    const { error: updateError } = await supabase.auth.updateUser({
                        data: {
                            name: data.username,
                            role: data.role,
                            email: data.username // Store as metadata since anon user has no email
                        }
                    });

                    if (updateError) console.warn("Failed to update session metadata", updateError);

                    const user: User = {
                        id: data.id,
                        email: data.username,
                        name: data.username,
                        role: data.role as UserRole,
                    };

                    // Update metadata with custom ID too
                    await supabase.auth.updateUser({
                        data: { custom_id: data.id }
                    });

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    console.error("❌ Admin Sign In failed:", error);
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error.message || "Failed to sign in",
                    });
                    throw error;
                }
            },


            signUp: async (email: string, password: string, name: string, role: UserRole) => {
                set({ isLoading: true, error: null });
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                name,
                                role,
                            },
                        },
                    });

                    if (error) throw error;

                    if (data.user) {
                        const user: User = {
                            id: data.user.id,
                            email: data.user.email!,
                            name,
                            role,
                        };

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    }
                } catch (error: any) {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error.message || "Failed to sign up",
                    });
                    throw error;
                }
            },


            simpleSignIn: async (role: UserRole) => {
                console.log("🔓 Simple Sign In: Logging in as", role);
                set({ isLoading: true, error: null });

                try {
                    const { error } = await supabase.auth.signInAnonymously();
                    if (error) throw error;

                    // Sync metadata
                    await supabase.auth.updateUser({
                        data: {
                            role: role,
                            name: role.charAt(0).toUpperCase() + role.slice(1),
                            custom_id: `${role}-${Date.now()}` // Persist legacy ID format
                        }
                    });

                    const user: User = {
                        id: `${role}-${Date.now()}`,
                        email: `${role}@example.com`,
                        name: role.charAt(0).toUpperCase() + role.slice(1),
                        role,
                    };

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (err: any) {
                    console.error("Simple sign in auth failed:", err);
                    set({
                        isLoading: false,
                        error: "Failed to establish database connection"
                    });
                }
            },

            signOut: async () => {
                set({ isLoading: true, error: null });
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;

                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || "Failed to sign out",
                    });
                    throw error;
                }
            },

            checkSession: async () => {
                set({ isLoading: true });
                try {
                    const { data: { session }, error } = await supabase.auth.getSession();

                    if (error) throw error;

                    if (session?.user) {
                        const metadata = session.user.user_metadata || {};

                        // Construct User object, preferring metadata if available (for anon users)
                        const user: User = {
                            id: metadata.custom_id || session.user.id,
                            email: session.user.email || metadata.email || "anonymous",
                            name: metadata.name || session.user.email?.split('@')[0] || "User",
                            role: (metadata.role as UserRole) || "sales", // Default fallback
                        };

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null,
                        });
                    } else {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            error: null,
                        });
                    }
                } catch (error: any) {
                    // Don't log out purely on network error if we have a persisted session?
                    // But here we assume session check failed means token is invalid.
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: error.message || "Failed to check session",
                    });
                }
            },

            clearError: () => set({ error: null }),

            updateProfile: async (name: string, role: UserRole) => {
                set({ isLoading: true, error: null });
                try {
                    const { data, error } = await supabase.auth.updateUser({
                        data: {
                            name,
                            role,
                        },
                    });

                    if (error) throw error;

                    if (data.user) {
                        const user: User = {
                            id: data.user.id,
                            email: data.user.email!,
                            name,
                            role,
                        };

                        set({
                            user,
                            isLoading: false,
                            error: null,
                        });
                    }
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || "Failed to update profile",
                    });
                    throw error;
                }
            },
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);

// Note: onAuthStateChange listener removed to prevent conflicts with immediate navigation
// The checkSession method handles session restoration on app load
// and signIn/signOut methods handle state updates directly
