import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Edit3, Trash, Check, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, ColumnDef } from "../components/DataTable";
import { DeleteConfirmationModal } from "../components/DeleteConfirmationModal";
import { DatePicker } from "../components/DatePicker";
import { format } from "date-fns";
import { Toast } from "../components/Toast";
import { useEmployeeStore } from "../store/employeeStore";
import SkeletonLoader from "../components/SkeletonLoader";
import { MonthPicker } from "../components/MonthPicker";

type AttendanceStatus = "present" | "absent" | "leave" | null;

export default function Employees() {
  const navigate = useNavigate();
  const {
    employees,
    fetchEmployees,
    deleteEmployee: deleteEmployeeStore,
    isLoading,
    attendance,
    fetchAttendance,
    markAttendance,
    fetchMonthlyStats,
    fetchMonthlyAttendanceMatrix,
  } = useEmployeeStore();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const [activeTab, setActiveTab] = useState<
    "employees" | "attendance" | "calendar"
  >("employees");
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  // Replaced local attendanceRecords with store 'attendance'
  const [monthlyStats, setMonthlyStats] = useState<
    Record<string, { present: number; absent: number; leave: number }>
  >({});

  const [calendarMonth, setCalendarMonth] = useState(() =>
    format(new Date(), "yyyy-MM"),
  );
  const [attendanceMatrix, setAttendanceMatrix] = useState<
    Record<string, Record<string, string>>
  >({});

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<
    (typeof employees)[0] | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch attendance when date changes
  useEffect(() => {
    fetchAttendance(attendanceDate);
  }, [attendanceDate, fetchAttendance]);

  // Fetch monthly stats when month changes (derived from attendanceDate)
  useEffect(() => {
    const month = attendanceDate.substring(0, 7); // "YYYY-MM"
    fetchMonthlyStats(month).then((stats) => setMonthlyStats(stats));
  }, [attendanceDate, fetchMonthlyStats]);

  // Fetch calendar matrix when calendar month changes
  useEffect(() => {
    if (activeTab === "calendar") {
      fetchMonthlyAttendanceMatrix(calendarMonth).then((matrix) =>
        setAttendanceMatrix(matrix),
      );
    }
  }, [calendarMonth, fetchMonthlyAttendanceMatrix, activeTab]);

  const handleMarkAttendance = async (
    employeeId: string,
    status: AttendanceStatus,
  ) => {
    if (!status) return;
    await markAttendance(employeeId, attendanceDate, status);

    // Refresh stats after marking
    const month = attendanceDate.substring(0, 7);
    fetchMonthlyStats(month).then((stats) => setMonthlyStats(stats));

    if (activeTab === "calendar") {
      fetchMonthlyAttendanceMatrix(calendarMonth).then((matrix) =>
        setAttendanceMatrix(matrix),
      );
    }
  };

  // Generate days for calendar view
  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [calendarMonth]);
  const columns = useMemo<ColumnDef<(typeof employees)[0]>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        className: "flex-[2] font-mono text-muted-foreground",
        cell: (info) => `#${info.id.substring(0, 6)}`,
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

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [employees, searchQuery]);

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
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "calendar"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Calendar View
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonLoader rows={5} />
          ) : (
            <DataTable data={filteredEmployees} columns={columns} />
          )}
        </>
      )}

      {/* Calendar View Tab */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Month Picker */}
          <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl shadow-sm hover:border-primary-500/50 transition-all duration-300">
                <Clock size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground mr-1">
                  Select Month:
                </span>
                <MonthPicker
                  value={calendarMonth}
                  onChange={(val: any) => setCalendarMonth(val)}
                />
              </div>
            </div>
            {/* Color Legend */}
            <div className="flex items-center gap-4 text-xs font-medium mr-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></div>
                <span className="text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></div>
                <span className="text-muted-foreground">Absent / Default</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500/20"></div>
                <span className="text-muted-foreground">Leave</span>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-secondary/90 z-10 w-48">
                    Employee
                  </th>
                  {calendarDays.map((day) => (
                    <th
                      key={day}
                      className="px-1 py-3 text-center w-8 font-medium text-muted-foreground"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`border-b border-border ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td
                      className="px-4 py-3 font-medium sticky left-0 bg-inherit border-r border-border truncate max-w-[12rem] z-10"
                      title={employee.name}
                    >
                      {employee.name}
                    </td>
                    {calendarDays.map((day) => {
                      // Construct date string YYYY-MM-DD
                      const dateStr = `${calendarMonth}-${String(day).padStart(
                        2,
                        "0",
                      )}`;
                      const record = attendanceMatrix[employee.id]?.[dateStr];

                      let colorClass = "bg-red-500 dark:bg-red-500"; // Default / None
                      if (record === "present")
                        colorClass =
                          "bg-green-500 shadow-sm shadow-green-500/50";
                      else if (record === "absent")
                        colorClass = "bg-red-500 shadow-sm shadow-red-500/50";
                      else if (record === "leave")
                        colorClass =
                          "bg-yellow-500 shadow-sm shadow-yellow-500/50";

                      return (
                        <td key={day} className="px-1 py-3 text-center">
                          <div className="flex justify-center">
                            <div
                              className={`w-3 h-3 rounded-full ${colorClass}`}
                              title={`${dateStr}: ${record || "None"}`}
                            ></div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                  <th className="text-center px-6 py-3 font-semibold text-green-600">
                    Present (Month)
                  </th>
                  <th className="text-center px-6 py-3 font-semibold text-red-600">
                    Absent (Month)
                  </th>
                  <th className="text-center px-6 py-3 font-semibold">
                    Mark Attendance
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => {
                  const status = attendance[employee.id]; // Use store state
                  const stats = monthlyStats[employee.id] || {
                    present: 0,
                    absent: 0,
                    leave: 0,
                  };

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
                              #{employee.id.substring(0, 6)}
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
                      <td className="px-6 py-4 text-center font-medium text-green-600">
                        {stats.present}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-red-600">
                        {stats.absent}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              handleMarkAttendance(employee.id, "present")
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
                              handleMarkAttendance(employee.id, "absent")
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
                            onClick={() =>
                              handleMarkAttendance(employee.id, "leave")
                            }
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
            deleteEmployeeStore(deleteEmployee.id);
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
