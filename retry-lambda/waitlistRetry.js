const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const TABLE_NAME = process.env.TABLE_NAME;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const AIRTABLE_SECRET_ARN = process.env.AIRTABLE_SECRET_ARN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

let airtableToken;
function getClients() {
  return {
    dynamo: new AWS.DynamoDB.DocumentClient(),
    ses: new AWS.SES(),
    secretsManager: new AWS.SecretsManager(),
  };
}

async function getAirtableToken(clients) {
  if (airtableToken) return airtableToken;
  const secret = await clients.secretsManager.getSecretValue({ SecretId: AIRTABLE_SECRET_ARN }).promise();
  airtableToken = secret.SecretString;
  return airtableToken;
}

const findAirtableRecordId = async (email, clients) => {
  const token = await getAirtableToken(clients);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula={Email}='${email}'`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  return data.records?.[0]?.id || null;
};

const upsertToAirtable = async (record, clients) => {
  const token = await getAirtableToken(clients);
  const recordId = await findAirtableRecordId(record.email, clients);

  const fields = {
    Email: record.email,
    "Founding Member": record.foundingMember,
    "Source": record.source || "unknown",
    "Email Sent": record.emailSent ? "Yes" : "No",
    "Retries": record.retryCount,
  };

  const method = recordId ? "PATCH" : "POST";
  const url = recordId
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}/${recordId}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

  const body = recordId ? { fields } : { records: [{ fields }] };
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Airtable API Error: ${await res.text()}`);
  }
};

exports.handler = async () => {
  const clients = getClients();

  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: "#sent = :no AND retryCount < :limit",
    ExpressionAttributeNames: { "#sent": "emailSent" },
    ExpressionAttributeValues: {
      ":no": "No",
      ":limit": 3,
    },
  };

  const { Items } = await clients.dynamo.scan(scanParams).promise();
  if (!Items || Items.length === 0) return { statusCode: 200, body: "No retries needed" };

  for (const item of Items) {
    const { email, foundingMember, source = "unknown", retryCount = 0 } = item;
    let emailSent = false;

    try {
      const subject = foundingMember
        ? "Welcome, Founding Member — You're In"
        : "You're on the waitlist for Clarity.";

      const htmlBody = foundingMember
        ? `<html><body><h2 style=\"color:#0753AD\">You're officially a Clarity. Founding Member</h2><p>Thanks for joining early — we're excited to shape Clarity. with you.</p><p>You'll get first access to:</p><ul><li>Founding pricing</li><li>Exclusive onboarding</li><li>Input into our first Support Plans</li></ul><p>We'll be in touch very soon. Until then — welcome to the inside.</p><p style=\"margin-top:2em\">— The Clarity. Team</p></body></html>`
        : `<html><body><h2 style=\"color:#0753AD\">You're on the waitlist for Clarity.</h2><p>Thanks for signing up to learn more about Clarity.</p><p>You're officially on the waitlist. We'll be in touch soon with:</p><ul><li>Launch details</li><li>Support Plan pricing</li><li>Your first steps to get started</li></ul><p>Until then — you're not alone in wanting faster decisions, more focus, and less noise.</p><p style=\"margin-top:2em\">— The Clarity. Team</p></body></html>`;

      const textBody = foundingMember
        ? `You're officially a Clarity. Founding Member.\n\nThanks for joining early — we're excited to shape Clarity. with you.\n\nYou'll get first access to:\n- Founding pricing\n- Exclusive onboarding\n- Input into our first Support Plans\n\nWe'll be in touch very soon. Until then — welcome to the inside.\n\n— The Clarity. Team`
        : `Thanks for signing up to learn more about Clarity.\n\nYou're officially on the waitlist.\n\nWe'll be in touch soon with launch details, pricing options, and your first steps.\n\nUntil then — you're not alone in wanting faster decisions, more focus, and less noise.\n\n— The Clarity. Team`;

      await clients.ses.sendEmail({
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
      console.error(`Retry email failed for ${email}:`, err.message);
    }

    const newRetryCount = retryCount + (emailSent ? 0 : 1);
    await clients.dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        ...item,
        emailSent: emailSent ? "Yes" : "No",
        retryCount: newRetryCount,
      },
    }).promise();

    await upsertToAirtable({ email, foundingMember, source, emailSent, retryCount: newRetryCount }, clients);
  }

  return { statusCode: 200, body: JSON.stringify({ retriesAttempted: Items.length }) };
};
