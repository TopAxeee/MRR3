// src/services/telegramAuth.js
import { auth } from "../firebase";
import { signInWithCustomToken, onAuthStateChanged, signOut } from "firebase/auth";

export const verifyTelegramAuth = async (telegramData) => {
  const response = await fetch('/api/verify-telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telegramData),
  });

  const { token } = await response.json();
  const userCredential = await signInWithCustomToken(auth, token);
  return userCredential.user;
};

export const getCurrentUser = () =>
  new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });

export const logout = () => signOut(auth);
