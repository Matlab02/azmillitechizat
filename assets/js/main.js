import { renderPublic } from "./pages.js?v=20261011d";
import { renderAdmin } from "./admin.js?v=20261011d";

const page = document.body.dataset.page || "home";

try {
  if (page === "admin") await renderAdmin();
  else await renderPublic(page);
} catch (error) {
  console.error(error);
  document.querySelector("#app").innerHTML = `<main id="main" class="fatal-error"><h1>Səhifə yüklənmədi</h1><p>Serverlə əlaqə qurulmadı. Bir qədər sonra səhifəni yeniləyin.</p><a href="index.html">Ana səhifəyə qayıt</a></main>`;
}
