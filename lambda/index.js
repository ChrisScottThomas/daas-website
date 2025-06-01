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
    records: [
      {
        fields: {
          Email: email,
          "Founding Member": foundingMember,
          "Created At": new Date().toISOString(),
          Source: source || "unknown",
          "Email Sent": "No"
        },
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
  const json = await res.json();
  return json.records?.[0]?.id;
};

const updateAirtableEmailSent = async (recordId) => {
  const token = await getAirtableToken();
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
  const body = {
    records: [
      {
        id: recordId,
        fields: {
          "Email Sent": "Yes",
        },
      },
    ],
  };
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable Update Error: ${errText}`);
  }
};

exports.handler = async (event) => {
  try {
    const { email, foundingMember } = JSON.parse(event.body);
    const source = event.queryStringParameters?.utm_source || "unknown";

    if (!email || !email.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        email,
        foundingMember,
        source,
        createdAt: new Date().toISOString(),
      },
    }).promise();

    const recordId = await postToAirtable({ email, foundingMember, source });

    const subject = foundingMember
      ? "Welcome, Founding Member — You're In"
      : "You're on the waitlist for Clarity.";

    const htmlBody = foundingMember
      ? `<html><body style=\"font-family: Inter, sans-serif; line-height: 1.6; color: #333;\"><h2 style=\"color: #0753AD;\">You're officially a Clarity. Founding Member</h2><p>Thanks for joining early — we're excited to shape Clarity. with you.</p><p>You'll get first access to:</p><ul><li>Founding pricing</li><li>Exclusive onboarding</li><li>Input into our first Support Plans</li></ul><p>We'll be in touch very soon. Until then — welcome to the inside.</p><p style=\"margin-top: 2em;\">— The Clarity. Team</p></body></html>`
      : `<html><body style=\"font-family: Inter, sans-serif; line-height: 1.6; color: #333;\"><h2 style=\"color: #0753AD;\">You're on the waitlist for Clarity.</h2><p>Thanks for signing up to learn more about <strong>Clarity.</strong></p><p>You're officially on the waitlist. We'll be in touch soon with:</p><ul><li>Launch details</li><li>Support Plan pricing</li><li>Your first steps to get started</li></ul><p>Until then — you're not alone in wanting faster decisions, more focus, and less noise.</p><p style=\"margin-top: 2em;\">— The Clarity. Team</p></body></html>`;

    const textBody = foundingMember
      ? `You're officially a Clarity. Founding Member.\n\nThanks for joining early — we're excited to shape Clarity. with you.\n\nYou'll get first access to:\n- Founding pricing\n- Exclusive onboarding\n- Input into our first Support Plans\n\nWe'll be in touch very soon. Until then — welcome to the inside.\n\n— The Clarity. Team`
      : `Thanks for signing up to learn more about Clarity.\n\nYou're officially on the waitlist.\n\nWe'll be in touch soon with launch details, pricing options, and your first steps.\n\nUntil then — you're not alone in wanting faster decisions, more focus, and less noise.\n\n— The Clarity. Team`;

    await ses.sendEmail({
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody },
        },
      },
    }).promise();

    await updateAirtableEmailSent(recordId);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Lambda failed:", { message: err.message, stack: err.stack });
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
