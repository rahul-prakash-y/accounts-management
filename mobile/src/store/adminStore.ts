import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { hashPassword } from '@/services/hashing';

export interface AdminUser {
    id: string;
    username: string;
    role: string;
    created_at: string;
}

interface AdminState {
    admins: AdminUser[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAdmins: () => Promise<void>;
    addAdmin: (username: string, password: string, role?: string) => Promise<void>;
    deleteAdmin: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
    admins: [],
    isLoading: false,
    error: null,

    fetchAdmins: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ admins: data || [] });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    },

    addAdmin: async (username, password, role = 'admin') => {
        set({ isLoading: true, error: null });
        try {
            // Hash the password before storage
            const hashedPassword = await hashPassword(password);

            const { error } = await supabase.from('admins').insert([
                {
                    username,
                    password: hashedPassword,
                    role,
                }
            ]);

            if (error) throw error;

            // Refresh list
            const { data: updatedData, error: fetchError } = await supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            set({ admins: updatedData || [] });
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteAdmin: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase.from('admins').delete().eq('id', id);

            if (error) throw error;
            set((state) => ({
                admins: state.admins.filter((a) => a.id !== id)
            }));
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
