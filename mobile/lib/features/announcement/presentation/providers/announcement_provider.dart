import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/announcement_model.dart';
import '../../data/repositories/announcement_repository.dart';

final announcementsProvider = FutureProvider.autoDispose<List<AnnouncementModel>>((ref) {
  return ref.watch(announcementRepositoryProvider).getAnnouncements();
});

final announcementsByCategoryProvider =
    FutureProvider.autoDispose.family<List<AnnouncementModel>, String>((ref, category) {
  return ref.watch(announcementRepositoryProvider).getAnnouncements(category: category);
});
