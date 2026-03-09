<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Migrate existing plain-JSON face descriptors to AES-256-CBC encrypted form.
 *
 * The FaceData model now uses 'encrypted:array' cast on the descriptor column.
 * That cast stores: Crypt::encrypt($jsonString, false) — no PHP serialize.
 *
 * Plain-JSON rows (the old format) always start with '['.
 * Encrypted rows (Laravel envelope) start with 'eyJ' (base64 of {"iv":...}).
 *
 * This migration is idempotent: rows already encrypted are skipped.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rows = DB::table('face_data')->get(['id', 'descriptor']);

        $encrypted = 0;
        $skipped   = 0;

        foreach ($rows as $row) {
            $raw = $row->descriptor;

            // Detect plain JSON: starts with '[' (a JSON array)
            if (!str_starts_with(ltrim($raw), '[')) {
                $skipped++;
                continue; // already encrypted or invalid — skip
            }

            $arr = json_decode($raw, true);

            if (!is_array($arr) || count($arr) !== 128) {
                Log::warning("face_data row {$row->id}: unexpected descriptor format, skipping.");
                $skipped++;
                continue;
            }

            // Encrypt exactly as Laravel's encrypted:array cast does on write:
            // json_encode the array, then Crypt::encrypt(..., false) (no PHP serialize)
            $ciphertext = Crypt::encrypt(json_encode($arr), false);

            DB::table('face_data')->where('id', $row->id)->update(['descriptor' => $ciphertext]);
            $encrypted++;
        }

        Log::info("face_data descriptor encryption: {$encrypted} encrypted, {$skipped} skipped.");
    }

    public function down(): void
    {
        // Decrypt back to plain JSON (for rollback)
        $rows = DB::table('face_data')->get(['id', 'descriptor']);

        foreach ($rows as $row) {
            $raw = $row->descriptor;

            // Skip rows that look like plain JSON already
            if (str_starts_with(ltrim($raw), '[')) {
                continue;
            }

            try {
                $jsonString = Crypt::decrypt($raw, false);
                DB::table('face_data')->where('id', $row->id)->update(['descriptor' => $jsonString]);
            } catch (\Exception $e) {
                Log::warning("face_data row {$row->id}: could not decrypt on rollback — {$e->getMessage()}");
            }
        }
    }
};
