// src/services/userService.js
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const bindNickname = async (userId, nickname) => {
  if (!nickname || !nickname.trim()) {
    throw new Error("Nickname cannot be empty");
  }

  const formattedNickname = nickname.trim().toLowerCase();
  const nicknameDoc = await getDoc(doc(db, "nicknames", formattedNickname));

  if (nicknameDoc.exists()) {
    throw new Error("Nickname already taken");
  }

  // Создание связи
  await setDoc(doc(db, "users", userId), {
    telegramId: userId,
    gameNickname: nickname,
    createdAt: new Date(),
  });

  // Резервирование никнейма
  await setDoc(doc(db, "nicknames", nickname.toLowerCase()), {
    userId,
    reservedAt: new Date(),
  });
};

export const getUserData = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  return userDoc.exists() ? userDoc.data() : null;
};

export const checkNicknameAvailability = async (nickname) => {
  const nicknameDoc = await getDoc(
    doc(db, "nicknames", nickname.toLowerCase())
  );
  return !nicknameDoc.exists();
};
