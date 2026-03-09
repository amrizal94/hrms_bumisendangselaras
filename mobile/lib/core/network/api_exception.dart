class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  const ApiException({
    required this.message,
    this.statusCode,
    this.errors,
  });

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';

  factory ApiException.fromDioError(dynamic error) {
    if (error.response != null) {
      final data = error.response?.data;
      final message = data?['message'] ?? 'An error occurred';
      final errors = data?['errors'];
      return ApiException(
        message: message is String ? message : 'An error occurred',
        statusCode: error.response?.statusCode,
        errors: errors is Map<String, dynamic> ? errors : null,
      );
    }

    return const ApiException(
      message: 'Network error. Please check your connection.',
      statusCode: null,
    );
  }
}
