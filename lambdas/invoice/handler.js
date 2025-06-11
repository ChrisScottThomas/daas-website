// lambdas/invoice-request/handler.js
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const {
  SESClient,
  SendEmailCommand,
} = require("@aws-sdk/client-ses");

const secretsClient = new SecretsManagerClient({ region: "eu-west-1" });
const sesClient = new SESClient({ region: "eu-west-1" });

async function getSecrets(secretArn) {
  const result = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );
  return JSON.parse(result.SecretString || "{}");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  const { name, email, org, billing, po, planId, timestamp } = body;

  if (!name || !email || !org || !billing || !planId || !timestamp) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const secretArn = process.env.AIRTABLE_SECRET_ARN;
  const secrets = await getSecrets(secretArn);

  const emailBody = `
    <html><body>
      <h2>Thanks for your request</h2>
      <p>You requested: <strong>${planId}</strong></p>
    </body></html>
  `;

  await sesClient.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Clarity. Invoice Request Confirmation" },
        Body: { Html: { Data: emailBody } },
      },
      Source: secrets.SES_FROM_EMAIL,
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
