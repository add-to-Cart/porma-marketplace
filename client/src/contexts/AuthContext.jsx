import { createContext, useContext, useEffect, useState, useRef } from "react";
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

  // Use ref to prevent infinite loops
  const isRefreshingRef = useRef(false);

  // Helper to check if seller can login (isActive check)
  const canSellerLogin = (userObj) => {
    if (!userObj) return true;
    const isSeller = userObj.isSeller === true || userObj.role === "seller";

    // If not a seller, they can always login
    if (!isSeller) return true;

    // Sellers can't login if isActive is false
    const isActive = userObj.isActive !== false; // default to true if undefined
    return isActive;
  };

  // Helper to check if seller has restrictions (for UI warnings)
  const isSellerRestricted = (userObj) => {
    if (!userObj) return false;
    const isSeller = userObj.isSeller === true || userObj.role === "seller";

    // Check if seller is restricted (they can still login, but with limitations)
    const isRestricted = userObj.isRestricted === true;
    return isSeller && isRestricted;
  };

  // Centralized user setter with restriction checks
  const setUserWithRestriction = (userObj) => {
    // First check if seller can login at all
    if (!canSellerLogin(userObj)) {
      localStorage.removeItem("authToken");
      setUser(null);
      setError(
        "Your seller account has been deactivated. Please contact support.",
      );
      setLoading(false);
      return false;
    }

    // Set user even if restricted (they can still login)
    setUser(userObj);

    // Show warning if restricted but still allow login
    if (isSellerRestricted(userObj)) {
      setError("Your account has limited access due to restrictions.");
    } else {
      setError(null);
    }

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
          setLoading(false);
        }
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
            message: "Your seller account has been deactivated.",
          };
        }
        return { success: true };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
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

      // Verify token with backend to get user data
      const verifyResponse = await authAPI.verifyToken(idToken);
      if (verifyResponse.success) {
        localStorage.setItem("authToken", idToken);
        if (!setUserWithRestriction(verifyResponse.user)) {
          return {
            success: false,
            message: "Your seller account has been deactivated.",
          };
        }
        return { success: true, user: verifyResponse.user };
      }
      setError(verifyResponse.message);
      return { success: false, message: verifyResponse.message };
    } catch (err) {
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
              message: "Your account has been deactivated.",
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
            message: "Your seller account has been deactivated.",
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
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const res = await authAPI.updateProfile(token, updates);
      if (res.success && res.user) {
        // Use setUserWithRestriction to apply restriction checks
        setUserWithRestriction(res.user);
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
    // Prevent infinite loops
    if (isRefreshingRef.current) {
      console.warn("Profile refresh already in progress, skipping...");
      return { success: false, message: "Refresh already in progress" };
    }

    try {
      isRefreshingRef.current = true;
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No auth token found for profile refresh");
        return { success: false, message: "No auth token" };
      }

      const res = await authAPI.getProfile(token);

      if (res.success && res.user) {
        // Use setUserWithRestriction to apply restriction checks
        setUserWithRestriction(res.user);
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
    } finally {
      isRefreshingRef.current = false;
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
        updateProfile,
        refreshProfile,
        isSellerRestricted,
        canSellerLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
