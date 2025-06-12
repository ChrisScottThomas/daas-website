exports.handler = async (event) => {
  // Always return CORS headers
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

  const secretArn = process.env.AIRTABLE_SECRET_ARN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;
  const senderEmail = process.env.SENDER_EMAIL;

  const secrets = await getSecrets(secretArn);
  const airtableApiKey = secrets.AIRTABLE_API_KEY;

  const formattedAddress = billingAddress
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("<br />");

  // 1. Save to Airtable
  await postToAirtable({
    apiKey: airtableApiKey,
    baseId,
    tableName,
    data: {
      Name: name,
      Email: email,
      Organisation: org,
      "Billing Address": billingAddress,
      "Formatted Billing": formattedAddress,
      "PO Number": po || "",
      "Plan ID": planId,
      "Submitted At": timestamp,
    },
  });

  // 2. Send confirmation email
  const emailBody = `
    <html><body>
      <h2>Thanks for your request</h2>
      <p>You requested: <strong>${planId}</strong></p>
      <p><strong>Organisation:</strong> ${org}</p>
      <p><strong>Billing Address:</strong><br />${formattedAddress}</p>
      <p><strong>PO Number:</strong> ${po || "—"}</p>
    </body></html>
  `;

  await sesClient.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Clarity. Invoice Request Confirmation" },
        Body: { Html: { Data: emailBody } },
      },
      Source: senderEmail,
    })
  );

  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify({ success: true }),
  };
};
