// Authentication API functions
const API_BASE = "http://localhost:3000/auth";

export const authAPI = {
  // Resolve email from username
  resolveEmail: async (identifier) => {
    const response = await fetch(
      `${API_BASE}/users/resolve-email?identifier=${encodeURIComponent(identifier)}`,
    );
    return await response.json();
  },

  // Check if username is available
  checkUsername: async (username) => {
    const response = await fetch(
      `${API_BASE}/users/check-username?username=${encodeURIComponent(username)}`,
    );
    return await response.json();
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data;
  },
  signUp: async (email, password, displayName) => {
    const response = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
      }),
    });

    const data = await response.json();
    return data;
  },

  signIn: async (identifier, password) => {
    const response = await fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    const data = await response.json();
    return data;
  },

  signOut: async (token) => {
    const response = await fetch(`${API_BASE}/signout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  },

  updateProfile: async (token, updates) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    return data;
  },

  updateSellerProfile: async (token, formData) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  },

  uploadAvatar: async (token, file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_BASE}/profile/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  },

  signInWithGoogle: async (idToken) => {
    const response = await fetch(`${API_BASE}/google-signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    });

    const data = await response.json();
    return data;
  },

  verifyToken: async (idToken) => {
    const response = await fetch(`${API_BASE}/token-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();
    return data;
  },

  signInAdmin: async (username, password) => {
    const response = await fetch(`${API_BASE}/signin-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: username, password }),
    });
    return await response.json();
  },

  // Seller application
  applyAsSeller: async (token, formData) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/apply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  },

  // Update seller application (for pending applications)
  updateSellerApplication: async (token, formData) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/update-application`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data;
  },

  // Get seller applications (admin only)
  getSellerApplications: async (token) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/applications`, {
      method: "GET",
    });

    const data = await response.json();
    return data;
  },

  // Approve seller application (admin only)
  approveSeller: async (token, uid) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/approve/${uid}`, {
      method: "PUT",
    });

    const data = await response.json();
    return data;
  },

  // Reject seller application (admin only)
  rejectSeller: async (token, uid, reason) => {
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/reject/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();
    return data;
  },

  uploadSellerAvatar: async (token, file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const ROOT = API_BASE.replace("/auth", "");
    const response = await fetch(`${ROOT}/seller/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Avatar upload failed");
    }
    return data;
  },
};
