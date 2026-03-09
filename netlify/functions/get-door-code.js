const Stripe = require("stripe");
const { getStore, connectLambda } = require("@netlify/blobs");

function fnv1a32(bytes) {
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function customerCodeForWindow(secret, window) {
  const secretBytes = Array.from(Buffer.from(secret, "utf8"));

  const windowBytes = [
    window & 0xff,
    (window >>> 8) & 0xff,
    (window >>> 16) & 0xff,
    (window >>> 24) & 0xff
  ];

  const bytes = [
    ...secretBytes,
    ":".charCodeAt(0),
    ...windowBytes
  ];

  let code = fnv1a32(bytes) % 10000;

  if (code === 2489) {
    code = (code + 1) % 10000;
  }

  return String(code).padStart(4, "0");
}

exports.handler = async function (event) {
  try {
    connectLambda(event);

    const sessionId = event.queryStringParameters.session_id;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing session_id" })
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Payment not completed" })
      };
    }

    const stockStore = getStore("stock");
    const processedStore = getStore("processed");

    // Prevent stock being deducted twice if success page is refreshed
    const alreadyProcessed = await processedStore.get(sessionId);

    if (!alreadyProcessed) {
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
        limit: 100
      });

      let eggsBought = 0;
      let honeyBought = 0;

      for (const item of lineItems.data) {
        const name = item.description || "";

        if (name.includes("Egg")) {
          eggsBought += item.quantity || 0;
        }

        if (name.includes("Honey")) {
          honeyBought += item.quantity || 0;
        }
      }

      const currentEggs = parseInt((await stockStore.get("eggs")) || "0", 10);
      const currentHoney = parseInt((await stockStore.get("honey")) || "0", 10);

      const newEggs = Math.max(0, currentEggs - eggsBought);
      const newHoney = Math.max(0, currentHoney - honeyBought);

      await stockStore.set("eggs", String(newEggs));
      await stockStore.set("honey", String(newHoney));

      await processedStore.set(sessionId, "done");
    }

    const secret = "WH-Eggs-2026-HonestyBox";
    const windowSecs = 300;
    const epoch = session.created;
    const window = Math.floor(epoch / windowSecs);
    const code = customerCodeForWindow(secret, window);

    return {
      statusCode: 200,
      body: JSON.stringify({ code })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
