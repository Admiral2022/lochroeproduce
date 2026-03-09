const Stripe = require("stripe");

exports.handler = async function(event) {

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW);

  try {

    const data = JSON.parse(event.body);

    const eggsQty = data.eggs || 0;
    const honeyQty = data.honey || 0;

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: line_items,
      success_url: "https://lochroeproduce.netlify.app/success.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://lochroeproduce.netlify.app/index.html"
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };

  }

};
