<?php

namespace App\Services;

use App\Models\FaceData;
use App\Models\User;
use Illuminate\Http\UploadedFile;

class FaceVerificationService
{
    const THRESHOLD = 0.5;

    /**
     * Verify that the face in $image matches the enrolled face of $user.
     * Returns confidence (0–100) on success.
     * Throws \RuntimeException on failure (no employee, not enrolled, no match).
     */
    public function verifyForUser(UploadedFile $image, User $user): float
    {
        $employee = $user->employee;
        if (!$employee) {
            throw new \RuntimeException('Akun belum terhubung data karyawan.');
        }

        $faceData = FaceData::where('employee_id', $employee->id)
            ->where('is_active', true)
            ->first();

        if (!$faceData) {
            throw new \RuntimeException('Wajah belum terdaftar. Silakan daftar wajah terlebih dahulu.');
        }

        $extracted = $this->extractDescriptor($image);

        $storedDescriptor = $faceData->getDescriptorArray();
        if (count($storedDescriptor) !== 128) {
            throw new \RuntimeException('Data wajah tidak valid. Silakan daftar ulang wajah Anda.');
        }

        $distance = FaceData::euclideanDistance($extracted['descriptor'], $storedDescriptor);

        if ($distance >= self::THRESHOLD) {
            throw new \RuntimeException(
                'Verifikasi wajah gagal. Pastikan Anda menggunakan akun sendiri.'
            );
        }

        return round((1 - $distance / self::THRESHOLD) * 100, 1);
    }

    /**
     * Call face-service (port 3003) to extract 128-d descriptor from image.
     */
    private function extractDescriptor(UploadedFile $image): array
    {
        $client = new \GuzzleHttp\Client(['timeout' => 15]);

        try {
            $response = $client->post('http://127.0.0.1:3003/extract', [
                'multipart' => [
                    [
                        'name'     => 'image',
                        'contents' => fopen($image->getRealPath(), 'r'),
                        'filename' => $image->getClientOriginalName(),
                    ],
                ],
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if (!isset($body['descriptor']) || count($body['descriptor']) !== 128) {
                throw new \RuntimeException('Invalid descriptor returned from face service.');
            }

            return $body;
        } catch (\GuzzleHttp\Exception\ConnectException) {
            throw new \RuntimeException('Face service unavailable. Please try again later.');
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $body = json_decode($e->getResponse()->getBody()->getContents(), true);
            throw new \RuntimeException($body['error'] ?? 'Face extraction failed.');
        }
    }
}
