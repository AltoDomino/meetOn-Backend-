import admin from "firebase-admin";
import path from "path";
import fs from "fs";

if (!admin.apps.length) {
  let creds: any;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const jsonStr = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf-8");
    creds = JSON.parse(jsonStr);
  } else {
    const serviceAccountPath = path.join(
      __dirname,
      "../config/firebase-service-account.json"
    );
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        "Brak pliku firebase-service-account.json lub zmiennej środowiskowej FIREBASE_SERVICE_ACCOUNT_BASE64"
      );
    }
    creds = require(serviceAccountPath);
  }

  console.log("🔥 Firebase Admin using project:", creds?.project_id);

  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

export default admin;
