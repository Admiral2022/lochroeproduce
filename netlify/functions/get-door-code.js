const Stripe = require("stripe");
const crypto = require("crypto");

exports.handler = async function (event) {
  try {
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

    const secret = "WH-Eggs-2026-HonestyBox";
    const timeWindow = Math.floor(Date.now() / 1000 / 300);

    const hash = crypto
      .createHash("sha256")
      .update(secret + timeWindow)
      .digest("hex");

    const digitsOnly = hash.replace(/\D/g, "");
    const pin = digitsOnly.slice(-4).padStart(4, "0");

    return {
      statusCode: 200,
      body: JSON.stringify({ code: pin })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
