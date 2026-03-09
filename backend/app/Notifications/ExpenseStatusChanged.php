<?php

namespace App\Notifications;

use App\Models\Expense;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class ExpenseStatusChanged extends Notification
{
    use Queueable;

    public function __construct(protected Expense $expense) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $status  = $this->expense->status;
        $amount  = number_format((float) $this->expense->amount, 0, ',', '.');
        $date    = $this->expense->expense_date?->toDateString();

        return [
            'type'       => 'expense_status',
            'title'      => match ($status) {
                'approved' => 'Expense Approved',
                'rejected' => 'Expense Rejected',
                default    => 'Expense Updated',
            },
            'message'    => match ($status) {
                'approved' => "Your expense of Rp {$amount} on {$date} has been approved.",
                'rejected' => "Your expense of Rp {$amount} on {$date} has been rejected." .
                    ($this->expense->rejection_reason ? " Reason: {$this->expense->rejection_reason}" : ''),
                default    => "Your expense status has changed to {$status}.",
            },
            'status'     => $status,
            'expense_id' => $this->expense->id,
            'link'       => '/staff/expenses',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $status  = $this->expense->status;
        $amount  = number_format((float) $this->expense->amount, 0, ',', '.');
        $date    = $this->expense->expense_date?->toDateString();

        $title = match ($status) {
            'approved' => 'Expense Approved',
            'rejected' => 'Expense Rejected',
            default    => 'Expense Updated',
        };

        $body = match ($status) {
            'approved' => "Your expense of Rp {$amount} on {$date} has been approved.",
            'rejected' => "Your expense of Rp {$amount} on {$date} has been rejected." .
                ($this->expense->rejection_reason ? " Reason: {$this->expense->rejection_reason}" : ''),
            default    => "Your expense status has changed to {$status}.",
        };

        return FcmMessage::create()
            ->notification(FcmNotification::create()->title($title)->body($body))
            ->data([
                'type'       => 'expense_status',
                'status'     => $status,
                'expense_id' => (string) $this->expense->id,
                'link'       => '/staff/expenses',
            ]);
    }
}
