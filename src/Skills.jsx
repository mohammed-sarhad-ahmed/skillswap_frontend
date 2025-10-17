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
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import { Calendar } from "./components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [open, setOpen] = useState(false);

  const usersPerPage = 8;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user`, {
          headers: { auth: getToken() },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.data.users);
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchUsers();
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
    if (!selectedUser || !selectedUser.availability) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const weekday = getWeekday(date);
    const dayData = selectedUser.availability[weekday];
    return !dayData || dayData.off;
  };

  const handleDateSelect = (date) => {
    if (isDateDisabled(date)) return;
    setSelectedDate(date);

    if (!selectedUser?.availability) return;
    const weekday = getWeekday(date);
    const dayData = selectedUser.availability[weekday];

    if (!dayData || dayData.off) {
      setAvailableTimes([]);
      return;
    }

    let times = generateTimeSlots(dayData.start, dayData.end);

    // 🕒 Filter out past times if the selected date is today
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      times = times.filter((time) => {
        const [h, m] = time.split(":").map(Number);
        const totalMinutes = h * 60 + m;
        return totalMinutes > currentMinutes;
      });
    }

    setAvailableTimes(times);
  };

  const handleConnectClick = (user) => {
    setSelectedUser(user);
    setSelectedDate(null);
    setSelectedTime("");
    setAvailableTimes([]);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both a date and time");
      return;
    }

    if (!selectedUser?._id) return;

    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({
          teacher: selectedUser._id,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to book appointment");

      toast.success(`Appointment confirmed with ${selectedUser.fullName}`);
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ✅ FIXED: support both teachingSkills and skills
  const filteredUsers = users.filter((user) => {
    const allSkills = user.teachingSkills || user.skills || [];
    return (
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      allSkills.some((skill) =>
        skill.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(
    startIndex,
    startIndex + usersPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <>
      <Toaster />

      {/* 🔎 Search Bar */}
      <div className="px-4 sm:px-6 md:px-0 mb-6 flex justify-center w-full">
        <div className="w-full max-w-xl mx-2.5">
          <Input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full"
          />
        </div>
      </div>

      {/* 👥 User Cards */}
      <div className="flex flex-col min-h-screen p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <Card
                key={user._id}
                className="flex flex-col items-center text-center p-6 justify-between h-full rounded-2xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 bg-white dark:bg-gray-800 w-full"
              >
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
                    alt={user.fullName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                  />
                  <CardHeader className="w-full text-center p-0">
                    <CardTitle className="text-lg font-semibold">
                      {user.fullName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CardDescription>
                      <div className="flex flex-wrap gap-2 justify-center mt-2">
                        {(user.teachingSkills || user.skills || []).map(
                          (skill, idx) => (
                            <span
                              key={idx}
                              className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </CardDescription>
                  </CardContent>
                </div>

                <Button
                  className="mt-5 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md"
                  onClick={() => handleConnectClick(user)}
                >
                  Connect to Teacher
                </Button>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 mt-8">
              No users found.
            </p>
          )}
        </div>

        {/* 📄 Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center mt-6 gap-2">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => goToPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* 🗓️ Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pt-10">
              Connect with {selectedUser?.fullName || "Teacher"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="font-medium mb-2 block">Select a Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border shadow-sm w-full"
                disabled={isDateDisabled}
              />
            </div>

            {selectedDate && (
              <>
                {availableTimes.length > 0 ? (
                  <div>
                    <label className="font-medium mb-2 block">
                      Available Times
                    </label>
                    <Select
                      onValueChange={setSelectedTime}
                      value={selectedTime}
                    >
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedTime}>
              Make Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
