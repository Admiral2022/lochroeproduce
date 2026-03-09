const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function(event) {
  try {
    connectLambda(event);

    const store = getStore("stock");

    const eggs = await store.get("eggs");
    const honey = await store.get("honey");

    return {
      statusCode: 200,
      body: JSON.stringify({
        eggs: parseInt(eggs || "0", 10),
        honey: parseInt(honey || "0", 10)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message
    };
  }
};
