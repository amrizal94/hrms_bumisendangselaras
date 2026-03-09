import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../../core/network/dio_client.dart';
import '../models/meeting_model.dart';

class MeetingRemoteDatasource {
  final Dio _dio;
  MeetingRemoteDatasource(this._dio);

  Future<List<MeetingModel>> getMyMeetings() async {
    try {
      final res  = await _dio.get(ApiConstants.myMeetings);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data.map((e) => MeetingModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<List<MeetingModel>> getMeetings() async {
    try {
      final res  = await _dio.get(ApiConstants.meetings);
      final body = res.data as Map<String, dynamic>;
      final data = body['data'] as List;
      return data.map((e) => MeetingModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<MeetingModel> createMeeting({
    required String title,
    String? description,
    required String meetingDate,
    required String startTime,
    required String endTime,
    String? location,
    String? meetingUrl,
    String targetRoles = 'all',
  }) async {
    try {
      final res  = await _dio.post(ApiConstants.meetings, data: {
        'title':        title,
        if (description != null && description.isNotEmpty) 'description': description,
        'meeting_date': meetingDate,
        'start_time':   startTime,
        'end_time':     endTime,
        if (location != null && location.isNotEmpty) 'location': location,
        if (meetingUrl != null && meetingUrl.isNotEmpty) 'meeting_url': meetingUrl,
        'target_roles': targetRoles,
      });
      final body = res.data as Map<String, dynamic>;
      return MeetingModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<MeetingModel> updateMeeting({
    required int id,
    required Map<String, dynamic> data,
  }) async {
    try {
      final res  = await _dio.put('${ApiConstants.meetings}/$id', data: data);
      final body = res.data as Map<String, dynamic>;
      return MeetingModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<void> deleteMeeting(int id) async {
    try {
      await _dio.delete('${ApiConstants.meetings}/$id');
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<MeetingModel> rsvp(int meetingId, String status) async {
    try {
      final res  = await _dio.post('${ApiConstants.meetings}/$meetingId/rsvp', data: {'status': status});
      final body = res.data as Map<String, dynamic>;
      return MeetingModel.fromJson(body['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<Map<String, dynamic>> getRsvpList(int meetingId) async {
    try {
      final res  = await _dio.get('${ApiConstants.meetings}/$meetingId/rsvps');
      final body = res.data as Map<String, dynamic>;
      return body['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}

final meetingRemoteDatasourceProvider = Provider<MeetingRemoteDatasource>(
  (ref) => MeetingRemoteDatasource(ref.watch(dioClientProvider)),
);
