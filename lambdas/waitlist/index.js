const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();
const secretsManager = new AWS.SecretsManager();
const eventBridge = new AWS.EventBridge();

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
          "Source": source || "unknown",
          "Email Sent": emailSent ? "Yes" : "No",
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
};

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const utmSource = queryParams.utm_source || "unknown";

    const body = JSON.parse(event.body);
    const email = body?.email?.trim();
    const foundingMember = !!body?.foundingMember;

    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' }),
      };
    }

    const existing = await dynamo.get({
      TableName: TABLE_NAME,
      Key: { email },
    }).promise();

    if (existing.Item) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Email already registered' }),
      };
    }

    let emailSent = false;

    try {
      const subject = foundingMember
        ? "Welcome, Founding Member — You're In"
        : "You're on the waitlist for Clarity.";

      const htmlBody = foundingMember
        ? `<html><body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0753AD;">Welcome to the inside.</h2>
            <p>You're officially a <strong>Clarity. Founding Member</strong> — thank you for backing us early.</p>
            <p>As a Founding Member, you'll get:</p>
            <ul>
              <li>First access to our Support Plans</li>
              <li>Founding pricing, locked in for your first year</li>
              <li>Priority onboarding and extra async input</li>
            </ul>
            <p>You'll also have the chance to shape how Clarity. evolves — your feedback matters.</p>
            <p>We'll be in touch very soon. Until then, welcome — it means a lot.</p>
            <p style="margin-top: 2em;">— The Clarity. Team</p>
          </body></html>`
        : `<html><body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0753AD;">You're officially on the Clarity. waitlist</h2>
            <p>Thanks for signing up to learn more about <strong>Clarity.</strong></p>
            <p>We'll be in touch soon with:</p>
            <ul>
              <li>Launch details and your first steps</li>
              <li>A preview of our Support Plans</li>
              <li>Early access opportunities</li>
            </ul>
            <p>Until then — you're not alone in wanting faster decisions, more focus, and less noise.</p>
            <p style="margin-top: 2em;">— The Clarity. Team</p>
          </body></html>`;

      const textBody = foundingMember
        ? `Welcome to the inside.

You're officially a Clarity. Founding Member — thank you for backing us early.

As a Founding Member, you'll get:
- First access to our Support Plans
- Founding pricing, locked in for your first year
- Priority onboarding and extra async input

You'll also have the chance to shape how Clarity. evolves — your feedback matters.

We'll be in touch very soon. Until then, welcome — it means a lot.

— The Clarity. Team`
        : `You're officially on the Clarity. waitlist.

Thanks for signing up to learn more about Clarity.

We'll be in touch soon with:
- Launch details and your first steps
- A preview of our Support Plans
- Early access opportunities

Until then — you're not alone in wanting faster decisions, more focus, and less noise.

— The Clarity. Team`;

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

      emailSent = true;
    } catch (err) {
      await eventBridge.putEvents({
        Entries: [
          {
            Source: 'clarity.waitlist',
            DetailType: 'email-send-failure',
            Detail: JSON.stringify({
              email,
              foundingMember,
              source: utmSource,
              reason: err.message,
            }),
            EventBusName: 'default',
          },
        ],
      }).promise();
    }

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        email,
        foundingMember,
        createdAt: new Date().toISOString(),
        source: utmSource,
        emailSent: emailSent ? "Yes" : "No",
      },
    }).promise();

    await postToAirtable({ email, foundingMember, source: utmSource, emailSent });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
    };
  }
};
