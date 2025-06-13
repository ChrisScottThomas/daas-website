const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const ses = new AWS.SES();
const secretsManager = new AWS.SecretsManager();

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const AIRTABLE_SECRET_ARN = process.env.AIRTABLE_SECRET_ARN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

let airtableToken;

async function getAirtableToken() {
  if (airtableToken) return airtableToken;

  const secret = await secretsManager.getSecretValue({
    SecretId: AIRTABLE_SECRET_ARN,
  }).promise();

  airtableToken = secret.SecretString;
  return airtableToken;
}

const postToAirtable = async (fields) => {
  const token = await getAirtableToken();
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const body = {
    records: [
      {
        fields,
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable API Error: ${errText}`);
  }
};

exports.handler = async (event) => {
  const defaultHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        ...defaultHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      name,
      email,
      org,
      billingAddress,
      po,
      planId,
      timestamp,
    } = body;

    if (!name || !email || !org || !billingAddress || !planId || !timestamp) {
      return {
        statusCode: 400,
        headers: defaultHeaders,
        body: "Missing required fields",
      };
    }

    const formattedAddress = billingAddress
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("<br />");

    const plans = {
      clarity_base_monthly: { name: "Clarity. Base — Monthly" },
      clarity_base_quarterly: { name: "Clarity. Base — Quarterly" },
      clarity_base_annually: { name: "Clarity. Base — Annually" },
      clarity_plus_monthly: { name: "Clarity. Plus — Monthly" },
      clarity_plus_quarterly: { name: "Clarity. Plus — Quarterly" },
      clarity_plus_annually: { name: "Clarity. Plus — Annually" },
      clarity_partner_annually: { name: "Clarity. Partner — Annually" },
      clarity_partner_quarterly: { name: "Clarity. Partner — Quarterly" },
      clarity_partner_monthly: { name: "Clarity. Partner — Monthly" },
      };
    const selected = plans[planId];
    const planName = selected.name;


    // 1. Save to Airtable
    await postToAirtable({
      Name: name,
      Email: email,
      Organisation: org,
      "Billing Address": formattedAddress,
      "PO Number": po || "",
      "Plan ID": planName,
      "Timestamp": timestamp,
    });

    // 2. Send confirmation email
    const emailBody = `
      <html><body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0753AD;">Thanks for your request</h2>
        <p>You requested: <strong>${planName}</strong></p>
        <p><strong>Organisation:</strong> ${org}</p>
        <p><strong>Billing Address:</strong><br />${formattedAddress}</p>
        <p><strong>PO Number:</strong> ${po || "—"}</p>
        <p style="margin-top: 2em;">— The Clarity. Team</p>
      </body></html>
    `;

    await ses.sendEmail({
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Clarity. Invoice Request Confirmation" },
        Body: {
          Html: { Data: emailBody },
        },
      },
    }).promise();

    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Invoice Lambda error:", err);
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
