/**
 * Generates a Web Push VAPID keypair for browser push notifications.
 *
 * Usage: node scripts/generate-vapid-keys.js
 *
 * Paste the printed values into .env as VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY,
 * and set VAPID_SUBJECT to a mailto: or https: URL identifying your server
 * (required by the Web Push protocol):
 *   VAPID_SUBJECT=mailto:feedback@tonecraft.app
 *
 * Pure Node — no dependencies.
 */
const crypto = require("crypto");

function urlBase64(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
  publicKeyEncoding: { type: "spki", format: "der" },
  privateKeyEncoding: { type: "pkcs8", format: "der" },
});

console.log("=== VAPID keys — add these to .env (never commit the private key) ===");
console.log(`VAPID_PUBLIC_KEY=${urlBase64(publicKey)}`);
console.log(`VAPID_PRIVATE_KEY=${urlBase64(privateKey)}`);
console.log('VAPID_SUBJECT=mailto:feedback@tonecraft.app');
console.log("");
console.log("Regenerate any time; old keys simply stop delivering to already-subscribed browsers.");
