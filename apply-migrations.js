// scripts/apply-migrations.js
const { execSync } = require("child_process");

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Migracje wdrożone.");
} catch (e) {
  console.error("❌ Migracje nie przeszły.");
  process.exit(1);
}
