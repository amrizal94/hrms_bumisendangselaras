<?php

namespace App\Notifications;

use App\Models\PayrollRecord;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Fcm\FcmChannel;
use NotificationChannels\Fcm\FcmMessage;
use NotificationChannels\Fcm\Resources\Notification as FcmNotification;

class PayrollPaid extends Notification
{
    use Queueable;

    public function __construct(protected PayrollRecord $payroll) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $month  = date('F Y', mktime(0, 0, 0, $this->payroll->period_month, 1, $this->payroll->period_year));
        $net    = number_format((float) $this->payroll->net_salary, 0, ',', '.');

        return [
            'type'       => 'payroll_paid',
            'title'      => 'Payslip Ready',
            'message'    => "Your salary for {$month} (Rp {$net}) has been paid. Check your payslip.",
            'payroll_id' => $this->payroll->id,
            'link'       => '/staff/payslip',
        ];
    }

    public function toFcm(object $notifiable): FcmMessage
    {
        $month = date('F Y', mktime(0, 0, 0, $this->payroll->period_month, 1, $this->payroll->period_year));
        $net   = number_format((float) $this->payroll->net_salary, 0, ',', '.');

        return FcmMessage::create()
            ->notification(
                FcmNotification::create()
                    ->title('Payslip Ready')
                    ->body("Your salary for {$month} (Rp {$net}) has been paid. Check your payslip.")
            )
            ->data([
                'type'       => 'payroll_paid',
                'payroll_id' => (string) $this->payroll->id,
                'link'       => '/staff/payslip',
            ]);
    }
}
