const crypto = require("crypto");
const AWS = require("aws-sdk");

const secretsManager = new AWS.SecretsManager({ region: "eu-west-2" });

// This only runs once per cold start
let cachedSecret;

exports.handler = async (event) => {
  try {
    const { plan, billing } = JSON.parse(event.body || "{}");

    if (!plan || !billing) {
      return response(400, { error: "Missing plan or billing." });
    }

    // Fetch and cache secret
    if (!cachedSecret) {
      const secretName = process.env.TOKEN_SECRET;
      const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
      cachedSecret = secretValue.SecretString;
    }

    // Generate token (HMAC-SHA256)
    const payload = {
      plan,
      billing,
      exp: Date.now() + 5 * 60 * 1000 // expires in 5 min
    };

    const token = signToken(payload, cachedSecret);

    return response(200, { token });
  } catch (err) {
    console.error("Token signing failed:", err);
    return response(500, { error: "Internal Server Error" });
  }
};

function signToken(payload, secret) {
  const json = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(json).digest("hex");
  const token = Buffer.from(json).toString("base64") + "." + signature;
  return token;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    },
    body: JSON.stringify(body)
  };
}
