const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();
const secretsManager = new AWS.SecretsManager();

const TABLE_NAME = process.env.TABLE_NAME;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const AIRTABLE_SECRET_ARN = process.env.AIRTABLE_SECRET_ARN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

let airtableToken;
async function getAirtableToken() {
  if (airtableToken) return airtableToken;
  const secret = await secretsManager.getSecretValue({ SecretId: AIRTABLE_SECRET_ARN }).promise();
  airtableToken = secret.SecretString;
  return airtableToken;
}

const postToAirtable = async ({ email, foundingMember, source }) => {
  const token = await getAirtableToken();
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const body = {
    records: [{
      fields: {
        Email: email,
        "Founding Member": foundingMember,
        "Source": source || "unknown",
        "Created At": new Date().toISOString(),
        "Email Sent": "Yes"
      }
    }]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Airtable POST failed:", errText);
    throw new Error(`Airtable API Error: ${errText}`);
  }
};

const sendConfirmationEmail = async (email, foundingMember) => {
  const subject = foundingMember
    ? "Welcome, Founding Member — You're In"
    : "You're on the waitlist for Clarity.";

  const htmlBody = foundingMember
    ? `<html><body><h2 style="color: #0753AD;">You're officially a Clarity. Founding Member</h2>
      <p>Thanks for joining early — we're excited to shape Clarity. with you.</p>
      <ul><li>Founding pricing</li><li>Exclusive onboarding</li><li>Input into our first Support Plans</li></ul>
      <p>We’ll be in touch very soon. Welcome to the inside.</p><p>— The Clarity. Team</p></body></html>`
    : `<html><body><h2 style="color: #0753AD;">You're on the waitlist for Clarity.</h2>
      <p>Thanks for signing up to learn more about Clarity.</p>
      <ul><li>Launch details</li><li>Support Plan pricing</li><li>Your first steps</li></ul>
      <p>You’re not alone in wanting faster decisions, more focus, and less noise.</p><p>— The Clarity. Team</p></body></html>`;

  const textBody = foundingMember
    ? `You're officially a Clarity. Founding Member.\n\nThanks for joining early — we're excited to shape Clarity. with you.\n\nYou'll get:\n- Founding pricing\n- Exclusive onboarding\n- Input into our Support Plans\n\nWelcome to the inside.\n— The Clarity. Team`
    : `You're on the waitlist for Clarity.\n\nThanks for signing up. We'll share:\n- Launch details\n- Support Plan pricing\n- First steps to get started\n\nYou're not alone in wanting faster decisions, more focus, and less noise.\n— The Clarity. Team`;

  const sendResult = await ses.sendEmail({
    Source: SENDER_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: htmlBody },
        Text: { Data: textBody }
      }
    }
  }).promise();

  return sendResult?.MessageId;
};

exports.handler = async (event) => {
  const source = event.queryStringParameters?.utm_source || "unknown";
  const resend = event.queryStringParameters?.resend === "true";

  try {
    const body = JSON.parse(event.body);
    const email = body?.email?.trim();
    const foundingMember = !!body?.foundingMember;

    if (!email || !email.includes("@")) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid email" }) };
    }

    const existing = await dynamo.get({
      TableName: TABLE_NAME,
      Key: { email }
    }).promise();

    if (existing.Item && !resend) {
      console.log("Duplicate email detected:", email);
      return { statusCode: 200, body: JSON.stringify({ success: true, duplicate: true }) };
    }

    // Send email
    const messageId = await sendConfirmationEmail(email, foundingMember);
    console.log("Email sent via SES:", messageId);

    // Store in DynamoDB
    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        email,
        foundingMember,
        source,
        emailSent: messageId || "failed",
        createdAt: new Date().toISOString()
      }
    }).promise();

    // Store in Airtable
    if (!existing.Item || resend) {
      await postToAirtable({ email, foundingMember, source });
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Lambda failed:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
