// SkillsPage.jsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

const sampleUsers = [
  {
    id: 1,
    name: "Alice",
    avatar: "https://i.pravatar.cc/150?img=1",
    skills: ["React", "Node.js", "CSS"],
  },
  {
    id: 2,
    name: "Bob",
    avatar: "https://i.pravatar.cc/150?img=2",
    skills: ["Python", "Django", "Flask"],
  },
  {
    id: 3,
    name: "Charlie",
    avatar: "https://i.pravatar.cc/150?img=3",
    skills: ["Golang", "Docker", "Kubernetes"],
  },
  {
    id: 4,
    name: "David",
    avatar: "https://i.pravatar.cc/150?img=4",
    skills: ["Java", "Spring", "Hibernate"],
  },
  {
    id: 5,
    name: "Eve",
    avatar: "https://i.pravatar.cc/150?img=5",
    skills: ["Vue", "Nuxt", "Tailwind"],
  },
  {
    id: 6,
    name: "Frank",
    avatar: "https://i.pravatar.cc/150?img=6",
    skills: ["C#", ".NET", "Blazor"],
  },
  {
    id: 7,
    name: "Grace",
    avatar: "https://i.pravatar.cc/150?img=7",
    skills: ["HTML", "CSS", "JS"],
  },
  {
    id: 8,
    name: "Hank",
    avatar: "https://i.pravatar.cc/150?img=8",
    skills: ["Ruby", "Rails", "Sinatra"],
  },
  {
    id: 9,
    name: "Ivy",
    avatar: "https://i.pravatar.cc/150?img=9",
    skills: ["PHP", "Laravel", "MySQL"],
  },
  {
    id: 10,
    name: "Jack",
    avatar: "https://i.pravatar.cc/150?img=10",
    skills: ["Kotlin", "Android", "Firebase"],
  },
];

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 6;

  const filteredUsers = sampleUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.skills.some((skill) =>
        skill.toLowerCase().includes(search.toLowerCase())
      )
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Search */}
      <div className="mb-6 w-full max-w-md mx-auto">
        <Input
          placeholder="Search by name or skill..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentUsers.map((user) => (
          <Card
            key={user.id}
            className="flex flex-col items-center text-center p-6 justify-between h-full"
          >
            {/* Top part: Avatar, Name, Skills */}
            <div className="flex flex-col items-center space-y-2">
              {/* Avatar */}
              <img
                src={user.avatar}
                alt={user.name}
                className="w-30 h-30 rounded-full"
              />

              {/* Name */}
              <CardHeader className="w-full text-center p-0">
                <CardTitle>{user.name}</CardTitle>
              </CardHeader>

              {/* Skills */}
              <CardContent className="p-0">
                <CardDescription>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardDescription>
              </CardContent>
            </div>

            {/* Bottom part: Button */}
            <Button
              className="mt-4 w-full"
              onClick={() => alert(`Appointment with ${user.name} clicked`)}
            >
              Make Appointment
            </Button>
          </Card>
        ))}
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
  );
}
