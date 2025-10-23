import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Calendar } from "./components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

// Pagination component with Next/Prev
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex gap-2 justify-center mt-4">
      <button
        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 ${
          currentPage === 1
            ? "bg-gray-700 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      <button className="px-4 py-2 rounded-lg bg-black text-white cursor-default">
        {currentPage}
      </button>

      <button
        className={`px-4 py-2 rounded-lg text-white transition-all duration-300 ${
          currentPage === totalPages
            ? "bg-gray-700 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");
  const [activeTab, setActiveTab] = useState("received");

  // Pagination
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [pageKey, setPageKey] = useState(0);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch appointments");

      const now = new Date();
      const updatedAppointments = await Promise.all(
        data.data.map(async (appt) => {
          const apptDate = new Date(`${appt.date}T${appt.time}`);
          if (appt.status === "pending" && apptDate < now) {
            await fetch(`${API_BASE_URL}/appointments/${appt._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", auth: getToken() },
              body: JSON.stringify({ status: "canceled" }),
            });
            return { ...appt, status: "canceled" };
          }
          return appt;
        })
      );

      setAppointments(updatedAppointments);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json", auth: getToken() },
      });
      const data = await res.json();
      if (res.ok) setUserId(data.data.user._id);
    } catch (err) {
      toast.error("Failed to fetch user info");
    }
  };

  useEffect(() => {
    fetchUser();
    fetchAppointments();
  }, []);

  const getWeekday = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long" });

  const generateTimeSlots = (start, end) => {
    const times = [];
    let [h, m] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
      m += 30;
      if (m >= 60) {
        h++;
        m -= 60;
      }
    }
    return times;
  };

  const isDateDisabled = (date) => {
    if (!selectedAppt || !selectedAppt.teacher.availability) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const weekday = getWeekday(date);
    const dayData = selectedAppt.teacher.availability[weekday];
    return !dayData || dayData.off;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setNewDate(date);
    const weekday = getWeekday(date);
    const dayData = selectedAppt.teacher.availability[weekday];
    if (!dayData || dayData.off) {
      setAvailableTimes([]);
      return;
    }
    const times = generateTimeSlots(dayData.start, dayData.end);
    setAvailableTimes(times);
  };

  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify({ status: "confirmed" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm");
      toast.success("Appointment confirmed");
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify({ status: "canceled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel");
      toast.success("Appointment canceled");
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRescheduleClick = (appt) => {
    setSelectedAppt(appt);
    setNewDate(new Date(appt.date));
    setNewTime(appt.time);
    setAvailableTimes([]);
    setOpenModal(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!newDate || !newTime) {
      toast.error("Please select both a new date and time");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments/change-schedule/${selectedAppt._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            date: newDate,
            time: newTime,
            teacher: selectedAppt.teacher._id,
            status: selectedAppt.status,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reschedule");
      toast.success("Appointment rescheduled");
      setOpenModal(false);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading || userId === null)
    return <p className="text-center mt-6">Loading appointments...</p>;

  const requestedAppointments = appointments.filter(
    (a) => a.student._id === userId
  );
  const receivedAppointments = appointments.filter(
    (a) => a.teacher._id === userId
  );

  const statusOrder = { pending: 1, confirmed: 2, completed: 3, canceled: 4 };
  const requestedAppointmentsSorted = [...requestedAppointments].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );
  const receivedAppointmentsSorted = [...receivedAppointments].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  const paginate = (list) => {
    const start = (currentPage - 1) * itemsPerPage;
    return list.slice(start, start + itemsPerPage);
  };

  const renderCards = (list, isTeacherView) =>
    list.length === 0 ? (
      <p className="text-center text-gray-500 mt-8">No appointments found.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((appt) => (
          <Card
            key={appt._id}
            className="flex flex-col justify-between h-full p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 bg-white dark:bg-gray-800"
          >
            <div className="flex-1">
              <CardHeader className="flex items-center gap-4 p-0 mb-3">
                <img
                  src={`${API_BASE_URL}/user_avatar/${
                    isTeacherView ? appt.student.avatar : appt.teacher.avatar
                  }`}
                  alt={
                    isTeacherView
                      ? appt.student.fullName
                      : appt.teacher.fullName
                  }
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                />
                <CardTitle className="text-lg font-semibold">
                  {isTeacherView
                    ? appt.student.fullName
                    : appt.teacher.fullName}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 space-y-2">
                <p>
                  <strong>Date:</strong> {new Date(appt.date).toDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {appt.time}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-semibold ${
                      appt.status === "pending"
                        ? "text-yellow-500"
                        : appt.status === "confirmed"
                        ? "text-green-500"
                        : appt.status === "completed"
                        ? "text-blue-500"
                        : "text-red-500"
                    }`}
                  >
                    {appt.status.toUpperCase()}
                  </span>
                </p>

                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {isTeacherView ? "Learning Skills" : "Teaching Skills"}
                  </p>

                  {(() => {
                    const rawSkills = isTeacherView
                      ? appt.student?.learningSkills
                      : appt.teacher?.teachingSkills;

                    if (
                      !rawSkills ||
                      (Array.isArray(rawSkills) && rawSkills.length === 0)
                    )
                      return (
                        <span className="text-gray-400 text-sm italic">
                          Not specified
                        </span>
                      );

                    const skillsArray = Array.isArray(rawSkills)
                      ? rawSkills
                      : rawSkills
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);

                    return (
                      <div className="flex flex-wrap gap-2">
                        {skillsArray.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </div>

            {/* Buttons aligned bottom */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {isTeacherView && appt.status === "pending" && (
                <>
                  <Button
                    className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[110px]"
                    onClick={() => handleConfirm(appt._id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-500 hover:bg-red-50 flex-1 min-w-[110px]"
                    onClick={() => handleCancel(appt._id)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-blue-500 border-blue-500 hover:bg-blue-50 flex-1 min-w-[110px]"
                    onClick={() => handleRescheduleClick(appt)}
                  >
                    Change Timeslot
                  </Button>
                </>
              )}

              {(appt.status === "confirmed" ||
                (!isTeacherView && appt.status === "pending")) && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-500 hover:bg-red-50 flex-1 min-w-[110px]"
                    onClick={() => handleCancel(appt._id)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="text-blue-500 border-blue-500 hover:bg-blue-50 flex-1 min-w-[110px]"
                    onClick={() => handleRescheduleClick(appt)}
                  >
                    Change Timeslot
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    );

  return (
    <>
      <div className="p-4 change-appt-px md:p-6">
        <h1 className="text-2xl font-semibold mb-6">My Appointments</h1>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setCurrentPage(1); // reset pagination
            setPageKey((prev) => prev + 1); // refresh fade animation
          }}
          className="w-full"
        >
          {" "}
          <TabsList className="flex justify-center mb-6">
            <TabsTrigger value="received">Received from Students</TabsTrigger>
            <TabsTrigger value="requested">Requested by Me</TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(receivedAppointmentsSorted), true)}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={receivedAppointmentsSorted.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>
          <TabsContent value="requested">
            <div
              key={pageKey}
              className="transition-all duration-500 ease-in-out transform opacity-0 animate-fadeIn"
            >
              {renderCards(paginate(requestedAppointmentsSorted), false)}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={requestedAppointmentsSorted.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                setPageKey((prev) => prev + 1);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Reschedule Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change timeslot</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="font-medium mb-2 block">
                  Select New Date
                </label>
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border shadow-sm w-full"
                  disabled={isDateDisabled}
                />
              </div>

              {newDate &&
                (availableTimes.length > 0 ? (
                  <div>
                    <label className="font-medium mb-2 block">
                      Available Times
                    </label>
                    <Select onValueChange={setNewTime} value={newTime}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Teacher is not available on this day.
                  </p>
                ))}
            </div>

            <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleConfirm}
                disabled={!newTime || !newDate}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
