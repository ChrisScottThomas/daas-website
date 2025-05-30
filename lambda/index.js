const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();
const TABLE_NAME = process.env.TABLE_NAME;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

exports.handler = async (event) => {
  console.log("Lambda invoked", {
    timestamp: new Date().toISOString(),
    method: event.httpMethod,
    path: event.path,
  });

  try {
    const body = JSON.parse(event.body);
    const email = body?.email;
    const foundingMember = body?.foundingMember === true;

    if (!email || !email.includes('@')) {
      console.warn("Invalid email received:", email);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' })
      };
    }

    console.log("Valid email received:", email);

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: {
        email,
        foundingMember,
        createdAt: new Date().toISOString()
      }
    }).promise();

    console.log("Email stored in DynamoDB", { email, foundingMember });

    const subjectLine = foundingMember
      ? "You're in line for the Clarity. Founding Member offer"
      : "You're on the waitlist for Clarity.";

    const htmlBody = foundingMember
      ? `
        <html>
          <body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0753AD;">You're in line for the Founding Member offer</h2>
            <p>Thanks for signing up to learn more about <strong>Clarity.</strong></p>
            <p>As a Founding Member, you'll receive:</p>
            <ul>
              <li>Priority onboarding and early access</li>
              <li>Extended support during your first 90 days</li>
              <li>First look at new tools and methods</li>
            </ul>
            <p>We'll be in touch shortly with launch details and how to secure your spot.</p>
            <p style="margin-top: 2em;">— The Clarity. Team</p>
          </body>
        </html>
      `
      : `
        <html>
          <body style="font-family: Inter, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0753AD;">You're on the waitlist for Clarity.</h2>
            <p>Thanks for signing up to learn more about <strong>Clarity.</strong></p>
            <p>You're officially on the waitlist. We'll be in touch soon with:</p>
            <ul>
              <li>Launch details</li>
              <li>Support Plan pricing</li>
              <li>Your first steps to get started</li>
            </ul>
            <p>Until then — you're not alone in wanting faster decisions, more focus, and less noise.</p>
            <p style="margin-top: 2em;">— The Clarity. Team</p>
          </body>
        </html>
      `;

    const textBody = foundingMember
      ? `Thanks for signing up to learn more about Clarity.\n\nAs a Founding Member, you'll receive priority onboarding, extended support, and first access to new tools.\n\nWe'll be in touch shortly with details.\n\n— The Clarity. Team`
      : `Thanks for signing up to learn more about Clarity.\n\nYou're officially on the waitlist.\n\nWe'll be in touch soon with launch details, pricing options, and your first steps.\n\n— The Clarity. Team`;

    await ses.sendEmail({
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subjectLine },
        Body: {
          Text: { Data: textBody },
          Html: { Data: htmlBody }
        }
      }
    }).promise();

    console.log("Confirmation email sent via SES to:", email);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error("Lambda failed:", {
      message: err.message,
      stack: err.stack
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};
