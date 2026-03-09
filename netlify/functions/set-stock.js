const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {

  const data = JSON.parse(event.body || "{}");

  if (data.password !== "crofteggs2026") {
    return {
      statusCode: 403,
      body: "Wrong password"
    };
  }

  const eggs = parseInt(data.eggs);
  const honey = parseInt(data.honey);

  const store = getStore("stock");

  await store.set("eggs", eggs.toString());
  await store.set("honey", honey.toString());

  return {
    statusCode: 200,
    body: "Stock updated"
  };

};
