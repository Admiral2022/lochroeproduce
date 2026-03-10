const Stripe = require("stripe");
const { Resend } = require("resend");
const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW);

  try {
    connectLambda(event);

    const signature =
      event.headers["stripe-signature"] ||
      event.headers["Stripe-Signature"];

    if (!signature) {
      return {
        statusCode: 400,
        body: "Missing Stripe signature"
      };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return {
        statusCode: 500,
        body: "Missing STRIPE_WEBHOOK_SECRET"
      };
    }

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      webhookSecret
    );

    if (stripeEvent.type !== "checkout.session.completed") {
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, ignored: true })
      };
    }

    const session = stripeEvent.data.object;
    const sessionId = session.id;

    const processedStore = getStore("processed");
    const alreadyProcessed = await processedStore.get(sessionId);

    if (alreadyProcessed) {
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, duplicate: true })
      };
    }

    const eggsBought = parseInt(session.metadata?.eggs || "0", 10);
    const honeyBought = parseInt(session.metadata?.honey || "0", 10);

    const stockStore = getStore("stock");
    const raw = await stockStore.get("current");
    const stock = raw ? JSON.parse(raw) : { eggs: 0, honey: 0 };

    const currentEggs = parseInt(stock.eggs || 0, 10);
    const currentHoney = parseInt(stock.honey || 0, 10);

    const newEggs = Math.max(0, currentEggs - eggsBought);
    const newHoney = Math.max(0, currentHoney - honeyBought);

    await stockStore.set("current", JSON.stringify({
      eggs: newEggs,
      honey: newHoney
    }));

    await processedStore.set(sessionId, "done");

    let emailSent = false;
    let emailError = null;

    try {
      const resendKey = (process.env.RESEND_API_KEY || "").trim();

      if (!resendKey) {
        throw new Error("RESEND_API_KEY missing");
      }

      const resend = new Resend(resendKey);

      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "r999hse@gmail.com",
        subject: "Loch Roe Produce sale",
        text:
`A new sale has completed.

Egg boxes sold: ${eggsBought}
Honey jars sold: ${honeyBought}

Updated stock:
Egg boxes: ${newEggs}
Honey jars: ${newHoney}

Stripe session ID:
${sessionId}`
      });

      emailSent = true;
    } catch (err) {
      emailError = err.message;
      console.error("Email send failed:", err.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
        updated: true,
        emailed: emailSent,
        emailError,
        eggs: newEggs,
        honey: newHoney
      })
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${error.message}`
    };
  }
};
