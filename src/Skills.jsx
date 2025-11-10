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
  const [ratingFilter, setRatingFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;
  const navigate = useNavigate();

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

  const filteredUsers = users.filter((user) => {
    const teachingSkills = user.teachingSkills || [];
    const learningSkills = user.learningSkills || [];
    const allSkills = [...teachingSkills, ...learningSkills];

    const matchesSearch =
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      allSkills.some((s) =>
        s.name.toLowerCase().includes(search.toLowerCase())
      );

    const matchesCategory = category
      ? allSkills.some(
          (s) => s.category?.toLowerCase() === category.toLowerCase()
        )
      : true;

    const matchesLevel = level
      ? allSkills.some((s) => s.level?.toLowerCase() === level.toLowerCase())
      : true;

    // Average rating filter logic
    const matchesRating = ratingFilter
      ? user.averageRating >= parseFloat(ratingFilter)
      : true;

    return matchesSearch && matchesCategory && matchesLevel && matchesRating;
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

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-500">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-500">
          ★
        </span>
      );
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">
          ★
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">
          ({rating?.toFixed(1) || "0.0"})
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="px-4 sm:px-6 md:px-3 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full max-w-5xl mx-auto">
        {/* Search Bar */}
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

        {/* Filters */}
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

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-14 flex-1 md:flex-none rounded-xl border border-gray-300 shadow-sm px-4 text-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">All Ratings</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="3.0">3.0+ Stars</option>
            <option value="2.0">2.0+ Stars</option>
            <option value="1.0">1.0+ Stars</option>
          </select>
        </div>
      </div>

      {/* User Cards */}
      <div className="flex flex-col min-h-screen p-4 md:p-6 bg-gray-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => {
              const teachingSkills = user.teachingSkills || [];
              const learningSkills = user.learningSkills || [];
              const hasTeachingSkills = teachingSkills.length > 0;
              const hasLearningSkills = learningSkills.length > 0;

              return (
                <Card
                  key={user._id}
                  className="flex flex-col items-center text-center p-5 justify-between w-full max-w-sm mx-auto rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-lg transition-transform transform hover:-translate-y-1 min-h-[380px]"
                >
                  <div className="flex flex-col items-center space-y-3 w-full">
                    <img
                      src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
                      alt={user.fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-500/40"
                    />
                    <CardHeader className="w-full text-center p-0">
                      <CardTitle className="text-lg font-semibold capitalize text-gray-800">
                        {user.fullName}
                      </CardTitle>
                      {/* Average Rating Display */}
                      <div className="mt-1 flex justify-center">
                        {renderStars(user.averageRating || 0)}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 w-full flex-1 flex flex-col justify-center">
                      <CardDescription>
                        <div className="flex flex-col items-center w-full space-y-4">
                          {/* Teaching Skills Section */}
                          <div className="w-full">
                            <p className="font-semibold text-blue-600 text-sm mb-2">
                              Teaching
                            </p>
                            {hasTeachingSkills ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {teachingSkills
                                  .slice(0, 3)
                                  .map((skill, idx) => (
                                    <span
                                      key={`teach-${idx}`}
                                      className="bg-blue-500/10 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-300 break-words max-w-full"
                                    >
                                      {skill.name} ({skill.level})
                                    </span>
                                  ))}
                                {teachingSkills.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{teachingSkills.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-400 italic text-xs">
                                Teaching skills does not exist
                              </p>
                            )}
                          </div>

                          {/* Learning Skills Section */}
                          <div className="w-full">
                            <p className="font-semibold text-green-600 text-sm mb-2">
                              Learning
                            </p>
                            {hasLearningSkills ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {learningSkills
                                  .slice(0, 3)
                                  .map((skill, idx) => (
                                    <span
                                      key={`learn-${idx}`}
                                      className="bg-green-500/10 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-300 break-words max-w-full"
                                    >
                                      {skill.name} ({skill.level})
                                    </span>
                                  ))}
                                {learningSkills.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{learningSkills.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-400 italic text-xs">
                                Learning skills does not exist
                              </p>
                            )}
                          </div>
                        </div>
                      </CardDescription>
                    </CardContent>
                  </div>

                  <Button
                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition py-2 text-sm"
                    onClick={() => navigate(`/profile-info/${user._id}`)}
                  >
                    View Profile
                  </Button>
                </Card>
              );
            })
          ) : (
            <p className="col-span-full text-center text-gray-500 mt-8">
              No users found.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center mt-8 gap-2">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
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
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
