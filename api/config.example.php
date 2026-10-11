<?php
declare(strict_types=1);

return [
    'app_url' => 'https://azmillitechizat.az',
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'database_name',
        'user' => 'database_user',
        'pass' => 'database_password',
        'charset' => 'utf8mb4',
    ],
    'install_token' => 'replace-with-a-long-random-token',
    'session_name' => 'azmt_admin',
    'private_upload_dir' => dirname(__DIR__, 2) . '/app_private/uploads',
    'public_upload_dir' => dirname(__DIR__) . '/uploads/media',
    'public_upload_url' => '/uploads/media',
    'max_image_bytes' => 8 * 1024 * 1024,
    'max_attachment_bytes' => 12 * 1024 * 1024,
];
