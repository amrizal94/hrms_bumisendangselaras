<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    // ---------------------------------------------------------------
    // Get a setting value by key (with optional default)
    // ---------------------------------------------------------------
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    // ---------------------------------------------------------------
    // Set (upsert) a setting value
    // ---------------------------------------------------------------
    public static function set(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group]
        );
    }

    // ---------------------------------------------------------------
    // Get all settings as key => value map, optionally filtered by group
    // ---------------------------------------------------------------
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }

    // ---------------------------------------------------------------
    // Bulk upsert settings from an associative array
    // ---------------------------------------------------------------
    public static function setMany(array $data, string $group): void
    {
        foreach ($data as $key => $value) {
            static::set($key, $value, $group);
        }
    }
}
