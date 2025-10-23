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
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import { useNavigate } from "react-router";

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const navigate = useNavigate();

  // Fetch all users
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

  // Combined filtering logic
  const filteredUsers = users.filter((user) => {
    const teachingSkills = user.teachingSkills || [];
    const learningSkills = user.learningSkills || [];
    const allSkills = [...teachingSkills, ...learningSkills];

    // Text search
    const matchesSearch =
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      allSkills.some((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      );

    // Category filter
    const matchesCategory = category
      ? allSkills.some(
          (s) => s.category?.toLowerCase() === category.toLowerCase()
        )
      : true;

    // Level filter
    const matchesLevel = level
      ? allSkills.some((s) => s.level?.toLowerCase() === level.toLowerCase())
      : true;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Pagination logic
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

      {/* Filters */}
      <div className="px-4 sm:px-6 md:px-0 mb-6 flex flex-col md:flex-row justify-between items-center gap-3 w-full max-w-5xl mx-auto">
        {/* Search Bar */}
        <div className="flex-1">
          <Input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-14 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md px-5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-3 md:mt-0">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md px-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

          {/* Level Filter */}
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md px-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>

      {/* User Cards */}
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
                    <CardTitle className="text-lg font-semibold capitalize">
                      {user.fullName}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-0">
                    <CardDescription>
                      <div className="flex flex-col items-center">
                        {user.teachingSkills?.length > 0 && (
                          <>
                            <p className="font-semibold mt-2 text-blue-600">
                              Teaching:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                              {user.teachingSkills.map((skill, idx) => (
                                <span
                                  key={`teach-${idx}`}
                                  className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md"
                                >
                                  {skill.name} ({skill.level})
                                </span>
                              ))}
                            </div>
                          </>
                        )}

                        {user.learningSkills?.length > 0 && (
                          <>
                            <p className="font-semibold mt-3 text-green-600">
                              Learning:
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mt-1">
                              {user.learningSkills.map((skill, idx) => (
                                <span
                                  key={`learn-${idx}`}
                                  className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md"
                                >
                                  {skill.name} ({skill.level})
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </CardDescription>
                  </CardContent>
                </div>

                <Button
                  className="mt-5 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md"
                  onClick={() => navigate(`/profile/${user._id}`)}
                >
                  View Profile
                </Button>
              </Card>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 mt-8">
              No users found.
            </p>
          )}
        </div>

        {/* Pagination */}
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
    </>
  );
}
