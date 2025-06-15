const crypto = require("crypto");
const AWS = require("aws-sdk");

const secretsManager = new AWS.SecretsManager({ region: "eu-west-2" });

let cachedSecret = null;
async function getSecret() {
  if (cachedSecret) return cachedSecret;
  const secretName = process.env.TOKEN_SECRET;
  const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
  cachedSecret = result.SecretString;
  return cachedSecret;
}

function base64Decode(str) {
  return Buffer.from(str, "base64").toString("utf-8");
}

function verifySignature(payload, signature, secret) {
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSig === signature;
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    const token = event.queryStringParameters?.token;
    if (!token || !token.includes(".")) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing or malformed token" }),
      };
    }

    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Malformed token" }),
      };
    }

    const payloadJson = base64Decode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    const secret = await getSecret();
    const valid = verifySignature(payloadJson, signature, secret);

    if (!valid) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Invalid signature" }),
      };
    }

    if (!payload.plan || !payload.exp || Date.now() > payload.exp) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Invalid or expired token" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        plan: payload.plan,
        billing: payload.billing,
        valid: true,
      }),
    };
  } catch (err) {
    console.error("Token validation error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal error" }),
    };
  }
};
