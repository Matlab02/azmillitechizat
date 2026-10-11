<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    azmt_json(['ok'=>true,'php'=>PHP_VERSION,'pdo_mysql'=>extension_loaded('pdo_mysql'),'fileinfo'=>extension_loaded('fileinfo'),'gd'=>extension_loaded('gd')]);
}

$token = $_SERVER['HTTP_X_INSTALL_TOKEN'] ?? '';
if (!$token || !hash_equals((string)(azmt_config()['install_token'] ?? ''), (string)$token)) azmt_error('Quraşdırma nişanı etibarsızdır.', 403);

$pdo = azmt_pdo();
$schema = [
"CREATE TABLE IF NOT EXISTS azmt_migrations (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, version VARCHAR(80) NOT NULL UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_admin_users (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, username VARCHAR(80) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, full_name VARCHAR(140) NOT NULL, role ENUM('super_admin','admin') NOT NULL DEFAULT 'admin', status ENUM('active','disabled') NOT NULL DEFAULT 'active', failed_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, locked_until DATETIME NULL, last_login_at DATETIME NULL, password_changed_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_media_files (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, original_name VARCHAR(255) NOT NULL, stored_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size BIGINT UNSIGNED NOT NULL, width INT UNSIGNED NULL, height INT UNSIGNED NULL, storage_scope ENUM('public','private') NOT NULL, file_path VARCHAR(600) NOT NULL, public_url VARCHAR(600) NULL, alt_text VARCHAR(255) NULL, created_by INT UNSIGNED NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(created_by), CONSTRAINT azmt_media_user_fk FOREIGN KEY(created_by) REFERENCES azmt_admin_users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_categories (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, slug VARCHAR(180) NOT NULL UNIQUE, description VARCHAR(600) NULL, icon_key VARCHAR(80) NULL, image_media_id BIGINT UNSIGNED NULL, sort_order INT NOT NULL DEFAULT 0, status ENUM('active','inactive') NOT NULL DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME NULL, INDEX(status,sort_order), CONSTRAINT azmt_category_media_fk FOREIGN KEY(image_media_id) REFERENCES azmt_media_files(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_brands (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(160) NOT NULL, slug VARCHAR(180) NOT NULL UNIQUE, description VARCHAR(1000) NULL, tone VARCHAR(16) NULL, website_url VARCHAR(500) NULL, logo_media_id BIGINT UNSIGNED NULL, sort_order INT NOT NULL DEFAULT 0, status ENUM('active','inactive') NOT NULL DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME NULL, INDEX(status,sort_order), CONSTRAINT azmt_brand_media_fk FOREIGN KEY(logo_media_id) REFERENCES azmt_media_files(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_products (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, category_id INT UNSIGNED NOT NULL, brand_id INT UNSIGNED NULL, name VARCHAR(220) NOT NULL, slug VARCHAR(240) NOT NULL UNIQUE, sku VARCHAR(100) NULL UNIQUE, short_description VARCHAR(500) NULL, description TEXT NULL, price DECIMAL(12,2) NULL, price_mode ENUM('FIXED_PRICE','REQUEST_ONLY','HYBRID') NOT NULL DEFAULT 'FIXED_PRICE', stock_quantity INT NOT NULL DEFAULT 0, material VARCHAR(140) NULL, color VARCHAR(140) NULL, art_type VARCHAR(80) NULL, status ENUM('active','inactive') NOT NULL DEFAULT 'active', featured TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, rating DECIMAL(3,2) NULL, review_count INT UNSIGNED NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, deleted_at DATETIME NULL, INDEX(category_id,status), INDEX(brand_id,status), CONSTRAINT azmt_product_category_fk FOREIGN KEY(category_id) REFERENCES azmt_categories(id), CONSTRAINT azmt_product_brand_fk FOREIGN KEY(brand_id) REFERENCES azmt_brands(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_product_images (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, media_id BIGINT UNSIGNED NOT NULL, is_primary TINYINT(1) NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, crop_json JSON NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(product_id,is_primary), CONSTRAINT azmt_pi_product_fk FOREIGN KEY(product_id) REFERENCES azmt_products(id) ON DELETE CASCADE, CONSTRAINT azmt_pi_media_fk FOREIGN KEY(media_id) REFERENCES azmt_media_files(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_product_specs (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, label VARCHAR(160) NOT NULL, value VARCHAR(400) NOT NULL, sort_order INT NOT NULL DEFAULT 0, CONSTRAINT azmt_ps_product_fk FOREIGN KEY(product_id) REFERENCES azmt_products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_product_variants (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, product_id INT UNSIGNED NOT NULL, name VARCHAR(180) NOT NULL, sort_order INT NOT NULL DEFAULT 0, CONSTRAINT azmt_pv_product_fk FOREIGN KEY(product_id) REFERENCES azmt_products(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_quote_requests (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_no VARCHAR(32) NOT NULL UNIQUE, full_name VARCHAR(160) NOT NULL, phone VARCHAR(40) NOT NULL, email VARCHAR(190) NULL, company VARCHAR(190) NULL, note TEXT NULL, status ENUM('new','reviewing','quoted','closed','cancelled') NOT NULL DEFAULT 'new', total_estimate DECIMAL(12,2) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(status,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_quote_items (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, quote_id BIGINT UNSIGNED NOT NULL, product_id INT UNSIGNED NULL, product_name VARCHAR(220) NOT NULL, quantity INT UNSIGNED NOT NULL DEFAULT 1, unit_price DECIMAL(12,2) NULL, price_mode VARCHAR(30) NOT NULL, CONSTRAINT azmt_qi_quote_fk FOREIGN KEY(quote_id) REFERENCES azmt_quote_requests(id) ON DELETE CASCADE, CONSTRAINT azmt_qi_product_fk FOREIGN KEY(product_id) REFERENCES azmt_products(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_quote_attachments (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, quote_id BIGINT UNSIGNED NOT NULL, original_name VARCHAR(255) NOT NULL, file_path VARCHAR(600) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size BIGINT UNSIGNED NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT azmt_qa_quote_fk FOREIGN KEY(quote_id) REFERENCES azmt_quote_requests(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_contact_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(160) NOT NULL, phone VARCHAR(40) NOT NULL, email VARCHAR(190) NULL, subject VARCHAR(220) NULL, message TEXT NOT NULL, status ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(status,created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_contact_attachments (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, contact_id BIGINT UNSIGNED NOT NULL, original_name VARCHAR(255) NOT NULL, file_path VARCHAR(600) NOT NULL, mime_type VARCHAR(100) NOT NULL, file_size BIGINT UNSIGNED NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT azmt_ca_contact_fk FOREIGN KEY(contact_id) REFERENCES azmt_contact_messages(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_site_settings (setting_key VARCHAR(100) PRIMARY KEY, setting_value TEXT NULL, setting_type VARCHAR(30) NOT NULL DEFAULT 'text', updated_by INT UNSIGNED NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT azmt_setting_user_fk FOREIGN KEY(updated_by) REFERENCES azmt_admin_users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_footer_links (id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, group_name VARCHAR(100) NOT NULL, label VARCHAR(160) NOT NULL, url VARCHAR(500) NOT NULL, sort_order INT NOT NULL DEFAULT 0, status ENUM('active','inactive') NOT NULL DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
"CREATE TABLE IF NOT EXISTS azmt_audit_logs (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, admin_user_id INT UNSIGNED NULL, action VARCHAR(80) NOT NULL, entity_type VARCHAR(80) NOT NULL, entity_id VARCHAR(80) NULL, details_json JSON NULL, ip_address VARCHAR(64) NULL, user_agent VARCHAR(255) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(admin_user_id,created_at), CONSTRAINT azmt_audit_user_fk FOREIGN KEY(admin_user_id) REFERENCES azmt_admin_users(id) ON DELETE SET NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
];

try {
    foreach ($schema as $sql) $pdo->exec($sql);
    $pdo->beginTransaction();
    $pdo->prepare('INSERT IGNORE INTO azmt_migrations (version) VALUES (?)')->execute(['001_initial']);

    $settings = [
        'site_name'=>'AZ Milli Təchizat','site_tagline'=>'Santexnika və ümumi təchizat','logo_url'=>'','logo_alt'=>'AZ Milli Təchizat loqosu',
        'topbar_left'=>'Topdan və pərakəndə satış','topbar_right'=>'Peşəkar təchizat • AZN','search_placeholder'=>'Axtar... (kran, boru, unitaz...)',
        'phone'=>'+994 50 123 45 67','email'=>'info@azmillitechizat.az','address'=>'Bakı, Azərbaycan',
        'whatsapp'=>'+994501234567','hero_eyebrow'=>'Santexnika və ümumi təchizat','hero_title'=>'Keyfiyyətli santexnika məhsulları',
        'hero_text'=>'Ev, ofis və layihələriniz üçün etibarlı həllər',
        'home_categories_title'=>'Kateqoriyalar','home_products_title'=>'Populyar məhsullar','home_brands_title'=>'Seçilmiş brendlər',
        'benefit_1_title'=>'Sürətli çatdırılma','benefit_1_text'=>'Əlverişli seçimlər','benefit_2_title'=>'Zəmanətli məhsullar','benefit_2_text'=>'Dəqiq məhsul məlumatı',
        'benefit_3_title'=>'Topdan satış','benefit_3_text'=>'Layihələr üçün təkliflər','benefit_4_title'=>'Peşəkar dəstək','benefit_4_text'=>'Seçimdə istiqamət',
        'brands_eyebrow'=>'İstehsalçılar','brands_title'=>'Brendlərimiz','brands_intro'=>'Kataloqumuzda təqdim olunan santexnika və su sistemləri markaları.',
        'about_eyebrow'=>'Bizim haqqımızda','about_hero_title'=>'Təchizat ehtiyacları üçün aydın seçim','about_hero_text'=>'Sanitar məhsullar və ümumi təchizat üzrə məhsulları rahat müqayisə edin.',
        'about_title'=>'AZ Milli Təchizat','about_body_1'=>'Sanitar məhsullar, santexnika avadanlıqları və ümumi təchizat sahəsində fərdi müştərilər və bizneslər üçün rahat seçim və qiymət sorğusu imkanı təqdim edirik.',
        'about_body_2'=>'Kataloqdakı kateqoriyalar, brendlər və məhsullar mütəmadi yenilənir. Layihənizə uyğun məhsulu tapa bilmirsinizsə, qiymət sorğusu və ya əlaqə forması vasitəsilə bizə yaza bilərsiniz.',
        'about_fact_1_value'=>'B2B + B2C','about_fact_1_label'=>'Fərdi və korporativ müştərilər','about_fact_2_value'=>'AZN','about_fact_2_label'=>'Yerli qiymət formatı','about_fact_3_value'=>'Dəstək','about_fact_3_label'=>'Məhsul seçiminə kömək',
        'contact_eyebrow'=>'Bizimlə əlaqə','contact_title'=>'Əlaqə','contact_intro'=>'Sualınızı göndərin, komandamız sizinlə telefon və ya e-poçt vasitəsilə əlaqə saxlasın.','contact_form_title'=>'Mesaj yazın',
        'footer_description'=>'Santexnika, su sistemləri və ümumi təchizat üçün etibarlı məhsullar.',
        'footer_copyright'=>'© ' . date('Y') . ' AZ Milli Təchizat. Bütün hüquqlar qorunur.'
    ];
    $settingStmt = $pdo->prepare('INSERT IGNORE INTO azmt_site_settings (setting_key,setting_value) VALUES (?,?)');
    foreach ($settings as $key=>$value) $settingStmt->execute([$key,$value]);
    $footerCount = (int)$pdo->query('SELECT COUNT(*) FROM azmt_footer_links')->fetchColumn();
    if ($footerCount === 0) {
        $link = $pdo->prepare('INSERT INTO azmt_footer_links (group_name,label,url,sort_order) VALUES (?,?,?,?)');
        foreach ([['Məhsullar','Bütün məhsullar','category.html',1],['Məhsullar','Qiymət sorğusu','quote.html',2],['Şirkət','Haqqımızda','about.html',1],['Şirkət','Brendlər','brands.html',2],['Şirkət','Əlaqə','contact.html',3]] as $row) $link->execute($row);
    }

    $catalogPath = AZMT_ROOT . '/data/catalog.json';
    if ((int)$pdo->query('SELECT COUNT(*) FROM azmt_categories')->fetchColumn() === 0 && is_file($catalogPath)) {
        $catalog = json_decode((string)file_get_contents($catalogPath), true, 512, JSON_THROW_ON_ERROR);
        $categoryIds = [];
        $stmt = $pdo->prepare('INSERT INTO azmt_categories (name,slug,description,icon_key,sort_order) VALUES (?,?,?,?,?)');
        foreach ($catalog['categories'] as $i=>$row) { $stmt->execute([$row['name'],$row['id'],$row['description'] ?? null,$row['icon'] ?? null,$i]); $categoryIds[$row['id']] = (int)$pdo->lastInsertId(); }
        $brandIds = [];
        $stmt = $pdo->prepare('INSERT INTO azmt_brands (name,slug,tone,sort_order) VALUES (?,?,?,?)');
        foreach ($catalog['brands'] as $i=>$row) { $stmt->execute([$row['name'],$row['id'],$row['tone'] ?? null,$i]); $brandIds[$row['id']] = (int)$pdo->lastInsertId(); }
        $productStmt = $pdo->prepare('INSERT INTO azmt_products (category_id,brand_id,name,slug,description,price,price_mode,stock_quantity,material,color,art_type,status,featured,sort_order,rating,review_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $specStmt = $pdo->prepare('INSERT INTO azmt_product_specs (product_id,label,value,sort_order) VALUES (?,?,?,?)');
        $variantStmt = $pdo->prepare('INSERT INTO azmt_product_variants (product_id,name,sort_order) VALUES (?,?,?)');
        foreach ($catalog['products'] as $i=>$row) {
            $productStmt->execute([$categoryIds[$row['categoryId']],$brandIds[$row['brandId']] ?? null,$row['name'],$row['id'],$row['description'] ?? null,$row['price'],$row['priceMode'],$row['stock'] ?? 0,$row['material'] ?? null,$row['color'] ?? null,$row['art'] ?? null,'active',!empty($row['featured']) ? 1 : 0,$i,$row['rating'] ?? null,$row['reviewCount'] ?? 0]);
            $productId = (int)$pdo->lastInsertId();
            foreach (($row['specs'] ?? []) as $j=>$value) { $specStmt->execute([$productId,(string)$j,(string)$value,0]); }
            foreach (($row['variants'] ?? []) as $j=>$value) $variantStmt->execute([$productId,(string)$value,$j]);
        }
    }

    $body = azmt_body();
    if (!empty($body['username']) && !empty($body['password'])) {
        if (mb_strlen((string)$body['password']) < 10) throw new RuntimeException('Admin şifrəsi ən azı 10 simvol olmalıdır.');
        $admin = $pdo->prepare("INSERT INTO azmt_admin_users (username,password_hash,full_name,role) VALUES (?,?,?,'super_admin') ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), status='active'");
        $admin->execute([mb_strtolower(trim((string)$body['username'])), password_hash((string)$body['password'], PASSWORD_DEFAULT), azmt_clean_text($body['fullName'] ?? 'Baş administrator',140)]);
    }
    $pdo->commit();
    azmt_json(['ok'=>true,'message'=>'Verilənlər bazası hazırdır.','seeded'=>true]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    azmt_error('Quraşdırma tamamlanmadı: ' . $error->getMessage(), 500);
}
