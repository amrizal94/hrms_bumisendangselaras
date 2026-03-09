'use client'

import { useState } from 'react'
import { Video, MapPin, Check, X } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMyMeetings, useRsvpMeeting } from '@/hooks/use-meetings'
import type { Meeting } from '@/types/meeting'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr + 'T00:00:00') >= new Date(new Date().toDateString())
}

// ── Filter ────────────────────────────────────────────────────────────────────

type Filter = 'upcoming' | 'all' | 'past'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all',      label: 'All' },
  { key: 'past',     label: 'Past' },
]

// ── RSVP Buttons ──────────────────────────────────────────────────────────────

function RsvpButtons({ meeting }: { meeting: Meeting }) {
  const rsvp = useRsvpMeeting()
  const current = meeting.my_rsvp

  if (current) {
    return (
      <span className={cn(
        'text-xs font-medium px-2 py-1 rounded-full',
        current === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      )}>
        {current === 'accepted' ? '✓ You accepted' : '✗ You declined'}
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={rsvp.isPending}
        onClick={() => rsvp.mutate({ id: meeting.id, status: 'accepted' })}
        className="flex items-center gap-1 text-xs border border-green-500 text-green-600 hover:bg-green-50 rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50"
      >
        <Check className="w-3 h-3" /> Accept
      </button>
      <button
        disabled={rsvp.isPending}
        onClick={() => rsvp.mutate({ id: meeting.id, status: 'declined' })}
        className="flex items-center gap-1 text-xs border border-red-400 text-red-500 hover:bg-red-50 rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50"
      >
        <X className="w-3 h-3" /> Decline
      </button>
    </div>
  )
}

// ── Meeting Card ──────────────────────────────────────────────────────────────

function MeetingCard({ meeting }: { meeting: Meeting }) {
  const upcoming = isUpcoming(meeting.meeting_date)

  return (
    <div className="relative rounded-xl border bg-card overflow-hidden flex">
      <div className={cn('w-1.5 shrink-0', upcoming ? 'bg-blue-500' : 'bg-slate-300')} />
      <div className="flex-1 p-5">
        <div className="flex items-start gap-4">
          {/* Date badge */}
          <div className={cn(
            'rounded-xl flex flex-col items-center justify-center w-14 h-14 shrink-0',
            upcoming ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
          )}>
            <span className="text-xl font-bold leading-none">
              {new Date(meeting.meeting_date + 'T00:00:00').getDate()}
            </span>
            <span className="text-xs font-medium">
              {new Date(meeting.meeting_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{meeting.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meeting.start_time.slice(0, 5)} – {meeting.end_time.slice(0, 5)}
              {' · '}
              {fmtDate(meeting.meeting_date)}
            </p>

            {meeting.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{meeting.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {meeting.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {meeting.location}
                </span>
              )}
              {meeting.meeting_url && (
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <Video className="w-3 h-3" /> Join Meeting
                </a>
              )}
            </div>

            {/* RSVP section */}
            {upcoming && (
              <div className="mt-3">
                <RsvpButtons meeting={meeting} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffMeetingsPage() {
  const [filter, setFilter] = useState<Filter>('upcoming')
  const { data: meetings = [], isLoading } = useMyMeetings()

  const filtered = meetings.filter(m => {
    if (filter === 'upcoming') return isUpcoming(m.meeting_date)
    if (filter === 'past') return !isUpcoming(m.meeting_date)
    return true
  })

  return (
    <DashboardLayout title="Meetings">
      <p className="text-sm text-muted-foreground mb-5">View your scheduled meetings and RSVP</p>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === 'upcoming' ? 'No upcoming meetings.' : 'No meetings found.'}
          </p>
          {filter !== 'all' && (
            <Button variant="outline" className="mt-4" onClick={() => setFilter('all')}>
              View all meetings
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
