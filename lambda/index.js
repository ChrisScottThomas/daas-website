const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES();
const TABLE_NAME = process.env.TABLE_NAME;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    await dynamo.put({
      TableName: TABLE_NAME,
      Item: { email, createdAt: new Date().toISOString() }
    }).promise();

    await ses.sendEmail({
      Source: SENDER_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "You're on the waitlist for Clarity" },
        Body: {
          Text: { Data: "Thanks for signing up for Clarity — our Strategic Insight-as-a-Service support plan. We'll be in touch soon with next steps." }
        }
      }
    }).promise();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
