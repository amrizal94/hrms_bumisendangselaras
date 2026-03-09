<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class SecurityLoginAlert extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return [FcmChannel::class];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title('Peringatan Keamanan')
                    ->body('Akun Anda baru saja diakses dari perangkat lain. Jika bukan Anda, segera hubungi admin.')
            )
            ->data([
                'type' => 'security_login',
                'link' => '',
            ]);
    }
}
