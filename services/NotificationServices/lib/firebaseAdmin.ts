import admin from "firebase-admin";
import path from "path";

const serviceAccountPath = path.join(
  __dirname,
  "../config/firebase-service-account.json" // <- tu połóż JSON z Google Cloud
);

if (!admin.apps.length) {
  // Jeżeli trzymasz plik lokalnie:
  const creds = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });

  // Jeśli wolisz trzymać JSON w ENV (base64):
  // const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  // if (b64) {
  //   const json = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
  //   admin.initializeApp({ credential: admin.credential.cert(json) });
  // }
}

export default admin;
