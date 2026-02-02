import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authAPI } from "@/api/auth";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [contact, setContact] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signUp, signInWithGoogle, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleAvatar = (e) => {
    const f = e.target.files[0];
    if (f) {
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const validateProfile = () => {
    if (!username.trim()) return "Username is required";
    if (!email.trim()) return "Email is required";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!birthday.trim()) return "Birthday is required";
    if (!contact.trim()) return "Contact is required";
    if (!/^\d{10,11}$/.test(contact.trim()))
      return "Contact must be 10-11 digits";
    if (!addressLine.trim()) return "Street address is required";
    if (!barangay.trim()) return "Barangay is required";
    if (!city.trim()) return "City is required";
    if (!province.trim()) return "Province is required";
    if (zipCode.trim() && !/^\d{4}$/.test(zipCode.trim()))
      return "ZIP code must be 4 digits";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const v = validateProfile();
    if (v) return toast.error(v);

    setLoading(true);
    try {
      const res = await signUp(email, password, username.trim());
      if (!res || !res.success) {
        return toast.error(res?.message || "Signup failed");
      }

      // upload avatar if exists
      let avatarUrl = null;
      if (avatarFile) {
        const token = localStorage.getItem("authToken");
        const uploadRes = await authAPI.uploadAvatar(token, avatarFile);
        if (uploadRes.success) avatarUrl = uploadRes.url;
      }

      // update profile on server
      const updates = {
        username: username.trim(),
        birthday: birthday.trim(),
        contact: contact.trim(),
        addressLine: addressLine.trim(),
        barangay: barangay.trim(),
        city: city.trim(),
        province: province.trim(),
        zipCode: zipCode.trim(),
        avatarUrl,
      };

      const up = await updateProfile(updates);
      if (up.success) {
        await refreshProfile();
        toast.success("Account created and profile saved");
        navigate("/");
      } else {
        toast.error(up.message || "Profile update failed");
      }
    } catch (err) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Ensure we have latest profile
      const profileRes = await refreshProfile();
      const user = profileRes?.user || null;
      const profileComplete = user && user.username;
      if (!profileComplete) {
        navigate("/complete-profile");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.message || "Google sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={50}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (min 6 characters)"
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            required
          />

          <input
            type="tel"
            placeholder="Contact (10-11 digits)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            required
          />

          <input
            type="text"
            placeholder="Street address"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="ZIP code (optional)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 text-sm focus:outline-none focus:border-blue-500"
              maxLength={4}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Avatar (optional)
            </label>
            <input type="file" accept="image/*" onChange={handleAvatar} />
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="preview"
                className="w-20 h-20 rounded mt-2"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-md font-medium text-sm"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="my-3 text-center text-xs text-gray-500">OR</div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center border border-gray-300 py-3 rounded-md hover:bg-gray-50 text-sm"
          disabled={loading}
        >
          <FcGoogle className="mr-2 text-lg" /> Continue with Google
        </button>

        <div className="mt-4 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
