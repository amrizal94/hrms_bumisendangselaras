<?php
namespace Database\Seeders;

use App\Models\AssetCategory;
use Illuminate\Database\Seeder;

class AssetCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Laptop', 'code' => 'LAP', 'description' => 'Laptop dan notebook'],
            ['name' => 'Monitor', 'code' => 'MON', 'description' => 'Monitor dan display'],
            ['name' => 'Komputer', 'code' => 'CPU', 'description' => 'Desktop PC dan komputer'],
            ['name' => 'Printer', 'code' => 'PRT', 'description' => 'Printer dan scanner'],
            ['name' => 'Kendaraan', 'code' => 'VHC', 'description' => 'Kendaraan perusahaan'],
            ['name' => 'Furnitur', 'code' => 'FRN', 'description' => 'Meja, kursi, lemari'],
            ['name' => 'Jaringan', 'code' => 'NET', 'description' => 'Router, switch, kabel'],
            ['name' => 'Telepon', 'code' => 'TEL', 'description' => 'Telepon dan handphone'],
            ['name' => 'Lainnya', 'code' => 'OTH', 'description' => 'Aset lainnya'],
        ];

        foreach ($categories as $cat) {
            AssetCategory::firstOrCreate(['code' => $cat['code']], $cat);
        }
    }
}
