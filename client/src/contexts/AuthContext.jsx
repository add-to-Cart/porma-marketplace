import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { authAPI } from "@/api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to check seller restriction
  const isSellerRestricted = (userObj) => {
    if (!userObj) return false;
    const isSeller = userObj.isSeller === true || userObj.role === "seller";
    const isDeactivated =
      userObj.status === "deactivated" || userObj.isActive === false;
    const isRestricted =
      userObj.status === "restricted" || userObj.isRestricted === true;
    return isSeller && (isDeactivated || isRestricted);
  };

  // Centralized user setter
  const setUserWithRestriction = (userObj) => {
    if (isSellerRestricted(userObj)) {
      localStorage.removeItem("authToken");
      setUser(null);
      setError("Seller account is inactive or restricted.");
      setLoading(false);
      return false;
    }
    setUser(userObj);
    setError(null);
    setLoading(false);
    return true;
  };

  // Set admin user directly (for admin login)
  const setAdminUser = (adminObj) => {
    setUser({ ...adminObj, isAdmin: true });
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        setLoading(true);
        const res = await authAPI.getProfile(token);
        if (res.success) {
          setUserWithRestriction(res.user);
        } else {
          localStorage.removeItem("authToken");
          setUser(null);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await userCredential.user.getIdToken();
      const response = await authAPI.verifyToken(idToken);
      if (response.success) {
        localStorage.setItem("authToken", idToken);
        if (!setUserWithRestriction(response.user)) {
          return {
            success: false,
            message: "Seller account is inactive or restricted.",
          };
        }
        return { success: true };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
      // Parse Firebase error code for better messaging
      let errorMessage = "Sign up failed";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak (minimum 6 characters required)";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("SignUp Error:", err.code, err.message);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier, password) => {
    try {
      setLoading(true);
      setError(null);
      let email = identifier;
      // If identifier is not an email, resolve email from backend
      if (!identifier.includes("@")) {
        // Call backend to resolve email from username
        const res = await authAPI.resolveEmail(identifier);
        if (!res || !res.email) {
          setError(
            "Username not found. Please use your email or a valid username.",
          );
          setLoading(false);
          return {
            success: false,
            message:
              "Username not found. Please use your email or a valid username.",
          };
        }
        email = res.email;
      }
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await userCredential.user.getIdToken();
      // Now verify idToken with backend to get user data
      const verifyResponse = await authAPI.verifyToken(idToken);
      if (verifyResponse.success) {
        localStorage.setItem("authToken", idToken);
        if (!setUserWithRestriction(verifyResponse.user)) {
          return {
            success: false,
            message: "Seller account is inactive or restricted.",
          };
        }
        return { success: true, user: verifyResponse.user };
      }
      setError(verifyResponse.message);
      return { success: false, message: verifyResponse.message };
    } catch (err) {
      // Parse Firebase error code for better messaging
      let errorMessage = "Sign in failed";

      if (err.code === "auth/user-not-found") {
        errorMessage = "Email or username not found";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (err.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("SignIn Error:", err.code, err.message);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInAdmin = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.signInAdmin(username, password);
      if (response.success) {
        const userCredential = await signInWithCustomToken(
          auth,
          response.customToken,
        );
        const idToken = await userCredential.user.getIdToken();
        const verifyResponse = await authAPI.verifyToken(idToken);
        if (verifyResponse.success) {
          localStorage.setItem("authToken", idToken);
          if (!setUserWithRestriction(verifyResponse.user)) {
            return {
              success: false,
              message: "Seller account is inactive or restricted.",
            };
          }
          return { success: true, user: verifyResponse.user };
        }
        setError(verifyResponse.message);
        return { success: false, message: verifyResponse.message };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
      setError(err.message || "Admin sign in failed");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await authAPI.verifyToken(idToken);
      if (response.success) {
        localStorage.setItem("authToken", idToken);
        if (!setUserWithRestriction(response.user)) {
          return {
            success: false,
            message: "Seller account is inactive or restricted.",
          };
        }
        return { success: true, user: response.user };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
      setError(err.message || "Google sign in failed");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
    } catch (err) {
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await authAPI.updateProfile(token, updates);
      if (res.success && res.user) {
        // Use the backend's response data to ensure proper field mapping
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      console.error("updateProfile error:", err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.warn("No auth token found for profile refresh");
        return null;
      }
      const res = await authAPI.getProfile(token);
      if (res.success && res.user) {
        setUser(res.user);
        return res;
      } else {
        console.error("Profile fetch failed:", res?.message || "Unknown error");
        return res;
      }
    } catch (err) {
      console.error("Profile refresh error:", err.message || err);
      return {
        success: false,
        message: err?.message || "Failed to refresh profile",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signUp,
        signIn,
        signInAdmin,
        signInWithGoogle,
        setUserWithRestriction,
        setAdminUser,
        setUser,
        setError,
        setLoading,
        signOut,
        updateProfile, // Added this since you defined it but didn't export it
        refreshProfile, // Added this since you defined it but didn't export it
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; // <--- THIS WAS LIKELY MISSING

// You also need these to actually use the context in other files
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
