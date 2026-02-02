export default function CompleteProfilePage() {
  const handleLogin = (e) => {
    e.preventDefault();
    console.log("Login submitted");
  };
  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      {/* Branding/Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Complete Profile</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please enter your details to complete your profile
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Username
          </label>
          <input
            type="text"
            placeholder="Enter admin username"
            className="w-full p-2.5 border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Complete Profile
        </button>
      </form>
    </div>
  );
}
