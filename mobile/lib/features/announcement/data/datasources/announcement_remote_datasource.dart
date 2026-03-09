import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/announcement_model.dart';

final announcementRemoteDataSourceProvider = Provider<AnnouncementRemoteDataSource>(
  (ref) => AnnouncementRemoteDataSource(ref.watch(dioClientProvider)),
);

class AnnouncementRemoteDataSource {
  final Dio _dio;
  AnnouncementRemoteDataSource(this._dio);

  Future<List<AnnouncementModel>> getAnnouncements({String? category}) async {
    try {
      final params = <String, dynamic>{};
      if (category != null) params['category'] = category;

      final res = await _dio.get(ApiConstants.announcements, queryParameters: params);
      return (res.data['data'] as List)
          .map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
