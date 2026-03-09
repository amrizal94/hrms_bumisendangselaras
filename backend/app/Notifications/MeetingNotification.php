<?php

namespace App\Notifications;

use App\Models\Meeting;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class MeetingNotification extends Notification
{
    use Queueable;

    public function __construct(protected Meeting $meeting) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $date = $this->meeting->meeting_date->format('d M Y');
        return [
            'type'       => 'meeting',
            'title'      => $this->meeting->title,
            'message'    => "Meeting on {$date} {$this->meeting->start_time}–{$this->meeting->end_time}",
            'meeting_id' => $this->meeting->id,
            'link'       => '/meetings',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $date = $this->meeting->meeting_date->format('d M Y');
        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title($this->meeting->title)
                    ->body("Meeting on {$date} {$this->meeting->start_time}–{$this->meeting->end_time}")
            )
            ->data([
                'type'       => 'meeting',
                'meeting_id' => (string) $this->meeting->id,
                'link'       => '/meetings',
            ]);
    }
}
