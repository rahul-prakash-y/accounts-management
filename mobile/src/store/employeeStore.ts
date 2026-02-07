import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    location: string;
    status: string;
    phone?: string;
}

interface EmployeeState {
    employees: Employee[];
    isLoading: boolean;
    error: string | null;
    fetchEmployees: () => Promise<void>;
    addEmployee: (employee: Partial<Employee>) => Promise<void>;
    updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;

    // Attendance
    attendance: Record<string, "present" | "absent" | "leave">;
    fetchAttendance: (date: string) => Promise<void>;
    markAttendance: (employeeId: string, date: string, status: "present" | "absent" | "leave") => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>()((set, get) => ({
    employees: [],
    isLoading: false,
    error: null,

    fetchEmployees: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData: Employee[] = (data || []).map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                role: emp.role,
                department: emp.department,
                location: emp.location,
                status: emp.status,
                phone: emp.phone,
            }));

            set({ employees: mappedData, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addEmployee: async (employee) => {
        set({ isLoading: true, error: null });
        try {
            const payload = {
                name: employee.name,
                role: employee.role,
                department: employee.department,
                location: employee.location,
                status: employee.status,
                phone: employee.phone,
            };

            const { data, error } = await supabase
                .from('employees')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            const newEmployee: Employee = {
                id: data.id,
                name: data.name,
                role: data.role,
                department: data.department,
                location: data.location,
                status: data.status,
                phone: data.phone,
            };

            set((state) => ({
                employees: [newEmployee, ...state.employees],
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    updateEmployee: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
            const payload: any = {};
            if (updates.name) payload.name = updates.name;
            if (updates.role) payload.role = updates.role;
            if (updates.department) payload.department = updates.department;
            if (updates.location) payload.location = updates.location;
            if (updates.status) payload.status = updates.status;
            if (updates.phone) payload.phone = updates.phone;

            const { error } = await supabase
                .from('employees')
                .update(payload)
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                employees: state.employees.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                ),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteEmployee: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set((state) => ({
                employees: state.employees.filter((e) => e.id !== id),
                isLoading: false
            }));
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Attendance Actions
    attendance: {},

    fetchAttendance: async (date) => {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('employee_id, status')
                .eq('date', date);

            if (error) throw error;

            const newAttendance: Record<string, 'present' | 'absent' | 'leave'> = {};
            data.forEach((record: any) => {
                newAttendance[record.employee_id] = record.status;
            });

            set({ attendance: newAttendance });
        } catch (error: any) {
            console.error("Error fetching attendance:", error);
        }
    },

    markAttendance: async (employeeId, date, status) => {
        try {
            // Optimistic update
            set((state) => ({
                attendance: { ...state.attendance, [employeeId]: status }
            }));

            const { error } = await supabase
                .from('attendance')
                .upsert(
                    { employee_id: employeeId, date, status },
                    { onConflict: 'employee_id, date' }
                );

            if (error) throw error;
        } catch (error: any) {
            console.error("Error marking attendance:", error);
            set({ error: error.message });
        }
    },
}));
