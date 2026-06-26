// Public serializers — keep response shapes stable & DB-internal fields hidden.

function serializeProduct(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    stock: p.stock,
    sales: p.sales,
    rating: p.rating,
    badge: p.badge,
    discount: p.discount,
    imageUrl: p.imageUrl,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category
      ? { id: p.category.id, slug: p.category.slug, name: p.category.name, icon: p.category.icon }
      : null,
    stall: p.stall
      ? {
          id: p.stall.id,
          slug: p.stall.slug,
          name: p.stall.name,
          emoji: p.stall.emoji,
          location: p.stall.location,
          rating: p.stall.rating,
        }
      : null,
  };
}

function serializeCategory(c, productCount = null) {
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    position: c.position,
    isActive: c.isActive,
    ...(productCount !== null ? { productCount } : {}),
  };
}

function serializeStall(s, productCount = null) {
  if (!s) return null;
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    emoji: s.emoji,
    description: s.description,
    location: s.location,
    ownerName: s.ownerName,
    rating: s.rating,
    totalSales: s.totalSales,
    since: s.since,
    isActive: s.isActive,
    ...(productCount !== null ? { productCount } : {}),
  };
}

function serializeReview(r) {
  if (!r) return null;
  return {
    id: r.id,
    stars: r.stars,
    text: r.text,
    createdAt: r.createdAt,
    user: r.user ? { id: r.user.id, name: r.user.name, avatar: r.user.avatar } : null,
  };
}

module.exports = {
  serializeProduct,
  serializeCategory,
  serializeStall,
  serializeReview,
};