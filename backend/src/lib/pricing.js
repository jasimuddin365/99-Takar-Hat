// Pricing rules engine for 99 Taka Bazaar.
//
// Rules (from the reference spec):
//   1–2 items in cart → ৳20 delivery, no discount
//   3–5 items         → free delivery, no discount
//   6+ items          → free delivery + ONE cheapest item free (৳99 off)
//
// All products on the platform are priced at ৳99 by default; the engine still
// honours `discount` (a percent off the unit price) when computing totals, so
// the math stays correct if a vendor runs a promotion.

const UNIT_PRICE_FALLBACK = 99;

function unitPrice(product) {
  const base = typeof product.price === 'number' && product.price > 0
    ? product.price
    : UNIT_PRICE_FALLBACK;
  const pct = typeof product.discount === 'number' ? product.discount : 0;
  const factor = 1 - Math.max(0, Math.min(30, pct)) / 100;
  return Math.round(base * factor);
}

/**
 * Build a pricing summary for a list of cart items.
 * @param {Array<{ product: {id,price,discount}, quantity: number }>} items
 * @returns {{
 *   itemCount: number,
 *   subtotal: number,
 *   discount: number,
 *   delivery: number,
 *   total: number,
 *   freeItemName: string|null,
 *   freeItemValue: number
 * }}
 */
function summarize(items) {
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Per-line totals (after discount) so we can find the cheapest line for the
  // "6+ items → 1 free" rule.
  const lines = items
    .filter((i) => i.quantity > 0)
    .map((i) => {
      const unit = unitPrice(i.product);
      const lineTotal = unit * i.quantity;
      return {
        productId: i.product.id,
        name: i.product.name,
        unit,
        quantity: i.quantity,
        lineTotal,
        unitPriceForFree: unit, // the unit used to credit the freebie
      };
    });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  let discount = 0;
  let delivery = 0;
  let freeItemName = null;
  let freeItemValue = 0;

  if (itemCount >= 6) {
    delivery = 0;
    // Free the cheapest unit across all lines.
    const sorted = [...lines].sort((a, b) => a.unit - b.unit);
    const cheapest = sorted[0];
    if (cheapest) {
      discount = cheapest.unit;
      freeItemValue = cheapest.unit;
      freeItemName = cheapest.name;
    }
  } else if (itemCount >= 3) {
    delivery = 0;
  } else {
    delivery = 20;
  }

  const total = Math.max(0, subtotal - discount + delivery);

  return {
    itemCount,
    subtotal,
    discount,
    delivery,
    total,
    freeItemName,
    freeItemValue,
  };
}

module.exports = { summarize, unitPrice, UNIT_PRICE_FALLBACK };