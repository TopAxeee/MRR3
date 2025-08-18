// src/services/db.js
import {
  addDoc, setDoc, doc, getDoc, getDocs,
  collection, query, where, orderBy, limit,
  serverTimestamp, startAt, endAt
} from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";

// Создать игрока (если нет) и вернуть его id
export async function createOrGetPlayerByName(displayName, avatarUrl = null) {
  const nameLower = displayName.trim().toLowerCase();
  // точное совпадение
  const q = query(
    collection(db, "players"),
    where("displayNameLower", "==", nameLower),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  // создать
  const ref = doc(collection(db, "players")); // сгенерированный id
  await setDoc(ref, {
    displayName,
    displayNameLower: nameLower,
    avatarUrl,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Поиск игроков по префиксу
export async function searchPlayers(prefix, take = 12) {
  const p = prefix.trim().toLowerCase();
  if (!p) return listRandomPlayers(take);

  const q = query(
    collection(db, "players"),
    orderBy("displayNameLower"),
    startAt(p),
    endAt(p + "\uf8ff"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Случайные игроки (простой способ: просто последние N)
export async function listRandomPlayers(take = 12) {
  const q = query(
    collection(db, "players"),
    orderBy("createdAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Отзывы игрока за последние N дней (по умолчанию 30)
export async function fetchReviewsByPlayer(playerId, days = 30, take = 100) {
  const since = Timestamp.fromDate(new Date(Date.now() - days*24*60*60*1000));
  const q = query(
    collection(db, "reviews"),
    where("playerId", "==", playerId),
    where("createdAt", ">=", since),
    orderBy("createdAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Добавить отзыв
export async function addReview({ playerId, rank, grade, comment, screenshotUrl = null, authorUid = null }) {
  const ref = await addDoc(collection(db, "reviews"), {
    playerId,
    rank,
    grade,
    comment,
    screenshotUrl,
    authorUid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
