const Stripe = require("stripe");

function fnv1a32(bytes) {
  let h = 0x811c9dc5; // 2166136261
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0; // 16777619
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
