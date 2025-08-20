import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import crypto from "crypto";

admin.initializeApp();

const BOT_TOKEN = functions.config().telegram.token;

function checkTelegramAuth(data) {
  const { hash, ...userData } = data;
  const checkString = Object.keys(userData)
    .sort()
    .map((k) => `${k}=${userData[k]}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secret).update(checkString).digest("hex");

  return hmac === hash ? userData : null;
}

export const verifyTelegram = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const userData = checkTelegramAuth(req.body);
  if (!userData) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const uid = `tg_${userData.id}`;
  const token = await admin.auth().createCustomToken(uid, {
    telegram: userData,
  });

  res.json({ token });
});
