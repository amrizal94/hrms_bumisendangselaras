<?php

namespace App\Notifications;

use App\Models\OvertimeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class OvertimeStatusChanged extends Notification
{
    use Queueable;

    public function __construct(protected OvertimeRequest $overtimeRequest) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $status = $this->overtimeRequest->status;
        $date   = $this->overtimeRequest->date?->toDateString();
        $hours  = $this->overtimeRequest->overtime_hours;

        return [
            'type'       => 'overtime_status',
            'title'      => match ($status) {
                'approved' => 'Overtime Request Approved',
                'rejected' => 'Overtime Request Rejected',
                'cancelled'=> 'Overtime Request Cancelled',
                default    => 'Overtime Request Updated',
            },
            'message'    => match ($status) {
                'approved' => "Your overtime request on {$date} ({$hours}h) has been approved.",
                'rejected' => "Your overtime request on {$date} ({$hours}h) has been rejected." .
                    ($this->overtimeRequest->rejection_reason ? " Reason: {$this->overtimeRequest->rejection_reason}" : ''),
                'cancelled'=> "Your overtime request on {$date} ({$hours}h) has been cancelled.",
                default    => "Your overtime request status has changed to {$status}.",
            },
            'status'     => $status,
            'request_id' => $this->overtimeRequest->id,
            'link'       => '/staff/overtime',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $status = $this->overtimeRequest->status;
        $date   = $this->overtimeRequest->date?->toDateString();
        $hours  = $this->overtimeRequest->overtime_hours;

        $title = match ($status) {
            'approved' => 'Overtime Request Approved',
            'rejected' => 'Overtime Request Rejected',
            'cancelled'=> 'Overtime Request Cancelled',
            default    => 'Overtime Request Updated',
        };

        $body = match ($status) {
            'approved' => "Your overtime request on {$date} ({$hours}h) has been approved.",
            'rejected' => "Your overtime request on {$date} ({$hours}h) has been rejected." .
                ($this->overtimeRequest->rejection_reason ? " Reason: {$this->overtimeRequest->rejection_reason}" : ''),
            'cancelled'=> "Your overtime request on {$date} ({$hours}h) has been cancelled.",
            default    => "Your overtime request status has changed to {$status}.",
        };

        return FcmMessage::create()
            ->notification(FcmNotification::create()->title($title)->body($body))
            ->data([
                'type'       => 'overtime_status',
                'status'     => $status,
                'request_id' => (string) $this->overtimeRequest->id,
                'link'       => '/staff/overtime',
            ]);
    }
}
