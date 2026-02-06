import { useState } from "react";
import { useForm } from "react-hook-form";
import { Save, ArrowLeft, Briefcase } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEmployeeStore } from "../store/employeeStore";
import { Toast } from "../components/Toast";

type EmployeeFormValues = {
  id: string;
  name: string;
  role: string;
  department: string;
  location: string;
  status: "Present" | "Absent";
};

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const createEmployee = useEmployeeStore((state) => state.addEmployee);
  const updateEmployee = useEmployeeStore((state) => state.updateEmployee);
  const employees = useEmployeeStore((state) => state.employees);

  const editableEmployee = employees.find((e) => e.id === id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    defaultValues: {
      id: editableEmployee?.id || "",
      name: editableEmployee?.name || "",
      role: editableEmployee?.role || "",
      department: editableEmployee?.department || "Sales",
      location: editableEmployee?.location || "",
      status: (editableEmployee?.status as "Present" | "Absent") || "Present",
    },
  });

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const onSubmit = async (data: EmployeeFormValues) => {
    try {
      if (editableEmployee) {
        console.log("Employee Updated:", data);
        await updateEmployee(editableEmployee.id, data);
        setToast({
          message: "Employee updated successfully!",
          type: "success",
        });
      } else {
        console.log("Employee Created:", data);
        await createEmployee({ ...data, status: "Active" }); // Fixed status and removed ID generation
        setToast({
          message: "Employee created successfully!",
          type: "success",
        });
      }
      setTimeout(() => {
        navigate("/employees");
      }, 1000);
    } catch (error: any) {
      console.error("Failed to save employee:", error);
      setToast({
        message: "Failed to save employee. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/employees")}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Briefcase className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">
            {editableEmployee ? "Edit Employee" : "New Employee"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee Name</label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="e.g. Sarah Jenkins"
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role / Title</label>
              <input
                {...register("role", { required: "Role is required" })}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Sales Executive"
              />
              {errors.role && (
                <p className="text-xs text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <select
                {...register("department")}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              >
                <option value="Sales">Sales</option>
                <option value="Inventory">Inventory</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input
                {...register("location")}
                className="w-full p-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g. Main Branch"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    value="Present"
                    {...register("status")}
                    className="sr-only peer"
                  />
                  <div className="text-center py-2 text-sm font-medium rounded-md transition-all peer-checked:bg-background peer-checked:shadow-sm peer-checked:text-primary">
                    Present
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    value="Absent"
                    {...register("status")}
                    className="sr-only peer"
                  />
                  <div className="text-center py-2 text-sm font-medium rounded-md transition-all peer-checked:bg-background peer-checked:shadow-sm peer-checked:text-destructive">
                    Absent
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
          >
            <Save size={18} />
            Save Employee
          </button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
