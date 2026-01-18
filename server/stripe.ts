import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function createEmbeddedCheckoutSession(
  tier: string,
  customerEmail: string,
  customerName: string,
  requestId: string,
  returnUrl: string
): Promise<{ clientSecret: string }> {
  const tierConfig: Record<string, { name: string; price: number }> = {
    basic: { name: "Basic Consult", price: 2900 },
    middle: { name: "AI Analyst", price: 9900 },
    custom: { name: "Expert Review", price: 49900 },
  };

  const config = tierConfig[tier];
  if (!config) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Kings Advice - ${config.name}`,
            description: `Business consulting service - ${config.name}`,
          },
          unit_amount: config.price,
        },
        quantity: 1,
      },
    ],
    metadata: {
      requestId,
      tier,
      customerName,
    },
    return_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
  });

  return {
    clientSecret: session.client_secret!,
  };
}

export async function getSessionStatus(sessionId: string): Promise<{
  status: string;
  customerEmail: string | null;
  requestId: string | null;
  tier: string | null;
}> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return {
      status: session.status || "unknown",
      customerEmail: session.customer_details?.email || session.customer_email || null,
      requestId: session.metadata?.requestId || null,
      tier: session.metadata?.tier || null,
    };
  } catch (error) {
    console.error("Error getting session status:", error);
    return {
      status: "error",
      customerEmail: null,
      requestId: null,
      tier: null,
    };
  }
}

export { stripe };
