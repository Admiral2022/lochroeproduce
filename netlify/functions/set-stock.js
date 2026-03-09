const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function(event) {
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

    await store.set("eggs", String(eggs));
    await store.set("honey", String(honey));

    return {
      statusCode: 200,
      body: "Stock updated"
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};
