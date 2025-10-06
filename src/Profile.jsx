import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Dialog } from "@headlessui/react";
import { Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { API_BASE_URL } from "./Config";
import { getToken, removeToken } from "./ManageToken";
import { useNavigate } from "react-router";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("information");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState("learning");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);

  // Fetch profile + skills
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        toast.error("Please login first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/user/me`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");

        setProfile(data.data.user);
        const userSkills = [];
        if (data.data.user.learningSkills)
          data.data.user.learningSkills.forEach((s) =>
            userSkills.push({ name: s, type: "learning" })
          );
        if (data.data.user.teachingSkills)
          data.data.user.teachingSkills.forEach((s) =>
            userSkills.push({ name: s, type: "teaching" })
          );
        setSkills(userSkills);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfile({ ...profile, avatar: file, avatarPreview: previewUrl });
    }
  };

  // Save Profile
  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const token = getToken();
      if (!token)
        throw new Error("You must be logged in to update your profile.");

      let endpoint = `${API_BASE_URL}/user/me`;
      let options = {
        method: "PATCH",
        headers: {
          auth: token,
        },
      };

      // If avatar is File, send FormData
      if (profile.avatar instanceof File) {
        endpoint = `${API_BASE_URL}/user/updateProfileAndPicture`;
        const formData = new FormData();
        if (profile.fullName) formData.append("fullName", profile.fullName);
        if (profile.email) formData.append("email", profile.email);
        formData.append("avatar", profile.avatar);
        options.body = formData;
      } else {
        const body = {};
        if (profile.fullName) body.fullName = profile.fullName;
        if (profile.email) body.email = profile.email;
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update profile.");

      toast.success("Profile updated successfully!");
      setProfile(data.data.user);
    } catch (err) {
      toast.error(err.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const deleteAccount = async () => {
    setSaving(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not logged in.");

      const res = await fetch(`${API_BASE_URL}/user/deleteMe`, {
        method: "DELETE",
        headers: { auth: token },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete account.");

      toast.success("Account deleted successfully.");
      removeToken();
      setTimeout(() => {
        navigate("/login"); // redirect home
      }, 1000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Add skill
  const addSkill = async () => {
    if (!newSkillName) return toast.error("Please enter skill name");
    setSaving(true);
    try {
      const token = getToken();
      const endpoint =
        newSkillType === "learning" ? "learning-skill" : "teaching-Skill";
      const res = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, skill: newSkillName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add skill");

      toast.success(data.message);
      setSkills([...skills, { name: newSkillName, type: newSkillType }]);
      setNewSkillName("");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete skill
  const deleteSkill = async (skill) => {
    setSaving(true);
    try {
      const token = getToken();
      const endpoint =
        skill.type === "learning" ? "learning-skill" : "teaching-Skill";
      const res = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, skill: skill.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete skill");

      toast.success(data.message);
      setSkills(skills.filter((s) => s !== skill));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <Toaster position="top-center" />
      </div>
    );

  if (!profile)
    return (
      <div className="text-center mt-20 text-red-500">
        Failed to load profile.
        <Toaster position="top-center" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />

      {/* Tabs with Credits */}
      <div className="bg-white border-b shadow-sm flex flex-wrap items-center justify-between px-6 py-3">
        <div className="flex gap-2">
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
        <div className="text-yellow-600 font-semibold">
          Credits: {profile.credits}
        </div>
      </div>

      <div className="flex-1 w-full px-6 py-8 flex flex-col">
        {/* INFORMATION */}
        {activeTab === "information" && (
          <div className="max-w-3xl mx-auto flex flex-col items-center flex-1 w-full">
            <h2 className="text-3xl font-semibold text-gray-800 mb-8">
              Profile Information
            </h2>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-3">
                <img
                  src={
                    profile.avatarPreview
                      ? profile.avatarPreview
                      : `${API_BASE_URL}/user_avatar/${profile.avatar}`
                  }
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

            {/* Info Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={profile.fullName}
                  onChange={(e) =>
                    handleProfileChange("fullName", e.target.value)
                  }
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

            {/* Buttons: Delete left, Save right */}
            <div className="w-full flex justify-between py-6">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={saving}
              >
                Delete Account
              </Button>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}

        {/* MANAGE SKILLS */}
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
                          onClick={() => deleteSkill(skill)}
                          disabled={saving}
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
                          onClick={() => deleteSkill(skill)}
                          disabled={saving}
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

        {/* Add Skill Modal */}
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
              <Button onClick={addSkill} disabled={saving}>
                Add
              </Button>
            </div>
          </div>
        </Dialog>

        {/* Delete Account Modal */}
        <Dialog
          open={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg p-6 w-80">
            <Dialog.Title className="text-xl font-semibold mb-4 text-red-600">
              Delete Account
            </Dialog.Title>
            <p className="mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteAccount}
                disabled={saving}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
