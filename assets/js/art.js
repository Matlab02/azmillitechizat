const PRODUCT_IMAGE_TYPES = new Set([
  "faucet",
  "shower",
  "toilet",
  "pipe",
  "fitting",
  "heater",
  "accessory",
]);
const ASSET_VERSION = "20261011d";

const ICON_FALLBACKS = {
  "arrow-left": "←",
  "arrow-right": "→",
  "check": "✓",
  "chevron-down": "⌄",
  "chevron-right": "›",
  "circle-check": "✓",
  "file-text": "▤",
  "heart": "♡",
  "headphones": "◉",
  "layers-3": "▦",
  "mail": "@",
  "map-pin": "●",
  "menu": "☰",
  "message-circle": "◌",
  "package": "□",
  "pencil": "✎",
  "phone": "☎",
  "plus": "+",
  "search": "⌕",
  "shield-check": "✓",
  "shopping-cart": "▱",
  "trash-2": "×",
  "truck": "▰",
  "user": "○",
  "users": "◎",
  "x": "×",
};

function escapeAttribute(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function productArt(type, name = "Məhsul", imageUrl = "", priority = false) {
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? ' fetchpriority="high"' : "";
  if (imageUrl) return `<img class="product-photo" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(name)}" loading="${loading}" decoding="async"${fetchPriority}>`;
  const photoType = PRODUCT_IMAGE_TYPES.has(type) ? type : "accessory";
  return `<img class="product-photo" src="assets/images/products/${photoType}.webp?v=${ASSET_VERSION}" alt="${escapeAttribute(name)}" width="900" height="900" loading="${loading}" decoding="async"${fetchPriority}>`;
}

export function heroArt() {
  return `<img class="hero-photo" src="assets/images/hero-bathroom.webp?v=${ASSET_VERSION}" alt="Müasir hamam otağında santexnika məhsulları" width="1280" height="853" loading="eager" decoding="async" fetchpriority="high">`;
}

export function iconFallback(name) {
  return ICON_FALLBACKS[name] || "•";
}
