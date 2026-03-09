<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class TaskIdleReminder extends Notification
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
                    ->title('Belum ada aktivitas tugas')
                    ->body('Sudah 2 jam kamu check-in. Jangan lupa laporkan progres tugasmu!')
            )
            ->data([
                'type' => 'task_idle',
                'link' => '/staff/tasks',
            ]);
    }
}
