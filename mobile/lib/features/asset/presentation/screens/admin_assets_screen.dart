import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/asset_model.dart';
import '../providers/asset_provider.dart';

class AdminAssetsScreen extends ConsumerStatefulWidget {
  const AdminAssetsScreen({super.key});

  @override
  ConsumerState<AdminAssetsScreen> createState() => _AdminAssetsScreenState();
}

class _AdminAssetsScreenState extends ConsumerState<AdminAssetsScreen> {
  final _searchCtrl = TextEditingController();
  String _statusFilter = 'all';

  final _statusFilters = const [
    ('all',         'Semua'),
    ('available',   'Tersedia'),
    ('in_use',      'Dipakai'),
    ('maintenance', 'Servis'),
    ('disposed',    'Dibuang'),
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assetsAsync = ref.watch(adminAssetsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manajemen Aset'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Tambah Aset',
            onPressed: () => _showAddAssetDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Cari nama, kode, merek...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                isDense: true,
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          ref.read(adminAssetsProvider.notifier).setSearch('');
                        },
                      )
                    : null,
              ),
              onChanged: (v) => ref.read(adminAssetsProvider.notifier).setSearch(v),
            ),
          ),
          // Filter chips
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: _statusFilters.map((f) {
                final selected = _statusFilter == f.$1;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(f.$2),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _statusFilter = f.$1);
                      ref.read(adminAssetsProvider.notifier).setFilter(f.$1);
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          // Asset list
          Expanded(
            child: assetsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.red),
                    const SizedBox(height: 12),
                    Text('Error: $e',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(adminAssetsProvider),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
              data: (data) {
                final items = data['data'] as List<dynamic>? ?? [];
                if (items.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 12),
                        Text('Tidak ada aset', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref.refresh(adminAssetsProvider.future),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    itemBuilder: (ctx, i) {
                      final asset = items[i] as AssetModel;
                      return _AssetCard(
                        asset: asset,
                        onAssign:  () => _showAssignDialog(context, asset),
                        onReturn:  () => _showReturnDialog(context, asset),
                        onDispose: () => _confirmDispose(context, asset),
                        onDelete:  () => _confirmDelete(context, asset),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAddAssetDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => _AddAssetDialog(
        onSave: (name, code, catId, brand, model, serial, price, condition, notes) async {
          final messenger = ScaffoldMessenger.of(context);
          final err = await ref.read(adminAssetsProvider.notifier).createAsset(
                name:          name,
                assetCode:     code,
                categoryId:    catId,
                brand:         brand,
                model:         model,
                serialNumber:  serial,
                purchasePrice: price,
                condition:     condition,
                notes:         notes,
              );
          if (err != null) {
            messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
          } else {
            messenger.showSnackBar(const SnackBar(
              content: Text('Aset berhasil ditambahkan'),
              backgroundColor: Colors.green,
            ));
          }
        },
      ),
    );
  }

  void _showAssignDialog(BuildContext context, AssetModel asset) {
    showDialog(
      context: context,
      builder: (ctx) => _AssignAssetDialog(
        asset: asset,
        onAssign: (empId, date, condition, notes) async {
          final messenger = ScaffoldMessenger.of(context);
          if (ctx.mounted) Navigator.of(ctx).pop();
          final err = await ref.read(adminAssetsProvider.notifier)
              .assignAsset(asset.id, empId, date, condition, notes);
          if (err != null) {
            messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
          } else {
            messenger.showSnackBar(const SnackBar(
              content: Text('Aset berhasil dipinjamkan'),
              backgroundColor: Colors.green,
            ));
          }
        },
      ),
    );
  }

  void _showReturnDialog(BuildContext context, AssetModel asset) {
    showDialog(
      context: context,
      builder: (ctx) => _ReturnAssetDialog(
        asset: asset,
        onReturn: (date, condition, notes) async {
          final messenger = ScaffoldMessenger.of(context);
          if (ctx.mounted) Navigator.of(ctx).pop();
          final err = await ref.read(adminAssetsProvider.notifier)
              .returnAsset(asset.id, date, condition, notes);
          if (err != null) {
            messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
          } else {
            messenger.showSnackBar(const SnackBar(
              content: Text('Aset berhasil dikembalikan'),
              backgroundColor: Colors.green,
            ));
          }
        },
      ),
    );
  }

  void _confirmDispose(BuildContext context, AssetModel asset) {
    final notesCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.archive_outlined, color: Colors.amber.shade700, size: 20),
            const SizedBox(width: 8),
            const Text('Buang Aset'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RichText(
              text: TextSpan(
                style: Theme.of(context).textTheme.bodyMedium,
                children: [
                  const TextSpan(text: 'Tandai '),
                  TextSpan(
                    text: '"${asset.name}"',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const TextSpan(
                    text: ' sebagai dibuang?\nRiwayat peminjaman tetap tersimpan.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Alasan / Catatan',
                hintText: 'Rusak parah, hilang...',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade700),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.of(ctx).pop();
              final err = await ref.read(adminAssetsProvider.notifier)
                  .disposeAsset(asset.id, notes: notesCtrl.text.trim().isEmpty ? null : notesCtrl.text.trim());
              if (err != null) {
                messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
              } else {
                messenger.showSnackBar(const SnackBar(
                  content: Text('Aset ditandai sebagai dibuang'),
                  backgroundColor: Colors.orange,
                ));
              }
            },
            child: const Text('Buang', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, AssetModel asset) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus Data Aset'),
        content: RichText(
          text: TextSpan(
            style: Theme.of(context).textTheme.bodyMedium,
            children: [
              const TextSpan(text: 'Hapus data '),
              TextSpan(
                text: '"${asset.name} (${asset.assetCode})"',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const TextSpan(text: ' secara permanen?'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.of(ctx).pop();
              final err = await ref.read(adminAssetsProvider.notifier).deleteAsset(asset.id);
              if (err != null) {
                messenger.showSnackBar(SnackBar(content: Text(err), backgroundColor: Colors.red));
              } else {
                messenger.showSnackBar(const SnackBar(
                  content: Text('Aset berhasil dihapus'),
                  backgroundColor: Colors.green,
                ));
              }
            },
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}

// ── Asset Card ────────────────────────────────────────────────────────────────
class _AssetCard extends StatelessWidget {
  final AssetModel asset;
  final VoidCallback onAssign;
  final VoidCallback onReturn;
  final VoidCallback onDispose;
  final VoidCallback onDelete;

  const _AssetCard({
    required this.asset,
    required this.onAssign,
    required this.onReturn,
    required this.onDispose,
    required this.onDelete,
  });

  Color _statusColor(String status) => switch (status) {
        'available'   => Colors.green,
        'in_use'      => Colors.blue,
        'maintenance' => Colors.orange,
        'disposed'    => Colors.grey,
        _             => Colors.grey,
      };

  @override
  Widget build(BuildContext context) {
    final isInUse     = asset.status == 'in_use';
    final isAvailable = asset.status == 'available';
    final isMaint     = asset.status == 'maintenance';
    final isDisposed  = asset.status == 'disposed';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row: name + status badge
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(asset.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Text(asset.assetCode,
                          style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: _statusColor(asset.status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    asset.statusLabel,
                    style: TextStyle(
                      color: _statusColor(asset.status),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            // Category / brand / model
            if (asset.categoryName != null || asset.brand != null || asset.modelName != null) ...[
              const SizedBox(height: 4),
              Text(
                [asset.categoryName, asset.brand, asset.modelName]
                    .whereType<String>()
                    .join(' · '),
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],

            // Warranty
            if (asset.formattedWarranty != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    Icons.verified_outlined,
                    size: 13,
                    color: asset.isWarrantyExpired ? Colors.red : Colors.teal,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Garansi s/d ${asset.formattedWarranty}'
                    '${asset.isWarrantyExpired ? ' (Expired)' : ''}',
                    style: TextStyle(
                      fontSize: 12,
                      color: asset.isWarrantyExpired ? Colors.red : Colors.teal,
                    ),
                  ),
                ],
              ),
            ],

            // Current holder (when in_use)
            if (isInUse && asset.currentHolderName != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.person_outline, size: 14, color: Colors.blue),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          asset.currentHolderName!,
                          style: const TextStyle(color: Colors.blue, fontSize: 12),
                        ),
                        if (asset.assignedByName != null)
                          Text(
                            'Dicatat oleh: ${asset.assignedByName}',
                            style: const TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                      ],
                    ),
                  ),
                  if (asset.assignedDate != null)
                    Text(
                      'Sejak ${_fmtDate(asset.assignedDate!)}',
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                ],
              ),
            ],

            const SizedBox(height: 8),

            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (isAvailable)
                  TextButton.icon(
                    icon: const Icon(Icons.assignment_ind_outlined, size: 16),
                    label: const Text('Pinjamkan'),
                    onPressed: onAssign,
                  ),
                if (isInUse)
                  TextButton.icon(
                    icon: const Icon(Icons.assignment_return_outlined, size: 16),
                    label: const Text('Kembalikan'),
                    style: TextButton.styleFrom(foregroundColor: Colors.orange),
                    onPressed: onReturn,
                  ),
                if (isAvailable || isMaint)
                  TextButton.icon(
                    icon: const Icon(Icons.archive_outlined, size: 16),
                    label: const Text('Buang'),
                    style: TextButton.styleFrom(foregroundColor: Colors.amber.shade700),
                    onPressed: onDispose,
                  ),
                if (!isInUse)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    color: isDisposed ? Colors.grey : Colors.red,
                    visualDensity: VisualDensity.compact,
                    tooltip: 'Hapus Data',
                    onPressed: onDelete,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _fmtDate(String raw) {
    try {
      final dt = DateTime.parse(raw);
      return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    } catch (_) {
      return raw;
    }
  }
}

// ── Add Asset Dialog ──────────────────────────────────────────────────────────
class _AddAssetDialog extends ConsumerStatefulWidget {
  final Future<void> Function(
    String name,
    String code,
    int? catId,
    String? brand,
    String? model,
    String? serial,
    String? price,
    String condition,
    String? notes,
  ) onSave;

  const _AddAssetDialog({required this.onSave});

  @override
  ConsumerState<_AddAssetDialog> createState() => _AddAssetDialogState();
}

class _AddAssetDialogState extends ConsumerState<_AddAssetDialog> {
  final _nameCtrl   = TextEditingController();
  final _codeCtrl   = TextEditingController();
  final _brandCtrl  = TextEditingController();
  final _modelCtrl  = TextEditingController();
  final _serialCtrl = TextEditingController();
  final _priceCtrl  = TextEditingController();
  final _notesCtrl  = TextEditingController();
  String _condition = 'good';
  int?   _selectedCategoryId;
  bool   _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _codeCtrl.dispose();
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _serialCtrl.dispose();
    _priceCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(assetCategoriesProvider);

    return AlertDialog(
      title: const Text('Tambah Aset Baru'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Nama Aset *')),
            const SizedBox(height: 8),
            TextField(controller: _codeCtrl,
                decoration: const InputDecoration(labelText: 'Kode Aset *')),
            const SizedBox(height: 8),
            categoriesAsync.when(
              loading: () => const Padding(
                  padding: EdgeInsets.all(8), child: CircularProgressIndicator()),
              error: (_, __) => const SizedBox(),
              data: (cats) => DropdownButtonFormField<int?>(
                value: _selectedCategoryId,
                decoration: const InputDecoration(labelText: 'Kategori'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('— Tanpa Kategori —')),
                  ...cats.map((c) => DropdownMenuItem(
                        value: c['id'] as int,
                        child: Text(c['name'] as String? ?? ''),
                      )),
                ],
                onChanged: (v) => setState(() => _selectedCategoryId = v),
              ),
            ),
            const SizedBox(height: 8),
            TextField(controller: _brandCtrl,
                decoration: const InputDecoration(labelText: 'Merek')),
            const SizedBox(height: 8),
            TextField(controller: _modelCtrl,
                decoration: const InputDecoration(labelText: 'Model')),
            const SizedBox(height: 8),
            TextField(controller: _serialCtrl,
                decoration: const InputDecoration(labelText: 'No. Seri')),
            const SizedBox(height: 8),
            TextField(
              controller: _priceCtrl,
              decoration: const InputDecoration(labelText: 'Harga Beli (IDR)'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _condition,
              decoration: const InputDecoration(labelText: 'Kondisi'),
              items: const [
                DropdownMenuItem(value: 'good', child: Text('Baik')),
                DropdownMenuItem(value: 'fair', child: Text('Cukup')),
                DropdownMenuItem(value: 'poor', child: Text('Buruk')),
              ],
              onChanged: (v) => setState(() => _condition = v!),
            ),
            const SizedBox(height: 8),
            TextField(controller: _notesCtrl,
                decoration: const InputDecoration(labelText: 'Catatan'),
                maxLines: 2),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.of(context).pop(),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: _saving
              ? null
              : () async {
                  if (_nameCtrl.text.trim().isEmpty || _codeCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Nama dan kode aset wajib diisi')));
                    return;
                  }
                  setState(() => _saving = true);
                  Navigator.of(context).pop();
                  await widget.onSave(
                    _nameCtrl.text.trim(),
                    _codeCtrl.text.trim(),
                    _selectedCategoryId,
                    _brandCtrl.text.trim().isEmpty ? null : _brandCtrl.text.trim(),
                    _modelCtrl.text.trim().isEmpty ? null : _modelCtrl.text.trim(),
                    _serialCtrl.text.trim().isEmpty ? null : _serialCtrl.text.trim(),
                    _priceCtrl.text.trim().isEmpty ? null : _priceCtrl.text.trim(),
                    _condition,
                    _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
                  );
                },
          child: const Text('Simpan'),
        ),
      ],
    );
  }
}

// ── Assign Dialog (with employee dropdown) ────────────────────────────────────
class _AssignAssetDialog extends ConsumerStatefulWidget {
  final AssetModel asset;
  final Future<void> Function(
      int empId, String date, String condition, String? notes) onAssign;

  const _AssignAssetDialog({required this.asset, required this.onAssign});

  @override
  ConsumerState<_AssignAssetDialog> createState() => _AssignAssetDialogState();
}

class _AssignAssetDialogState extends ConsumerState<_AssignAssetDialog> {
  final _dateCtrl  = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _condition  = 'good';
  int?   _selectedEmpId;
  String _empSearch  = '';

  @override
  void initState() {
    super.initState();
    _dateCtrl.text = DateTime.now().toIso8601String().split('T')[0];
  }

  @override
  void dispose() {
    _dateCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final employeesAsync = ref.watch(activeEmployeesProvider);

    return AlertDialog(
      title: Text('Pinjamkan: ${widget.asset.name}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Employee picker
            employeesAsync.when(
              loading: () => const Padding(
                  padding: EdgeInsets.all(8), child: CircularProgressIndicator()),
              error: (e, _) => Text('Gagal memuat karyawan: $e',
                  style: const TextStyle(color: Colors.red, fontSize: 12)),
              data: (employees) {
                final filtered = _empSearch.isEmpty
                    ? employees
                    : employees.where((e) {
                        final name   = (e['user']?['name'] as String? ?? '').toLowerCase();
                        final number = (e['employee_number'] as String? ?? '').toLowerCase();
                        final q      = _empSearch.toLowerCase();
                        return name.contains(q) || number.contains(q);
                      }).toList();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Karyawan *',
                        style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 4),
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Cari nama atau nomor...',
                        prefixIcon: const Icon(Icons.search, size: 18),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        isDense: true,
                      ),
                      onChanged: (v) => setState(() => _empSearch = v),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      constraints: const BoxConstraints(maxHeight: 160),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey.shade300),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: filtered.isEmpty
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: Text('Tidak ada karyawan',
                                  style: TextStyle(color: Colors.grey, fontSize: 12)),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              itemCount: filtered.length,
                              itemBuilder: (ctx, i) {
                                final emp   = filtered[i];
                                final empId = emp['id'] as int;
                                final name  = emp['user']?['name'] as String? ?? '—';
                                final num   = emp['employee_number'] as String? ?? '';
                                final dept  = (emp['department'] as Map?)?['name'] as String?;
                                final selected = _selectedEmpId == empId;
                                return ListTile(
                                  dense: true,
                                  selected: selected,
                                  selectedTileColor: Colors.blue.withValues(alpha: 0.1),
                                  title: Text(name, style: const TextStyle(fontSize: 13)),
                                  subtitle: Text(
                                    [num, dept].whereType<String>().join(' · '),
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  trailing: selected
                                      ? const Icon(Icons.check_circle,
                                          color: Colors.blue, size: 18)
                                      : null,
                                  onTap: () => setState(() => _selectedEmpId = empId),
                                );
                              },
                            ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 12),
            // Date picker
            TextField(
              controller: _dateCtrl,
              decoration: const InputDecoration(
                labelText: 'Tanggal Pinjam *',
                suffixIcon: Icon(Icons.calendar_today, size: 16),
              ),
              readOnly: true,
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2020),
                  lastDate: DateTime(2030),
                );
                if (picked != null) {
                  setState(() => _dateCtrl.text = picked.toIso8601String().split('T')[0]);
                }
              },
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _condition,
              decoration: const InputDecoration(labelText: 'Kondisi Saat Pinjam'),
              items: const [
                DropdownMenuItem(value: 'good', child: Text('Baik')),
                DropdownMenuItem(value: 'fair', child: Text('Cukup')),
                DropdownMenuItem(value: 'poor', child: Text('Buruk')),
              ],
              onChanged: (v) => setState(() => _condition = v!),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Catatan'),
              maxLines: 2,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          onPressed: _selectedEmpId == null
              ? null
              : () async {
                  await widget.onAssign(
                    _selectedEmpId!,
                    _dateCtrl.text,
                    _condition,
                    _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
                  );
                },
          child: const Text('Pinjamkan'),
        ),
      ],
    );
  }
}

// ── Return Dialog ─────────────────────────────────────────────────────────────
class _ReturnAssetDialog extends StatefulWidget {
  final AssetModel asset;
  final Future<void> Function(String date, String condition, String? notes) onReturn;

  const _ReturnAssetDialog({required this.asset, required this.onReturn});

  @override
  State<_ReturnAssetDialog> createState() => _ReturnAssetDialogState();
}

class _ReturnAssetDialogState extends State<_ReturnAssetDialog> {
  final _dateCtrl  = TextEditingController();
  final _notesCtrl = TextEditingController();
  String _condition = 'good';

  @override
  void initState() {
    super.initState();
    _dateCtrl.text = DateTime.now().toIso8601String().split('T')[0];
  }

  @override
  void dispose() {
    _dateCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Kembalikan: ${widget.asset.name}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.asset.currentHolderName != null)
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person_outline, size: 16, color: Colors.blue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Pemegang: ${widget.asset.currentHolderName}',
                            style: const TextStyle(fontSize: 13)),
                        if (widget.asset.assignedByName != null)
                          Text(
                            'Dicatat oleh: ${widget.asset.assignedByName}',
                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _dateCtrl,
            decoration: const InputDecoration(
              labelText: 'Tanggal Kembali *',
              suffixIcon: Icon(Icons.calendar_today, size: 16),
            ),
            readOnly: true,
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(2020),
                lastDate: DateTime(2030),
              );
              if (picked != null) {
                setState(() => _dateCtrl.text = picked.toIso8601String().split('T')[0]);
              }
            },
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _condition,
            decoration: const InputDecoration(labelText: 'Kondisi Saat Kembali'),
            items: const [
              DropdownMenuItem(value: 'good', child: Text('Baik')),
              DropdownMenuItem(value: 'fair', child: Text('Cukup')),
              DropdownMenuItem(value: 'poor', child: Text('Buruk')),
            ],
            onChanged: (v) => setState(() => _condition = v!),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _notesCtrl,
            decoration: const InputDecoration(labelText: 'Catatan'),
            maxLines: 2,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Batal'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
          onPressed: () async {
            await widget.onReturn(
              _dateCtrl.text,
              _condition,
              _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
            );
          },
          child: const Text('Kembalikan', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
