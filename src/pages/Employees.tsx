import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash, Check, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { DatePicker } from "../components/DatePicker";
import { format } from "date-fns";
import { Toast } from "../components/Toast";
import { useDataStore } from "../store/dataStore";

type AttendanceStatus = "present" | "absent" | "leave" | null;

export default function Employees() {
  const navigate = useNavigate();
  const employees = useDataStore((state) => state.employees);
  const deleteEmployeeFromStore = useDataStore((state) => state.deleteEmployee);
  const [activeTab, setActiveTab] = useState<"employees" | "attendance">(
    "employees",
  );
  const [attendanceDate, setAttendanceDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<
    (typeof employees)[0] | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load attendance from localStorage when date changes
  useEffect(() => {
    const saved = localStorage.getItem(`attendance_${attendanceDate}`);
    if (saved) {
      setAttendanceRecords(JSON.parse(saved));
    } else {
      setAttendanceRecords({});
    }
  }, [attendanceDate]);

  const saveAttendance = () => {
    localStorage.setItem(
      `attendance_${attendanceDate}`,
      JSON.stringify(attendanceRecords),
    );
    setToast({ message: "Attendance saved successfully!", type: "success" });
  };

  const markAttendance = (employeeId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [employeeId]: status,
    }));
  };
  const columns = useMemo<ColumnDef<(typeof employees)[0]>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className: "flex-[2] font-mono text-muted-foreground",
      },
      {
        header: "Name",
        className: "flex-[3] font-medium",
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-semibold border border-border">
              {info.name.substring(0, 1)}
            </div>
            {info.name}
          </div>
        ),
      },
      {
        header: "Role / Dept",
        className: "flex-[3]",
        cell: (info) => (
          <div>
            <div className="font-medium flex items-center gap-1.5">
              {/* <Briefcase size={14} className="text-muted-foreground" />{" "} */}
              {info.role}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {info.department}
            </div>
          </div>
        ),
      },
      {
        header: "Location",
        className: "flex-[2]",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            {/* <MapPin size={14} /> */}
            {info.location}
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        className: "flex-[2]",
        cell: (employee) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              employee.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {employee.status}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "flex-[2] flex items-center justify-center gap-2",
        cell: (employee) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/employees/edit/${employee.id}`);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Edit3 size={12} />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteEmployee(employee);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              <Trash size={12} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">Employees</h1>
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "employees"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Employees List
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "attendance"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Attendance
            </button>
          </div>
        </div>
        {activeTab === "employees" && (
          <button
            onClick={() => navigate("/employees/new")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add Employee
          </button>
        )}
      </div>

      {/* Employees List Tab */}
      {activeTab === "employees" && (
        <>
          <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DataTable data={employees} columns={columns} />
        </>
      )}

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          {/* Date Picker and Save Button */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-muted-foreground" />
              <span className="font-medium">Attendance Date:</span>
              <DatePicker
                value={attendanceDate}
                onChange={setAttendanceDate}
                className="w-[180px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveAttendance}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Save Attendance
              </button>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold">
                    Employee
                  </th>
                  <th className="text-left px-6 py-3 font-semibold">
                    Role / Department
                  </th>
                  <th className="text-center px-6 py-3 font-semibold">
                    Mark Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => {
                  const status = attendanceRecords[employee.id];
                  return (
                    <tr
                      key={employee.id}
                      className={`border-b border-border ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-secondary-foreground font-semibold border border-border">
                            {employee.name.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {employee.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{employee.role}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.department}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              markAttendance(employee.id, "present")
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
                              status === "present"
                                ? "bg-green-600 text-white"
                                : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-100 dark:text-green-400 dark:hover:bg-green-200"
                            }`}
                          >
                            <Check size={16} />
                            Present
                          </button>
                          <button
                            onClick={() =>
                              markAttendance(employee.id, "absent")
                            }
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
                              status === "absent"
                                ? "bg-red-600 text-white"
                                : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-100 dark:text-red-400 dark:hover:bg-red-200"
                            }`}
                          >
                            <X size={16} />
                            Absent
                          </button>
                          <button
                            onClick={() => markAttendance(employee.id, "leave")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm transition-all ${
                              status === "leave"
                                ? "bg-yellow-600 text-white"
                                : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-200"
                            }`}
                          >
                            <Clock size={16} />
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteEmployee !== null}
        onClose={() => setDeleteEmployee(null)}
        onConfirm={() => {
          setIsDeleting(true);
          if (deleteEmployee) {
            deleteEmployeeFromStore(deleteEmployee.id);
          }
          setTimeout(() => {
            setIsDeleting(false);
            setDeleteEmployee(null);
            setToast({
              message: "Employee deleted successfully!",
              type: "success",
            });
          }, 500);
        }}
        itemName={deleteEmployee?.name || ""}
        itemType="Employee"
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
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
