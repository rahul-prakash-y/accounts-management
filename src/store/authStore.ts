import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "salesman" | "inventory";

interface User {
    name: string;
    role: UserRole;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    signIn: (role: UserRole) => void;
    signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            signIn: (role) =>
                set({
                    user: { name: role.charAt(0).toUpperCase() + role.slice(1), role },
                    isAuthenticated: true,
                }),
            signOut: () => set({ user: null, isAuthenticated: false }),
        }),
        {
            name: "auth-storage",
        },
    ),
);
