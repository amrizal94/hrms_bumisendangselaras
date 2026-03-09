<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                      => ['sometimes', 'string', 'max:255'],
            'email'                     => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)->whereNull('deleted_at')],
            'phone'                     => ['sometimes', 'nullable', 'string', 'max:20'],
            'current_password_for_email'=> ['sometimes', 'nullable', 'string'],
            'current_password'          => ['required_with:password', 'string'],
            'password'                  => ['sometimes', 'confirmed', Password::min(8)],
        ]);

        // Require password verification when email is being changed
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $pw = $request->input('current_password_for_email');
            if (!$pw) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password required to change email address.',
                    'errors'  => ['current_password_for_email' => ['Your current password is required to change email.']],
                ], 422);
            }
            if (!Hash::check($pw, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Incorrect password.',
                    'errors'  => ['current_password_for_email' => ['The password you entered is incorrect.']],
                ], 422);
            }
        }

        // Verify current password if changing password
        if (isset($validated['current_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect.',
                    'errors'  => ['current_password' => ['The current password is incorrect.']],
                ], 422);
            }
        }

        // Update user data
        $updateData = array_filter([
            'name'  => $validated['name']  ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ], fn($v) => $v !== null);

        if (isset($validated['password'])) {
            $updateData['password'] = $validated['password'];
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => new UserResource($user->fresh()),
            ],
        ]);
    }

    /**
     * Force-change password on first login.
     * Does not require current password — user is already authenticated.
     * Clears the must_change_password flag on success.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();
        $user->update([
            'password'             => $request->string('password'),
            'must_change_password' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'data'    => ['user' => new UserResource($user->fresh())],
        ]);
    }

    /**
     * Delete (soft) the authenticated user's own account.
     * Safeguard: cannot delete if sole active admin or director.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();

        // Safeguard — prevent deleting the last active admin or director
        foreach ($user->getRoleNames() as $role) {
            if (in_array($role, ['admin', 'director'])) {
                $remaining = User::whereHas('roles', fn($q) => $q->where('name', $role))
                    ->where('id', '!=', $user->id)
                    ->whereNull('deleted_at')
                    ->count();
                if ($remaining === 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "Cannot delete — you are the only active {$role} account.",
                    ], 422);
                }
            }
        }

        // Revoke all tokens
        $user->tokens()->delete();

        // Soft-delete linked employee record if exists
        $user->employee?->delete();

        // Soft-delete user
        $user->delete();

        return response()->json(['success' => true, 'message' => 'Account deleted successfully.']);
    }

    public function updateFcmToken(Request $request): JsonResponse
    {
        $validated = $request->validate(['fcm_token' => ['nullable', 'string', 'max:255']]);
        $request->user()->update([
            'fcm_token'            => $validated['fcm_token'],
            'fcm_token_updated_at' => $validated['fcm_token'] ? now() : null,
        ]);
        return response()->json(['success' => true, 'message' => 'FCM token updated.']);
    }
}
