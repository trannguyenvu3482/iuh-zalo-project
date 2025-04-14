const ngrok = require("@ngrok/ngrok");
const fs = require("fs");
require("dotenv").config();

// Start ngrok and setup .env files for frontend / mobile
const setupNgrok = async () => {
  const listener = await ngrok.connect({
    addr: process.env.PORT || 8080,
    authtoken_from_env: true,
    domain: "main-gradually-octopus.ngrok-free.app",
    region: "au",
  });
  console.log(`Ngrok tunnel established at: ${listener.url()}`);

  // updateEnvFile("../frontend/.env", "VITE_API_URL_NGROK", listener.url());
  // updateEnvFile("../mobile/.env", "EXPO_PUBLIC_API_URL", listener.url());
};

const updateEnvFile = (filePath, key, value) => {
  let content = "";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf-8");
  }

  const lines = content.split("\n").filter(Boolean);
  const updatedLines = [];
  let found = false;

  for (const line of lines) {
    if (line.startsWith(`${key}=`)) {
      updatedLines.push(`${key}=${value}`);
      found = true;
    } else {
      updatedLines.push(line);
    }
  }

  if (!found) {
    updatedLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(filePath, updatedLines.join("\n") + "\n");
};

module.exports = setupNgrok;
