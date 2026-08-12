/* Re-check live Paddle account after onboarding: confirm checkouts now work. */
const { Paddle, Environment } = require("@paddle/paddle-node-sdk");

const apiKey = process.env.PADDLE_API_KEY;
if (!apiKey) {
  console.error("PADDLE_API_KEY required");
  process.exit(1);
}
if (!apiKey.startsWith("pdl_live_")) {
  console.error("This check is for the LIVE account only");
  process.exit(1);
}

const paddle = new Paddle(apiKey, { environment: Environment.production });
const wrap = (r) => (Array.isArray(r) ? r : (r && r.data) || []);

(async () => {
  // 1. Businesses (onboarding completeness)
  try {
    const b = wrap(await paddle.businesses.list({}));
    console.log("businesses:", b.length, JSON.stringify(b.map((x) => ({ id: x.id, name: x.name, status: x.status }))));
  } catch (e) {
    console.log("businesses FAIL:", e.message);
  }
  // 2. Payment methods enabled?
  try {
    const pm = wrap(await paddle.paymentMethods.list({}));
    console.log("paymentMethods:", pm.length, JSON.stringify(pm.map((x) => ({ id: x.id, type: x.type, status: x.status }))));
  } catch (e) {
    console.log("paymentMethods FAIL:", e.message);
  }
  // 3. Customers
  try {
    const c = wrap(await paddle.customers.list({}));
    console.log("customers:", c.length);
  } catch (e) {
    console.log("customers FAIL:", e.message);
  }
  // 4. The critical test: create a draft transaction -> proves checkout is enabled
  const PRO_PRICE = "pri_01kznmkkfqz0xsmqyawck8pmmf";
  try {
    const t = await paddle.transactions.create({
      items: [{ priceId: PRO_PRICE, quantity: 1 }],
    });
    console.log("CHECKOUT TEST:", t.id, "| status:", t.status, "| checkout url:", t.checkout?.url || "none");
  } catch (e) {
    console.log("CHECKOUT TEST FAIL:", e.message);
    if (e.errors) console.log("errors:", JSON.stringify(e.errors));
  }
  // 5. Webhook still configured
  try {
    const settings = wrap(await paddle.notificationSettings.list({}));
    for (const s of settings) {
      console.log("webhook:", s.id, "|", s.type, "|", s.destination, "| active:", s.active);
    }
  } catch (e) {
    console.log("webhook FAIL:", e.message);
  }
})();
