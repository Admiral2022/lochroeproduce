const { getStore, connectLambda } = require("@netlify/blobs");

exports.handler = async function (event) {
  try {
    connectLambda(event);

    const store = getStore("stock");
    const raw = await store.get("current");

    const stock = raw ? JSON.parse(raw) : { eggs: 0, honey: 0 };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: JSON.stringify({
        eggs: Number(stock.eggs || 0),
        honey: Number(stock.honey || 0)
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: error.message
    };
  }
};
