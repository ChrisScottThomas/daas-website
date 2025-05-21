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
        createdAt: new Date().toISOString()
      }
    }).promise();

    console.log("Email stored in DynamoDB");

    await ses.sendEmail({
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "You're on the waitlist for Clarity." },
        Body: {
          Text: {
            Data: "Thanks for signing up for more information on the Clarity. Insight-as-a-Service Support Plan. We'll be in touch soon with details, pricing, launch date and more."
          }
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
