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
            Data: `Thanks for signing up to learn more about Clarity.
    
    You're officially on the waitlist.
    
    We'll be in touch soon with launch details, pricing options, and your first steps.
    
    Until then — you're not alone in wanting faster decisions, more focus, and less noise.
    
    — The Clarity. Team`
          },
          Html: {
            Data: `
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
            `
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
