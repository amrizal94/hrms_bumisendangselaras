class MeetingModel {
  final int id;
  final String title;
  final String? description;
  final String meetingDate;  // 'YYYY-MM-DD'
  final String startTime;    // 'HH:mm:ss' or 'HH:mm'
  final String endTime;
  final String? location;
  final String? meetingUrl;
  final String targetRoles;
  final String? createdBy;
  final String? myRsvp;      // 'accepted' | 'declined' | null
  final int rsvpAccepted;
  final int rsvpDeclined;

  const MeetingModel({
    required this.id,
    required this.title,
    this.description,
    required this.meetingDate,
    required this.startTime,
    required this.endTime,
    this.location,
    this.meetingUrl,
    required this.targetRoles,
    this.createdBy,
    this.myRsvp,
    required this.rsvpAccepted,
    required this.rsvpDeclined,
  });

  factory MeetingModel.fromJson(Map<String, dynamic> j) {
    final counts = j['rsvp_counts'] as Map<String, dynamic>? ?? {};
    return MeetingModel(
      id:           j['id'] as int,
      title:        j['title'] as String,
      description:  j['description'] as String?,
      meetingDate:  j['meeting_date'] as String,
      startTime:    j['start_time'] as String,
      endTime:      j['end_time'] as String,
      location:     j['location'] as String?,
      meetingUrl:   j['meeting_url'] as String?,
      targetRoles:  j['target_roles'] as String,
      createdBy:    j['created_by'] as String?,
      myRsvp:       j['my_rsvp'] as String?,
      rsvpAccepted: counts['accepted'] as int? ?? 0,
      rsvpDeclined: counts['declined'] as int? ?? 0,
    );
  }

  bool get isUpcoming {
    final date = DateTime.tryParse(meetingDate);
    if (date == null) return false;
    final today = DateTime.now();
    return !date.isBefore(DateTime(today.year, today.month, today.day));
  }

  // Display time like '09:00'
  String get startTimeShort => startTime.length >= 5 ? startTime.substring(0, 5) : startTime;
  String get endTimeShort   => endTime.length   >= 5 ? endTime.substring(0, 5)   : endTime;
}
