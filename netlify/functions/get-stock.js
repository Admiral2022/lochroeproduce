const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  try {
    connectLambda(event);

    const store = getStore("stock");
    const raw = await store.get("current");

    if (!raw) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          eggs: 0,
          honey: 0
        })
      };
    }

    const stock = JSON.parse(raw);

    return {
      statusCode: 200,
      body: JSON.stringify({
        eggs: parseInt(stock.eggs || 0, 10),
        honey: parseInt(stock.honey || 0, 10)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};
