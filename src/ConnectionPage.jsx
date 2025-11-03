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
import { useNavigate } from "react-router";

export default function ConnectionsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [connections, setConnections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const connectionsPerPage = 8;
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newDate, setNewDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/connections`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();
        console.log(data);
        if (!res.ok)
          throw new Error(data.message || "Failed to fetch connections");
        setConnections(data.data.connections);
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchConnections();
  }, []);

  const filteredConnections = connections.filter((c) => {
    const matchesSearch = c.fullName
      .toLowerCase()
      .includes(search.toLowerCase());
    const allSkills = c.skills || [];
    const matchesCategory = category
      ? allSkills.some(
          (s) => s.category?.toLowerCase() === category.toLowerCase()
        )
      : true;
    const matchesLevel = level
      ? allSkills.some((s) => s.level?.toLowerCase() === level.toLowerCase())
      : true;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const totalPages = Math.ceil(filteredConnections.length / connectionsPerPage);
  const startIndex = (currentPage - 1) * connectionsPerPage;
  const currentConnections = filteredConnections.slice(
    startIndex,
    startIndex + connectionsPerPage
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getWeekday = (date) =>
    date.toLocaleDateString("en-US", { weekday: "long" });

  const generateTimeSlots = (start, end) => {
    const times = [];
    let [h, m] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);

    while (h < endH || (h === endH && m < endM)) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      m += 1; // ⬅️ make each slot 1 minute apart
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
    setNewDate(date);

    const weekday = getWeekday(date);
    const dayData = selectedUser.availability[weekday];
    if (!dayData || dayData.off) {
      setAvailableTimes([]);
      return;
    }

    // Generate all times first
    let times = generateTimeSlots(dayData.start, dayData.end);

    // Filter out past times if the selected date is today
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        Math.floor(now.getMinutes() / 30) * 30
      ).padStart(2, "0")}`;
      times = times.filter((t) => t > currentTime);
    }

    setAvailableTimes(times);
  };

  const handleBookAppointment = async () => {
    if (!newDate || !newTime) {
      toast.error("Select a date and time");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify({
          teacher: selectedUser._id,
          date: newDate,
          time: newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to book");
      toast.success("Appointment booked!");
      setOpenModal(false);
      setNewDate(null);
      setNewTime("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openAppointmentModal = (user) => {
    setSelectedUser(user);
    setNewDate(null);
    setNewTime("");
    setAvailableTimes([]);
    setOpenModal(true);
  };

  return (
    <>
      <div className="px-4 sm:px-6 md:px-3 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full max-w-5xl mx-auto">
        <div className="w-full md:flex-1">
          <Input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-14 rounded-xl border border-gray-300 shadow-sm px-5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-3 md:mt-0 w-full md:w-auto">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 flex-1 md:flex-none rounded-xl border border-gray-300 shadow-sm px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Categories</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
            <option value="Languages">Languages</option>
            <option value="Arts">Arts</option>
            <option value="Music">Music</option>
            <option value="Sports">Sports</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 flex-1 md:flex-none rounded-xl border border-gray-300 shadow-sm px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentConnections.map((user) => (
            <Card
              key={user._id}
              className="flex flex-col items-center text-center p-6 justify-between h-full rounded-xl border border-blue-200 bg-white shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 min-w-[280px]"
            >
              <div className="flex flex-col items-center space-y-3 w-full">
                <img
                  src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
                  alt={user.fullName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-500/40"
                />
                <CardHeader className="w-full text-center p-0">
                  <CardTitle className="text-lg font-semibold capitalize text-blue-600">
                    {user.fullName}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0 w-full">
                  <CardDescription>
                    <div className="flex flex-col items-center w-full">
                      {(user.skills && user.skills.length > 0) ||
                      (user.learningSkills &&
                        user.learningSkills.length > 0) ? (
                        <>
                          {/* Teaching Skills */}
                          {user.skills && user.skills.length > 0 && (
                            <>
                              <p className="font-semibold mt-2 text-blue-600">
                                Teaching:
                              </p>
                              <div className="flex flex-wrap gap-2 justify-center mt-1">
                                {user.skills.map((skill, idx) => (
                                  <span
                                    key={`teach-${idx}`}
                                    className="bg-blue-500/10 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-300"
                                  >
                                    {skill.name} ({skill.level})
                                  </span>
                                ))}
                              </div>
                            </>
                          )}

                          {/* Learning Skills */}
                          {user.learningSkills &&
                            user.learningSkills.length > 0 && (
                              <>
                                <p className="font-semibold mt-3 text-green-600">
                                  Learning:
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center mt-1">
                                  {user.learningSkills.map((skill, idx) => (
                                    <span
                                      key={`learn-${idx}`}
                                      className="bg-green-500/10 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-300"
                                    >
                                      {skill.name} ({skill.level})
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                        </>
                      ) : (
                        <p className="text-gray-400 italic mt-2">
                          No skills have been specified
                        </p>
                      )}
                    </div>
                  </CardDescription>
                </CardContent>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center w-full px-4">
                <Button
                  variant="outline"
                  className="flex-1 px-4 py-3 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition"
                  onClick={() => navigate(`/profile-info/${user._id}`)}
                >
                  Visit Profile
                </Button>

                <Button
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                  onClick={() => openAppointmentModal(user)}
                >
                  Book Appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center mt-8 gap-2">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              className="px-4 py-2 rounded-lg font-medium"
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => goToPage(i + 1)}
                className="px-4 py-2 rounded-lg font-medium"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              className="px-4 py-2 rounded-lg font-medium"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Book Appointment with {selectedUser?.fullName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="font-medium mb-2 block">Select Date</label>
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
            <Button
              variant="outline"
              className="flex-1 hover:bg-gray-100 transition"
              onClick={() => setOpenModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition"
              onClick={handleBookAppointment}
              disabled={!newTime || !newDate}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
