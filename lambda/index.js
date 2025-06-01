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
  const secret = await secretsManager.getSecretValue({
    SecretId: AIRTABLE_SECRET_ARN,
  }).promise();
  airtableToken = secret.SecretString;
  return airtableToken;
}

const postToAirtable = async ({ email, foundingMember, source, emailSent }) => {
  const token = await getAirtableToken();
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const body = {
    records: [
      {
        fields: {
          Email: email,
          "Founding Member": foundingMember,
          "Created At": new Date().toISOString(),
          "Source": source,
          "Email Sent": emailSent ? "Yes" : "Pending"
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
    console.error("Airtable POST failed:", errText);
    throw new Error(`Airtable API Error: ${errText}`);
  }
};

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const email = body?.email?.trim();
    const foundingMember = !!body?.foundingMember;
    const source = body?.source?.trim() || 'unknown';

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' }),
      };
    }

    let emailSentStatus = false;

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        email,
        foundingMember,
        createdAt: new Date().toISOString(),
        source,
        emailSent: false
      },
    }).promise();

    const subject = foundingMember
      ? "Welcome, Founding Member — You're In"
      : "You're on the waitlist for Clarity.";

    const htmlBody = foundingMember
      ? `<html><body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0753AD;">You're officially a Clarity. Founding Member</h2>
          <p>Thanks for joining early — we're excited to shape Clarity. with you.</p>
          <p>You'll get first access to:</p>
          <ul><li>Founding pricing</li><li>Exclusive onboarding</li><li>Input into our first Support Plans</li></ul>
          <p>We'll be in touch very soon. Until then — welcome to the inside.</p>
          <p style="margin-top: 2em;">— The Clarity. Team</p></body></html>`
      : `<html><body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0753AD;">You're on the waitlist for Clarity.</h2>
          <p>Thanks for signing up to learn more about <strong>Clarity.</strong></p>
          <p>You're officially on the waitlist. We'll be in touch soon with:</p>
          <ul><li>Launch details</li><li>Support Plan pricing</li><li>Your first steps to get started</li></ul>
          <p>Until then — you're not alone in wanting faster decisions, more focus, and less noise.</p>
          <p style="margin-top: 2em;">— The Clarity. Team</p></body></html>`;

    const textBody = foundingMember
      ? `You're officially a Clarity. Founding Member.
Thanks for joining early — we're excited to shape Clarity. with you.
You'll get first access to:
- Founding pricing
- Exclusive onboarding
- Input into our first Support Plans
We'll be in touch very soon. Until then — welcome to the inside.
— The Clarity. Team`
      : `Thanks for signing up to learn more about Clarity.
You're officially on the waitlist.
We'll be in touch soon with launch details, pricing options, and your first steps.
Until then — you're not alone in wanting faster decisions, more focus, and less noise.
— The Clarity. Team`;

    try {
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
      emailSentStatus = true;
    } catch (err) {
      console.error("SES sendEmail failed:", err);
    }

    // Update DynamoDB with SES result
    await dynamo.update({
      TableName: TABLE_NAME,
      Key: { email },
      UpdateExpression: "SET emailSent = :val",
      ExpressionAttributeValues: {
        ":val": emailSentStatus,
      },
    }).promise();

    // Post to Airtable with email status
    await postToAirtable({ email, foundingMember, source, emailSent: emailSentStatus });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("Lambda failed:", {
      message: err.message,
      stack: err.stack,
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
