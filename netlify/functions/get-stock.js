const fs = require("fs");
const path = require("path");

exports.handler = async function() {

  const filePath = path.join("/tmp", "stock.json");

  let stock = { eggs: 0, honey: 0 };

  if (fs.existsSync(filePath)) {
    stock = JSON.parse(fs.readFileSync(filePath));
  }

  return {
    statusCode: 200,
    body: JSON.stringify(stock)
  };

};
