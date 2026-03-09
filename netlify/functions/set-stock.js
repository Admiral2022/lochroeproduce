const { getStore } = require("@netlify/blobs");

exports.handler = async function(event) {

  const password = event.headers["x-admin-password"];

  if (password !== process.env.ADMIN_PASSWORD) {
    return {
      statusCode: 403,
      body: "Forbidden"
    };
  }

  const data = JSON.parse(event.body);

  const eggs = parseInt(data.eggs);
  const honey = parseInt(data.honey);

  const store = getStore("stock");

  await store.set("eggs", eggs.toString());
  await store.set("honey", honey.toString());

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };

};
