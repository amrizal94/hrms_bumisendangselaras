<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class TaskSelfReported extends Notification
{
    use Queueable;

    public function __construct(protected Task $task) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $staffName   = $this->task->creator?->name ?? 'Staff';
        $projectName = $this->task->project?->name ?? 'No Project';

        return [
            'type'       => 'task_self_reported',
            'title'      => 'Laporan Tugas Baru',
            'message'    => "{$staffName} melaporkan tugas: \"{$this->task->title}\" di project {$projectName}",
            'task_id'    => $this->task->id,
            'project_id' => $this->task->project_id,
            'link'       => "/admin/projects/{$this->task->project_id}/tasks",
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $staffName   = $this->task->creator?->name ?? 'Staff';
        $projectName = $this->task->project?->name ?? 'No Project';

        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title('Laporan Tugas Baru')
                    ->body("{$staffName} melaporkan tugas: \"{$this->task->title}\" di project {$projectName}")
            )
            ->data([
                'type'       => 'task_self_reported',
                'task_id'    => (string) $this->task->id,
                'project_id' => (string) $this->task->project_id,
                'link'       => "/admin/projects/{$this->task->project_id}/tasks",
            ]);
    }
}
