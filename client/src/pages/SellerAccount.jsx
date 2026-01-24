import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Upload,
  X,
  CreditCard,
  Building2,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "@/api/auth";
import toast from "react-hot-toast";

export default function SellerAccount() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: "",
    storeDescription: "",
    paymentMethod: "gcash",
    gcashNumber: "",
    gcashName: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    qrCodeFile: null,
    qrCodePreview: null,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load existing seller data or application data
  useEffect(() => {
    if (user?.seller) {
      // Approved seller - load seller profile
      const seller = user.seller;
      const paymentDetails = seller.paymentDetails || {};

      setFormData({
        storeName: seller.storeName || "",
        storeDescription: seller.storeDescription || "",
        paymentMethod: paymentDetails.method || "gcash",
        gcashNumber: paymentDetails.gcash?.number || "",
        gcashName: paymentDetails.gcash?.name || "",
        bankName: paymentDetails.bank?.bankName || "",
        accountNumber: paymentDetails.bank?.accountNumber || "",
        accountName: paymentDetails.bank?.accountName || "",
        qrCodeFile: null,
        qrCodePreview: paymentDetails.qrCodeUrl || null,
      });
    } else if (
      user?.sellerApplication &&
      user.sellerApplication.status === "pending"
    ) {
      // Pending application - load application data
      const application = user.sellerApplication;
      const paymentDetails = application.paymentDetails || {};

      setFormData({
        storeName: application.storeName || "",
        storeDescription: application.storeDescription || "",
        paymentMethod: paymentDetails.method || "gcash",
        gcashNumber: paymentDetails.gcash?.number || "",
        gcashName: paymentDetails.gcash?.name || "",
        bankName: paymentDetails.bank?.bankName || "",
        accountNumber: paymentDetails.bank?.accountNumber || "",
        accountName: paymentDetails.bank?.accountName || "",
        qrCodeFile: null,
        qrCodePreview: paymentDetails.qrCodeUrl || null,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          qrCode: "Please upload an image file",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          qrCode: "File size must be less than 5MB",
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          qrCodeFile: file,
          qrCodePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);

      if (errors.qrCode) {
        setErrors((prev) => ({ ...prev, qrCode: "" }));
      }
    }
  };

  const removeQRCode = () => {
    setFormData((prev) => ({
      ...prev,
      qrCodeFile: null,
      qrCodePreview: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store name is required";
    }

    if (!formData.storeDescription.trim()) {
      newErrors.storeDescription = "Store description is required";
    }

    if (formData.paymentMethod === "gcash") {
      if (!formData.gcashNumber.trim()) {
        newErrors.gcashNumber = "GCash number is required";
      } else if (!/^09\d{9}$/.test(formData.gcashNumber)) {
        newErrors.gcashNumber = "Invalid GCash number (must be 09XXXXXXXXX)";
      }

      if (!formData.gcashName.trim()) {
        newErrors.gcashName = "GCash account name is required";
      }
    } else if (formData.paymentMethod === "bank") {
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bank name is required";
      }

      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
      }

      if (!formData.accountName.trim()) {
        newErrors.accountName = "Account name is required";
      }
    }

    if (!formData.qrCodeFile) {
      newErrors.qrCode = "Payment QR code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Authentication required");
        navigate("/login");
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("storeName", formData.storeName.trim());
      formDataToSend.append(
        "storeDescription",
        formData.storeDescription.trim(),
      );
      formDataToSend.append("paymentMethod", formData.paymentMethod);

      // Add payment-specific details
      if (formData.paymentMethod === "gcash") {
        formDataToSend.append("gcashNumber", formData.gcashNumber.trim());
        formDataToSend.append("gcashName", formData.gcashName.trim());
      } else if (formData.paymentMethod === "bank") {
        formDataToSend.append("bankName", formData.bankName.trim());
        formDataToSend.append("accountNumber", formData.accountNumber.trim());
        formDataToSend.append("accountName", formData.accountName.trim());
      }

      // Append QR code file
      if (formData.qrCodeFile) {
        formDataToSend.append("qrCode", formData.qrCodeFile);
      }

      console.log("Submitting seller application...");

      // Log FormData contents for debugging
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Determine which API to use
      const isApprovedSeller = user.role === "seller";
      const hasPendingApplication =
        user.sellerApplication?.status === "pending";

      let response;
      if (isApprovedSeller) {
        // Update approved seller profile
        response = await authAPI.updateSellerProfile(token, formDataToSend);
      } else if (hasPendingApplication) {
        // Update pending application
        response = await authAPI.updateSellerApplication(token, formDataToSend);
      } else {
        toast.error("No seller profile or application found");
        return;
      }

      if (response.success) {
        toast.success(
          isApprovedSeller
            ? "Seller profile updated successfully!"
            : "Application updated successfully!",
        );
        await refreshProfile();
      } else {
        toast.error(response.message || "Failed to update");
      }
    } catch (error) {
      console.error("Apply seller error:", error);
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Store size={32} />
              <h1 className="text-3xl font-bold">Seller Account</h1>
            </div>
            <p className="text-blue-100">
              {user?.role === "seller"
                ? "Manage your seller profile and payment information"
                : "Update your seller application details"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Store Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                <Store size={20} className="text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Store Information
                </h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    errors.storeName ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="e.g., Speed Moto Parts"
                />
                {errors.storeName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.storeName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Store Description *
                </label>
                <textarea
                  name="storeDescription"
                  value={formData.storeDescription}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${
                    errors.storeDescription
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                  placeholder="Tell buyers about your store and what you sell..."
                />
                {errors.storeDescription && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.storeDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-200">
                <CreditCard size={20} className="text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Details
                </h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: "gcash",
                      }))
                    }
                    className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                      formData.paymentMethod === "gcash"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <CreditCard className="mx-auto mb-2" size={24} />
                      GCash
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: "bank",
                      }))
                    }
                    className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                      formData.paymentMethod === "bank"
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <Building2 className="mx-auto mb-2" size={24} />
                      Bank Transfer
                    </div>
                  </button>
                </div>
              </div>

              {formData.paymentMethod === "gcash" && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-100">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2">
                    <CreditCard size={18} />
                    GCash Account Details
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GCash Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="gcashNumber"
                      value={formData.gcashNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.gcashNumber
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                    />
                    {errors.gcashNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.gcashNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GCash Account Name *
                    </label>
                    <input
                      type="text"
                      name="gcashName"
                      value={formData.gcashName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.gcashName ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Juan Dela Cruz"
                    />
                    {errors.gcashName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.gcashName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {formData.paymentMethod === "bank" && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-100">
                  <h3 className="font-bold text-green-900 flex items-center gap-2">
                    <Building2 size={18} />
                    Bank Account Details
                  </h3>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name *
                    </label>
                    <select
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.bankName ? "border-red-500" : "border-gray-200"
                      }`}
                    >
                      <option value="">Select Bank</option>
                      <option value="BDO">BDO Unibank</option>
                      <option value="BPI">
                        Bank of the Philippine Islands
                      </option>
                      <option value="Metrobank">Metrobank</option>
                      <option value="Landbank">Landbank</option>
                      <option value="PNB">Philippine National Bank</option>
                      <option value="UnionBank">UnionBank</option>
                      <option value="Security Bank">Security Bank</option>
                    </select>
                    {errors.bankName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.bankName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.accountNumber
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      placeholder="XXXX-XXXX-XXXX"
                    />
                    {errors.accountNumber && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.accountNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.accountName
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      placeholder="Juan Dela Cruz"
                    />
                    {errors.accountName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.accountName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payment QR Code *
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Upload your{" "}
                  {formData.paymentMethod === "gcash" ? "GCash" : "Bank"} QR
                  code so buyers can easily send payments
                </p>

                {!formData.qrCodePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG or JPEG (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleQRUpload}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={formData.qrCodePreview}
                      alt="QR Code Preview"
                      className="w-full max-w-sm mx-auto rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeQRCode}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {errors.qrCode && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.qrCode}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle
                  className="text-amber-600 flex-shrink-0"
                  size={20}
                />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">Important Notes:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Your payment details will be shown to buyers during
                      checkout
                    </li>
                    <li>Make sure your QR code is clear and scannable</li>
                    <li>Double-check all information before submitting</li>
                    <li>Admin will review your application before approval</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting Application...
                </>
              ) : (
                <>
                  <Store size={20} />
                  Submit Application
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
