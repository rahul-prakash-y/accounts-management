import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    location: string;
    status: string;
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
    fetchMonthlyStats: (month: string) => Promise<Record<string, { present: number; absent: number; leave: number }>>;
    fetchMonthlyAttendanceMatrix: (month: string) => Promise<Record<string, Record<string, string>>>;
}

export const useEmployeeStore = create<EmployeeState>()((set) => ({
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
            // Prepare payload
            const payload: any = {};
            if (updates.name) payload.name = updates.name;
            if (updates.role) payload.role = updates.role;
            if (updates.department) payload.department = updates.department;
            if (updates.location) payload.location = updates.location;
            if (updates.status) payload.status = updates.status;

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
        // set({ isLoading: true }); // Optional: don't block UI for attendance load if not needed
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
            // Don't set global error to avoid disrupting employee list
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
            // Revert on error could be implemented here
        }
    },

    fetchMonthlyStats: async (monthStr) => { // monthStr format "YYYY-MM"
        try {
            // This requires a more complex query or multiple fetches. 
            // For simplicity, we might fetch all attendance for the month.
            // Start Date: monthStr-01, End Date: monthStr-31

            // To get stats for ALL employees efficiently, we might need a custom rpc or just raw query
            const startDate = `${monthStr}-01`;
            // simplistic end date calc
            const [year, month] = monthStr.split('-').map(Number);
            const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

            const { data, error } = await supabase
                .from('attendance')
                .select('employee_id, status')
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            // Calculate stats
            // Return structure: Record<employeeId, { present: number, absent: number, leave: number }>

            const stats: Record<string, { present: number, absent: number, leave: number }> = {};

            data.forEach((record: any) => {
                if (!stats[record.employee_id]) {
                    stats[record.employee_id] = { present: 0, absent: 0, leave: 0 };
                }
                const s = record.status as 'present' | 'absent' | 'leave';
                if (stats[record.employee_id][s] !== undefined) {
                    stats[record.employee_id][s]++;
                }
            });

            return stats;

        } catch (error: any) {
            console.error("Error fetching monthly stats:", error);
            return {};
        }
    },

    fetchMonthlyAttendanceMatrix: async (monthStr) => {
        try {
            const startDate = `${monthStr}-01`;
            const [year, month] = monthStr.split('-').map(Number);
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('attendance')
                .select('employee_id, date, status')
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const matrix: Record<string, Record<string, string>> = {};
            data.forEach((record: any) => {
                if (!matrix[record.employee_id]) {
                    matrix[record.employee_id] = {};
                }
                matrix[record.employee_id][record.date] = record.status;
            });

            return matrix;
        } catch (error: any) {
            console.error("Error fetching attendance matrix:", error);
            return {};
        }
    }
}));
