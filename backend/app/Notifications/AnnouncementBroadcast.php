<?php

namespace App\Notifications;

use App\Models\Announcement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class AnnouncementBroadcast extends Notification
{
    use Queueable;

    public function __construct(protected Announcement $announcement) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'            => 'announcement',
            'title'           => $this->announcement->title,
            'message'         => mb_substr($this->announcement->content, 0, 120),
            'announcement_id' => $this->announcement->id,
            'category'        => $this->announcement->category,
            'priority'        => $this->announcement->priority,
            'link'            => '/announcements',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title($this->announcement->title)
                    ->body(mb_substr($this->announcement->content, 0, 120))
            )
            ->data([
                'type'            => 'announcement',
                'announcement_id' => (string) $this->announcement->id,
                'category'        => $this->announcement->category,
                'priority'        => $this->announcement->priority,
                'link'            => '/announcements',
            ]);
    }
}
