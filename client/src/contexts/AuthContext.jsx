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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          setLoading(true);
          const res = await authAPI.getProfile(token);
          if (res.success) setUser(res.user);
          else localStorage.removeItem("authToken");
        } catch (e) {
          console.warn("Auth init failed", e);
          localStorage.removeItem("authToken");
        } finally {
          setLoading(false);
        }
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
      // get firebase id token
      const idToken = await userCredential.user.getIdToken();

      // verify with backend and create/get user profile
      const response = await authAPI.verifyToken(idToken);
      if (response.success) {
        localStorage.setItem("authToken", idToken);
        setUser(response.user);
        return { success: true };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
      setError(err.message || "Sign up failed");
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.signIn(identifier, password);
      if (response.success) {
        // Sign in with custom token
        const userCredential = await signInWithCustomToken(
          auth,
          response.customToken,
        );
        const idToken = await userCredential.user.getIdToken();

        // Verify and get user data
        const verifyResponse = await authAPI.verifyToken(idToken);
        if (verifyResponse.success) {
          localStorage.setItem("authToken", idToken);
          setUser(verifyResponse.user);
          return { success: true };
        }
        setError(verifyResponse.message);
        return { success: false, message: verifyResponse.message };
      }
      setError(response.message);
      return { success: false, message: response.message };
    } catch (err) {
      setError(err.message || "Sign in failed");
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
        setUser(response.user);
        return { success: true };
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
      console.warn("firebase signout failed", err);
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
      if (res.success) {
        setUser((prev) => ({ ...prev, ...updates }));
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;
      const res = await authAPI.getProfile(token);
      if (res.success) setUser(res.user);
      return res;
    } catch (err) {
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
