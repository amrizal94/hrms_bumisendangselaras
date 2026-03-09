import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/user_entity.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  // Info controllers
  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();

  // Password controllers
  final _currPassCtrl    = TextEditingController();
  final _newPassCtrl     = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  // UI state
  bool _savingInfo     = false;
  bool _savingPassword = false;
  bool _obscureCurr    = true;
  bool _obscureNew     = true;
  bool _obscureConfirm = true;

  final _infoKey     = GlobalKey<FormState>();
  final _passwordKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _prefillFromState();
  }

  void _prefillFromState() {
    final auth = ref.read(authNotifierProvider);
    if (auth is AuthAuthenticated) {
      _nameCtrl.text  = auth.user.name;
      _phoneCtrl.text = auth.user.phone ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _currPassCtrl.dispose();
    _newPassCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  // ── Save profile info ────────────────────────────────────────────────────
  Future<void> _saveInfo() async {
    if (!(_infoKey.currentState?.validate() ?? false)) return;
    setState(() => _savingInfo = true);

    final err = await ref.read(authNotifierProvider.notifier).updateProfile(
      name:  _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
    );

    if (!mounted) return;
    setState(() => _savingInfo = false);

    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: Colors.red),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully.')),
      );
    }
  }

  // ── Save password ────────────────────────────────────────────────────────
  Future<void> _savePassword() async {
    if (!(_passwordKey.currentState?.validate() ?? false)) return;
    setState(() => _savingPassword = true);

    final err = await ref.read(authNotifierProvider.notifier).updateProfile(
      currentPassword:      _currPassCtrl.text,
      password:             _newPassCtrl.text,
      passwordConfirmation: _confirmPassCtrl.text,
    );

    if (!mounted) return;
    setState(() => _savingPassword = false);

    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: Colors.red),
      );
    } else {
      _currPassCtrl.clear();
      _newPassCtrl.clear();
      _confirmPassCtrl.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final user = authState is AuthAuthenticated ? authState.user : null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _ProfileHeader(user: user),
                    const SizedBox(height: 24),
                    _InfoForm(
                      formKey:     _infoKey,
                      nameCtrl:    _nameCtrl,
                      phoneCtrl:   _phoneCtrl,
                      saving:      _savingInfo,
                      onSave:      _saveInfo,
                    ),
                    const SizedBox(height: 16),
                    _PasswordForm(
                      formKey:        _passwordKey,
                      currPassCtrl:   _currPassCtrl,
                      newPassCtrl:    _newPassCtrl,
                      confirmCtrl:    _confirmPassCtrl,
                      obscureCurr:    _obscureCurr,
                      obscureNew:     _obscureNew,
                      obscureConfirm: _obscureConfirm,
                      onToggleCurr:    () => setState(() => _obscureCurr    = !_obscureCurr),
                      onToggleNew:     () => setState(() => _obscureNew     = !_obscureNew),
                      onToggleConfirm: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      saving:         _savingPassword,
                      onSave:         _savePassword,
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

// ── Profile header ─────────────────────────────────────────────────────────
class _ProfileHeader extends StatelessWidget {
  final UserEntity user;
  const _ProfileHeader({required this.user});

  Color get _roleColor => switch (user.role) {
        'admin' => Colors.red.shade700,
        'hr'    => Colors.green.shade700,
        _       => Colors.blue.shade700,
      };

  String get _roleLabel => switch (user.role) {
        'admin' => 'ADMIN',
        'hr'    => 'HR',
        _       => 'STAFF',
      };

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: _roleColor,
              child: Text(
                user.name.isNotEmpty
                    ? user.name[0].toUpperCase()
                    : '?',
                style: const TextStyle(
                  fontSize: 28,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.name,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user.email,
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: _roleColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _roleLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Info form ──────────────────────────────────────────────────────────────
class _InfoForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController phoneCtrl;
  final bool saving;
  final VoidCallback onSave;

  const _InfoForm({
    required this.formKey,
    required this.nameCtrl,
    required this.phoneCtrl,
    required this.saving,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Personal Information',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.words,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return 'Name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: phoneCtrl,
                decoration: const InputDecoration(
                  labelText: 'Phone Number (optional)',
                  prefixIcon: Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: saving ? null : onSave,
                  icon: saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(saving ? 'Saving...' : 'Save Changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Password form ──────────────────────────────────────────────────────────
class _PasswordForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController currPassCtrl;
  final TextEditingController newPassCtrl;
  final TextEditingController confirmCtrl;
  final bool obscureCurr;
  final bool obscureNew;
  final bool obscureConfirm;
  final VoidCallback onToggleCurr;
  final VoidCallback onToggleNew;
  final VoidCallback onToggleConfirm;
  final bool saving;
  final VoidCallback onSave;

  const _PasswordForm({
    required this.formKey,
    required this.currPassCtrl,
    required this.newPassCtrl,
    required this.confirmCtrl,
    required this.obscureCurr,
    required this.obscureNew,
    required this.obscureConfirm,
    required this.onToggleCurr,
    required this.onToggleNew,
    required this.onToggleConfirm,
    required this.saving,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Change Password',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: currPassCtrl,
                obscureText: obscureCurr,
                decoration: InputDecoration(
                  labelText: 'Current Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscureCurr
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: onToggleCurr,
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) {
                    return 'Current password is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: newPassCtrl,
                obscureText: obscureNew,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  prefixIcon: const Icon(Icons.lock_reset_outlined),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscureNew
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: onToggleNew,
                  ),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'New password is required';
                  if (v.length < 8) return 'Minimum 8 characters';
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: confirmCtrl,
                obscureText: obscureConfirm,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  prefixIcon: const Icon(Icons.lock_reset_outlined),
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(obscureConfirm
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined),
                    onPressed: onToggleConfirm,
                  ),
                ),
                validator: (v) {
                  if (v != newPassCtrl.text) return 'Passwords do not match';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: saving ? null : onSave,
                  icon: saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.key_outlined),
                  label: Text(saving ? 'Updating...' : 'Update Password'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange.shade700,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
