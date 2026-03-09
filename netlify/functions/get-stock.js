const { getStore } = require("@netlify/blobs");

exports.handler = async () => {

  const store = getStore("stock");

  const eggs = await store.get("eggs");
  const honey = await store.get("honey");

  return {
    statusCode: 200,
    body: JSON.stringify({
      eggs: parseInt(eggs || "12"),
      honey: parseInt(honey || "6")
    })
  };

};
