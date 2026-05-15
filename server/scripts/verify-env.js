import "dotenv/config";

const requiredVariables = ["MONGODB_URI", "MONGODB_DB", "JWT_SECRET"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  console.error(`Variables manquantes: ${missingVariables.join(", ")}`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET === "change_this_secret_in_production") {
  console.error("JWT_SECRET doit etre remplace avant le deploiement en production.");
  process.exit(1);
}

console.log("Configuration MongoDB prete.");
