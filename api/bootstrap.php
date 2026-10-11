<?php
declare(strict_types=1);

const AZMT_ROOT = __DIR__ . '/..';

function azmt_config(): array
{
    static $config;
    if (is_array($config)) return $config;
    $paths = [
        dirname(__DIR__, 2) . '/app_private/config.php',
        __DIR__ . '/config.php',
    ];
    foreach ($paths as $path) {
        if (is_file($path)) {
            $loaded = require $path;
            if (is_array($loaded)) return $config = $loaded;
        }
    }
    throw new RuntimeException('Server konfiqurasiyası tapılmadı.');
}

function azmt_pdo(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) return $pdo;
    $db = azmt_config()['db'];
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $db['host'], $db['port'] ?? 3306, $db['name'], $db['charset'] ?? 'utf8mb4');
    return $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function azmt_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name(azmt_config()['session_name'] ?? 'azmt_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

function azmt_json(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function azmt_error(string $message, int $status = 400, array $errors = []): never
{
    azmt_json(['ok' => false, 'message' => $message, 'errors' => (object)$errors], $status);
}

function azmt_body(): array
{
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($type, 'application/json')) {
        $decoded = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($decoded)) azmt_error('Göndərilən JSON düzgün deyil.');
        return $decoded;
    }
    return $_POST;
}

function azmt_user(): ?array
{
    azmt_start_session();
    return isset($_SESSION['admin']) && is_array($_SESSION['admin']) ? $_SESSION['admin'] : null;
}

function azmt_require_auth(array $roles = []): array
{
    $user = azmt_user();
    if (!$user) azmt_error('Sessiya bitib. Yenidən daxil olun.', 401);
    if ($roles && !in_array($user['role'], $roles, true)) azmt_error('Bu əməliyyat üçün icazəniz yoxdur.', 403);
    return $user;
}

function azmt_verify_csrf(): void
{
    azmt_start_session();
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    if (!$token || !hash_equals((string)($_SESSION['csrf'] ?? ''), (string)$token)) {
        azmt_error('Təhlükəsizlik nişanı etibarsızdır. Səhifəni yeniləyin.', 419);
    }
}

function azmt_slug(string $value): string
{
    $map = ['ə'=>'e','Ə'=>'e','ı'=>'i','İ'=>'i','ö'=>'o','Ö'=>'o','ü'=>'u','Ü'=>'u','ş'=>'s','Ş'=>'s','ç'=>'c','Ç'=>'c','ğ'=>'g','Ğ'=>'g'];
    $value = strtr(trim($value), $map);
    $value = strtolower((string)preg_replace('/[^a-zA-Z0-9]+/u', '-', $value));
    return trim($value, '-') ?: bin2hex(random_bytes(4));
}

function azmt_int(mixed $value, int $default = 0): int
{
    return filter_var($value, FILTER_VALIDATE_INT) !== false ? (int)$value : $default;
}

function azmt_nullable_int(mixed $value): ?int
{
    if ($value === null || $value === '') return null;
    return filter_var($value, FILTER_VALIDATE_INT) !== false ? (int)$value : null;
}

function azmt_clean_text(mixed $value, int $max = 5000): string
{
    return mb_substr(trim(strip_tags((string)$value)), 0, $max);
}

function azmt_origin_guard(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!$origin) return;
    $allowed = rtrim((string)(azmt_config()['app_url'] ?? ''), '/');
    if ($allowed && !hash_equals($allowed, rtrim($origin, '/'))) azmt_error('Sorğu mənbəyi qəbul edilmir.', 403);
}

function azmt_audit(string $action, string $entity, ?string $entityId = null, array $details = []): void
{
    try {
        $user = azmt_user();
        $stmt = azmt_pdo()->prepare('INSERT INTO azmt_audit_logs (admin_user_id, action, entity_type, entity_id, details_json, ip_address, user_agent) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$user['id'] ?? null, $action, $entity, $entityId, json_encode($details, JSON_UNESCAPED_UNICODE), $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255)]);
    } catch (Throwable) {
        // Audit logging must never break the requested operation.
    }
}

function azmt_upload_error_message(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Fayl icazə verilən ölçüdən böyükdür.',
        UPLOAD_ERR_PARTIAL => 'Fayl tam yüklənmədi.',
        UPLOAD_ERR_NO_FILE => 'Fayl seçilməyib.',
        default => 'Fayl yüklənərkən xəta baş verdi.',
    };
}

function azmt_store_attachment(array $file, string $context): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) azmt_error(azmt_upload_error_message((int)($file['error'] ?? UPLOAD_ERR_NO_FILE)), 422);
    $config = azmt_config();
    if (($file['size'] ?? 0) > ($config['max_attachment_bytes'] ?? 12582912)) azmt_error('Fayl maksimum 12 MB ola bilər.', 422);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($file['tmp_name']);
    $allowed = [
        'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp',
        'application/pdf'=>'pdf','application/msword'=>'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'=>'docx',
        'application/vnd.ms-excel'=>'xls','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'=>'xlsx',
    ];
    if (!isset($allowed[$mime])) azmt_error('Bu fayl növü qəbul edilmir. JPG, PNG, WEBP, PDF, DOC, DOCX, XLS və XLSX istifadə edin.', 422);
    $base = rtrim($config['private_upload_dir'], '/\\') . DIRECTORY_SEPARATOR . $context . DIRECTORY_SEPARATOR . date('Y/m');
    if (!is_dir($base) && !mkdir($base, 0750, true) && !is_dir($base)) azmt_error('Fayl qovluğu yaradıla bilmədi.', 500);
    $stored = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    $path = $base . DIRECTORY_SEPARATOR . $stored;
    if (!move_uploaded_file($file['tmp_name'], $path)) azmt_error('Fayl saxlanmadı.', 500);
    return ['path'=>$path,'name'=>mb_substr(basename((string)$file['name']),0,255),'mime'=>$mime,'size'=>(int)$file['size']];
}

function azmt_store_image(array $file, string $alt = ''): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) azmt_error(azmt_upload_error_message((int)($file['error'] ?? UPLOAD_ERR_NO_FILE)), 422);
    $config = azmt_config();
    if (($file['size'] ?? 0) > ($config['max_image_bytes'] ?? 8388608)) azmt_error('Şəkil maksimum 8 MB ola bilər.', 422);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string)$finfo->file($file['tmp_name']);
    $ext = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime] ?? null;
    if (!$ext) azmt_error('Yalnız JPG, JPEG, PNG və WEBP şəkilləri qəbul edilir.', 422);
    $size = @getimagesize($file['tmp_name']);
    if (!$size || $size[0] < 120 || $size[1] < 120) azmt_error('Şəklin ölçüsü ən azı 120×120 piksel olmalıdır.', 422);
    $relative = date('Y/m');
    $base = rtrim($config['public_upload_dir'], '/\\') . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
    if (!is_dir($base) && !mkdir($base, 0755, true) && !is_dir($base)) azmt_error('Şəkil qovluğu yaradıla bilmədi.', 500);
    $stored = bin2hex(random_bytes(16)) . '.' . $ext;
    $path = $base . DIRECTORY_SEPARATOR . $stored;
    if (!move_uploaded_file($file['tmp_name'], $path)) azmt_error('Şəkil saxlanmadı.', 500);
    $url = rtrim($config['public_upload_url'] ?? '/uploads/media', '/') . '/' . $relative . '/' . $stored;
    $stmt = azmt_pdo()->prepare('INSERT INTO azmt_media_files (original_name, stored_name, mime_type, file_size, width, height, storage_scope, file_path, public_url, alt_text, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $user = azmt_user();
    $stmt->execute([mb_substr(basename((string)$file['name']),0,255),$stored,$mime,(int)$file['size'],(int)$size[0],(int)$size[1],'public',$path,$url,azmt_clean_text($alt,255),$user['id'] ?? null]);
    return ['id'=>(int)azmt_pdo()->lastInsertId(),'url'=>$url,'width'=>(int)$size[0],'height'=>(int)$size[1],'name'=>basename((string)$file['name'])];
}

function azmt_paginate(string $sql, array $params, int $page, int $perPage): array
{
    $page = max(1, $page);
    $perPage = max(1, min(100, $perPage));
    $countSql = 'SELECT COUNT(*) FROM (' . $sql . ') azmt_count';
    $count = azmt_pdo()->prepare($countSql);
    $count->execute($params);
    $total = (int)$count->fetchColumn();
    $query = azmt_pdo()->prepare($sql . ' LIMIT ' . $perPage . ' OFFSET ' . (($page - 1) * $perPage));
    $query->execute($params);
    return ['items'=>$query->fetchAll(),'pagination'=>['page'=>$page,'perPage'=>$perPage,'total'=>$total,'pages'=>max(1,(int)ceil($total/$perPage))]];
}
