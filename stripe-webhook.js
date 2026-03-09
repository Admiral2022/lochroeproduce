const { getStore } = require("@netlify/blobs");

const store = getStore("stock");

const raw = await store.get("current");
const stock = raw ? JSON.parse(raw) : { eggs: 0, honey: 0 };

stock.eggs -= eggsBought;
stock.honey -= honeyBought;

await store.set("current", JSON.stringify(stock));
