<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Assigns a correlation ID to every request.
 *
 * - Reads X-Request-ID from the incoming request (if provided by caller/load-balancer).
 * - Falls back to a fresh UUID v4.
 * - Injects the ID into all subsequent Log calls for this request via withContext().
 * - Echoes the ID back in the response header so clients can correlate logs.
 * - Logs a structured access-log entry after the response is built.
 */
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('X-Request-ID') ?: (string) Str::uuid();

        // All Log::*() calls in this request lifecycle will include request_id automatically.
        Log::withContext(['request_id' => $requestId]);

        $startTime = microtime(true);

        $response = $next($request);

        $durationMs = (int) round((microtime(true) - $startTime) * 1000);

        // Echo correlation ID back so mobile/web clients and load-balancers can trace it.
        $response->headers->set('X-Request-ID', $requestId);

        // Structured access log — readable by log aggregators (Loki, Datadog, CloudWatch, etc.)
        Log::info('api_request', [
            'method'  => $request->method(),
            'path'    => $request->path(),
            'status'  => $response->getStatusCode(),
            'ms'      => $durationMs,
            'ip'      => $request->ip(),
            'user_id' => $request->user()?->id,
        ]);

        return $response;
    }
}
