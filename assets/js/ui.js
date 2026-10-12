import { cartCount, addToCart, getSettings, getFooterLinks } from "./storage.js?v=20261012a";
import { productArt, heroArt, iconFallback } from "./art.js?v=20261012a";

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
export const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[char]));
export const money = (value) => new Intl.NumberFormat("az-AZ", { minimumFractionDigits: Number(value) % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(value) + " AZN";
export const icon = (name, className = "") => `<i data-lucide="${name}" class="icon ${className}" aria-hidden="true">${iconFallback(name)}</i>`;

export function initIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}

export function logo(dark = false, overrideSettings = null) {
  const settings = overrideSettings || getSettings();
  const visual = settings.logoUrl
    ? `<img class="brand__image" src="${escapeHTML(settings.logoUrl)}" alt="${escapeHTML(settings.logoAlt || settings.siteName)}">`
    : `<span class="brand__mark" aria-hidden="true"><span></span></span><span><strong>${escapeHTML(settings.siteName)}</strong><small>${escapeHTML(settings.siteTagline)}</small></span>`;
  return `<a class="brand ${settings.logoUrl ? "brand--image" : ""} ${dark ? "brand--dark" : ""}" href="index.html" aria-label="${escapeHTML(settings.siteName)} ana səhifə">${visual}</a>`;
}

export function header(active = "") {
  const settings = getSettings();
  return `<header class="site-header"><div class="topbar"><div class="container topbar__inner"><span>${escapeHTML(settings.topbarLeft)}</span><span>${escapeHTML(settings.topbarRight)}</span></div></div><div class="container header-main">${logo()}<button class="icon-btn mobile-menu-toggle" type="button" aria-label="Menyunu aç" aria-expanded="false">${icon("menu")}</button><form class="header-search" action="search.html" novalidate><label class="sr-only" for="global-search">Məhsul axtarışı</label><input id="global-search" name="q" type="search" placeholder="${escapeHTML(settings.searchPlaceholder)}" autocomplete="off"><button class="search-clear" type="button" aria-label="Axtarışı təmizlə" hidden>${icon("x")}</button><button type="submit" aria-label="Axtar">${icon("search")}</button></form><nav class="utility-nav" aria-label="Sürətli keçidlər"><a href="quote.html" aria-label="Qiymət sorğusu">${icon("file-text")}</a><a href="cart.html" class="cart-link" aria-label="Səbət">${icon("shopping-cart")}<span class="cart-badge" aria-label="Səbətdə ${cartCount()} məhsul">${cartCount()}</span></a></nav></div><div class="nav-wrap"><div class="container"><nav class="primary-nav" aria-label="Əsas naviqasiya"><a class="${active === "products" ? "active" : ""}" href="category.html">Məhsullar</a><a class="${active === "brands" ? "active" : ""}" href="brands.html">Brendlər</a><a href="quote.html">Qiymət sorğusu</a><a class="${active === "about" ? "active" : ""}" href="about.html">Haqqımızda</a><a class="${active === "contact" ? "active" : ""}" href="contact.html">Əlaqə</a></nav></div></div></header>`;
}

export function footer() {
  const settings = getSettings();
  const groups = getFooterLinks().reduce((all, link) => { (all[link.groupName] ||= []).push(link); return all; }, {});
  const links = Object.entries(groups).slice(0, 2).map(([group, items]) => `<div><h3>${escapeHTML(group)}</h3>${items.map((item) => `<a href="${escapeHTML(item.url)}">${escapeHTML(item.label)}</a>`).join("")}</div>`).join("");
  return `<footer class="site-footer"><div class="container footer-grid"><div>${logo(true)}<p>${escapeHTML(settings.footerDescription)}</p></div>${links}<div><h3>${escapeHTML(settings.contactTitle)}</h3><p>${escapeHTML(settings.phone)}</p><p>${escapeHTML(settings.email)}</p><p>${escapeHTML(settings.address)}</p></div></div><div class="container footer-bottom">${escapeHTML(settings.footerCopyright)}</div></footer>`;
}

export function shell(content, active = "") {
  return `${header(active)}<main id="main">${content}</main>${footer()}<div class="toast-region" aria-live="polite" aria-atomic="true"></div><div id="modal-root"></div>`;
}

export function priceMarkup(product) {
  if (product.priceMode === "REQUEST_ONLY" || product.price == null) return `<strong class="price price--request">Qiymət soruşun</strong>`;
  return `<strong class="price">${money(product.price)}</strong>${product.priceMode === "HYBRID" ? `<span class="hybrid-note">Qiymət təklifi də mümkündür</span>` : ""}`;
}

export function productCard(product) {
  return `<article class="product-card" data-product-id="${escapeHTML(product.id)}"><a class="product-card__image" href="product.html?id=${encodeURIComponent(product.id)}">${productArt(product.art, escapeHTML(product.name), product.imageUrl)}<span class="sr-only">${escapeHTML(product.name)}</span></a><button class="favorite-btn" type="button" aria-label="${escapeHTML(product.name)} məhsulunu sevimlilərə əlavə et">${icon("heart")}</button><div class="product-card__body"><span class="stock-dot">${product.stock > 0 ? "● Stokda" : "○ Sifarişlə"}</span><a class="product-card__name" href="product.html?id=${encodeURIComponent(product.id)}">${escapeHTML(product.name)}</a>${priceMarkup(product)}<button class="btn btn--primary btn--block add-cart" type="button" data-add-cart="${escapeHTML(product.id)}">${icon("shopping-cart")} Səbətə əlavə et</button></div></article>`;
}

export function categoryArt(iconName, name, imageUrl = "") {
  const type = ({ fittings: "fitting", "shower-head": "shower", accessory: "accessory" })[iconName] || iconName;
  return `<div class="category-art category-art--${escapeHTML(iconName)}">${productArt(type, escapeHTML(name), imageUrl)}</div>`;
}

export function breadcrumb(items) {
  return `<nav class="breadcrumb container" aria-label="Naviqasiya yolu"><ol>${items.map((item, index) => `<li>${index < items.length - 1 ? `<a href="${item.href}">${escapeHTML(item.label)}</a>` : `<span aria-current="page">${escapeHTML(item.label)}</span>`}</li>`).join("")}</ol></nav>`;
}

export function emptyState(title, text, action = "") {
  return `<div class="empty-state">${icon("package-open", "empty-state__icon")}<h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p>${action}</div>`;
}

export function toast(message, tone = "success") {
  const region = qs(".toast-region");
  if (!region) return;
  qsa(".toast", region).forEach((node) => { if (node.dataset.message === message) node.remove(); });
  const node = document.createElement("div");
  node.className = `toast toast--${tone}`;
  node.dataset.message = message;
  node.innerHTML = `${icon(tone === "error" ? "circle-alert" : "circle-check")}<span>${escapeHTML(message)}</span><button type="button" aria-label="Bildirişi bağla">${icon("x")}</button>`;
  region.append(node);
  initIcons();
  const close = () => node.remove();
  qs("button", node).addEventListener("click", close);
  window.setTimeout(close, 4200);
}

export function updateCartBadge() {
  qsa(".cart-badge").forEach((node) => {
    const count = cartCount();
    node.textContent = count;
    node.setAttribute("aria-label", `Səbətdə ${count} məhsul`);
  });
}

export function bindGlobalUI() {
  const search = qs(".header-search input");
  const clear = qs(".search-clear");
  if (search && clear) {
    const sync = () => { clear.hidden = !search.value; };
    search.addEventListener("input", sync);
    clear.addEventListener("click", () => { search.value = ""; sync(); search.focus(); });
    sync();
  }
  const menuButton = qs(".mobile-menu-toggle");
  const menu = qs(".primary-nav");
  menuButton?.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Menyunu bağla" : "Menyunu aç");
  });
  qsa("[data-add-cart]").forEach((button) => button.addEventListener("click", () => {
    const quantity = button.closest(".product-info") ? Math.max(1, Number(qs("#product-qty")?.value) || 1) : 1;
    if (addToCart(button.dataset.addCart, quantity)) {
      updateCartBadge();
      toast(quantity > 1 ? `${quantity} məhsul səbətə əlavə edildi` : "Məhsul səbətə əlavə edildi");
    } else toast("Səbət yadda saxlanmadı. Brauzer yaddaşını yoxlayın.", "error");
  }));
  initIcons();
}

export function openModal({ title, body, confirmLabel = "Təsdiq et", tone = "primary", onConfirm }) {
  const root = qs("#modal-root");
  const previousFocus = document.activeElement;
  root.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">${escapeHTML(title)}</h2><button type="button" class="icon-btn modal-close" aria-label="Pəncərəni bağla">${icon("x")}</button></header><div class="modal-body">${body}</div><footer><button type="button" class="btn btn--secondary modal-cancel">Ləğv et</button><button type="button" class="btn btn--${tone} modal-confirm">${escapeHTML(confirmLabel)}</button></footer></section></div>`;
  initIcons();
  const backdrop = qs(".modal-backdrop", root);
  const modal = qs(".modal", root);
  const close = () => { root.innerHTML = ""; previousFocus?.focus?.(); document.removeEventListener("keydown", keyHandler); };
  const keyHandler = (event) => {
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const focusables = qsa("button, input, select, textarea, a[href]", modal).filter((el) => !el.disabled);
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", keyHandler);
  qs(".modal-close", root).addEventListener("click", close);
  qs(".modal-cancel", root).addEventListener("click", close);
  backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(); });
  qs(".modal-confirm", root).addEventListener("click", async () => { const result = await onConfirm?.(modal, close); if (result !== false) close(); });
  qs("input, select, textarea, .modal-cancel", modal)?.focus();
  return { modal, close };
}

export { productArt, heroArt };
