import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageCircle, Flag } from "lucide-react";
import { Button } from "./components/ui/button";
import { API_BASE_URL } from "./Config";
import { getToken } from "./ManageToken";
import toast from "react-hot-toast";

export default function ProfileInfo() {
  const { userId: id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch profile user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/teacher/${id}`, {
          headers: { auth: getToken() },
        });
        const data = await res.json();
        setUser(data.data.user);
      } catch {
        toast.error("Could not fetch user info");
      }
    };
    fetchUser();
  }, [id]);

  // Fetch current logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            auth: getToken(),
          },
        });
        const data = await res.json();
        setCurrentUser(data.data.user);
      } catch {
        toast.error("Could not fetch current user info");
      }
    };
    fetchCurrentUser();
  }, []);

  const handleReport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: getToken(),
        },
        body: JSON.stringify({ reportedUser: user._id }),
      });

      const data = await res.json();
      if (res.ok) toast.success("User reported successfully!");
      else toast.error(data.message || "Failed to report user");
    } catch {
      toast.error("Something went wrong while reporting.");
    }
  };

  if (!user || !currentUser) {
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col items-center py-10 px-4 relative">
      {/* Fixed Back Button */}
      <button
        onClick={() => navigate("/skills")}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-700 hover:text-black bg-white/70 backdrop-blur-md px-4 py-2 rounded-full shadow-md transition"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium text-sm">Back</span>
      </button>

      <div className="w-full max-w-5xl mt-12">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-md p-8 flex flex-col items-center text-center">
          <img
            src={`${API_BASE_URL}/user_avatar/${user.avatar}`}
            alt={user.fullName}
            className="w-36 h-36 rounded-full object-cover shadow-md border-4 border-white"
          />
          <h1 className="text-3xl font-bold mt-4 text-gray-900">
            {user.fullName}
          </h1>
          <p className="text-gray-500">{user.email}</p>

          {/* Availability */}
          {user.availability && (
            <div className="mt-6 w-full max-w-md text-left">
              <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Availability
              </h2>
              <ul className="mt-3 space-y-2">
                {Object.entries(user.availability).map(([day, info]) => (
                  <li
                    key={day}
                    className="flex justify-between border-b border-gray-100 pb-1 text-gray-700"
                  >
                    <span className="font-medium">{day}</span>
                    {info.off ? (
                      <span className="text-red-500">Off</span>
                    ) : (
                      <span className="text-green-600">
                        {info.start} - {info.end}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="grid lg:grid-cols-2 gap-8 mt-10">
          {user.teachingSkills?.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Teaching Skills
              </h2>
              <div className="space-y-5">
                {user.teachingSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {skill.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {skill.category} • {skill.level}
                    </p>
                    {skill.experience && (
                      <p className="mt-2 text-gray-700">
                        <strong>Experience:</strong> {skill.experience} year(s)
                      </p>
                    )}
                    {skill.certifications?.length > 0 && (
                      <p className="mt-1 text-gray-700">
                        <strong>Certifications:</strong>{" "}
                        {skill.certifications.join(", ")}
                      </p>
                    )}
                    {skill.description && (
                      <p className="mt-2 text-gray-700">{skill.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.learningSkills?.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Learning Skills
              </h2>
              <div className="space-y-5">
                {user.learningSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {skill.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {skill.category} • {skill.level}
                    </p>
                    {skill.description && (
                      <p className="mt-2 text-gray-700">{skill.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center mt-10">
          <Button
            onClick={
              () => navigate(`/chat/${user._id}`) // redirect to chat page
            }
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-md"
          >
            <MessageCircle className="h-5 w-5" />
            Chat
          </Button>
          <Button
            onClick={handleReport}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl shadow-md"
          >
            <Flag className="h-5 w-5" />
            Report
          </Button>
        </div>
      </div>
    </div>
  );
}
