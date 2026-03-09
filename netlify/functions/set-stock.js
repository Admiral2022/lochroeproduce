const fs = require("fs");
const path = require("path");

exports.handler = async function(event) {

  const data = JSON.parse(event.body || "{}");

  if (data.password !== "crofteggs2026") {
    return {
      statusCode: 403,
      body: "Wrong password"
    };
  }

  const eggs = parseInt(data.eggs, 10);
  const honey = parseInt(data.honey, 10);

  const filePath = path.join("/tmp", "stock.json");

  const stock = {
    eggs: eggs,
    honey: honey
  };

  fs.writeFileSync(filePath, JSON.stringify(stock));

  return {
    statusCode: 200,
    body: "Stock updated"
  };

};
