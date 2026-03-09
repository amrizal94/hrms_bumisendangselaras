<?php

use Monolog\Handler\NullHandler;
use Monolog\Handler\StreamHandler;
use Monolog\Processor\PsrLogMessageProcessor;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Log Channel
    |--------------------------------------------------------------------------
    | Env variable LOG_CHANNEL controls this. Production uses 'daily' so logs
    | rotate automatically and don't grow unbounded.
    */

    'default' => env('LOG_CHANNEL', 'stack'),

    'deprecations' => [
        'channel' => env('LOG_DEPRECATIONS_CHANNEL', 'null'),
        'trace'   => env('LOG_DEPRECATIONS_TRACE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Log Channels
    |--------------------------------------------------------------------------
    */

    'channels' => [

        'stack' => [
            'driver'            => 'stack',
            'channels'          => explode(',', env('LOG_STACK', 'single')),
            'ignore_exceptions' => false,
        ],

        'single' => [
            'driver'    => 'single',
            'path'      => storage_path('logs/laravel.log'),
            'level'     => env('LOG_LEVEL', 'debug'),
            'replace_placeholders' => true,
        ],

        // Production: rotate daily, keep 30 days, gzip old files.
        'daily' => [
            'driver'    => 'daily',
            'path'      => storage_path('logs/laravel.log'),
            'level'     => env('LOG_LEVEL', 'debug'),
            'days'      => env('LOG_DAILY_DAYS', 30),
            'replace_placeholders' => true,
        ],

        'stderr' => [
            'driver'    => 'monolog',
            'level'     => env('LOG_LEVEL', 'debug'),
            'handler'   => StreamHandler::class,
            'formatter' => env('LOG_STDERR_FORMATTER'),
            'with'      => [
                'stream' => 'php://stderr',
            ],
            'processors' => [PsrLogMessageProcessor::class],
        ],

        'null' => [
            'driver'  => 'monolog',
            'handler' => NullHandler::class,
        ],

        'emergency' => [
            'path' => storage_path('logs/laravel.log'),
        ],
    ],
];
