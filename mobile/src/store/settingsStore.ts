import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface CompanySettings {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    gstNo?: string;
    is_main?: boolean;
}

export interface SubCompany {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    gstNo?: string;
}

interface SettingsState {
    companySettings: CompanySettings;
    subCompanies: SubCompany[];
    loading: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
    updateCompanySettings: (settings: CompanySettings) => Promise<void>;
    addSubCompany: (subCompany: Omit<SubCompany, 'id'>) => Promise<void>;
    updateSubCompany: (id: string, subCompany: Partial<SubCompany>) => Promise<void>;
    deleteSubCompany: (id: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    (set, get) => ({
        companySettings: {
            name: "",
            address: "",
            city: "",
            phone: "",
            email: "",
            website: "",
        },
        subCompanies: [],
        loading: false,
        error: null,

        fetchSettings: async () => {
            set({ loading: true, error: null });
            try {
                // Fetch Company Settings
                const { data: mainSettings, error: mainError } = await supabase
                    .from('company_settings')
                    .select('*')
                    .eq('is_main', true)
                    .maybeSingle();

                if (mainError) {
                    console.error('Error fetching company settings:', mainError);
                }

                // Fetch Sub Companies
                const { data: subs, error: subsError } = await supabase
                    .from('sub_companies')
                    .select('*');

                if (subsError) {
                    console.error('Error fetching sub-companies:', subsError);
                }

                set({
                    companySettings: mainSettings ? {
                        name: mainSettings.name,
                        address: mainSettings.address,
                        city: mainSettings.city,
                        phone: mainSettings.phone,
                        email: mainSettings.email,
                        website: mainSettings.website,
                        gstNo: mainSettings.gst_no
                    } : get().companySettings,
                    subCompanies: subs ? subs.map((sub: any) => ({
                        id: sub.id,
                        name: sub.name,
                        address: sub.address,
                        city: sub.city,
                        phone: sub.phone,
                        email: sub.email,
                        website: sub.website,
                        gstNo: sub.gst_no
                    })) : []
                });
            } catch (err: any) {
                set({ error: err.message });
            } finally {
                set({ loading: false });
            }
        },

        updateCompanySettings: async (settings) => {
            set({ loading: true, error: null });
            try {
                const dbSettings = {
                    name: settings.name,
                    address: settings.address,
                    city: settings.city,
                    phone: settings.phone,
                    email: settings.email,
                    website: settings.website,
                    gst_no: settings.gstNo,
                    is_main: true
                };

                const { data: existing, error: fetchError } = await supabase
                    .from('company_settings')
                    .select('id')
                    .eq('is_main', true)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                let error;
                if (existing) {
                    const { error: updateError } = await supabase
                        .from('company_settings')
                        .update(dbSettings)
                        .eq('id', existing.id);
                    error = updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('company_settings')
                        .insert(dbSettings);
                    error = insertError;
                }

                if (error) throw error;

                set({ companySettings: settings });
            } catch (err: any) {
                set({ error: err.message });
                throw err;
            } finally {
                set({ loading: false });
            }
        },

        addSubCompany: async (subCompany) => {
            set({ loading: true, error: null });
            try {
                const dbSub = {
                    name: subCompany.name,
                    address: subCompany.address,
                    city: subCompany.city,
                    phone: subCompany.phone,
                    email: subCompany.email,
                    website: subCompany.website,
                    gst_no: subCompany.gstNo
                };

                const { data, error } = await supabase
                    .from('sub_companies')
                    .insert(dbSub)
                    .select()
                    .single();

                if (error) throw error;

                const newSub: SubCompany = {
                    id: data.id,
                    name: data.name,
                    address: data.address,
                    city: data.city,
                    phone: data.phone,
                    email: data.email,
                    website: data.website,
                    gstNo: data.gst_no
                };

                set((state) => ({ subCompanies: [...state.subCompanies, newSub] }));
            } catch (err: any) {
                set({ error: err.message });
                throw err;
            } finally {
                set({ loading: false });
            }
        },

        updateSubCompany: async (id, updates) => {
            set({ loading: true, error: null });
            try {
                const dbUpdates: any = {};
                if (updates.name) dbUpdates.name = updates.name;
                if (updates.address) dbUpdates.address = updates.address;
                if (updates.city) dbUpdates.city = updates.city;
                if (updates.phone) dbUpdates.phone = updates.phone;
                if (updates.email) dbUpdates.email = updates.email;
                if (updates.website) dbUpdates.website = updates.website;
                if (updates.gstNo) dbUpdates.gst_no = updates.gstNo;

                const { error } = await supabase
                    .from('sub_companies')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    subCompanies: state.subCompanies.map((sc) =>
                        sc.id === id ? { ...sc, ...updates } : sc
                    ),
                }));
            } catch (err: any) {
                set({ error: err.message });
                throw err;
            } finally {
                set({ loading: false });
            }
        },

        deleteSubCompany: async (id) => {
            set({ loading: true, error: null });
            try {
                const { error } = await supabase
                    .from('sub_companies')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                set((state) => ({
                    subCompanies: state.subCompanies.filter((sc) => sc.id !== id),
                }));
            } catch (err: any) {
                set({ error: err.message });
                throw err;
            } finally {
                set({ loading: false });
            }
        },
    })
);
