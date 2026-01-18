import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { toast } from "react-hot-toast";
import { authAPI } from "@/api/auth";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, updateProfile, refreshProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [birthday, setBirthday] = useState("");
  const [contact, setContact] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
      setBirthday(user.birthday ?? "");
      setContact(user.contact ?? "");
      setAddressLine(user.addressLine ?? "");
      setBarangay(user.barangay ?? "");
      setCity(user.city ?? "");
      setProvince(user.province ?? "");
      setZipCode(user.zipCode ?? "");
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await authAPI.uploadAvatar(token, file);
      if (response.success) {
        setAvatarUrl(response.url);
        await refreshProfile();
        toast.success("Avatar uploaded!");
      } else {
        toast.error("Failed to upload avatar.");
      }
    } catch (error) {
      toast.error("Failed to upload avatar.");
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return toast.error("Username is required");
    if (!birthday.trim()) return toast.error("Birthday is required");
    if (!contact.trim()) return toast.error("Contact is required");
    if (!addressLine.trim()) return toast.error("Street address is required");
    if (!barangay.trim()) return toast.error("Barangay is required");
    if (!city.trim()) return toast.error("City is required");
    if (!province.trim()) return toast.error("Province is required");
    if (zipCode.trim() && !/^\d{4}$/.test(zipCode.trim())) {
      return toast.error("ZIP code must be 4 digits");
    }

    setLoading(true);
    try {
      const data = {
        username: username.trim(),
        birthday: birthday.trim(),
        contact: contact.trim(),
        addressLine: addressLine.trim(),
        barangay: barangay.trim(),
        city: city.trim(),
        province: province.trim(),
        zipCode: zipCode.trim(),
      };
      const res = await updateProfile(data);
      if (res.success) {
        toast.success("Profile updated!");
      } else {
        toast.error("Update failed.");
      }
    } catch (err) {
      toast.error("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 text-gray-800">
      <h2 className="text-2xl font-semibold mb-8">Edit Profile</h2>

      <div className="flex flex-col md:flex-row gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover border shadow-sm"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-100 border flex items-center justify-center text-gray-400 text-sm shadow-sm">
              No Avatar
            </div>
          )}

          <div className="flex flex-col items-center md:items-start gap-2">
            <label
              htmlFor="avatar-upload"
              className="inline-block px-4 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition"
            >
              {avatarUrl ? "Change Avatar" : "Upload Avatar"}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birthday
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact
            </label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barangay
              </label>
              <input
                type="text"
                value={barangay}
                onChange={(e) => setBarangay(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City / Municipality
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code (Optional)
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md font-medium"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {!user?.seller && (
            <Link
              to="/apply-seller"
              className="block w-full mt-4 text-center bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-medium"
            >
              Apply as Seller
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
