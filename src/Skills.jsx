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

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (user.skills &&
        user.skills.some((skill) =>
          skill.toLowerCase().includes(search.toLowerCase())
        ))
  );

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
      {/* Search Bar */}
      <div className=" px-4 sm:px-6 md:px-0 mb-6 flex justify-center mx-6">
        <div className=" md:w-auto flex-1">
          <Input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className=" rounded-2xl border border-gray-300 dark:border-gray-700 shadow-md px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* User Cards */}
      <div className="flex flex-col min-h-screen p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <Card
                key={user._id}
                className="flex flex-col items-center text-center p-6 justify-between h-full rounded-2xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 bg-white dark:bg-gray-800"
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
                        {user.teachingSkills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardDescription>
                  </CardContent>
                </div>

                <Button
                  className="mt-5 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md"
                  onClick={() =>
                    alert(`Appointment with ${user.fullName} clicked`)
                  }
                >
                  Make Appointment
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
