import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Dialog } from "@headlessui/react";
import { Trash2 } from "lucide-react";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("information");
  const [skills, setSkills] = useState([
    { name: "JavaScript", type: "learning" },
    { name: "React", type: "teaching" },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState("learning");

  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    credits: 120,
    avatar: "/default-avatar.png",
    availability: {
      Monday: { start: "", end: "" },
      Tuesday: { start: "", end: "" },
      Wednesday: { start: "", end: "" },
      Thursday: { start: "", end: "" },
      Friday: { start: "", end: "" },
      Saturday: { start: "", end: "" },
      Sunday: { start: "", end: "" },
    },
  });

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile({ ...profile, avatar: url });
    }
  };

  const addSkill = () => {
    if (!newSkillName) return;
    setSkills([...skills, { name: newSkillName, type: newSkillType }]);
    setNewSkillName("");
    setNewSkillType("learning");
    setIsModalOpen(false);
  };

  const deleteSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b shadow-sm flex flex-wrap justify-start gap-2 px-6 py-3">
        <Button
          variant={activeTab === "information" ? "default" : "ghost"}
          onClick={() => setActiveTab("information")}
        >
          Information
        </Button>
        <Button
          variant={activeTab === "manage" ? "default" : "ghost"}
          onClick={() => setActiveTab("manage")}
        >
          Manage Skills
        </Button>
      </div>

      {/* Page Content */}
      <div className="flex-1 w-full px-6 py-8 flex flex-col">
        {/* INFORMATION TAB */}
        {activeTab === "information" && (
          <div className="max-w-3xl mx-auto flex flex-col items-center flex-1 w-full">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
              Profile Information
            </h2>

            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-3">
                <img
                  src={profile.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Choose Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={profile.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="w-full mb-6">
              <h3 className="text-xl font-semibold mb-4">Availability</h3>
              <div className="flex flex-col gap-4">
                {Object.keys(profile.availability).map((day) => (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 border rounded-lg p-3 bg-white w-full"
                  >
                    <span className="font-medium w-full sm:w-28 text-center sm:text-left">
                      {day}
                    </span>

                    {/* Time Inputs */}
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full sm:w-auto">
                      {/* FROM */}
                      <div className="flex flex-col sm:flex-row items-start gap-1 w-full sm:w-auto sm:mr-4">
                        <span>From</span>
                        <input
                          type="time"
                          value={profile.availability[day].start}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              availability: {
                                ...profile.availability,
                                [day]: {
                                  ...profile.availability[day],
                                  start: e.target.value,
                                },
                              },
                            })
                          }
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      </div>

                      {/* TO */}
                      <div className="flex flex-col sm:flex-row items-start gap-1 w-full sm:w-auto">
                        <span>To</span>
                        <input
                          type="time"
                          value={profile.availability[day].end}
                          onChange={(e) =>
                            setProfile({
                              ...profile,
                              availability: {
                                ...profile.availability,
                                [day]: {
                                  ...profile.availability[day],
                                  end: e.target.value,
                                },
                              },
                            })
                          }
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-yellow-600 font-semibold mb-6">
              Credits: {profile.credits}
            </p>

            <div className="w-full flex justify-end py-6">
              <Button onClick={saveProfile}>Save Changes</Button>
            </div>
          </div>
        )}

        {/* MANAGE SKILLS TAB */}
        {activeTab === "manage" && (
          <div className="w-full max-w-6xl mx-auto flex-1">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Manage Skills
            </h2>

            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => {
                  setNewSkillType("learning");
                  setIsModalOpen(true);
                }}
              >
                Add Learning Skill
              </Button>
              <Button
                onClick={() => {
                  setNewSkillType("teaching");
                  setIsModalOpen(true);
                }}
              >
                Add Teaching Skill
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Learning Skills</h3>
                <div className="space-y-2">
                  {skills
                    .filter((s) => s.type === "learning")
                    .map((skill, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center border rounded-lg px-3 py-2 bg-white"
                      >
                        <span>{skill.name}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSkill(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4">Teaching Skills</h3>
                <div className="space-y-2">
                  {skills
                    .filter((s) => s.type === "teaching")
                    .map((skill, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center border rounded-lg px-3 py-2 bg-white"
                      >
                        <span>{skill.name}</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSkill(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD SKILL MODAL */}
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg p-6 w-80">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Add {newSkillType === "learning" ? "Learning" : "Teaching"} Skill
            </Dialog.Title>
            <Input
              placeholder="Skill Name"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSkill}>Add</Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
