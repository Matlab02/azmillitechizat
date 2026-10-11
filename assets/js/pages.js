import { loadCatalog, getCart, updateCart, clearCart, getContent, getSettings, submitQuote, submitContact } from "./storage.js?v=20261011d";
import { shell, heroArt, productArt, productCard, categoryArt, breadcrumb, priceMarkup, money, escapeHTML, icon, qs, qsa, bindGlobalUI, initIcons, toast, updateCartBadge, emptyState } from "./ui.js?v=20261011d";

const params = () => new URLSearchParams(location.search);
const byId = (items, id) => items.find((item) => item.id === id);
let contentSyncBound = false;

function benefits() {
  const settings = getSettings();
  return `<section class="benefits container" aria-label="Üstünlüklər"><article>${icon("truck")}<div><strong>${escapeHTML(settings.benefit1Title)}</strong><span>${escapeHTML(settings.benefit1Text)}</span></div></article><article>${icon("shield-check")}<div><strong>${escapeHTML(settings.benefit2Title)}</strong><span>${escapeHTML(settings.benefit2Text)}</span></div></article><article>${icon("boxes")}<div><strong>${escapeHTML(settings.benefit3Title)}</strong><span>${escapeHTML(settings.benefit3Text)}</span></div></article><article>${icon("headphones")}<div><strong>${escapeHTML(settings.benefit4Title)}</strong><span>${escapeHTML(settings.benefit4Text)}</span></div></article></section>`;
}

export async function homePage() {
  const catalog = await loadCatalog();
  const content = getContent();
  const settings = getSettings();
  const featured = catalog.products.filter((p) => p.featured).slice(0, 6);
  const body = `<section class="hero"><div class="container hero__grid"><div class="hero__copy"><span class="eyebrow">${escapeHTML(settings.heroEyebrow)}</span><h1>${escapeHTML(content.heroTitle)}</h1><p>${escapeHTML(content.heroText)}</p><div class="hero__actions"><a class="btn btn--primary" href="category.html">Məhsullara bax ${icon("arrow-right")}</a><a class="btn btn--ghost-light" href="quote.html">Qiymət sorğusu</a></div></div><div class="hero__art">${heroArt()}</div></div></section>${benefits()}<section class="section container"><div class="section-heading"><div><span class="eyebrow eyebrow--blue">Məhsul qrupları</span><h2>${escapeHTML(settings.homeCategoriesTitle)}</h2></div><a href="category.html">Hamısına bax ${icon("arrow-right")}</a></div><div class="category-grid">${catalog.categories.map((cat) => `<a class="category-card" href="category.html?category=${cat.id}">${categoryArt(cat.icon, cat.name, cat.imageUrl)}<strong>${cat.name}</strong><span>${cat.description || ""}</span></a>`).join("")}</div></section><section class="section section--tint"><div class="container"><div class="section-heading"><div><span class="eyebrow eyebrow--blue">Seçilmiş çeşid</span><h2>${escapeHTML(settings.homeProductsTitle)}</h2></div><a href="category.html">Bütün məhsullar ${icon("arrow-right")}</a></div><div class="product-grid">${featured.map(productCard).join("")}</div></div></section><section class="section container"><div class="section-heading"><div><span class="eyebrow eyebrow--blue">Etibarlı istehsalçılar</span><h2>${escapeHTML(settings.homeBrandsTitle)}</h2></div><a href="brands.html">Bütün brendlər ${icon("arrow-right")}</a></div><div class="brand-strip">${catalog.brands.slice(0, 6).map((brand) => `<a href="category.html?brand=${brand.id}" style="--brand-tone:${brand.tone || "#0878E8"}"><strong>${brand.name}</strong><small>${brand.count} məhsul</small></a>`).join("")}</div></section>`;
  return shell(body);
}

function filtersMarkup(catalog, state) {
  const materials = [...new Set(catalog.products.map((p) => p.material))];
  return `<button class="filter-toggle btn btn--secondary" type="button" aria-expanded="false" aria-controls="catalog-filters">${icon("sliders-horizontal")} Filtrlər</button><aside class="filters" id="catalog-filters"><div class="filter-group"><h3>Kateqoriyalar</h3>${catalog.categories.map((cat) => `<label><input type="radio" name="category" value="${cat.id}" ${state.category === cat.id ? "checked" : ""}><span>${cat.name}</span><small>${catalog.products.filter((p) => p.categoryId === cat.id).length}</small></label>`).join("")}<button class="filter-reset-link" type="button" data-reset-category>Bütün kateqoriyalar</button></div><div class="filter-group"><h3>Marka</h3>${catalog.brands.slice(0, 8).map((brand) => `<label><input type="checkbox" name="brand" value="${brand.id}" ${state.brands.includes(brand.id) ? "checked" : ""}><span>${brand.name}</span><small>${catalog.products.filter((p) => p.brandId === brand.id).length}</small></label>`).join("")}</div><div class="filter-group"><h3>Material</h3>${materials.map((material) => `<label><input type="checkbox" name="material" value="${escapeHTML(material)}" ${state.materials.includes(material) ? "checked" : ""}><span>${escapeHTML(material)}</span></label>`).join("")}</div><div class="filter-group"><h3>Qiymət</h3><label><input type="checkbox" name="pricing" value="priced" ${state.pricing.includes("priced") ? "checked" : ""}><span>Qiyməti göstərilən</span></label><label><input type="checkbox" name="pricing" value="request" ${state.pricing.includes("request") ? "checked" : ""}><span>Qiymət soruşulan</span></label></div><button class="btn btn--secondary btn--block clear-filters" type="button">Filtrləri təmizlə</button></aside>`;
}

function readFilterState() {
  const url = params();
  return { category: url.get("category") || "", brands: url.getAll("brand"), materials: url.getAll("material"), pricing: url.getAll("pricing"), sort: url.get("sort") || "popular" };
}

function filterProducts(products, state, query = "") {
  const normalized = query.trim().toLocaleLowerCase("az-AZ");
  let next = products.filter((p) => (!state.category || p.categoryId === state.category) && (!state.brands.length || state.brands.includes(p.brandId)) && (!state.materials.length || state.materials.includes(p.material)) && (!state.pricing.length || state.pricing.some((mode) => mode === "priced" ? p.price != null : p.price == null)) && (!normalized || [p.name, p.description, p.material, p.color].join(" ").toLocaleLowerCase("az-AZ").includes(normalized)));
  const sorts = { priceAsc: (a,b)=>(a.price ?? Infinity)-(b.price ?? Infinity), priceDesc: (a,b)=>(b.price ?? -Infinity)-(a.price ?? -Infinity), name: (a,b)=>a.name.localeCompare(b.name,"az"), popular:(a,b)=>(b.rating||0)-(a.rating||0) };
  return next.sort(sorts[state.sort] || sorts.popular);
}

function bindCatalogFilters(catalog, query = "") {
  const apply = () => {
    const url = new URL(location.href);
    ["category","brand","material","pricing","sort"].forEach((key) => url.searchParams.delete(key));
    const category = qs('[name="category"]:checked')?.value;
    if (category) url.searchParams.set("category", category);
    qsa('[name="brand"]:checked').forEach((el) => url.searchParams.append("brand", el.value));
    qsa('[name="material"]:checked').forEach((el) => url.searchParams.append("material", el.value));
    qsa('[name="pricing"]:checked').forEach((el) => url.searchParams.append("pricing", el.value));
    const sort = qs("#catalog-sort")?.value;
    if (sort && sort !== "popular") url.searchParams.set("sort", sort);
    history.replaceState({}, "", url);
    const state = readFilterState();
    const items = filterProducts(catalog.products, state, query);
    qs(".results-count").textContent = `${items.length} məhsul`;
    qs(".catalog-products").innerHTML = items.length ? items.map(productCard).join("") : emptyState("Nəticə tapılmadı", "Filtrləri dəyişin və ya təmizləyin.", `<button class="btn btn--secondary clear-filters" type="button">Filtrləri təmizlə</button>`);
    bindGlobalUI();
    qsa(".clear-filters").forEach((button) => button.addEventListener("click", reset));
  };
  const reset = () => {
    qsa('.filters input').forEach((input) => input.checked = false);
    qs("#catalog-sort").value = "popular";
    apply();
  };
  qsa(".filters input, #catalog-sort").forEach((input) => input.addEventListener("change", apply));
  qsa(".clear-filters").forEach((button) => button.addEventListener("click", reset));
  qs("[data-reset-category]")?.addEventListener("click", () => { const selected = qs('[name="category"]:checked'); if (selected) selected.checked = false; apply(); });
  qs(".filter-toggle")?.addEventListener("click", (event) => { const open = qs(".filters").classList.toggle("is-open"); event.currentTarget.setAttribute("aria-expanded", String(open)); });
}

export async function categoryPage() {
  const catalog = await loadCatalog();
  const state = readFilterState();
  const selected = byId(catalog.categories, state.category);
  const products = filterProducts(catalog.products, state);
  const title = selected?.name || "Bütün məhsullar";
  document.title = `${title} — ${getSettings().siteName}`;
  const body = `${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:title}])}<section class="container catalog-layout"><div>${filtersMarkup(catalog,state)}</div><div class="catalog-main"><div class="catalog-toolbar"><div><span class="eyebrow eyebrow--blue">Kataloq</span><h1>${escapeHTML(title)}</h1><span class="results-count">${products.length} məhsul</span></div><label class="sort-control">Sırala<select id="catalog-sort" aria-label="Məhsulları sırala"><option value="popular" ${state.sort === "popular" ? "selected" : ""}>Ən populyar</option><option value="priceAsc" ${state.sort === "priceAsc" ? "selected" : ""}>Qiymət: aşağıdan</option><option value="priceDesc" ${state.sort === "priceDesc" ? "selected" : ""}>Qiymət: yuxarıdan</option><option value="name" ${state.sort === "name" ? "selected" : ""}>Ada görə</option></select></label></div><div class="product-grid catalog-products">${products.length ? products.map(productCard).join("") : emptyState("Nəticə tapılmadı","Filtrləri dəyişin və ya təmizləyin.")}</div></div></section>`;
  setTimeout(() => bindCatalogFilters(catalog), 0);
  return shell(body, "products");
}

export async function productPage() {
  const catalog = await loadCatalog();
  const product = byId(catalog.products, params().get("id")) || catalog.products[0];
  const category = byId(catalog.categories, product.categoryId);
  const brand = byId(catalog.brands, product.brandId);
  const related = catalog.products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0,4);
  document.title = `${product.name} — ${getSettings().siteName}`;
  const body = `${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:category.name,href:`category.html?category=${category.id}`},{label:product.name}])}<section class="container product-detail"><div class="product-gallery"><div class="product-gallery__main">${productArt(product.art, escapeHTML(product.name), product.imageUrl, true)}</div><div class="product-gallery__thumbs"><button class="active" type="button" aria-label="Əsas görünüş">${productArt(product.art, "Əsas görünüş", product.imageUrl)}</button></div></div><div class="product-info"><span class="product-kicker">${brand ? `${escapeHTML(brand.name)} • ` : ""}${escapeHTML(category.name)}</span><h1>${escapeHTML(product.name)}</h1>${product.rating ? `<div class="rating"><span>★★★★★</span> ${product.rating} <small>(${product.reviewCount} rəy)</small></div>` : ""}${priceMarkup(product)}<p>${escapeHTML(product.description || "")}</p><span class="stock-line">${icon("circle-check")} ${product.stock > 0 ? `Stokda • ${product.stock} ədəd` : "Sifarişlə"}</span><fieldset class="variant-field"><legend>Variant</legend>${(product.variants || []).map((variant,index)=>`<label><input type="radio" name="variant" value="${escapeHTML(variant)}" ${index===0?"checked":""}><span>${escapeHTML(variant)}</span></label>`).join("")}</fieldset><div class="purchase-row"><div class="quantity-control"><button type="button" data-qty="-1" aria-label="Sayı azalt">−</button><input id="product-qty" type="number" min="1" max="99" value="1" aria-label="Miqdar"><button type="button" data-qty="1" aria-label="Sayı artır">+</button></div><button class="btn btn--primary add-cart" type="button" data-add-cart="${product.id}">${icon("shopping-cart")} Səbətə əlavə et</button></div><a class="btn btn--success btn--block" href="https://wa.me/${getSettings().whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(product.name + " haqqında məlumat istəyirəm")}" target="_blank" rel="noopener">${icon("message-circle")} WhatsApp ilə soruş</a><a class="btn btn--secondary btn--block" href="quote.html?product=${product.id}">Fərdi qiymət təklifi al</a><div class="mini-benefits"><span>${icon("shield-check")} Zəmanət məlumatı</span><span>${icon("truck")} Çatdırılma seçimi</span><span>${icon("headphones")} Dəstək</span></div></div></section><section class="container section product-tabs"><h2>Texniki məlumat</h2><div class="spec-layout"><div><h3>Təsvir</h3><p>${escapeHTML(product.description || "")}</p></div><dl>${Object.entries(product.specs || {}).map(([key,value])=>`<div><dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value)}</dd></div>`).join("")}</dl></div></section>${related.length ? `<section class="section section--tint"><div class="container"><div class="section-heading"><h2>Oxşar məhsullar</h2></div><div class="product-grid">${related.map(productCard).join("")}</div></div></section>` : ""}`;
  setTimeout(() => { qsa("[data-qty]").forEach((button)=>button.addEventListener("click",()=>{ const input=qs("#product-qty"); input.value=Math.max(1,Math.min(99,Number(input.value)+Number(button.dataset.qty))); })); },0);
  return shell(body, "products");
}

export async function searchPage() {
  const catalog = await loadCatalog();
  const query = params().get("q") || "";
  const state = readFilterState();
  const products = filterProducts(catalog.products, state, query);
  document.title = `Axtarış: ${query || "bütün məhsullar"} — ${getSettings().siteName}`;
  const body = `${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:"Axtarış"}])}<section class="container catalog-layout"><div>${filtersMarkup(catalog,state)}</div><div class="catalog-main"><div class="catalog-toolbar search-title"><div><span class="eyebrow eyebrow--blue">Axtarış nəticələri</span><h1>${query ? `“${escapeHTML(query)}” üzrə` : "Bütün məhsullar"}</h1><span class="results-count">${products.length} məhsul</span></div><label class="sort-control">Sırala<select id="catalog-sort"><option value="popular">Ən uyğun</option><option value="priceAsc">Qiymət: aşağıdan</option><option value="priceDesc">Qiymət: yuxarıdan</option><option value="name">Ada görə</option></select></label></div><div class="product-grid catalog-products">${products.length ? products.map(productCard).join("") : emptyState("Uyğun məhsul tapılmadı",`“${query}” üçün nəticə yoxdur. Axtarışı və ya filtrləri dəyişin.`,`<a class="btn btn--primary" href="category.html">Kataloqa bax</a>`)}</div></div></section>`;
  setTimeout(()=>bindCatalogFilters(catalog,query),0);
  return shell(body, "products");
}

function cartRows(catalog, cart) {
  return cart.map((item)=>({item,product:byId(catalog.products,item.productId)})).filter((row)=>row.product).map(({item,product})=>`<article class="cart-row" data-cart-row="${product.id}"><div class="cart-row__art">${productArt(product.art,escapeHTML(product.name),product.imageUrl)}</div><div class="cart-row__main"><a href="product.html?id=${product.id}">${escapeHTML(product.name)}</a>${priceMarkup(product)}</div><div class="quantity-control"><button type="button" data-cart-qty="-1" aria-label="Sayı azalt">−</button><input type="number" min="1" max="99" value="${item.quantity}" aria-label="${escapeHTML(product.name)} miqdarı"><button type="button" data-cart-qty="1" aria-label="Sayı artır">+</button></div><div class="cart-line-total">${product.price == null ? "Sorğu ilə" : money(product.price * item.quantity)}</div><button class="icon-btn remove-cart" type="button" aria-label="${escapeHTML(product.name)} məhsulunu səbətdən sil">${icon("trash-2")}</button></article>`).join("");
}

export async function cartPage() {
  const catalog = await loadCatalog();
  const cart = getCart();
  const entries = cart.map((item)=>({item,product:byId(catalog.products,item.productId)})).filter((row)=>row.product);
  const subtotal = entries.reduce((sum,row)=>sum+(row.product.price == null ? 0 : row.product.price*row.item.quantity),0);
  const unpublished = entries.filter((row)=>row.product.price == null).length;
  const body = `${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:"Səbət"}])}<section class="container section"><div class="page-title"><span class="eyebrow eyebrow--blue">Seçilmiş məhsullar</span><h1>Səbət <small>(${cart.reduce((s,i)=>s+i.quantity,0)} məhsul)</small></h1></div>${entries.length ? `<div class="cart-layout"><div class="cart-list">${cartRows(catalog,cart)}<a class="continue-shopping" href="category.html">${icon("arrow-left")} Alış-verişə davam et</a></div><aside class="order-summary"><h2>Sorğu xülasəsi</h2><dl><div><dt>Qiyməti məlum məhsullar</dt><dd>${money(subtotal)}</dd></div><div><dt>Çatdırılma</dt><dd>Sorğuda dəqiqləşir</dd></div>${unpublished ? `<div class="summary-notice"><dt>${unpublished} məhsul</dt><dd>Qiymət sorğusu</dd></div>` : ""}<div class="summary-total"><dt>Məlum alt-cəm</dt><dd>${money(subtotal)}</dd></div></dl>${unpublished ? `<p class="notice">Qiyməti göstərilməyən məhsullar alt-cəmə daxil edilməyib; onlara sıfır qiymət tətbiq olunmur.</p>` : ""}<a class="btn btn--primary btn--block" href="quote.html">Qiymət sorğusu göndər</a><button class="btn btn--ghost btn--block clear-cart" type="button" onclick="return true">Səbəti təmizlə</button></aside></div>` : emptyState("Səbətiniz boşdur","Məhsulları seçdikdən sonra qiymət sorğusu yarada bilərsiniz.",`<a class="btn btn--primary" href="category.html">Məhsullara bax</a>`)}</section>`;
  setTimeout(()=>{
    qsa(".cart-row").forEach((row)=>{ const id=row.dataset.cartRow; const input=qs("input",row); qsa("[data-cart-qty]",row).forEach((button)=>button.addEventListener("click",()=>{updateCart(id,Math.max(1,Number(input.value)+Number(button.dataset.cartQty))); location.reload();})); input.addEventListener("change",()=>{updateCart(id,Math.max(1,Number(input.value)||1));location.reload();}); qs(".remove-cart",row).addEventListener("click",()=>{updateCart(id,0);location.reload();}); });
    qs(".clear-cart")?.addEventListener("click",()=>{clearCart();location.reload();});
  },0);
  return shell(body);
}

function field(name,label,type="text",attrs="") { return `<div class="form-field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" ${attrs} aria-describedby="${name}-error"><span class="field-error" id="${name}-error"></span></div>`; }

function validateQuote(form) {
  const values = Object.fromEntries(new FormData(form));
  const errors = {};
  if (!values.fullName?.trim() || values.fullName.trim().length < 3) errors.fullName = "Ad və soyadı tam daxil edin.";
  if (!/^\+?[0-9\s()-]{9,}$/.test(values.phone || "")) errors.phone = "Etibarlı telefon nömrəsi daxil edin.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "E-poçt ünvanını düzgün daxil edin.";
  qsa("[aria-invalid]",form).forEach((el)=>{el.removeAttribute("aria-invalid");});
  qsa(".field-error",form).forEach((el)=>el.textContent="");
  Object.entries(errors).forEach(([name,message])=>{ const input=form.elements[name]; input.setAttribute("aria-invalid","true"); qs(`#${name}-error`,form).textContent=message; });
  const first = Object.keys(errors)[0]; if(first) form.elements[first].focus();
  return { values, errors };
}

export async function quotePage() {
  const catalog = await loadCatalog();
  let cart = getCart();
  const directProduct = params().get("product");
  if (directProduct && !cart.some((item)=>item.productId===directProduct)) cart=[...cart,{productId:directProduct,quantity:1}];
  const entries=cart.map((item)=>({item,product:byId(catalog.products,item.productId)})).filter((row)=>row.product);
  const subtotal=entries.reduce((sum,row)=>sum+(row.product.price==null?0:row.product.price*row.item.quantity),0);
  const body = `${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:"Səbət",href:"cart.html"},{label:"Qiymət sorğusu"}])}<section class="container section"><div class="stepper" aria-label="Sorğu mərhələləri"><span class="active"><b>1</b>Məlumat</span><span><b>2</b>Qəbul</span><span><b>3</b>Əlaqə</span></div><div class="quote-layout"><form class="quote-form panel" id="quote-form" novalidate><div class="page-title"><span class="eyebrow eyebrow--blue">Təklif alın</span><h1>Qiymət sorğusu</h1><p>Məlumatlarınız sorğunun hazırlanması üçün təhlükəsiz şəkildə sistemə göndəriləcək.</p></div><div class="form-grid">${field("fullName","Ad və soyad *","text",'autocomplete="name" required')}${field("phone","Telefon *","tel",'autocomplete="tel" inputmode="tel" required')}${field("email","E-poçt","email",'autocomplete="email"')}${field("company","Şirkət adı (istəyə bağlı)","text",'autocomplete="organization"')}<div class="form-field form-field--wide"><label for="note">Qeyd</label><textarea id="note" name="note" rows="4" placeholder="Miqdar, layihə və çatdırılma ilə bağlı əlavə məlumat..."></textarea></div><div class="form-field form-field--wide"><label for="quote-attachment">Fayl əlavə et</label><input id="quote-attachment" name="attachment" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx" aria-describedby="quote-file-help"><small id="quote-file-help" class="field-help">JPG, PNG, WEBP, PDF, DOC, DOCX, XLS və XLSX — maksimum 12 MB.</small></div></div><button class="btn btn--primary" type="submit">Sorğunu göndər ${icon("arrow-right")}</button></form><aside class="order-summary quote-summary"><h2>Sorğudakı məhsullar</h2>${entries.length ? entries.map(({item,product})=>`<div class="quote-item"><span>${productArt(product.art,escapeHTML(product.name),product.imageUrl)}</span><div><strong>${escapeHTML(product.name)}</strong><small>${item.quantity} ədəd</small></div><b>${product.price==null?"Qiymət sorğusu":money(product.price*item.quantity)}</b></div>`).join("") : `<p>Qiymət sorğusu göndərmək üçün əvvəl məhsul seçin.</p>`}<dl><div class="summary-total"><dt>Məlum alt-cəm</dt><dd>${money(subtotal)}</dd></div></dl></aside></div></section>`;
  setTimeout(()=>{
    const form=qs("#quote-form");
    let submitting=false;
    form.addEventListener("submit",async (event)=>{
      event.preventDefault();
      if(submitting)return;
      const {values,errors}=validateQuote(form);
      if(Object.keys(errors).length)return;
      if(!entries.length){toast("Sorğu göndərmək üçün ən azı bir məhsul seçin.","error");return;}
      submitting=true;
      const button=qs('button[type="submit"]',form);button.disabled=true;button.setAttribute("aria-busy","true");
      const payload=new FormData(form);payload.set("items",JSON.stringify(entries.map(({item,product})=>({productId:product.id,quantity:item.quantity}))));
      try { const result=await submitQuote(payload); clearCart(); location.href=`confirmation.html?id=${encodeURIComponent(result.requestNo)}`; }
      catch(error){ submitting=false; button.disabled=false; button.removeAttribute("aria-busy"); Object.entries(error.errors||{}).forEach(([name,message])=>{if(!message||!form.elements[name])return;form.elements[name].setAttribute("aria-invalid","true");const target=qs(`#${name}-error`,form);if(target)target.textContent=message;}); toast(error.message,"error"); }
    });
  },0);
  return shell(body);
}

export async function confirmationPage() {
  await loadCatalog();
  const requestNo=params().get("id");
  const body=`<section class="confirmation container"><div class="confirmation__icon">${icon("check")}</div><h1>${requestNo?"Sorğunuz uğurla qəbul edildi":"Sorğu nömrəsi tapılmadı"}</h1>${requestNo?`<p>Sorğu nömrəsi: <strong>${escapeHTML(requestNo)}</strong></p><p>Mütəxəssisimiz sorğunu yoxlayıb sizinlə göstərdiyiniz telefon nömrəsi ilə əlaqə saxlayacaq.</p><div class="confirmation__actions"><a class="btn btn--primary" href="category.html">Məhsullara qayıt</a><a class="btn btn--secondary" href="index.html">Ana səhifə</a></div>`:`<p>Yeni qiymət sorğusu yaratmaq üçün formaya keçin.</p><a class="btn btn--primary" href="quote.html">Yeni sorğu yarat</a>`}<div class="confirmation-features"><span>${icon("shield-check")} Təhlükəsiz qəbul</span><span>${icon("phone")} Telefonla əlaqə</span><span>${icon("file-text")} Sorğu nömrəsi</span></div></section>`;
  return shell(body);
}

export async function brandsPage() {
  const catalog=await loadCatalog();
  const settings=getSettings();
  const body=`${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:"Brendlər"}])}<section class="container section"><div class="page-title"><span class="eyebrow eyebrow--blue">${escapeHTML(settings.brandsEyebrow)}</span><h1>${escapeHTML(settings.brandsTitle)}</h1><p>${escapeHTML(settings.brandsIntro)}</p></div><div class="brands-grid">${catalog.brands.map((brand)=>`<a href="category.html?brand=${brand.id}" style="--brand-tone:${brand.tone || "#0878E8"}"><div class="brand-logo">${brand.imageUrl ? `<img src="${escapeHTML(brand.imageUrl)}" alt="${escapeHTML(brand.name)}">` : escapeHTML(brand.name)}</div><span>${brand.count} məhsul</span><small>Kataloqa bax ${icon("arrow-right")}</small></a>`).join("")}</div></section>`;
  return shell(body,"brands");
}

export async function aboutPage() {
  await loadCatalog();
  const settings=getSettings();
  const body=`<section class="about-hero"><div class="container"><span class="eyebrow">${escapeHTML(settings.aboutEyebrow)}</span><h1>${escapeHTML(settings.aboutHeroTitle)}</h1><p>${escapeHTML(settings.aboutHeroText)}</p></div></section><section class="container section prose-layout"><div><h2>${escapeHTML(settings.aboutTitle)}</h2><p>${escapeHTML(settings.aboutBody1)}</p><p>${escapeHTML(settings.aboutBody2)}</p></div><aside class="fact-card"><strong>${escapeHTML(settings.aboutFact1Value)}</strong><span>${escapeHTML(settings.aboutFact1Label)}</span><hr><strong>${escapeHTML(settings.aboutFact2Value)}</strong><span>${escapeHTML(settings.aboutFact2Label)}</span><hr><strong>${escapeHTML(settings.aboutFact3Value)}</strong><span>${escapeHTML(settings.aboutFact3Label)}</span></aside></section>${benefits()}`;
  return shell(body,"about");
}

export async function contactPage() {
  await loadCatalog();
  const settings=getSettings();
  const body=`${breadcrumb([{label:"Ana səhifə",href:"index.html"},{label:settings.contactTitle}])}<section class="container section contact-layout"><div><div class="page-title"><span class="eyebrow eyebrow--blue">${escapeHTML(settings.contactEyebrow)}</span><h1>${escapeHTML(settings.contactTitle)}</h1><p>${escapeHTML(settings.contactIntro)}</p></div><div class="contact-cards"><article>${icon("map-pin")}<div><strong>Ünvan</strong><span>${escapeHTML(settings.address)}</span></div></article><article>${icon("phone")}<div><strong>Telefon</strong><span>${escapeHTML(settings.phone)}</span></div></article><article>${icon("mail")}<div><strong>E-poçt</strong><span>${escapeHTML(settings.email)}</span></div></article></div></div><form class="panel contact-form" id="contact-form" novalidate><h2>${escapeHTML(settings.contactFormTitle)}</h2>${field("fullName","Ad və soyad *","text",'required autocomplete="name"')}${field("phone","Telefon *","tel",'required autocomplete="tel" inputmode="tel"')}${field("email","E-poçt","email",'autocomplete="email"')}${field("subject","Mövzu","text",'')}<div class="form-field"><label for="message">Mesaj *</label><textarea id="message" name="message" rows="5" required aria-describedby="message-error"></textarea><span class="field-error" id="message-error"></span></div><div class="form-field"><label for="contact-attachment">Fayl əlavə et</label><input id="contact-attachment" name="attachment" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"><small class="field-help">Maksimum 12 MB.</small></div><button class="btn btn--primary btn--block" type="submit">Mesajı göndər</button></form></section>`;
  setTimeout(()=>qs("#contact-form").addEventListener("submit",async(event)=>{event.preventDefault();const form=event.currentTarget;let first;[["fullName","Adınızı daxil edin."],["phone","Telefon nömrəsini daxil edin."],["email","Düzgün e-poçt ünvanı daxil edin."],["message","Mesajınızı daxil edin."]].forEach(([name,message])=>{const el=form.elements[name];const invalid=(name!=="email"&&!el.value.trim())||(name==="email"&&el.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value));el.toggleAttribute("aria-invalid",invalid);const target=qs(`#${name}-error`);if(target)target.textContent=invalid?message:"";if(invalid&&!first)first=el;});if(first){first.focus();return;}const button=qs('button[type="submit"]',form);button.disabled=true;button.setAttribute("aria-busy","true");try{const result=await submitContact(new FormData(form));form.reset();toast(result.message);}catch(error){toast(error.message,"error");}finally{button.disabled=false;button.removeAttribute("aria-busy");}}),0);
  return shell(body,"contact");
}

export async function renderPublic(page) {
  const handlers={home:homePage,category:categoryPage,product:productPage,search:searchPage,cart:cartPage,quote:quotePage,confirmation:confirmationPage,brands:brandsPage,about:aboutPage,contact:contactPage};
  const html=await (handlers[page]||handlers.home)();
  qs("#app").innerHTML=html;
  bindGlobalUI();
  initIcons();
  if(!contentSyncBound){
    window.addEventListener("storage",(event)=>{if(event.key==="azmt.site.updated")location.reload();});
    contentSyncBound=true;
  }
}
