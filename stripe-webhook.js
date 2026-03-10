const Stripe = require("stripe");
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
        updated: true,
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
