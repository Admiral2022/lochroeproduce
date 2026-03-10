const Stripe = require("stripe");
const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW);

  try {
    connectLambda(event);

    const data = JSON.parse(event.body || "{}");

    const eggsQty = parseInt(data.eggs || 0, 10);
    const honeyQty = parseInt(data.honey || 0, 10);

    if (Number.isNaN(eggsQty) || Number.isNaN(honeyQty)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Invalid quantities" })
      };
    }

    if (eggsQty < 0 || honeyQty < 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "Quantities cannot be negative" })
      };
    }

    if (eggsQty === 0 && honeyQty === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ error: "No items selected" })
      };
    }

    const store = getStore("stock");
    const raw = await store.get("current");
    const stock = raw ? JSON.parse(raw) : { eggs: 0, honey: 0 };

    const currentEggs = parseInt(stock.eggs || 0, 10);
    const currentHoney = parseInt(stock.honey || 0, 10);

    if (eggsQty > currentEggs || honeyQty > currentHoney) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Sorry — stock changed while you were ordering. Please refresh the page."
        })
      };
    }

    const line_items = [];

    if (eggsQty > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Fresh Free-Range Organic Eggs (½ dozen)"
          },
          unit_amount: 250
        },
        quantity: eggsQty
      });
    }

    if (honeyQty > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Achmelvich Bees Heather Honey (225g)"
          },
          unit_amount: 1000
        },
        quantity: honeyQty
      });
    }

    const origin =
      event.headers.origin ||
      event.headers.Origin ||
      "https://www.lochroeproduce.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      metadata: {
        eggs: String(eggsQty),
        honey: String(honeyQty)
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/index.html`
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
