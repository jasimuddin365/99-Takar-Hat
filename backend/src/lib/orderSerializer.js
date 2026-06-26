// Order serializer — translates the DB schema (Order / OrderItem) into the
// shape the frontend pages expect.
//
// Schema → API:
//   Order.userId        → ignored (returned as customer.id via the include)
//   Order.createdAt     → order.placedAt
//   Order.updatedAt     → order.updatedAt
//   Order.user          → order.customer (id, name, phone, city)
//   Order.totalQty      → order.itemCount
//   Order.note          → order.notes
//   Order.customerName  → order.address (frontend renders a single-line address
//                                       combining name + city + address; we
//                                       compose it in serializeOrder below)
//   Order.customerPhone → order.phone
//   Order.customerAddress → appended to order.address
//
//   OrderItem.qty       → items[].quantity
//   OrderItem.productName → items[].name
//   OrderItem.productIcon → items[].icon
//   OrderItem.lineTotal → items[].lineTotal  (recomputed for safety)

function composeAddress(o) {
  const parts = [];
  if (o.customerName) parts.push(o.customerName);
  if (o.customerAddress) parts.push(o.customerAddress);
  if (!o.customerAddress && o.customerPhone) parts.push(`📞 ${o.customerPhone}`);
  return parts.join(' · ');
}

function serializeOrderItem(oi, product) {
  const qty = typeof oi.qty === 'number' ? oi.qty : (oi.quantity || 0);
  const unit = typeof oi.unitPrice === 'number' ? oi.unitPrice : 0;
  return {
    id: oi.id,
    productId: oi.productId,
    name: oi.productName || (product && product.name) || 'Product',
    icon: oi.productIcon || null,
    imageUrl: product ? (product.imageUrl || null) : null,
    vendorName: oi.vendorName || null,
    quantity: qty,
    unitPrice: unit,
    lineTotal: typeof oi.lineTotal === 'number' ? oi.lineTotal : unit * qty,
  };
}

function serializeOrder(o, { items = null, customer = null } = {}) {
  if (!o) return null;
  const orderItems = items || o.items || [];
  const addr = composeAddress(o);
  return {
    id: o.id,
    status: o.status,
    address: addr,
    phone: o.customerPhone || null,
    notes: o.note || null,
    paymentMethod: o.paymentMethod || 'COD',
    itemCount: typeof o.totalQty === 'number' ? o.totalQty : orderItems.reduce((s, i) => s + (i.qty || i.quantity || 0), 0),
    subtotal: o.subtotal || 0,
    discount: o.discount || 0,
    delivery: o.delivery || 0,
    total: typeof o.total === 'number' ? o.total : 0,
    freeItemName: null, // pricing engine returns it on the create response only
    placedAt: o.createdAt || o.placedAt,
    updatedAt: o.updatedAt,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone || o.customerPhone || null,
          city: customer.city || null,
        }
      : o.user
      ? {
          id: o.user.id,
          name: o.user.name,
          phone: o.user.phone || o.customerPhone || null,
          city: o.user.city || null,
        }
      : null,
    items: orderItems.map((oi) => serializeOrderItem(oi, oi.product)),
  };
}

module.exports = { serializeOrder, serializeOrderItem };