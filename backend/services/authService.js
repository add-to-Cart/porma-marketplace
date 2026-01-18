import { googleProvider, auth } from "@/services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

import { validateUsername } from "@/helpers";
import api from "@/api/index";
import { resolveEmailFromUsername, saveUserToFirestore } from "@/services";

export const registerWithEmail = async (email, password, username) => {
  const validationError = validateUsername(username);
  if (validationError) throw new Error(validationError);
  // check username availability via backend
  try {
    await api.get(
      `/users/resolve-email?identifier=${encodeURIComponent(username)}`
    );
    // if exists, resolve-email returned 200 -> username taken
    throw new Error("Username already taken");
  } catch (err) {
    // if 404, username available -> continue
    if (err && err.status && err.status !== 404) throw err;
  }

  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  // create user record via backend
  await saveUserToFirestore({ uid: user.uid, email, username });
  await sendEmailVerification(user);
  return user;
};

export const smartLogin = async (identifier, password) => {
  const email = await resolveEmailFromUsername(identifier);
  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await saveUserToFirestore(user);
  return user;
};

export const forgotPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not signed in.");
  await user.sendEmailVerification();
};
