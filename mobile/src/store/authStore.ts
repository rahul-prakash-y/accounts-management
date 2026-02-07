import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { comparePassword } from '@/services/hashing'

export type UserRole = "super_admin" | "admin" | "warehouse" | "sales" | "guest";

interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    adminSignIn: (username: string, password: string) => Promise<void>;
    staffEnter: (role: "sales" | "warehouse") => Promise<void>; // "Public Mode"
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            adminSignIn: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Fetch admin by username (password comparison happens locally via bcrypt)
                    const { data, error } = await supabase
                        .from('admins')
                        .select('*')
                        .eq('username', username)
                        .maybeSingle();

                    if (error) {
                        console.error("Admin check failed", error);
                        throw new Error("Login service unavailable");
                    }

                    if (!data) throw new Error("Invalid credentials");

                    // 2. Verify password hash
                    const isPasswordMatch = await comparePassword(password, data.password);
                    if (!isPasswordMatch) throw new Error("Invalid credentials");

                    // 3. SignIn Anonymously to get a token but with metadata
                    const { error: authError } = await supabase.auth.signInAnonymously();
                    if (authError) throw authError;

                    // 3. Update User Metadata
                    await supabase.auth.updateUser({
                        data: {
                            name: data.username,
                            role: data.role,
                            username: data.username
                        }
                    });

                    const user: User = {
                        id: data.id,
                        email: data.username,
                        name: data.username,
                        role: data.role as UserRole
                    };

                    set({ user, isAuthenticated: true, error: null });
                } catch (e: any) {
                    set({ error: e.message });
                    throw e;
                } finally {
                    set({ isLoading: false });
                }
            },

            staffEnter: async (targetRole) => {
                set({ isLoading: true, error: null });
                try {
                    // For staff mode, we also want a backend session for Syncing to work
                    const { error } = await supabase.auth.signInAnonymously();
                    if (error) throw error;

                    await supabase.auth.updateUser({
                        data: {
                            role: targetRole,
                            name: targetRole === 'sales' ? 'Sales Staff' : 'Warehouse Staff'
                        }
                    });

                    const user: User = {
                        id: 'local-staff-' + Date.now(),
                        email: `${targetRole}@local`,
                        name: targetRole === 'sales' ? 'Sales Staff' : 'Warehouse Staff',
                        role: targetRole
                    };

                    set({ user, isAuthenticated: true, error: null });
                } catch (e: any) {
                    // Even if network fails, allow entering in offline mode if we want?
                    // But Supabase client needs a session for RLS usually.
                    // For now, assume we need at least one successful connect or we operate completely offline 
                    // and sync later. But WatermelonDB sync needs auth.
                    // Let's allow entry but log error.
                    console.warn("Staff enter auth failed (optimistic offline):", e);

                    const user: User = {
                        id: 'offline-staff',
                        email: `${targetRole}@offline`,
                        name: targetRole === 'sales' ? 'Sales Staff' : 'Warehouse Staff',
                        role: targetRole
                    };
                    set({ user, isAuthenticated: true, error: null });
                } finally {
                    set({ isLoading: false });
                }
            },

            signOut: async () => {
                try {
                    await supabase.auth.signOut();
                } catch (e) {
                    console.error("Supabase signOut error", e);
                } finally {
                    set({ user: null, isAuthenticated: false });
                }
            },

            checkSession: async () => {
                // Restore session logic
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const metadata = session.user.user_metadata || {};
                    // If we have persisted state, we might trust it more or merge it.
                    // For now, rely on zustand persist, but validate with supabase if online.
                }
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
)
