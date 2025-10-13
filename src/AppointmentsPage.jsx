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
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { auth: getToken() },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch appointments");
      setAppointments(data.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
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
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
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
    setAvailableTimes([]); // will populate based on teacher availability
    setOpenModal(true);
  };

  const handleRescheduleConfirm = async () => {
    if (!newDate || !newTime) {
      toast.error("Please select both a new date and time");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/appointments/${selectedAppt._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
          body: JSON.stringify({
            date: newDate,
            time: newTime,
            status: "pending",
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

  if (loading)
    return <p className="text-center mt-6">Loading appointments...</p>;

  return (
    <>
      <Toaster />
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-6">My Appointments</h1>

        {appointments.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            No appointments found.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appt) => (
            <Card
              key={appt._id}
              className="flex flex-col justify-between p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 bg-white dark:bg-gray-800"
            >
              <CardHeader className="flex items-center gap-4 p-0">
                <img
                  src={`${API_BASE_URL}/user_avatar/${appt.teacher.avatar}`}
                  alt={appt.teacher.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                />
                <CardTitle className="text-lg font-semibold">
                  {appt.teacher.fullName}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-0 mt-2">
                <CardDescription>
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
                          : "text-red-500"
                      }`}
                    >
                      {appt.status.toUpperCase()}
                    </span>
                  </p>
                </CardDescription>
              </CardContent>

              <div className="mt-4 flex flex-wrap gap-2">
                {appt.status === "pending" && (
                  <>
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white flex-1 min-w-[120px] sm:min-w-[140px]"
                      onClick={() => handleConfirm(appt._id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-500 border-red-500 hover:bg-red-50 flex-1 min-w-[120px] sm:min-w-[140px]"
                      onClick={() => handleCancel(appt._id)}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="text-blue-500 border-blue-500 hover:bg-blue-50 flex-1 min-w-[120px] sm:min-w-[140px]"
                  onClick={() => handleRescheduleClick(appt)}
                >
                  Reschedule
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Reschedule Modal */}
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogContent className="w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
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

              {newDate && (
                <>
                  {availableTimes.length > 0 ? (
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
                  )}
                </>
              )}
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
