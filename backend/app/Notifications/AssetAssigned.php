<?php

namespace App\Notifications;

use App\Models\AssetAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class AssetAssigned extends Notification
{
    use Queueable;

    public function __construct(
        public readonly AssetAssignment $assignment,
        public readonly string $action
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $asset     = $this->assignment->asset;
        $assetName = $asset?->name ?? 'Aset';
        $assetCode = $asset?->asset_code ?? '';

        if ($this->action === 'assigned') {
            $title = 'Aset Dipinjamkan';
            $body  = "Aset {$assetName} ({$assetCode}) telah dipinjamkan kepada Anda";
        } else {
            $title = 'Aset Dikembalikan';
            $body  = "Aset {$assetName} ({$assetCode}) telah berhasil dikembalikan";
        }

        return [
            'type'          => 'asset_' . $this->action,
            'title'         => $title,
            'body'          => $body,
            'assignment_id' => $this->assignment->id,
            'asset_id'      => $asset?->id,
            'link'          => '/staff/assets',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $asset     = $this->assignment->asset;
        $assetName = $asset?->name ?? 'Aset';
        $assetCode = $asset?->asset_code ?? '';

        if ($this->action === 'assigned') {
            $title = 'Aset Dipinjamkan';
            $body  = "Aset {$assetName} ({$assetCode}) telah dipinjamkan kepada Anda";
        } else {
            $title = 'Aset Dikembalikan';
            $body  = "Aset {$assetName} ({$assetCode}) telah berhasil dikembalikan";
        }

        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title($title)
                    ->body($body)
            )
            ->data([
                'type'          => 'asset_' . $this->action,
                'assignment_id' => (string) $this->assignment->id,
                'asset_id'      => (string) ($asset?->id ?? ''),
                'link'          => '/staff/assets',
            ]);
    }
}
