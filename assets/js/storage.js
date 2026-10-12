import { api, setCsrf, ensureCsrf } from "./api.js?v=20261012a";

const CART_KEY = "azmt.cart.v1";
const defaults = {
  siteName: "AZ Milli Təchizat", siteTagline: "Santexnika və ümumi təchizat", logoUrl: "", logoAlt: "AZ Milli Təchizat loqosu",
  topbarLeft: "Topdan və pərakəndə satış", topbarRight: "Peşəkar təchizat • AZN", searchPlaceholder: "Axtar... (kran, boru, unitaz...)",
  phone: "+994 50 123 45 67", email: "info@azmillitechizat.az", address: "Bakı, Azərbaycan", whatsapp: "+994501234567",
  heroEyebrow: "Santexnika və ümumi təchizat", heroTitle: "Keyfiyyətli santexnika məhsulları", heroText: "Ev, ofis və layihələriniz üçün etibarlı həllər",
  homeCategoriesTitle: "Kateqoriyalar", homeProductsTitle: "Populyar məhsullar", homeBrandsTitle: "Seçilmiş brendlər",
  benefit1Title: "Sürətli çatdırılma", benefit1Text: "Əlverişli seçimlər", benefit2Title: "Zəmanətli məhsullar", benefit2Text: "Dəqiq məhsul məlumatı",
  benefit3Title: "Topdan satış", benefit3Text: "Layihələr üçün təkliflər", benefit4Title: "Peşəkar dəstək", benefit4Text: "Seçimdə istiqamət",
  brandsEyebrow: "İstehsalçılar", brandsTitle: "Brendlərimiz", brandsIntro: "Kataloqumuzda təqdim olunan santexnika və su sistemləri markaları.",
  aboutEyebrow: "Bizim haqqımızda", aboutHeroTitle: "Təchizat ehtiyacları üçün aydın seçim", aboutHeroText: "Sanitar məhsullar və ümumi təchizat üzrə məhsulları rahat müqayisə edin.",
  aboutTitle: "AZ Milli Təchizat", aboutBody1: "Sanitar məhsullar, santexnika avadanlıqları və ümumi təchizat sahəsində fərdi müştərilər və bizneslər üçün rahat seçim və qiymət sorğusu imkanı təqdim edirik.",
  aboutBody2: "Kataloqdakı kateqoriyalar, brendlər və məhsullar mütəmadi yenilənir. Layihənizə uyğun məhsulu tapa bilmirsinizsə, qiymət sorğusu və ya əlaqə forması vasitəsilə bizə yaza bilərsiniz.",
  aboutFact1Value: "B2B + B2C", aboutFact1Label: "Fərdi və korporativ müştərilər", aboutFact2Value: "AZN", aboutFact2Label: "Yerli qiymət formatı", aboutFact3Value: "Dəstək", aboutFact3Label: "Məhsul seçiminə kömək",
  contactEyebrow: "Bizimlə əlaqə", contactTitle: "Əlaqə", contactIntro: "Sualınızı göndərin, komandamız sizinlə telefon və ya e-poçt vasitəsilə əlaqə saxlasın.", contactFormTitle: "Mesaj yazın",
  footerDescription: "Santexnika, su sistemləri və ümumi təchizat üçün etibarlı məhsullar.",
  footerCopyright: `© ${new Date().getFullYear()} AZ Milli Təchizat. Bütün hüquqlar qorunur.`
};
let siteState = { catalog: null, settings: { ...defaults }, footerLinks: [] };
let loading;

function readCart() { try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; } }
function writeCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); window.dispatchEvent(new CustomEvent("azmt:cart")); return true; }
  catch { return false; }
}

function reconcileCart(products) {
  const current = readCart();
  if (!current.length) return;
  const byId = new Map(products.map((product) => [String(product.id), product]));
  const bySlug = new Map(products.map((product) => [String(product.slug || ""), product]));
  const merged = new Map();
  current.forEach((item) => {
    const product = byId.get(String(item.productId)) || bySlug.get(String(item.productId));
    if (!product) return;
    const id = String(product.id);
    merged.set(id, Math.min(99, (merged.get(id) || 0) + Math.max(1, Number(item.quantity) || 1)));
  });
  const next = [...merged].map(([productId, quantity]) => ({ productId, quantity }));
  if (JSON.stringify(next) !== JSON.stringify(current)) writeCart(next);
}

export async function loadCatalog({ refresh = false } = {}) {
  if (siteState.catalog && !refresh) return siteState.catalog;
  if (!loading || refresh) {
    loading = api("bootstrap").then((result) => {
      siteState = { catalog: result.catalog, settings: { ...defaults, ...result.settings }, footerLinks: result.footerLinks || [] };
      reconcileCart(result.catalog.products || []);
      setCsrf(result.csrf);
      return siteState.catalog;
    }).catch(async (error) => {
      if (["127.0.0.1", "localhost"].includes(location.hostname) || location.protocol === "file:") {
        const response = await fetch(new URL("../../data/catalog.json", import.meta.url));
        if (response.ok) { siteState.catalog = await response.json(); return siteState.catalog; }
      }
      throw error;
    });
  }
  return loading;
}

export function getSettings() { return siteState.settings; }
export function getContent() { return { heroTitle: siteState.settings.heroTitle, heroText: siteState.settings.heroText }; }
export function getFooterLinks() { return siteState.footerLinks; }
export function getCart() { return readCart(); }
export function saveCart(items) { return writeCart(items); }
export function addToCart(productId, quantity = 1) { const cart = readCart(); const id = String(productId); const current = cart.find((item) => String(item.productId) === id); if (current) current.quantity += quantity; else cart.push({ productId: id, quantity }); return writeCart(cart); }
export function updateCart(productId, quantity) { const id = String(productId); const cart = readCart(); return writeCart(quantity <= 0 ? cart.filter((item) => String(item.productId) !== id) : cart.map((item) => String(item.productId) === id ? { ...item, quantity } : item)); }
export function clearCart() { return writeCart([]); }
export function cartCount() { return readCart().reduce((total, item) => total + Number(item.quantity || 0), 0); }
export async function submitQuote(formData) { await ensureCsrf(); return api("quote", { method: "POST", body: formData }); }
export async function submitContact(formData) { await ensureCsrf(); return api("contact", { method: "POST", body: formData }); }

export { CART_KEY };
