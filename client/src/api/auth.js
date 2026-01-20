// Authentication API functions
const API_BASE = "http://localhost:3000/auth";

export const authAPI = {
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
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_BASE}/profile`, {
      headers: {
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
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
};
