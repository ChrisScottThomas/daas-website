const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const { plan, billing } = JSON.parse(event.body);

  const priceMap = {
    clarity_base_monthly: "price_1RZXKHR6VR3z49aKKR5nWs7a",
    clarity_base_quarterly: "price_1RZXLbR6VR3z49aKwE7zK8aV",
    clarity_base_annually: "price_1RZXM3R6VR3z49aK9jGBAcyN",
    clarity_plus_monthly: "price_1RZXNQR6VR3z49aKdnde1pGo",
    clarity_plus_quarterly: "price_1RZXP4R6VR3z49aKF0Qifd7d",
    clarity_plus_annually: "price_1RZXPUR6VR3z49aK08DzWOdr",
    clarity_partner_monthly: "price_1RZXO8R6VR3z49aKQs4nIuYd",
    clarity_partner_quarterly: "price_1RZXQ4R6VR3z49aKiaBFYQ22",
    clarity_partner_annually: "price_1RZXQQR6VR3z49aKjBXBGesI",
  };

  const priceId = priceMap[`${plan}_${billing}`];

  if (!priceId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
      },
      body: JSON.stringify({ error: "Invalid plan or billing cycle." }),
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.SITE_URL}/checkout/success`,
    cancel_url: `${process.env.SITE_URL}/checkout/cancel`,
  });

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify({ url: session.url }),
  };
  
};
