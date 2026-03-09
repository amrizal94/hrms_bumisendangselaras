import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/asset_model.dart';
import '../providers/asset_provider.dart';

class MyAssetsScreen extends ConsumerWidget {
  const MyAssetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(myAssetsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Aset Saya'),
        backgroundColor: Colors.indigo.shade700,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myAssetsProvider),
        child: assetsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 40),
                const SizedBox(height: 8),
                Text(
                  e.toString().replaceFirst('ApiException: ', ''),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.invalidate(myAssetsProvider),
                  child: const Text('Coba Lagi'),
                ),
              ],
            ),
          ),
          data: (assets) {
            if (assets.isEmpty) {
              return ListView(
                // Wrap in ListView so RefreshIndicator works on empty state
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 120),
                  Center(
                    child: Column(
                      children: [
                        Icon(Icons.inventory_2_outlined,
                            size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'Belum ada aset yang dipinjamkan',
                          style: TextStyle(color: Colors.grey, fontSize: 15),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            }

            return ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: assets.length,
              itemBuilder: (context, index) =>
                  _AssetCard(assignment: assets[index]),
            );
          },
        ),
      ),
    );
  }
}

// ── Asset card ────────────────────────────────────────────────────────────────

class _AssetCard extends StatelessWidget {
  final AssetAssignmentModel assignment;
  const _AssetCard({required this.assignment});

  IconData _categoryIcon(String? category) {
    if (category == null) return Icons.devices;
    final lower = category.toLowerCase();
    if (lower.contains('laptop') || lower.contains('notebook')) {
      return Icons.laptop;
    }
    if (lower.contains('monitor') || lower.contains('desktop')) {
      return Icons.monitor;
    }
    if (lower.contains('kendaraan') || lower.contains('mobil') ||
        lower.contains('motor')) {
      return Icons.directions_car;
    }
    if (lower.contains('printer')) return Icons.print;
    if (lower.contains('phone') || lower.contains('hp') ||
        lower.contains('handphone')) {
      return Icons.smartphone;
    }
    return Icons.devices;
  }

  Color _conditionColor(String condition) {
    switch (condition) {
      case 'good': return Colors.green;
      case 'fair': return Colors.orange;
      case 'poor': return Colors.red;
      default:     return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final icon  = _categoryIcon(assignment.categoryName);
    final color = _conditionColor(assignment.conditionOnAssign);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.indigo.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.indigo.shade700, size: 28),
            ),

            const SizedBox(width: 14),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Asset name
                  Text(
                    assignment.assetName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),

                  const SizedBox(height: 2),

                  // Asset code
                  Text(
                    assignment.assetCode,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),

                  // Brand / model (if available)
                  if (assignment.brand != null ||
                      assignment.modelName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (assignment.brand != null) assignment.brand!,
                        if (assignment.modelName != null) assignment.modelName!,
                      ].join(' · '),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ],

                  const SizedBox(height: 8),

                  // Condition chip + assigned date
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: color.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          'Kondisi: ${assignment.conditionLabel}',
                          style: TextStyle(
                            fontSize: 11,
                            color: color,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 6),

                  // Assigned since
                  Row(
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          size: 12, color: Colors.grey.shade500),
                      const SizedBox(width: 4),
                      Text(
                        'Dipinjam sejak: ${assignment.formattedDate}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
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
