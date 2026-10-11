import { api, setCsrf } from "./api.js?v=20261011d";
import { logo, icon, productArt, money, escapeHTML, qs, qsa, initIcons, toast, openModal } from "./ui.js?v=20261011d";

const sections = [
  ["dashboard","layout-dashboard","İcmal"],["products","package","Məhsullar"],["categories","layers-3","Kateqoriyalar"],
  ["brands","badge","Brendlər"],["quotes","file-text","Qiymət sorğuları"],["contacts","mail","Əlaqə mesajları"],
  ["settings","settings","Sayt və footer"],["users","users","Adminlər"]
];
let state = { user: null, stats: {}, recentQuotes: [], catalog: { products: [], categories: [], brands: [] }, settings: {} };

const currentSection = () => location.hash.slice(1) || "dashboard";
const categoryName = (id) => state.catalog.categories.find((item) => item.id === String(id))?.name || "—";
const brandName = (id) => id ? state.catalog.brands.find((item) => item.id === String(id))?.name || "—" : "Brendsiz";
const statusLabel = (value) => ({ active:"Aktiv",inactive:"Deaktiv",new:"Yeni",reviewing:"Baxılır",quoted:"Təklif verildi",read:"Oxundu",replied:"Cavablandı",closed:"Bağlandı",cancelled:"Ləğv edildi" })[value] || value;

function loginScreen() {
  return `<main id="main" class="admin-login"><section class="admin-login__card">${logo()}<div><span class="eyebrow eyebrow--blue">İdarəetmə</span><h1>Admin panelə giriş</h1><p>Kataloq və müraciətləri idarə etmək üçün daxil olun.</p></div><form id="admin-login-form" novalidate><div class="form-field"><label for="login-username">İstifadəçi adı</label><input id="login-username" name="username" autocomplete="username" required aria-describedby="login-username-error"><span class="field-error" id="login-username-error"></span></div><div class="form-field password-field"><label for="login-password">Şifrə</label><div><input id="login-password" name="password" type="password" autocomplete="current-password" required aria-describedby="login-password-error"><button class="icon-btn password-toggle" type="button" aria-label="Şifrəni göstər">${icon("eye")}</button></div><span class="field-error" id="login-password-error"></span></div><button class="btn btn--primary btn--block" type="submit">Daxil ol</button><p class="login-error" role="alert"></p></form><a href="index.html">${icon("arrow-left")} Sayta qayıt</a></section><div class="toast-region" aria-live="polite"></div></main>`;
}

function adminShell() {
  return `<div class="admin-shell"><aside class="admin-sidebar">${logo(true,state.settings)}<span class="admin-user-label">${escapeHTML(state.user.fullName)}</span><nav aria-label="Admin naviqasiyası">${sections.filter(([id])=>id!=="users"||state.user.role==="super_admin").map(([id,ico,label])=>`<a href="#${id}" data-admin-nav="${id}">${icon(ico)}<span>${label}</span></a>`).join("")}</nav><a class="admin-back" href="index.html">${icon("arrow-left")} Sayta qayıt</a></aside><main id="main" class="admin-main"><header class="admin-topbar"><div><button class="icon-btn admin-menu" type="button" aria-label="Admin menyusunu aç">${icon("menu")}</button><span>${escapeHTML(state.settings.siteName||"AZ Milli Təchizat")}</span></div><div><span>${escapeHTML(state.user.username)}</span><button class="btn btn--secondary btn--sm" type="button" data-logout>Çıxış</button></div></header><div class="admin-content" id="admin-content"></div></main></div><div class="toast-region" aria-live="polite" aria-atomic="true"></div><div id="modal-root"></div>`;
}

function pageHead(kicker, title, action = "") { return `<div class="admin-page-head"><div><span class="eyebrow eyebrow--blue">${kicker}</span><h1>${title}</h1></div>${action}</div>`; }
function badge(status) { return `<span class="status status--${["active","closed","quoted","replied"].includes(status)?"success":["inactive","cancelled"].includes(status)?"danger":"info"}">${escapeHTML(statusLabel(status))}</span>`; }

function dashboardView() {
  return `${pageHead("İdarəetmə","İcmal")}<div class="stats-grid"><article>${icon("package")}<div><span>Məhsullar</span><strong>${state.stats.products||0}</strong><small>${state.catalog.products.filter((p)=>p.stock<10).length} məhsul az stokda</small></div></article><article>${icon("file-text")}<div><span>Yeni sorğular</span><strong>${state.stats.newQuotes||0}</strong><small>Qiymət təklifləri</small></div></article><article>${icon("mail")}<div><span>Yeni mesajlar</span><strong>${state.stats.newMessages||0}</strong><small>Əlaqə forması</small></div></article><article>${icon("layers-3")}<div><span>Kateqoriyalar</span><strong>${state.stats.categories||0}</strong><small>${state.stats.brands||0} brend</small></div></article></div><div class="admin-dashboard-grid"><section class="admin-card"><h2>Son sorğular</h2>${state.recentQuotes.length?`<div class="table-wrap"><table><thead><tr><th>Nömrə</th><th>Müştəri</th><th>Telefon</th><th>Status</th></tr></thead><tbody>${state.recentQuotes.map((r)=>`<tr><td>${escapeHTML(r.requestNo)}</td><td>${escapeHTML(r.fullName)}</td><td>${escapeHTML(r.phone)}</td><td>${badge(r.status)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="admin-empty">Hələ sorğu yoxdur.</p>`}</section><section class="admin-card"><h2>Stok xəbərdarlığı</h2><ul class="stock-list">${state.catalog.products.filter((p)=>p.stock<10).slice(0,6).map((p)=>`<li><span>${productArt(p.art,p.name,p.imageUrl)}</span><div><strong>${escapeHTML(p.name)}</strong><small>${p.stock} ədəd</small></div></li>`).join("")||"<li>Stok xəbərdarlığı yoxdur.</li>"}</ul></section></div>`;
}

function productRows(items) {
  return items.map((p)=>`<tr><td><div class="admin-product-cell"><span>${productArt(p.art,p.name,p.imageUrl)}</span><strong>${escapeHTML(p.name)}</strong></div></td><td>${escapeHTML(categoryName(p.categoryId))}</td><td>${escapeHTML(brandName(p.brandId))}</td><td>${p.price==null?"Sorğu ilə":money(p.price)}</td><td>${p.stock}</td><td>${badge(p.status)}</td><td><div class="row-actions"><button class="icon-btn" type="button" data-edit-product="${p.id}" aria-label="Redaktə et">${icon("pencil")}</button><button class="icon-btn icon-btn--danger" type="button" data-delete="product:${p.id}" aria-label="Arxivləşdir">${icon("trash-2")}</button></div></td></tr>`).join("");
}

function productsView() {
  return `${pageHead("Kataloq","Məhsullar",`<button class="btn btn--primary" type="button" data-new-product onclick="return true">${icon("plus")} Yeni məhsul</button>`)}<div class="admin-toolbar"><div class="admin-search">${icon("search")}<label class="sr-only" for="admin-search">Məhsul axtar</label><input id="admin-search" type="search" placeholder="Məhsul axtar..."></div><label>Kateqoriya<select id="admin-filter"><option value="">Hamısı</option>${state.catalog.categories.map((c)=>`<option value="${c.id}">${escapeHTML(c.name)}</option>`).join("")}</select></label></div><section class="admin-card table-wrap"><table class="admin-table"><thead><tr><th>Məhsul</th><th>Kateqoriya</th><th>Brend</th><th>Qiymət</th><th>Stok</th><th>Status</th><th>Əməliyyat</th></tr></thead><tbody id="product-table">${productRows(state.catalog.products)}</tbody></table><div class="table-empty" hidden>Nəticə yoxdur.</div></section>`;
}

function simpleView(type) {
  const isCategory=type==="category", items=isCategory?state.catalog.categories:state.catalog.brands;
  return `${pageHead("Kataloq",isCategory?"Kateqoriyalar":"Brendlər",`<button class="btn btn--primary" type="button" data-new-simple="${type}" onclick="return true">${icon("plus")} Yeni ${isCategory?"kateqoriya":"brend"}</button>`)}<div class="admin-card simple-grid">${items.map((item)=>`<article><div class="simple-icon">${isCategory?productArt(item.icon,item.name,item.imageUrl):(item.imageUrl?`<img class="product-photo" src="${escapeHTML(item.imageUrl)}" alt="${escapeHTML(item.name)}">`:`<div class="admin-brand-name" style="color:${escapeHTML(item.tone||"#0878E8")}">${escapeHTML(item.name)}</div>`)}</div><div><strong>${escapeHTML(item.name)}</strong><span>${item.count??state.catalog.products.filter((p)=>p.categoryId===item.id).length} məhsul</span><small>${escapeHTML(item.description||"")}</small></div><div class="row-actions"><button class="icon-btn" type="button" data-edit-simple="${type}:${item.id}" onclick="return true" aria-label="Redaktə et">${icon("pencil")}</button><button class="icon-btn icon-btn--danger" type="button" data-delete="${type}:${item.id}" onclick="return true" aria-label="Arxivləşdir">${icon("trash-2")}</button></div></article>`).join("")||`<p class="admin-empty">Məlumat yoxdur.</p>`}</div>`;
}

async function requestsView(type) {
  const isQuote=type==="quotes"; const result=await api(isQuote?"admin.quotes":"admin.contacts");
  const statuses=isQuote?["new","reviewing","quoted","closed","cancelled"]:["new","read","replied","closed"];
  return `${pageHead("Müraciətlər",isQuote?"Qiymət sorğuları":"Əlaqə mesajları")}<section class="admin-card table-wrap"><table class="admin-table"><thead><tr>${isQuote?"<th>Nömrə</th>":""}<th>Ad</th><th>Telefon</th><th>${isQuote?"Şirkət":"Mövzu"}</th><th>Tarix</th><th>Status</th></tr></thead><tbody>${result.items.map((item)=>`<tr>${isQuote?`<td><strong>${escapeHTML(item.requestNo)}</strong></td>`:""}<td>${escapeHTML(item.fullName)}<small>${escapeHTML(item.email||"")}</small></td><td>${escapeHTML(item.phone)}</td><td>${escapeHTML((isQuote?item.company:item.subject)||"—")}</td><td>${new Date(item.createdAt).toLocaleDateString("az-AZ")}</td><td><select data-request-status="${type}:${item.id}" aria-label="Status">${statuses.map((status)=>`<option value="${status}" ${status===item.status?"selected":""}>${statusLabel(status)}</option>`).join("")}</select></td></tr><tr class="request-detail"><td colspan="${isQuote?6:5}">${escapeHTML((isQuote?item.note:item.message)||"Qeyd yoxdur")}</td></tr>`).join("")||`<tr><td colspan="6" class="admin-empty">Müraciət yoxdur.</td></tr>`}</tbody></table></section>`;
}

function settingsView() {
  const s=state.settings;
  const textField=(id,name,label,value,type="text")=>`<div class="form-field"><label for="${id}">${label}</label><input id="${id}" name="${name}" type="${type}" value="${escapeHTML(value||"")}"></div>`;
  const wideField=(id,name,label,value,type="text")=>`<div class="form-field form-field--wide"><label for="${id}">${label}</label><input id="${id}" name="${name}" type="${type}" value="${escapeHTML(value||"")}"></div>`;
  const area=(id,name,label,value,rows=3)=>`<div class="form-field form-field--wide"><label for="${id}">${label}</label><textarea id="${id}" name="${name}" rows="${rows}">${escapeHTML(value||"")}</textarea></div>`;
  return `${pageHead("Sayt məlumatları","Bütün sayt məzmunu")}<form class="admin-card settings-form" id="settings-form" novalidate>
    <section class="settings-section"><div class="settings-section__head"><h2>Brend və loqo</h2><p>Başlıq, loqo və saytın üst məlumatları.</p></div><div class="form-grid">${wideField("s-site-name","siteName","Sayt adı",s.siteName)}${wideField("s-site-tagline","siteTagline","Loqo alt mətni",s.siteTagline)}${wideField("s-logo-alt","logoAlt","Loqo alternativ mətni",s.logoAlt)}${imageEditor(s.logoUrl||"",{id:"site-logo",label:"Sayt loqosu",width:960,height:320,hint:"Loqo header və footerdə bu nisbətdə görünəcək."})}<input type="hidden" name="logoUrl" value="${escapeHTML(s.logoUrl||"")}"><label class="checkbox-line form-field--wide"><input type="checkbox" name="removeLogo"><span>Yüklənmiş loqonu sil və standart yazılı loqoya qayıt</span></label>${textField("s-topbar-left","topbarLeft","Üst panel — sol",s.topbarLeft)}${textField("s-topbar-right","topbarRight","Üst panel — sağ",s.topbarRight)}${wideField("s-search-placeholder","searchPlaceholder","Axtarış sahəsinin nümunə mətni",s.searchPlaceholder)}</div></section>
    <section class="settings-section"><div class="settings-section__head"><h2>Əlaqə məlumatları</h2><p>Əlaqə səhifəsi və footerdə istifadə olunur.</p></div><div class="form-grid">${textField("s-phone","phone","Telefon",s.phone)}${textField("s-email","email","E-poçt",s.email,"email")}${wideField("s-address","address","Ünvan",s.address)}${textField("s-whatsapp","whatsapp","WhatsApp",s.whatsapp)}</div></section>
    <section class="settings-section"><div class="settings-section__head"><h2>Ana səhifə</h2><p>Hero, bölmə başlıqları və üstünlüklər.</p></div><div class="form-grid">${wideField("s-hero-eyebrow","heroEyebrow","Hero üst başlığı",s.heroEyebrow)}${wideField("s-title","heroTitle","Ana səhifə başlığı",s.heroTitle)}${area("s-text","heroText","Ana səhifə mətni",s.heroText)}${textField("s-categories-title","homeCategoriesTitle","Kateqoriyalar bölməsi",s.homeCategoriesTitle)}${textField("s-products-title","homeProductsTitle","Məhsullar bölməsi",s.homeProductsTitle)}${textField("s-brands-home-title","homeBrandsTitle","Brendlər bölməsi",s.homeBrandsTitle)}${textField("s-benefit1-title","benefit1Title","Üstünlük 1 — başlıq",s.benefit1Title)}${textField("s-benefit1-text","benefit1Text","Üstünlük 1 — mətn",s.benefit1Text)}${textField("s-benefit2-title","benefit2Title","Üstünlük 2 — başlıq",s.benefit2Title)}${textField("s-benefit2-text","benefit2Text","Üstünlük 2 — mətn",s.benefit2Text)}${textField("s-benefit3-title","benefit3Title","Üstünlük 3 — başlıq",s.benefit3Title)}${textField("s-benefit3-text","benefit3Text","Üstünlük 3 — mətn",s.benefit3Text)}${textField("s-benefit4-title","benefit4Title","Üstünlük 4 — başlıq",s.benefit4Title)}${textField("s-benefit4-text","benefit4Text","Üstünlük 4 — mətn",s.benefit4Text)}</div></section>
    <section class="settings-section"><div class="settings-section__head"><h2>Haqqımızda səhifəsi</h2><p>Başlıq, mətnlər və sağdakı qısa faktlar.</p></div><div class="form-grid">${wideField("s-about-eyebrow","aboutEyebrow","Üst başlıq",s.aboutEyebrow)}${wideField("s-about-hero-title","aboutHeroTitle","Hero başlığı",s.aboutHeroTitle)}${area("s-about-hero-text","aboutHeroText","Hero mətni",s.aboutHeroText)}${wideField("s-about-title","aboutTitle","Məzmun başlığı",s.aboutTitle)}${area("s-about-body1","aboutBody1","Birinci abzas",s.aboutBody1,4)}${area("s-about-body2","aboutBody2","İkinci abzas",s.aboutBody2,4)}${textField("s-fact1-value","aboutFact1Value","Fakt 1 — dəyər",s.aboutFact1Value)}${textField("s-fact1-label","aboutFact1Label","Fakt 1 — izah",s.aboutFact1Label)}${textField("s-fact2-value","aboutFact2Value","Fakt 2 — dəyər",s.aboutFact2Value)}${textField("s-fact2-label","aboutFact2Label","Fakt 2 — izah",s.aboutFact2Label)}${textField("s-fact3-value","aboutFact3Value","Fakt 3 — dəyər",s.aboutFact3Value)}${textField("s-fact3-label","aboutFact3Label","Fakt 3 — izah",s.aboutFact3Label)}</div></section>
    <section class="settings-section"><div class="settings-section__head"><h2>Brendlər və Əlaqə səhifələri</h2><p>Səhifə giriş mətnləri və forma başlığı.</p></div><div class="form-grid">${textField("s-brands-eyebrow","brandsEyebrow","Brendlər — üst başlıq",s.brandsEyebrow)}${textField("s-brands-title","brandsTitle","Brendlər — başlıq",s.brandsTitle)}${area("s-brands-intro","brandsIntro","Brendlər — giriş mətni",s.brandsIntro)}${textField("s-contact-eyebrow","contactEyebrow","Əlaqə — üst başlıq",s.contactEyebrow)}${textField("s-contact-title","contactTitle","Əlaqə — başlıq",s.contactTitle)}${area("s-contact-intro","contactIntro","Əlaqə — giriş mətni",s.contactIntro)}${wideField("s-contact-form-title","contactFormTitle","Əlaqə forması başlığı",s.contactFormTitle)}</div></section>
    <section class="settings-section"><div class="settings-section__head"><h2>Footer</h2><p>Aşağı hissənin mətni və keçidləri.</p></div><div class="form-grid">${area("s-footer","footerDescription","Footer təsviri",s.footerDescription)}${wideField("s-copyright","footerCopyright","Copyright mətni",s.footerCopyright)}<div class="form-field form-field--wide"><label for="s-links">Footer keçidləri</label><textarea id="s-links" name="footerLinks" rows="7" placeholder="Qrup | Başlıq | URL">${(state.footerLinks||[]).map((l)=>`${l.groupName} | ${l.label} | ${l.url}`).join("\n")}</textarea><small class="field-help">Hər sətir: Qrup | Başlıq | URL</small></div></div></section>
    <div class="settings-actions"><button class="btn btn--primary" type="submit">Bütün dəyişiklikləri saxla</button><span class="field-help" role="status">Saxlanıldıqdan sonra açıq frontend səhifələri avtomatik yenilənir.</span></div>
  </form>`;
}

async function usersView() {
  const result=await api("admin.users");
  return `${pageHead("Təhlükəsizlik","Admin istifadəçiləri",`<button class="btn btn--primary" type="button" data-new-user onclick="return true">${icon("plus")} Yeni admin</button>`)}<section class="admin-card table-wrap"><table><thead><tr><th>Ad</th><th>İstifadəçi adı</th><th>Rol</th><th>Status</th><th>Son giriş</th></tr></thead><tbody>${result.items.map((u)=>`<tr><td>${escapeHTML(u.fullName)}</td><td>${escapeHTML(u.username)}</td><td>${u.role==="super_admin"?"Baş admin":"Admin"}</td><td>${badge(u.status)}</td><td>${u.lastLoginAt?new Date(u.lastLoginAt).toLocaleString("az-AZ"):"—"}</td></tr>`).join("")}</tbody></table></section>`;
}

function imageEditor(existingUrl="",options={}) {
  const id=options.id||"entity-image",label=options.label||"Şəkil",width=options.width||640,height=options.height||480,hint=options.hint||"Bu çərçivə saytdakı məhsul/kateqoriya kartının görünüş nisbətini göstərir.";
  return `<div class="form-field form-field--wide image-editor" data-image-editor><label for="${id}">${escapeHTML(label)}</label><input id="${id}" type="file" accept="image/jpeg,image/png,image/webp"><small class="field-help">JPG, JPEG, PNG və WEBP; maksimum 8 MB.</small><div class="image-editor__stage" style="--editor-aspect:${width}/${height}"><canvas width="${width}" height="${height}" aria-label="Şəklin saytda görünüş önizləməsi"></canvas><span class="image-editor__empty" ${existingUrl?"hidden":""}>Şəkil seçin</span></div><div class="image-editor__controls"><label>Yaxınlaşdır <input type="range" min="1" max="3" step="0.05" value="1" data-zoom></label><button class="btn btn--secondary btn--sm" type="button" data-rotate>${icon("rotate-cw")} 90° döndər</button></div><p class="field-help">${escapeHTML(hint)}</p><input type="hidden" name="existingImage" value="${escapeHTML(existingUrl)}"></div>`;
}

function setupImageEditor(root, existingUrl="") {
  const wrap=qs("[data-image-editor]",root); if(!wrap)return null;
  const canvas=qs("canvas",wrap),ctx=canvas.getContext("2d"),input=qs('input[type="file"]',wrap),zoom=qs("[data-zoom]",wrap),empty=qs(".image-editor__empty",wrap);
  const editor={ canvas,image:null,rotation:0,changed:false,draw(){ctx.clearRect(0,0,canvas.width,canvas.height);if(!this.image)return;const rad=this.rotation*Math.PI/180,sw=this.rotation%180?this.image.height:this.image.width,sh=this.rotation%180?this.image.width:this.image.height,scale=Math.max(canvas.width/sw,canvas.height/sh)*Number(zoom.value);ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(rad);ctx.drawImage(this.image,-this.image.width*scale/2,-this.image.height*scale/2,this.image.width*scale,this.image.height*scale);ctx.restore();empty.hidden=true;}};
  const load=(src,changed=false)=>{const image=new Image();image.onload=()=>{editor.image=image;editor.changed=changed;editor.draw();};image.src=src;};
  if(existingUrl)load(existingUrl);
  input.addEventListener("change",()=>{const file=input.files[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024){toast("Şəkil JPG, PNG və ya WEBP olmalı, 8 MB-dan böyük olmamalıdır.","error");input.value="";return;}load(URL.createObjectURL(file),true);});
  zoom.addEventListener("input",()=>editor.draw());qs("[data-rotate]",wrap).addEventListener("click",()=>{editor.rotation=(editor.rotation+90)%360;editor.changed=true;editor.draw();});
  return editor;
}

async function uploadEditedImage(editor, alt) {
  if(!editor?.changed||!editor.image)return null;
  editor.draw();
  const fileBlob=await new Promise((resolve)=>editor.canvas.toBlob(resolve,"image/webp",0.9));
  const form=new FormData();form.append("image",fileBlob,"image.webp");form.append("alt",alt||"");
  const result=await api("admin.media.upload",{method:"POST",body:form});return result.media;
}

function productForm(product={}) {
  return `<form id="entity-form" class="modal-form" novalidate><div class="form-grid"><div class="form-field form-field--wide"><label for="p-name">Məhsul adı *</label><input id="p-name" name="name" value="${escapeHTML(product.name||"")}" required><span class="field-error" id="p-name-error"></span></div><div class="form-field"><label for="p-category">Kateqoriya *</label><select id="p-category" name="categoryId"><option value="">Seçin</option>${state.catalog.categories.map((c)=>`<option value="${c.id}" ${String(product.categoryId)===c.id?"selected":""}>${escapeHTML(c.name)}</option>`).join("")}</select></div><div class="form-field"><label for="p-brand">Brend (istəyə bağlı)</label><select id="p-brand" name="brandId"><option value="">Brendsiz</option>${state.catalog.brands.map((b)=>`<option value="${b.id}" ${String(product.brandId)===b.id?"selected":""}>${escapeHTML(b.name)}</option>`).join("")}</select></div><div class="form-field"><label for="p-sku">SKU</label><input id="p-sku" name="sku" value="${escapeHTML(product.sku||"")}"></div><div class="form-field"><label for="p-mode">Qiymət rejimi</label><select id="p-mode" name="priceMode"><option value="FIXED_PRICE" ${product.priceMode==="FIXED_PRICE"?"selected":""}>Sabit qiymət</option><option value="REQUEST_ONLY" ${product.priceMode==="REQUEST_ONLY"?"selected":""}>Yalnız sorğu</option><option value="HYBRID" ${product.priceMode==="HYBRID"?"selected":""}>Hibrid</option></select></div><div class="form-field"><label for="p-price">Qiymət (AZN)</label><input id="p-price" name="price" type="number" min="0" step="0.01" value="${product.price??""}"></div><div class="form-field"><label for="p-stock">Stok</label><input id="p-stock" name="stock" type="number" min="0" value="${product.stock??0}"></div><div class="form-field"><label for="p-status">Status</label><select id="p-status" name="status"><option value="active">Aktiv</option><option value="inactive" ${product.status==="inactive"?"selected":""}>Deaktiv</option></select></div><div class="form-field"><label for="p-material">Material</label><input id="p-material" name="material" value="${escapeHTML(product.material||"")}"></div><div class="form-field"><label for="p-color">Rəng</label><input id="p-color" name="color" value="${escapeHTML(product.color||"")}"></div><div class="form-field form-field--wide"><label for="p-description">Təsvir</label><textarea id="p-description" name="description" rows="4">${escapeHTML(product.description||"")}</textarea></div><div class="form-field form-field--wide"><label for="p-specs">Xüsusiyyətlər</label><textarea id="p-specs" name="specs" rows="5" placeholder="Açar: Dəyər">${Object.entries(product.specs||{}).map(([k,v])=>`${k}: ${v}`).join("\n")}</textarea><small class="field-help">Hər sətir: Xüsusiyyət: Dəyər</small></div><div class="form-field form-field--wide"><label for="p-variants">Variantlar</label><input id="p-variants" name="variants" value="${escapeHTML((product.variants||[]).join(", "))}" placeholder="Xrom, Mat qara"></div><label class="checkbox-line"><input type="checkbox" name="featured" ${product.featured?"checked":""}><span>Ana səhifədə seçilmiş məhsul kimi göstər</span></label>${imageEditor(product.imageUrl||"")}</div></form>`;
}

function simpleForm(type,item={}) {
  const isCategory=type==="category";
  return `<form id="entity-form" class="modal-form" novalidate><div class="form-grid"><div class="form-field form-field--wide"><label for="e-name">${isCategory?"Kateqoriya":"Brend"} adı *</label><input id="e-name" name="name" value="${escapeHTML(item.name||"")}" required></div><div class="form-field form-field--wide"><label for="e-description">Təsvir</label><textarea id="e-description" name="description">${escapeHTML(item.description||"")}</textarea></div>${isCategory?`<div class="form-field"><label for="e-icon">Vizual tip</label><select id="e-icon" name="icon">${["faucet","shower","toilet","pipe","fittings","heater","accessory"].map((v)=>`<option value="${v}" ${item.icon===v?"selected":""}>${v}</option>`).join("")}</select></div>`:`<div class="form-field"><label for="e-tone">Brend rəngi</label><input id="e-tone" name="tone" type="color" value="${escapeHTML(item.tone||"#0878E8")}"></div><div class="form-field form-field--wide"><label for="e-web">Vebsayt</label><input id="e-web" name="websiteUrl" type="url" value="${escapeHTML(item.websiteUrl||"")}"></div>`}<div class="form-field"><label for="e-sort">Sıra</label><input id="e-sort" name="sortOrder" type="number" value="${item.sortOrder||0}"></div><div class="form-field"><label for="e-status">Status</label><select id="e-status" name="status"><option value="active">Aktiv</option><option value="inactive" ${item.status==="inactive"?"selected":""}>Deaktiv</option></select></div>${imageEditor(item.imageUrl||"")}</div></form>`;
}

function formObject(form) { return Object.fromEntries(new FormData(form).entries()); }
function parseSpecs(value) { return value.split("\n").map((line)=>{const at=line.indexOf(":");return at>0?{label:line.slice(0,at).trim(),value:line.slice(at+1).trim()}:null;}).filter(Boolean); }

async function reloadState() { const result=await api("admin.bootstrap"); state={...state,...result}; }

function openProduct(product=null) {
  const dialog=openModal({title:product?"Məhsulu redaktə et":"Yeni məhsul",body:productForm(product||{}),confirmLabel:"Yadda saxla",onConfirm:async(modal,close)=>{const form=qs("#entity-form",modal),data=formObject(form);if(!data.name.trim()||!data.categoryId){toast("Məhsul adı və kateqoriya məcburidir.","error");return false;}const editor=modal._imageEditor;try{const media=await uploadEditedImage(editor,data.name);const payload={...data,id:product?.id||undefined,brandId:data.brandId||null,featured:form.elements.featured.checked,specs:parseSpecs(data.specs||""),variants:(data.variants||"").split(",").map((v)=>v.trim()).filter(Boolean),imageMediaId:media?.id};await api("admin.products",{method:product?"PUT":"POST",body:payload});await reloadState();close();await renderSection();toast(product?"Məhsul yeniləndi.":"Məhsul yaradıldı.");}catch(error){toast(error.message,"error");}return false;}});dialog.modal._imageEditor=setupImageEditor(dialog.modal,product?.imageUrl||"");
}

function openSimple(type,item=null) {
  const label=type==="category"?"Kateqoriya":"Brend",route=type==="category"?"admin.categories":"admin.brands";
  const dialog=openModal({title:item?`${label} redaktəsi`:`Yeni ${label.toLocaleLowerCase("az-AZ")}`,body:simpleForm(type,item||{}),confirmLabel:"Yadda saxla",onConfirm:async(modal,close)=>{const form=qs("#entity-form",modal),data=formObject(form);if(!data.name.trim()){toast(`${label} adı məcburidir.`,"error");return false;}try{const media=await uploadEditedImage(modal._imageEditor,data.name);await api(route,{method:item?"PUT":"POST",body:{...data,id:item?.id||undefined,imageMediaId:media?.id}});await reloadState();close();await renderSection();toast(`${label} saxlanıldı.`);}catch(error){toast(error.message,"error");}return false;}});dialog.modal._imageEditor=setupImageEditor(dialog.modal,item?.imageUrl||"");
}

function confirmArchive(type,id) {
  const names={product:"məhsulu",category:"kateqoriyanı",brand:"brendi"};
  openModal({title:"Arxivləşdirməni təsdiqləyin",body:`<p>Bu ${names[type]} arxivləşdirmək istəyirsiniz? Məlumat bərpa üçün verilənlər bazasında saxlanacaq.</p>`,confirmLabel:"Arxivləşdir",tone:"danger",onConfirm:async(modal,close)=>{try{await api(`admin.${type==="product"?"products":type==="category"?"categories":"brands"}`,{method:"DELETE",body:{id}});await reloadState();close();await renderSection();toast("Məlumat arxivləşdirildi.");}catch(error){toast(error.message,"error");}return false;}});
}

function openUser() {
  const body=`<form id="entity-form" novalidate><div class="form-grid"><div class="form-field form-field--wide"><label for="u-name">Ad və soyad</label><input id="u-name" name="fullName" required></div><div class="form-field"><label for="u-username">İstifadəçi adı</label><input id="u-username" name="username" autocomplete="off" required></div><div class="form-field"><label for="u-role">Rol</label><select id="u-role" name="role"><option value="admin">Admin</option><option value="super_admin">Baş admin</option></select></div><div class="form-field form-field--wide"><label for="u-password">Şifrə</label><input id="u-password" name="password" type="password" minlength="10" required><small class="field-help">Ən azı 10 simvol.</small></div></div></form>`;
  openModal({title:"Yeni admin",body,confirmLabel:"Yarat",onConfirm:async(modal,close)=>{const data=formObject(qs("#entity-form",modal));try{await api("admin.users",{method:"POST",body:data});close();await renderSection();toast("Admin yaradıldı.");}catch(error){toast(error.message,"error");}return false;}});
}

async function renderSection() {
  const section=currentSection(); const content=qs("#admin-content");
  qsa("[data-admin-nav]").forEach((a)=>a.classList.toggle("active",a.dataset.adminNav===section));
  content.innerHTML=`<div class="admin-loading">${icon("loader-circle")} Məlumat yüklənir...</div>`;initIcons();
  try {
    if(section==="dashboard")content.innerHTML=dashboardView();
    else if(section==="products")content.innerHTML=productsView();
    else if(section==="categories")content.innerHTML=simpleView("category");
    else if(section==="brands")content.innerHTML=simpleView("brand");
    else if(section==="quotes"||section==="contacts")content.innerHTML=await requestsView(section);
    else if(section==="settings"){const result=await api("admin.settings");state.settings=result.settings;state.footerLinks=result.footerLinks;content.innerHTML=settingsView();}
    else if(section==="users"&&state.user.role==="super_admin")content.innerHTML=await usersView();
    else content.innerHTML=dashboardView();
    bindSection();initIcons();
  } catch(error){if(error.status===401){location.reload();return;}content.innerHTML=`<div class="admin-error"><h2>Məlumat yüklənmədi</h2><p>${escapeHTML(error.message)}</p><button class="btn btn--secondary" type="button" data-retry>Yenidən cəhd et</button></div>`;qs("[data-retry]")?.addEventListener("click",renderSection);}
}

function bindSection() {
  const run=(action)=>{try{action();}catch(error){console.error(error);toast(error.message||"Əməliyyat açılmadı.","error");}};
  qs("#admin-content").onclick=(event)=>{
    const newProduct=event.target.closest("[data-new-product]");if(newProduct){run(()=>openProduct());return;}
    const editProduct=event.target.closest("[data-edit-product]");if(editProduct){run(()=>openProduct(state.catalog.products.find((p)=>p.id===editProduct.dataset.editProduct)));return;}
    const newSimple=event.target.closest("[data-new-simple]");if(newSimple){run(()=>openSimple(newSimple.dataset.newSimple));return;}
    const editSimple=event.target.closest("[data-edit-simple]");if(editSimple){run(()=>{const[type,id]=editSimple.dataset.editSimple.split(":");const list=type==="category"?state.catalog.categories:state.catalog.brands;openSimple(type,list.find((i)=>i.id===id));});return;}
    const remove=event.target.closest("[data-delete]");if(remove){run(()=>{const[type,id]=remove.dataset.delete.split(":");confirmArchive(type,id);});return;}
    if(event.target.closest("[data-new-user]"))run(openUser);
  };
  qsa("[data-request-status]").forEach((select)=>select.addEventListener("change",async()=>{const[type,id]=select.dataset.requestStatus.split(":");try{await api(type==="quotes"?"admin.quotes":"admin.contacts",{method:"PUT",body:{id,status:select.value}});toast("Status yeniləndi.");}catch(error){toast(error.message,"error");}}));
  const search=qs("#admin-search"),filter=qs("#admin-filter");const apply=()=>{const q=(search?.value||"").toLocaleLowerCase("az-AZ"),category=filter?.value||"";const items=state.catalog.products.filter((p)=>(!q||[p.name,p.sku,p.brandName].join(" ").toLocaleLowerCase("az-AZ").includes(q))&&(!category||p.categoryId===category));qs("#product-table").innerHTML=productRows(items);qs(".table-empty").hidden=items.length>0;initIcons();};search?.addEventListener("input",apply);filter?.addEventListener("change",apply);
  const settingsForm=qs("#settings-form");
  if(settingsForm){
    settingsForm._logoEditor=setupImageEditor(settingsForm,state.settings.logoUrl||"");
    settingsForm.addEventListener("submit",async(event)=>{
      event.preventDefault();
      const form=event.currentTarget,data=formObject(form);
      data.footerLinks=(data.footerLinks||"").split("\n").map((line)=>{const[groupName,label,url]=line.split("|").map((v)=>v.trim());return{groupName,label,url};}).filter((l)=>l.groupName&&l.label&&l.url);
      const button=qs('button[type="submit"]',form);button.disabled=true;button.setAttribute("aria-busy","true");
      try{
        const media=await uploadEditedImage(form._logoEditor,data.siteName||"Sayt loqosu");
        if(media?.url)data.logoUrl=media.url;
        if(form.elements.removeLogo.checked)data.logoUrl="";
        delete data.removeLogo;
        const result=await api("admin.settings",{method:"PUT",body:data});
        state.footerLinks=data.footerLinks;
        const {footerLinks,...settings}=data;state.settings={...state.settings,...settings};
        try{localStorage.setItem("azmt.site.updated",String(Date.now()));}catch{}
        toast(result.message);
      }catch(error){toast(error.message,"error");}
      finally{button.disabled=false;button.removeAttribute("aria-busy");}
    });
  }
}

function bindShell() {
  qs(".admin-menu")?.addEventListener("click",()=>qs(".admin-sidebar").classList.toggle("is-open"));
  qsa("[data-admin-nav]").forEach((a)=>a.addEventListener("click",()=>qs(".admin-sidebar").classList.remove("is-open")));
  qs("[data-logout]")?.addEventListener("click",async()=>{try{await api("auth.logout",{method:"POST",body:{}});}finally{location.reload();}});
  window.addEventListener("hashchange",renderSection);
}

function bindLogin() {
  const form=qs("#admin-login-form"),password=qs("#login-password"),toggle=qs(".password-toggle");
  toggle.addEventListener("click",()=>{const visible=password.type==="text";password.type=visible?"password":"text";toggle.setAttribute("aria-label",visible?"Şifrəni göstər":"Şifrəni gizlət");});
  form.addEventListener("submit",async(event)=>{event.preventDefault();const data=formObject(form),button=qs('button[type="submit"]',form),error=qs(".login-error");error.textContent="";if(!data.username.trim()||!data.password){error.textContent="İstifadəçi adı və şifrəni daxil edin.";return;}button.disabled=true;button.setAttribute("aria-busy","true");try{const result=await api("auth.login",{method:"POST",body:data});setCsrf(result.csrf);state.user=result.user;await startAdmin();}catch(err){error.textContent=err.message;password.focus();}finally{button.disabled=false;button.removeAttribute("aria-busy");}});
}

async function startAdmin() {
  const result=await api("admin.bootstrap");state={...state,...result};qs("#app").innerHTML=adminShell();bindShell();await renderSection();initIcons();
}

export async function renderAdmin() {
  const session=await api("auth.session");setCsrf(session.csrf);
  if(!session.authenticated){qs("#app").innerHTML=loginScreen();bindLogin();initIcons();return;}
  state.user=session.user;await startAdmin();
}
