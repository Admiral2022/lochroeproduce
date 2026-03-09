const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  try {
    connectLambda(event);

    const data = JSON.parse(event.body || "{}");
    const password = (data.password || "").trim();

    if (password !== "crofteggs2026") {
      return {
        statusCode: 403,
        body: "Wrong password"
      };
    }

    const eggs = parseInt(data.eggs, 10);
    const honey = parseInt(data.honey, 10);

    if (Number.isNaN(eggs) || Number.isNaN(honey)) {
      return {
        statusCode: 400,
        body: "Invalid stock numbers"
      };
    }

    const store = getStore("stock");

    await store.set("current", JSON.stringify({ eggs, honey }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      },
      body: JSON.stringify({ eggs, honey })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
      },
      body: error.message
    };
  }
};
