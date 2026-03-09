<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class TaskStatusChanged extends Notification
{
    use Queueable;

    public function __construct(protected Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type'    => 'task_status',
            'title'   => 'Task Cancelled',
            'message' => "Task \"{$this->task->title}\" has been cancelled.",
            'task_id' => $this->task->id,
            'link'    => '/staff/tasks',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title('Task Cancelled')
                    ->body("Task \"{$this->task->title}\" has been cancelled.")
            )
            ->data([
                'type'    => 'task_status',
                'task_id' => (string) $this->task->id,
                'link'    => '/staff/tasks',
            ]);
    }
}
