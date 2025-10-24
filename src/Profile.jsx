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

  // Skill form state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillType, setNewSkillType] = useState("learning");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("");
  const [newSkillExperience, setNewSkillExperience] = useState("");
  const [newSkillDescription, setNewSkillDescription] = useState("");
  const [newSkillCertifications, setNewSkillCertifications] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [skills, setSkills] = useState([]);

  // Fetch user profile
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
        console.log(data);
        const availability = data.data.user.availability || {
          Monday: { start: "09:00", end: "17:00", off: false },
          Tuesday: { start: "09:00", end: "17:00", off: false },
          Wednesday: { start: "09:00", end: "17:00", off: false },
          Thursday: { start: "09:00", end: "17:00", off: false },
          Friday: { start: "09:00", end: "17:00", off: false },
          Saturday: { start: "09:00", end: "17:00", off: false },
          Sunday: { start: "09:00", end: "17:00", off: false },
        };

        const fullProfile = { ...data.data.user, availability };
        setProfile(fullProfile);
        setOriginalProfile(fullProfile);

        const userSkills = [];
        if (data.data.user.learningSkills)
          data.data.user.learningSkills.forEach((s) =>
            userSkills.push({ ...s, type: "learning" })
          );
        if (data.data.user.teachingSkills)
          data.data.user.teachingSkills.forEach((s) =>
            userSkills.push({ ...s, type: "teaching" })
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

  const hasChanges = () => {
    if (!profile || !originalProfile) return false;

    const keys = ["fullName", "email", "balance"];
    for (const key of keys) {
      if (profile[key] !== originalProfile[key]) return true;
    }

    for (const day of Object.keys(profile.availability)) {
      const pDay = profile.availability[day];
      const oDay = originalProfile.availability[day];
      if (
        pDay.off !== oDay.off ||
        (!pDay.off && (pDay.start !== oDay.start || pDay.end !== oDay.end))
      )
        return true;
    }

    if (profile.avatar instanceof File) return true;

    return false;
  };

  const saveProfile = async () => {
    if (!profile) return;
    if (!hasChanges()) return toast("No changes detected.", { icon: "ℹ️" });
    setSaving(true);

    try {
      const token = getToken();
      if (!token)
        throw new Error("You must be logged in to update your profile.");

      let endpoint = `${API_BASE_URL}/user/me`;
      let options = { method: "PATCH", headers: { auth: token } };

      if (profile.avatar instanceof File) {
        endpoint = `${API_BASE_URL}/user/updateProfileAndPicture`;
        const formData = new FormData();
        if (profile.fullName) formData.append("fullName", profile.fullName);
        if (profile.email) formData.append("email", profile.email);
        if (profile.balance !== undefined)
          formData.append("balance", profile.balance);
        formData.append("avatar", profile.avatar);
        formData.append("availability", JSON.stringify(profile.availability));
        options.body = formData;
      } else {
        const body = {};
        if (profile.fullName) body.fullName = profile.fullName;
        if (profile.email) body.email = profile.email;
        if (profile.balance !== undefined) body.balance = profile.balance;
        if (profile.availability) body.availability = profile.availability;
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile.");

      toast.success("Profile updated successfully!");
      setProfile(data.data.user);
      setOriginalProfile(data.data.user);
    } catch (err) {
      toast.error(err.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (!hasChanges()) {
      toast("No changes detected.", { icon: "ℹ️" });
      return;
    }
    if (originalProfile) setProfile(originalProfile);
    toast("Changes canceled.", { icon: "🛑" });
  };

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
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
      setIsDeleteModalOpen(false);
    }
  };

  const addSkill = async () => {
    if (!newSkillName) return toast.error("Please enter skill name");
    setSaving(true);
    try {
      const token = getToken();
      const endpoint =
        newSkillType === "learning" ? "learning-skill" : "teaching-skill";

      const skillPayload = {
        name: newSkillName,
        category: newSkillCategory,
        level: newSkillLevel,
        description: newSkillDescription,
      };

      // Add experience and certifications only for teaching skills
      if (newSkillType === "teaching") {
        skillPayload.experience = Number(newSkillExperience) || 0;
        skillPayload.certifications = newSkillCertifications
          ? newSkillCertifications.split(",").map((c) => c.trim())
          : [];
      }

      const res = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, skill: skillPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add skill");

      toast.success(data.message);
      setSkills([...skills, { ...skillPayload, type: newSkillType }]);

      // Reset modal fields
      setNewSkillName("");
      setNewSkillCategory("");
      setNewSkillLevel("");
      setNewSkillExperience("");
      setNewSkillDescription("");
      setNewSkillCertifications("");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSkill = async (skill) => {
    setSaving(true);
    try {
      const token = getToken();
      const endpoint =
        skill.type === "learning" ? "learning-skill" : "teaching-skill";
      console.log(skill);
      const res = await fetch(`${API_BASE_URL}/user/${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, skillId: skill._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete skill");

      toast.success(data.message);
      setSkills(skills.filter((s) => s.name !== skill.name));
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

      {/* Tabs and Credits */}
      <div className="bg-white border-b shadow-sm px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex justify-between w-full sm:w-auto gap-2">
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
        <div className="text-yellow-600 font-semibold text-center mt-2 sm:mt-0 sm:text-right">
          Credits: {profile.credits}
        </div>
      </div>

      <div className="flex-1 w-full px-6 change-profile-px py-8 flex flex-col">
        {/* INFORMATION TAB */}
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

              {/* Balance Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Balance</label>
                <Input
                  type="number"
                  value={profile.balance ?? 0}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val) || val < 0) val = 0;
                    handleProfileChange("balance", val);
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="w-full mb-6">
              <h3 className="text-xl font-semibold mb-4">Availability</h3>
              <div className="flex flex-col gap-4 w-full">
                {Object.keys(profile.availability).map((day) => {
                  const dayData = profile.availability[day];
                  return (
                    <div
                      key={day}
                      className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 border rounded-lg p-3 bg-white w-full"
                    >
                      <span className="font-medium w-full sm:w-28 text-center sm:text-left">
                        {day}
                      </span>

                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        {!dayData.off && (
                          <>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="min-w-[40px] text-sm">From</span>
                              <input
                                type="time"
                                value={dayData.start}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    availability: {
                                      ...profile.availability,
                                      [day]: {
                                        ...dayData,
                                        start: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                              />
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="min-w-[40px] text-sm">To</span>
                              <input
                                type="time"
                                value={dayData.end}
                                onChange={(e) =>
                                  setProfile({
                                    ...profile,
                                    availability: {
                                      ...profile.availability,
                                      [day]: {
                                        ...dayData,
                                        end: e.target.value,
                                      },
                                    },
                                  })
                                }
                                className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
                              />
                            </div>
                          </>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={dayData.off || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfile({
                                  ...profile,
                                  availability: {
                                    ...profile.availability,
                                    [day]: {
                                      off: true,
                                      start: dayData.start,
                                      end: dayData.end,
                                    },
                                  },
                                });
                              } else {
                                const prevDay =
                                  originalProfile.availability[day];
                                setProfile({
                                  ...profile,
                                  availability: {
                                    ...profile.availability,
                                    [day]: {
                                      off: false,
                                      start: prevDay.start || "09:00",
                                      end: prevDay.end || "17:00",
                                    },
                                  },
                                });
                              }
                            }}
                            className="w-5 h-5 accent-blue-600 rounded"
                          />
                          <span className="text-sm">Day Off</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6">
              <Button
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Delete Account
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={cancelChanges}
                  disabled={saving || !hasChanges()}
                  className="w-full sm:w-auto"
                >
                  {hasChanges() ? "Cancel Changes" : "No changes detected"}
                </Button>
                <Button
                  onClick={saveProfile}
                  disabled={saving || !hasChanges()}
                  className="w-full sm:w-auto"
                >
                  {saving
                    ? "Saving..."
                    : hasChanges()
                    ? "Save Changes"
                    : "No changes detected"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MANAGE SKILLS TAB */}
        {activeTab === "manage" && (
          <div className="w-full max-w-6xl mx-auto flex-1 change-manage-px">
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">
              Manage Skills
            </h2>

            <div className="flex gap-2 mb-4 ">
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
              {/* Learning Skills */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Learning Skills</h3>
                <div className="space-y-2">
                  {skills
                    .filter((s) => s.type === "learning")
                    .map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between bg-white shadow px-4 py-3 rounded-lg gap-2 hover:shadow-md transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            Name: {s.name}
                          </p>
                          {s.category && (
                            <p className="text-sm text-gray-500">
                              Category: {s.category}
                            </p>
                          )}
                          {s.level && (
                            <p className="text-sm text-gray-500">
                              Level: {s.level}
                            </p>
                          )}
                          {s.description && (
                            <p className="text-sm text-gray-600">
                              Description:{s.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSkill(s)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Teaching Skills */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Teaching Skills</h3>
                <div className="space-y-2">
                  {skills
                    .filter((s) => s.type === "teaching")
                    .map((s, i) => (
                      <div
                        key={i}
                        className="flex justify-between bg-white shadow px-4 py-3 rounded-lg gap-2 hover:shadow-md transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            Name: {s.name}
                          </p>
                          {s.category && (
                            <p className="text-sm text-gray-500">
                              Category: {s.category}
                            </p>
                          )}
                          {s.level && (
                            <p className="text-sm text-gray-500">
                              Level: {s.level}
                            </p>
                          )}
                          {s.experience !== undefined && (
                            <p className="text-sm text-gray-500">
                              Experience: {s.experience}{" "}
                              {s.experience > 1 ? "years" : "year"}
                            </p>
                          )}
                          {s.certifications?.length > 0 && (
                            <p className="text-sm text-gray-500">
                              Certifications: {s.certifications.join(", ")}
                            </p>
                          )}
                          {s.description && (
                            <p className="text-sm text-gray-600">
                              Description: {s.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSkill(s)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Add {newSkillType === "learning" ? "Learning" : "Teaching"} Skill
            </Dialog.Title>
            <div className="space-y-3">
              <Input
                placeholder="Skill name"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
              />

              {/* Category Dropdown with "Other" */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Category
                </label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full border rounded px-2 py-1 mb-2"
                >
                  <option value="">Select Category</option>
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
                {newSkillCategory === "Other" && (
                  <Input
                    placeholder="Enter custom category"
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value)}
                  />
                )}
              </div>

              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>

              {newSkillType === "teaching" && (
                <Input
                  type="number"
                  placeholder="Experience (years)"
                  value={newSkillExperience}
                  onChange={(e) => setNewSkillExperience(e.target.value)}
                />
              )}
              <Input
                placeholder="Description (optional)"
                value={newSkillDescription}
                onChange={(e) => setNewSkillDescription(e.target.value)}
              />
              {newSkillType === "teaching" && (
                <Input
                  placeholder="Certifications (comma separated)"
                  value={newSkillCertifications}
                  onChange={(e) => setNewSkillCertifications(e.target.value)}
                />
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addSkill} disabled={saving}>
                {saving ? "Adding..." : "Add Skill"}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* DELETE ACCOUNT MODAL */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md text-center">
            <Dialog.Title className="text-xl font-semibold mb-4 text-red-600">
              Confirm Account Deletion
            </Dialog.Title>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete your account? This
              action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
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
                {saving ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
