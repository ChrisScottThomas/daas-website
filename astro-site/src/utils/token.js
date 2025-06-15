const crypto = require("crypto");
const AWS = require("aws-sdk");

const secretsManager = new AWS.SecretsManager({ region: "eu-west-2" });

let cachedSecret;

async function getSigningSecret() {
  if (cachedSecret) return cachedSecret;

  const secretName = process.env.TOKEN_SECRET;
  const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  cachedSecret = result.SecretString;
  return cachedSecret;
}

async function verifyToken(token) {
  if (!token || !token.includes(".")) {
    throw new Error("Invalid token format.");
  }

  const [encodedPayload, receivedSig] = token.split(".");
  const payloadJson = Buffer.from(encodedPayload, "base64").toString("utf-8");

  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    throw new Error("Invalid token payload.");
  }

  const secret = await getSigningSecret();
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payloadJson)
    .digest("hex");

  if (receivedSig !== expectedSig) {
    throw new Error("Signature mismatch.");
  }

  if (!payload.exp || Date.now() > payload.exp) {
    throw new Error("Token expired.");
  }

  return payload;
}

module.exports = {
  verifyToken
};
