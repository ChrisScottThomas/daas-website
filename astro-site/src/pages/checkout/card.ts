// /src/pages/checkout/card.ts
import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Map safe plan IDs to Stripe price IDs and metadata
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

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const { planId } = data;

  if (!planId || !plans[planId]) {
    return new Response(JSON.stringify({ error: "Invalid plan selected." }), {
      status: 400,
    });
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
      success_url: `${import.meta.env.SITE_URL}/checkout/success`,
      cancel_url: `${import.meta.env.SITE_URL}/checkout/cancel`,
      customer_creation: "always",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Stripe error." }), {
      status: 500,
    });
  }
};
