# AZ Milli Təchizat

Production JavaScript paketini yeniləmək üçün mənbə fayllarındakı dəyişikliklərdən sonra `node scripts/build-bundle.mjs` əmrini işlədin.

PHP 8 + MySQL ilə işləyən kataloq, qiymət sorğusu, əlaqə forması və autentifikasiyalı admin paneli.

## Əsas imkanlar

- Kateqoriya, brend və məhsul CRUD-u; məhsul brendsiz ola bilər.
- Admin istifadəçi adı/şifrə girişi, rol yoxlaması, CSRF və giriş bloklaması.
- JPG/JPEG, PNG və WEBP üçün admin şəkil redaktoru: önizləmə, zoom və 90° fırlatma.
- Qiymət sorğusu və əlaqə formalarında qorunan fayl əlavəsi; əlaqədə telefon məcburidir.
- Saytın əlaqə məlumatları, ana səhifə mətni, footer mətni və keçidləri admin paneldən idarə olunur.
- Müştəri səbəti brauzerdə saxlanır; müraciətlər server verilənlər bazasına yazılır.

## Qovluqlar

```text
api/                    PHP API, autentifikasiya və quraşdırma
assets/js/api.js        API adapteri
assets/js/storage.js    Public data + lokal səbət adapteri
assets/js/admin.js      Admin panel və CRUD
assets/css/styles.css   Dizayn sistemi
data/catalog.json       İlkin kataloq seed məlumatı
uploads/media/          Public yüklənmiş şəkillər (serverdə yaradılır)
```

## Server quraşdırması

1. `api/config.example.php` əsasında `app_private/config.php` yaradın və public web root-dan kənarda saxlayın.
2. `api/install.php` ünvanına `X-Install-Token` başlığı ilə POST göndərin. İstəyə görə ilk admin üçün `username`, `password`, `fullName` JSON sahələrini əlavə edin.
3. Quraşdırmadan sonra `install.php` faylını serverdən silin.
4. `api/index.php?route=health` və public `bootstrap` cavabını yoxlayın.

Müştəri əlavələri `app_private/uploads` altında saxlanır və birbaşa URL ilə açılmır. Public kataloq şəkilləri `uploads/media` altında saxlanır.

## Yoxlama

```powershell
node --check assets/js/api.js
node --check assets/js/storage.js
node --check assets/js/pages.js
node --check assets/js/admin.js
```

UI və davranış qaydaları [DESIGN.md](DESIGN.md) və [UX-CONTRACT.md](UX-CONTRACT.md) sənədlərindədir.

Növbəti inkişaf mərhələsi üçün görülən işlər, arxitektura, yoxlama nəticələri və qalan prioritetlər `CODEX_HANDOFF.txt` faylında toplanıb.
