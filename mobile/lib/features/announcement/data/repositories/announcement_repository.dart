import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../datasources/announcement_remote_datasource.dart';
import '../models/announcement_model.dart';

final announcementRepositoryProvider = Provider<AnnouncementRepository>(
  (ref) => AnnouncementRepository(ref.watch(announcementRemoteDataSourceProvider)),
);

class AnnouncementRepository {
  final AnnouncementRemoteDataSource _ds;
  AnnouncementRepository(this._ds);

  Future<List<AnnouncementModel>> getAnnouncements({String? category}) =>
      _ds.getAnnouncements(category: category);
}
