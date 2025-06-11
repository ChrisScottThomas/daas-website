const Stripe = require("stripe");

const plans = {
  "clarity_base_monthly": {
    name: "Clarity. Base — Monthly",
    priceId: "price_abc123",
  },
  "clarity_plus_quarterly": {
    name: "Clarity. Plus — Quarterly",
    priceId: "price_def456",
  },
  // Add more plans here
};

exports.handler = async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
  });

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { planId } = body;

  if (!planId || !plans[planId]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid plan selected." }),
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: plans[planId].priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/checkout/success`,
      cancel_url: `${process.env.SITE_URL}/checkout/cancel`,
      customer_creation: "always",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Stripe error." }),
    };
  }
};
