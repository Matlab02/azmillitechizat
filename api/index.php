<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

azmt_origin_guard();
azmt_start_session();
$route = trim((string)($_GET['route'] ?? 'bootstrap'));
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

function azmt_settings(): array
{
    $rows = azmt_pdo()->query('SELECT setting_key,setting_value FROM azmt_site_settings')->fetchAll();
    $flat = [];
    foreach ($rows as $row) $flat[$row['setting_key']] = $row['setting_value'];
    $settings = [];
    $insert = null;
    foreach (azmt_setting_definitions() as $input => [$key, $default]) {
        if (!array_key_exists($key, $flat)) {
            $insert ??= azmt_pdo()->prepare('INSERT IGNORE INTO azmt_site_settings (setting_key,setting_value) VALUES (?,?)');
            $insert->execute([$key, $default]);
            $flat[$key] = $default;
        }
        $settings[$input] = $flat[$key];
    }
    return $settings;
}

function azmt_setting_definitions(): array
{
    return [
        'siteName'=>['site_name','AZ Milli Təchizat'], 'siteTagline'=>['site_tagline','Santexnika və ümumi təchizat'], 'logoUrl'=>['logo_url',''], 'logoAlt'=>['logo_alt','AZ Milli Təchizat loqosu'],
        'topbarLeft'=>['topbar_left','Topdan və pərakəndə satış'], 'topbarRight'=>['topbar_right','Peşəkar təchizat • AZN'], 'searchPlaceholder'=>['search_placeholder','Axtar... (kran, boru, unitaz...)'],
        'phone'=>['phone','+994 50 123 45 67'], 'email'=>['email','info@azmillitechizat.az'], 'address'=>['address','Bakı, Azərbaycan'], 'whatsapp'=>['whatsapp','+994501234567'],
        'heroEyebrow'=>['hero_eyebrow','Santexnika və ümumi təchizat'], 'heroTitle'=>['hero_title','Keyfiyyətli santexnika məhsulları'], 'heroText'=>['hero_text','Ev, ofis və layihələriniz üçün etibarlı həllər'],
        'homeCategoriesTitle'=>['home_categories_title','Kateqoriyalar'], 'homeProductsTitle'=>['home_products_title','Populyar məhsullar'], 'homeBrandsTitle'=>['home_brands_title','Seçilmiş brendlər'],
        'benefit1Title'=>['benefit_1_title','Sürətli çatdırılma'], 'benefit1Text'=>['benefit_1_text','Əlverişli seçimlər'], 'benefit2Title'=>['benefit_2_title','Zəmanətli məhsullar'], 'benefit2Text'=>['benefit_2_text','Dəqiq məhsul məlumatı'],
        'benefit3Title'=>['benefit_3_title','Topdan satış'], 'benefit3Text'=>['benefit_3_text','Layihələr üçün təkliflər'], 'benefit4Title'=>['benefit_4_title','Peşəkar dəstək'], 'benefit4Text'=>['benefit_4_text','Seçimdə istiqamət'],
        'brandsEyebrow'=>['brands_eyebrow','İstehsalçılar'], 'brandsTitle'=>['brands_title','Brendlərimiz'], 'brandsIntro'=>['brands_intro','Kataloqumuzda təqdim olunan santexnika və su sistemləri markaları.'],
        'aboutEyebrow'=>['about_eyebrow','Bizim haqqımızda'], 'aboutHeroTitle'=>['about_hero_title','Təchizat ehtiyacları üçün aydın seçim'], 'aboutHeroText'=>['about_hero_text','Sanitar məhsullar və ümumi təchizat üzrə məhsulları rahat müqayisə edin.'],
        'aboutTitle'=>['about_title','AZ Milli Təchizat'], 'aboutBody1'=>['about_body_1','Sanitar məhsullar, santexnika avadanlıqları və ümumi təchizat sahəsində fərdi müştərilər və bizneslər üçün rahat seçim və qiymət sorğusu imkanı təqdim edirik.'],
        'aboutBody2'=>['about_body_2','Kataloqdakı kateqoriyalar, brendlər və məhsullar mütəmadi yenilənir. Layihənizə uyğun məhsulu tapa bilmirsinizsə, qiymət sorğusu və ya əlaqə forması vasitəsilə bizə yaza bilərsiniz.'],
        'aboutFact1Value'=>['about_fact_1_value','B2B + B2C'], 'aboutFact1Label'=>['about_fact_1_label','Fərdi və korporativ müştərilər'], 'aboutFact2Value'=>['about_fact_2_value','AZN'], 'aboutFact2Label'=>['about_fact_2_label','Yerli qiymət formatı'], 'aboutFact3Value'=>['about_fact_3_value','Dəstək'], 'aboutFact3Label'=>['about_fact_3_label','Məhsul seçiminə kömək'],
        'contactEyebrow'=>['contact_eyebrow','Bizimlə əlaqə'], 'contactTitle'=>['contact_title','Əlaqə'], 'contactIntro'=>['contact_intro','Sualınızı göndərin, komandamız sizinlə telefon və ya e-poçt vasitəsilə əlaqə saxlasın.'], 'contactFormTitle'=>['contact_form_title','Mesaj yazın'],
        'footerDescription'=>['footer_description','Santexnika, su sistemləri və ümumi təchizat üçün etibarlı məhsullar.'], 'footerCopyright'=>['footer_copyright','© '.date('Y').' AZ Milli Təchizat. Bütün hüquqlar qorunur.'],
    ];
}

function azmt_catalog(bool $admin = false): array
{
    $status = $admin ? '' : " AND c.status='active'";
    $categories = azmt_pdo()->query("SELECT c.id,c.name,c.slug,c.description,c.icon_key AS icon,c.sort_order AS sortOrder,c.status,m.public_url AS imageUrl FROM azmt_categories c LEFT JOIN azmt_media_files m ON m.id=c.image_media_id WHERE c.deleted_at IS NULL{$status} ORDER BY c.sort_order,c.name")->fetchAll();
    $status = $admin ? '' : " AND b.status='active'";
    $brands = azmt_pdo()->query("SELECT b.id,b.name,b.slug,b.description,b.tone,b.website_url AS websiteUrl,b.sort_order AS sortOrder,b.status,m.public_url AS imageUrl,(SELECT COUNT(*) FROM azmt_products p WHERE p.brand_id=b.id AND p.deleted_at IS NULL" . ($admin ? '' : " AND p.status='active'") . ") AS count FROM azmt_brands b LEFT JOIN azmt_media_files m ON m.id=b.logo_media_id WHERE b.deleted_at IS NULL{$status} ORDER BY b.sort_order,b.name")->fetchAll();
    $status = $admin ? '' : " AND p.status='active'";
    $products = azmt_pdo()->query("SELECT p.id,p.name,p.slug,p.sku,p.category_id AS categoryId,p.brand_id AS brandId,p.short_description AS shortDescription,p.description,p.price,p.price_mode AS priceMode,p.stock_quantity AS stock,p.material,p.color,p.art_type AS art,p.status,p.featured,p.sort_order AS sortOrder,p.rating,p.review_count AS reviewCount,c.name AS categoryName,b.name AS brandName,(SELECT mf.public_url FROM azmt_product_images pi JOIN azmt_media_files mf ON mf.id=pi.media_id WHERE pi.product_id=p.id ORDER BY pi.is_primary DESC,pi.sort_order,pi.id LIMIT 1) AS imageUrl FROM azmt_products p JOIN azmt_categories c ON c.id=p.category_id LEFT JOIN azmt_brands b ON b.id=p.brand_id WHERE p.deleted_at IS NULL{$status} ORDER BY p.sort_order,p.id DESC")->fetchAll();
    $productIds = array_column($products, 'id');
    $specs = $variants = [];
    if ($productIds) {
        $in = implode(',', array_fill(0,count($productIds),'?'));
        $stmt = azmt_pdo()->prepare("SELECT product_id,label,value FROM azmt_product_specs WHERE product_id IN ($in) ORDER BY sort_order,id"); $stmt->execute($productIds);
        foreach ($stmt as $row) $specs[$row['product_id']][$row['label']] = $row['value'];
        $stmt = azmt_pdo()->prepare("SELECT product_id,name FROM azmt_product_variants WHERE product_id IN ($in) ORDER BY sort_order,id"); $stmt->execute($productIds);
        foreach ($stmt as $row) $variants[$row['product_id']][] = $row['name'];
    }
    foreach ($products as &$product) {
        $product['id'] = (string)$product['id'];
        $product['categoryId'] = (string)$product['categoryId'];
        $product['brandId'] = $product['brandId'] === null ? null : (string)$product['brandId'];
        $product['price'] = $product['price'] === null ? null : (float)$product['price'];
        $product['stock'] = (int)$product['stock']; $product['featured'] = (bool)$product['featured'];
        $product['rating'] = $product['rating'] === null ? null : (float)$product['rating']; $product['reviewCount'] = (int)$product['reviewCount'];
        $product['specs'] = $specs[(int)$product['id']] ?? []; $product['variants'] = $variants[(int)$product['id']] ?? [];
    }
    foreach ($categories as &$row) $row['id'] = (string)$row['id'];
    foreach ($brands as &$row) { $row['id'] = (string)$row['id']; $row['count'] = (int)$row['count']; }
    return ['categories'=>$categories,'brands'=>$brands,'products'=>$products];
}

function azmt_unique_slug(string $table, string $name, ?int $ignoreId = null): string
{
    $base = azmt_slug($name); $slug = $base; $i = 2;
    do {
        $sql = "SELECT id FROM {$table} WHERE slug=?" . ($ignoreId ? ' AND id<>?' : '') . ' LIMIT 1';
        $stmt = azmt_pdo()->prepare($sql); $stmt->execute($ignoreId ? [$slug,$ignoreId] : [$slug]);
        if (!$stmt->fetchColumn()) return $slug;
        $slug = $base . '-' . $i++;
    } while ($i < 1000);
    return $base . '-' . bin2hex(random_bytes(3));
}

function azmt_request_number(): string
{
    return 'AZMT-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
}

if ($route === 'health') azmt_json(['ok'=>true,'status'=>'healthy','time'=>date(DATE_ATOM)]);

if ($route === 'bootstrap' && $method === 'GET') {
    $footer = azmt_pdo()->query("SELECT id,group_name AS groupName,label,url,sort_order AS sortOrder FROM azmt_footer_links WHERE status='active' ORDER BY group_name,sort_order,id")->fetchAll();
    azmt_json(['ok'=>true,'catalog'=>azmt_catalog(false),'settings'=>azmt_settings(),'footerLinks'=>$footer,'csrf'=>$_SESSION['csrf']]);
}

if ($route === 'quote' && $method === 'POST') {
    azmt_verify_csrf();
    $name = azmt_clean_text($_POST['fullName'] ?? '',160); $phone = azmt_clean_text($_POST['phone'] ?? '',40);
    if ($name === '' || $phone === '') azmt_error('Ad, soyad və telefon nömrəsi məcburidir.',422,['fullName'=>$name === '' ? 'Ad və soyadı daxil edin.' : null,'phone'=>$phone === '' ? 'Telefon nömrəsini daxil edin.' : null]);
    $items = json_decode((string)($_POST['items'] ?? '[]'), true);
    if (!is_array($items) || !$items) azmt_error('Sorğuya ən azı bir məhsul əlavə edin.',422);
    $pdo=azmt_pdo(); $pdo->beginTransaction();
    try {
        $number=azmt_request_number();
        $stmt=$pdo->prepare('INSERT INTO azmt_quote_requests (request_no,full_name,phone,email,company,note) VALUES (?,?,?,?,?,?)');
        $stmt->execute([$number,$name,$phone,azmt_clean_text($_POST['email']??'',190)?:null,azmt_clean_text($_POST['company']??'',190)?:null,azmt_clean_text($_POST['note']??'',10000)?:null]);
        $quoteId=(int)$pdo->lastInsertId(); $total=0.0;
        $lookup=$pdo->prepare("SELECT id,name,price,price_mode FROM azmt_products WHERE id=? AND deleted_at IS NULL AND status='active'");
        $insert=$pdo->prepare('INSERT INTO azmt_quote_items (quote_id,product_id,product_name,quantity,unit_price,price_mode) VALUES (?,?,?,?,?,?)');
        foreach ($items as $item) { $lookup->execute([azmt_int($item['productId']??0)]); $product=$lookup->fetch(); if(!$product) continue; $qty=max(1,min(999,azmt_int($item['quantity']??1,1))); $insert->execute([$quoteId,$product['id'],$product['name'],$qty,$product['price'],$product['price_mode']]); if($product['price']!==null)$total+=(float)$product['price']*$qty; }
        $pdo->prepare('UPDATE azmt_quote_requests SET total_estimate=? WHERE id=?')->execute([$total,$quoteId]);
        if (isset($_FILES['attachment']) && ($_FILES['attachment']['error'] ?? UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE) { $file=azmt_store_attachment($_FILES['attachment'],'quotes'); $pdo->prepare('INSERT INTO azmt_quote_attachments (quote_id,original_name,file_path,mime_type,file_size) VALUES (?,?,?,?,?)')->execute([$quoteId,$file['name'],$file['path'],$file['mime'],$file['size']]); }
        $pdo->commit(); azmt_json(['ok'=>true,'message'=>'Qiymət sorğunuz qəbul edildi.','requestNo'=>$number],201);
    } catch(Throwable $e) { if($pdo->inTransaction())$pdo->rollBack(); azmt_error('Sorğu saxlanmadı. Bir qədər sonra yenidən cəhd edin.',500); }
}

if ($route === 'contact' && $method === 'POST') {
    azmt_verify_csrf();
    $name=azmt_clean_text($_POST['fullName']??'',160); $phone=azmt_clean_text($_POST['phone']??'',40); $message=azmt_clean_text($_POST['message']??'',10000);
    if($name===''||$phone===''||$message==='')azmt_error('Ad, telefon və mesaj sahələri məcburidir.',422,['fullName'=>$name===''?'Ad və soyadı daxil edin.':null,'phone'=>$phone===''?'Telefon nömrəsini daxil edin.':null,'message'=>$message===''?'Mesajınızı daxil edin.':null]);
    $pdo=azmt_pdo(); $pdo->beginTransaction();
    try { $stmt=$pdo->prepare('INSERT INTO azmt_contact_messages (full_name,phone,email,subject,message) VALUES (?,?,?,?,?)'); $stmt->execute([$name,$phone,azmt_clean_text($_POST['email']??'',190)?:null,azmt_clean_text($_POST['subject']??'',220)?:null,$message]); $id=(int)$pdo->lastInsertId(); if(isset($_FILES['attachment'])&&($_FILES['attachment']['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_NO_FILE){$file=azmt_store_attachment($_FILES['attachment'],'contacts');$pdo->prepare('INSERT INTO azmt_contact_attachments (contact_id,original_name,file_path,mime_type,file_size) VALUES (?,?,?,?,?)')->execute([$id,$file['name'],$file['path'],$file['mime'],$file['size']]);}$pdo->commit();azmt_json(['ok'=>true,'message'=>'Mesajınız qəbul edildi. Tezliklə sizinlə əlaqə saxlanılacaq.'],201); } catch(Throwable){if($pdo->inTransaction())$pdo->rollBack();azmt_error('Mesaj saxlanmadı. Bir qədər sonra yenidən cəhd edin.',500);}
}

if ($route === 'auth.login' && $method === 'POST') {
    azmt_verify_csrf(); $body=azmt_body(); $username=mb_strtolower(trim((string)($body['username']??''))); $password=(string)($body['password']??'');
    $stmt=azmt_pdo()->prepare("SELECT * FROM azmt_admin_users WHERE username=? LIMIT 1");$stmt->execute([$username]);$admin=$stmt->fetch();
    if($admin && $admin['locked_until'] && strtotime($admin['locked_until'])>time())azmt_error('Çoxsaylı uğursuz cəhdə görə giriş müvəqqəti bağlanıb.',429);
    if(!$admin||$admin['status']!=='active'||!password_verify($password,$admin['password_hash'])){if($admin){$attempts=(int)$admin['failed_attempts']+1;$locked=$attempts>=5?date('Y-m-d H:i:s',time()+900):null;azmt_pdo()->prepare('UPDATE azmt_admin_users SET failed_attempts=?,locked_until=? WHERE id=?')->execute([$attempts,$locked,$admin['id']]);}azmt_audit('login_failed','auth',$admin['id']??null,['username'=>$username]);azmt_error('İstifadəçi adı və ya şifrə yanlışdır.',401);}
    session_regenerate_id(true); $_SESSION['csrf']=bin2hex(random_bytes(32)); $_SESSION['admin']=['id'=>(int)$admin['id'],'username'=>$admin['username'],'fullName'=>$admin['full_name'],'role'=>$admin['role']]; azmt_pdo()->prepare('UPDATE azmt_admin_users SET failed_attempts=0,locked_until=NULL,last_login_at=NOW() WHERE id=?')->execute([$admin['id']]); azmt_audit('login','auth',(string)$admin['id']); azmt_json(['ok'=>true,'user'=>$_SESSION['admin'],'csrf'=>$_SESSION['csrf']]);
}

if ($route === 'auth.logout' && $method === 'POST') { azmt_verify_csrf(); $user=azmt_user(); if($user)azmt_audit('logout','auth',(string)$user['id']); $_SESSION=[]; session_destroy(); azmt_json(['ok'=>true]); }
if ($route === 'auth.session' && $method === 'GET') { $user=azmt_user(); azmt_json(['ok'=>true,'authenticated'=>(bool)$user,'user'=>$user,'csrf'=>$_SESSION['csrf']]); }

// Everything below this line belongs to the authenticated administration API.
$user=azmt_require_auth();

if ($route === 'admin.bootstrap' && $method === 'GET') {
    $stats=[
        'products'=>(int)azmt_pdo()->query("SELECT COUNT(*) FROM azmt_products WHERE deleted_at IS NULL")->fetchColumn(),
        'categories'=>(int)azmt_pdo()->query("SELECT COUNT(*) FROM azmt_categories WHERE deleted_at IS NULL")->fetchColumn(),
        'brands'=>(int)azmt_pdo()->query("SELECT COUNT(*) FROM azmt_brands WHERE deleted_at IS NULL")->fetchColumn(),
        'newQuotes'=>(int)azmt_pdo()->query("SELECT COUNT(*) FROM azmt_quote_requests WHERE status='new'")->fetchColumn(),
        'newMessages'=>(int)azmt_pdo()->query("SELECT COUNT(*) FROM azmt_contact_messages WHERE status='new'")->fetchColumn(),
    ];
    $quotes=azmt_pdo()->query('SELECT id,request_no AS requestNo,full_name AS fullName,phone,status,created_at AS createdAt FROM azmt_quote_requests ORDER BY id DESC LIMIT 5')->fetchAll();
    azmt_json(['ok'=>true,'user'=>$user,'stats'=>$stats,'recentQuotes'=>$quotes,'catalog'=>azmt_catalog(true),'settings'=>azmt_settings()]);
}

if ($route === 'admin.media.upload' && $method === 'POST') {
    azmt_verify_csrf(); if(!isset($_FILES['image']))azmt_error('Şəkil seçilməyib.',422); $media=azmt_store_image($_FILES['image'],$_POST['alt']??''); azmt_audit('upload','media',(string)$media['id']); azmt_json(['ok'=>true,'media'=>$media],201);
}

if ($route === 'admin.categories') {
    if($method==='GET')azmt_json(['ok'=>true,'items'=>azmt_catalog(true)['categories']]);
    azmt_verify_csrf();$body=azmt_body();$id=azmt_nullable_int($body['id']??null);
    if($method==='DELETE'&&$id){$count=azmt_pdo()->prepare('SELECT COUNT(*) FROM azmt_products WHERE category_id=? AND deleted_at IS NULL');$count->execute([$id]);if((int)$count->fetchColumn()>0)azmt_error('Bu kateqoriyada məhsullar var. Əvvəl məhsulları başqa kateqoriyaya keçirin.',409);azmt_pdo()->prepare("UPDATE azmt_categories SET deleted_at=NOW(),status='inactive' WHERE id=?")->execute([$id]);azmt_audit('archive','category',(string)$id);azmt_json(['ok'=>true,'message'=>'Kateqoriya arxivləşdirildi.']);}
    $name=azmt_clean_text($body['name']??'',160);if($name==='')azmt_error('Kateqoriya adı məcburidir.',422,['name'=>'Kateqoriya adını daxil edin.']);
    if($method==='POST'){$slug=azmt_unique_slug('azmt_categories',$body['slug']??$name);$stmt=azmt_pdo()->prepare('INSERT INTO azmt_categories (name,slug,description,icon_key,image_media_id,sort_order,status) VALUES (?,?,?,?,?,?,?)');$stmt->execute([$name,$slug,azmt_clean_text($body['description']??'',600)?:null,azmt_clean_text($body['icon']??'',80)?:null,azmt_nullable_int($body['imageMediaId']??null),azmt_int($body['sortOrder']??0),($body['status']??'active')==='inactive'?'inactive':'active']);$id=(int)azmt_pdo()->lastInsertId();azmt_audit('create','category',(string)$id);azmt_json(['ok'=>true,'id'=>$id,'message'=>'Kateqoriya yaradıldı.'],201);}
    if($method==='PUT'&&$id){$slug=azmt_unique_slug('azmt_categories',$body['slug']??$name,$id);$stmt=azmt_pdo()->prepare('UPDATE azmt_categories SET name=?,slug=?,description=?,icon_key=?,image_media_id=COALESCE(?,image_media_id),sort_order=?,status=? WHERE id=? AND deleted_at IS NULL');$stmt->execute([$name,$slug,azmt_clean_text($body['description']??'',600)?:null,azmt_clean_text($body['icon']??'',80)?:null,azmt_nullable_int($body['imageMediaId']??null),azmt_int($body['sortOrder']??0),($body['status']??'active')==='inactive'?'inactive':'active',$id]);azmt_audit('update','category',(string)$id);azmt_json(['ok'=>true,'message'=>'Kateqoriya yeniləndi.']);}
}

if ($route === 'admin.brands') {
    if($method==='GET')azmt_json(['ok'=>true,'items'=>azmt_catalog(true)['brands']]);
    azmt_verify_csrf();$body=azmt_body();$id=azmt_nullable_int($body['id']??null);
    if($method==='DELETE'&&$id){azmt_pdo()->prepare('UPDATE azmt_products SET brand_id=NULL WHERE brand_id=?')->execute([$id]);azmt_pdo()->prepare("UPDATE azmt_brands SET deleted_at=NOW(),status='inactive' WHERE id=?")->execute([$id]);azmt_audit('archive','brand',(string)$id);azmt_json(['ok'=>true,'message'=>'Brend arxivləşdirildi; məhsullar brendsiz saxlanıldı.']);}
    $name=azmt_clean_text($body['name']??'',160);if($name==='')azmt_error('Brend adı məcburidir.',422,['name'=>'Brend adını daxil edin.']);
    if($method==='POST'){$slug=azmt_unique_slug('azmt_brands',$body['slug']??$name);$stmt=azmt_pdo()->prepare('INSERT INTO azmt_brands (name,slug,description,tone,website_url,logo_media_id,sort_order,status) VALUES (?,?,?,?,?,?,?,?)');$stmt->execute([$name,$slug,azmt_clean_text($body['description']??'',1000)?:null,azmt_clean_text($body['tone']??'',16)?:null,filter_var($body['websiteUrl']??'',FILTER_VALIDATE_URL)?:null,azmt_nullable_int($body['imageMediaId']??null),azmt_int($body['sortOrder']??0),($body['status']??'active')==='inactive'?'inactive':'active']);$id=(int)azmt_pdo()->lastInsertId();azmt_audit('create','brand',(string)$id);azmt_json(['ok'=>true,'id'=>$id,'message'=>'Brend yaradıldı.'],201);}
    if($method==='PUT'&&$id){$slug=azmt_unique_slug('azmt_brands',$body['slug']??$name,$id);$stmt=azmt_pdo()->prepare('UPDATE azmt_brands SET name=?,slug=?,description=?,tone=?,website_url=?,logo_media_id=COALESCE(?,logo_media_id),sort_order=?,status=? WHERE id=? AND deleted_at IS NULL');$stmt->execute([$name,$slug,azmt_clean_text($body['description']??'',1000)?:null,azmt_clean_text($body['tone']??'',16)?:null,filter_var($body['websiteUrl']??'',FILTER_VALIDATE_URL)?:null,azmt_nullable_int($body['imageMediaId']??null),azmt_int($body['sortOrder']??0),($body['status']??'active')==='inactive'?'inactive':'active',$id]);azmt_audit('update','brand',(string)$id);azmt_json(['ok'=>true,'message'=>'Brend yeniləndi.']);}
}

if ($route === 'admin.products') {
    if($method==='GET')azmt_json(['ok'=>true,'items'=>azmt_catalog(true)['products']]);
    azmt_verify_csrf();$body=azmt_body();$id=azmt_nullable_int($body['id']??null);
    if($method==='DELETE'&&$id){azmt_pdo()->prepare("UPDATE azmt_products SET deleted_at=NOW(),status='inactive' WHERE id=?")->execute([$id]);azmt_audit('archive','product',(string)$id);azmt_json(['ok'=>true,'message'=>'Məhsul arxivləşdirildi.']);}
    $name=azmt_clean_text($body['name']??'',220);$categoryId=azmt_nullable_int($body['categoryId']??null);if($name===''||!$categoryId)azmt_error('Məhsul adı və kateqoriya məcburidir.',422,['name'=>$name===''?'Məhsul adını daxil edin.':null,'categoryId'=>!$categoryId?'Kateqoriya seçin.':null]);$priceMode=in_array($body['priceMode']??'', ['FIXED_PRICE','REQUEST_ONLY','HYBRID'],true)?$body['priceMode']:'FIXED_PRICE';$price=$priceMode==='REQUEST_ONLY'?null:(is_numeric($body['price']??null)?(float)$body['price']:null);if($priceMode!=='REQUEST_ONLY'&&$price===null)azmt_error('Bu qiymət rejimi üçün qiymət daxil edilməlidir.',422,['price'=>'Qiyməti daxil edin.']);
    $saveRelations=function(int $productId,array $payload):void{$pdo=azmt_pdo();$pdo->prepare('DELETE FROM azmt_product_specs WHERE product_id=?')->execute([$productId]);$pdo->prepare('DELETE FROM azmt_product_variants WHERE product_id=?')->execute([$productId]);$spec=$pdo->prepare('INSERT INTO azmt_product_specs (product_id,label,value,sort_order) VALUES (?,?,?,?)');foreach(($payload['specs']??[]) as $i=>$row){$label=azmt_clean_text(is_array($row)?($row['label']??''):$i,160);$value=azmt_clean_text(is_array($row)?($row['value']??''):$row,400);if($label!==''&&$value!=='')$spec->execute([$productId,$label,$value,$i]);}$variant=$pdo->prepare('INSERT INTO azmt_product_variants (product_id,name,sort_order) VALUES (?,?,?)');foreach(($payload['variants']??[]) as $i=>$value){$value=azmt_clean_text($value,180);if($value!=='')$variant->execute([$productId,$value,$i]);}if(!empty($payload['imageMediaId'])){$pdo->prepare('UPDATE azmt_product_images SET is_primary=0 WHERE product_id=?')->execute([$productId]);$pdo->prepare('INSERT INTO azmt_product_images (product_id,media_id,is_primary,sort_order,crop_json) VALUES (?,?,1,0,?)')->execute([$productId,(int)$payload['imageMediaId'],isset($payload['crop'])?json_encode($payload['crop']):null]);}};
    $values=[$categoryId,azmt_nullable_int($body['brandId']??null),$name,azmt_clean_text($body['sku']??'',100)?:null,azmt_clean_text($body['shortDescription']??'',500)?:null,azmt_clean_text($body['description']??'',20000)?:null,$price,$priceMode,max(0,azmt_int($body['stock']??0)),azmt_clean_text($body['material']??'',140)?:null,azmt_clean_text($body['color']??'',140)?:null,($body['status']??'active')==='inactive'?'inactive':'active',!empty($body['featured'])?1:0,azmt_int($body['sortOrder']??0)];
    if($method==='POST'){$slug=azmt_unique_slug('azmt_products',$body['slug']??$name);$stmt=azmt_pdo()->prepare('INSERT INTO azmt_products (category_id,brand_id,name,slug,sku,short_description,description,price,price_mode,stock_quantity,material,color,status,featured,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');$stmt->execute([$values[0],$values[1],$values[2],$slug,...array_slice($values,3)]);$id=(int)azmt_pdo()->lastInsertId();$saveRelations($id,$body);azmt_audit('create','product',(string)$id);azmt_json(['ok'=>true,'id'=>$id,'message'=>'Məhsul yaradıldı.'],201);}
    if($method==='PUT'&&$id){$slug=azmt_unique_slug('azmt_products',$body['slug']??$name,$id);$stmt=azmt_pdo()->prepare('UPDATE azmt_products SET category_id=?,brand_id=?,name=?,slug=?,sku=?,short_description=?,description=?,price=?,price_mode=?,stock_quantity=?,material=?,color=?,status=?,featured=?,sort_order=? WHERE id=? AND deleted_at IS NULL');$stmt->execute([$values[0],$values[1],$values[2],$slug,...array_slice($values,3),$id]);$saveRelations($id,$body);azmt_audit('update','product',(string)$id);azmt_json(['ok'=>true,'message'=>'Məhsul yeniləndi.']);}
}

if ($route === 'admin.settings') {
    if($method==='GET')azmt_json(['ok'=>true,'settings'=>azmt_settings(),'footerLinks'=>azmt_pdo()->query('SELECT id,group_name AS groupName,label,url,sort_order AS sortOrder,status FROM azmt_footer_links ORDER BY group_name,sort_order,id')->fetchAll()]);
    if($method==='PUT'){azmt_verify_csrf();$body=azmt_body();$stmt=azmt_pdo()->prepare('INSERT INTO azmt_site_settings (setting_key,setting_value,updated_by) VALUES (?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),updated_by=VALUES(updated_by)');foreach(azmt_setting_definitions() as $input=>[$key]){$value=azmt_clean_text($body[$input]??'',20000);if($input==='logoUrl'&&$value!==''&&!str_starts_with($value,'/uploads/media/'))$value='';$stmt->execute([$key,$value,$user['id']]);}if(isset($body['footerLinks'])&&is_array($body['footerLinks'])){azmt_pdo()->exec('DELETE FROM azmt_footer_links');$link=azmt_pdo()->prepare('INSERT INTO azmt_footer_links (group_name,label,url,sort_order,status) VALUES (?,?,?,?,?)');foreach($body['footerLinks'] as $i=>$row){$group=azmt_clean_text($row['groupName']??'',100);$label=azmt_clean_text($row['label']??'',160);$url=azmt_clean_text($row['url']??'',500);if($group!==''&&$label!==''&&$url!=='')$link->execute([$group,$label,$url,$i,'active']);}}azmt_audit('update','settings');azmt_json(['ok'=>true,'message'=>'Sayt məlumatları yeniləndi.','settings'=>azmt_settings()]);}
}

if ($route === 'admin.quotes' || $route === 'admin.contacts') {
    $isQuote=$route==='admin.quotes';$table=$isQuote?'azmt_quote_requests':'azmt_contact_messages';
    if($method==='GET'){$page=max(1,azmt_int($_GET['page']??1,1));$search=trim((string)($_GET['q']??''));$params=[];$where='1=1';if($search!==''){$where.=$isQuote?' AND (request_no LIKE ? OR full_name LIKE ? OR phone LIKE ?)':' AND (full_name LIKE ? OR phone LIKE ? OR subject LIKE ?)';$like='%'.$search.'%';$params=[$like,$like,$like];}$fields=$isQuote?'id,request_no AS requestNo,full_name AS fullName,phone,email,company,note,status,total_estimate AS totalEstimate,created_at AS createdAt':'id,full_name AS fullName,phone,email,subject,message,status,created_at AS createdAt';$data=azmt_paginate("SELECT {$fields} FROM {$table} WHERE {$where} ORDER BY id DESC",$params,$page,20);azmt_json(['ok'=>true]+$data);}
    if($method==='PUT'){azmt_verify_csrf();$body=azmt_body();$id=azmt_int($body['id']??0);$allowed=$isQuote?['new','reviewing','quoted','closed','cancelled']:['new','read','replied','closed'];$status=in_array($body['status']??'',$allowed,true)?$body['status']:null;if(!$id||!$status)azmt_error('Status məlumatı düzgün deyil.',422);azmt_pdo()->prepare("UPDATE {$table} SET status=? WHERE id=?")->execute([$status,$id]);azmt_audit('status_update',$isQuote?'quote':'contact',(string)$id,['status'=>$status]);azmt_json(['ok'=>true,'message'=>'Status yeniləndi.']);}
}

if ($route === 'admin.password' && $method === 'PUT') {
    azmt_verify_csrf();
    $body = azmt_body();
    $password = (string)($body['password'] ?? '');
    if (mb_strlen($password) < 8) azmt_error('Şifrə ən azı 8 simvol olmalıdır.', 422);
    azmt_pdo()->prepare('UPDATE azmt_admin_users SET password_hash=?, password_changed_at=NOW(), failed_attempts=0, locked_until=NULL WHERE id=?')->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    azmt_audit('password_update', 'admin_user', (string)$user['id']);
    azmt_json(['ok'=>true,'message'=>'Şifrə yeniləndi.']);
}

if ($route === 'admin.users') {
    azmt_require_auth(['super_admin']);
    if($method==='GET')azmt_json(['ok'=>true,'items'=>azmt_pdo()->query('SELECT id,username,full_name AS fullName,role,status,last_login_at AS lastLoginAt,created_at AS createdAt FROM azmt_admin_users ORDER BY id')->fetchAll()]);
    if($method==='POST'){azmt_verify_csrf();$body=azmt_body();$username=mb_strtolower(trim((string)($body['username']??'')));$password=(string)($body['password']??'');$name=azmt_clean_text($body['fullName']??'',140);if($username===''||$name===''||mb_strlen($password)<10)azmt_error('Ad, istifadəçi adı və ən azı 10 simvolluq şifrə tələb olunur.',422);$role=($body['role']??'admin')==='super_admin'?'super_admin':'admin';try{azmt_pdo()->prepare('INSERT INTO azmt_admin_users (username,password_hash,full_name,role) VALUES (?,?,?,?)')->execute([$username,password_hash($password,PASSWORD_DEFAULT),$name,$role]);azmt_audit('create','admin_user',(string)azmt_pdo()->lastInsertId());azmt_json(['ok'=>true,'message'=>'Admin istifadəçisi yaradıldı.'],201);}catch(PDOException){azmt_error('Bu istifadəçi adı artıq mövcuddur.',409);}}
}

azmt_error('API marşrutu tapılmadı.',404);
