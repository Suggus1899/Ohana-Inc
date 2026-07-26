import 'package:flutter/material.dart';

/// Ohana design system colors.
///
/// Mirrors the web frontend CSS variables (HSL) from `apps/frontend/src/index.css`.
/// All values are converted from HSL to Color for Flutter.
class AppColors {
  AppColors._();

  // ── Light theme ──────────────────────────────────────────────

  /// HSL(160, 84%, 17%) — deep teal/green
  static const primary = Color(0xFF0A4D3C);

  /// HSL(0, 0%, 100%) — white
  static const primaryForeground = Color(0xFFFFFFFF);

  /// HSL(160, 10%, 95%) — very light green-gray
  static const secondary = Color(0xFFEFF2F0);

  /// HSL(160, 84%, 17%)
  static const secondaryForeground = Color(0xFF0A4D3C);

  /// HSL(160, 10%, 96%)
  static const muted = Color(0xFFF2F5F3);

  /// HSL(160, 10%, 45%)
  static const mutedForeground = Color(0xFF6B7773);

  /// HSL(160, 60%, 45%) — medium green
  static const accent = Color(0xFF2E9E7A);

  /// HSL(0, 0%, 100%)
  static const accentForeground = Color(0xFFFFFFFF);

  /// HSL(0, 84.2%, 60.2%) — red
  static const destructive = Color(0xFFF43F5E);

  /// HSL(0, 0%, 100%)
  static const destructiveForeground = Color(0xFFFFFFFF);

  /// HSL(0, 0%, 100%)
  static const background = Color(0xFFFFFFFF);

  /// HSL(160, 84%, 17%)
  static const foreground = Color(0xFF0A4D3C);

  /// HSL(0, 0%, 100%)
  static const card = Color(0xFFFFFFFF);

  /// HSL(160, 20%, 25%)
  static const cardForeground = Color(0xFF2D4A42);

  /// HSL(0, 0%, 100%)
  static const popover = Color(0xFFFFFFFF);

  /// HSL(160, 84%, 17%)
  static const popoverForeground = Color(0xFF0A4D3C);

  /// HSL(160, 10%, 90%)
  static const border = Color(0xFFD9DEDB);

  /// HSL(160, 10%, 90%)
  static const input = Color(0xFFD9DEDB);

  /// HSL(160, 84%, 17%)
  static const ring = Color(0xFF0A4D3C);

  /// HSL(142, 70%, 49%) — WhatsApp green
  static const whatsapp = Color(0xFF25D366);

  /// HSL(0, 0%, 100%)
  static const whatsappForeground = Color(0xFFFFFFFF);

  // ── Dark theme ───────────────────────────────────────────────

  /// HSL(160, 50%, 8%)
  static const darkBackground = Color(0xFF0D1A16);

  /// HSL(0, 0%, 98%)
  static const darkForeground = Color(0xFFFAFAFA);

  /// HSL(160, 40%, 12%)
  static const darkCard = Color(0xFF142823);

  /// HSL(0, 0%, 98%)
  static const darkCardForeground = Color(0xFFFAFAFA);

  /// HSL(160, 50%, 8%)
  static const darkPopover = Color(0xFF0D1A16);

  /// HSL(0, 0%, 98%)
  static const darkPopoverForeground = Color(0xFFFAFAFA);

  /// HSL(160, 60%, 45%) — medium green
  static const darkPrimary = Color(0xFF2E9E7A);

  /// HSL(0, 0%, 100%)
  static const darkPrimaryForeground = Color(0xFFFFFFFF);

  /// HSL(160, 30%, 15%)
  static const darkSecondary = Color(0xFF1A2E27);

  /// HSL(0, 0%, 98%)
  static const darkSecondaryForeground = Color(0xFFFAFAFA);

  /// HSL(160, 30%, 20%)
  static const darkMuted = Color(0xFF213329);

  /// HSL(160, 10%, 65%)
  static const darkMutedForeground = Color(0xFF8FA097);

  /// HSL(160, 60%, 35%)
  static const darkAccent = Color(0xFF1E7A5C);

  /// HSL(0, 0%, 100%)
  static const darkAccentForeground = Color(0xFFFFFFFF);

  /// HSL(0, 62.8%, 50%)
  static const darkDestructive = Color(0xFFDC2626);

  /// HSL(0, 0%, 100%)
  static const darkDestructiveForeground = Color(0xFFFFFFFF);

  /// HSL(160, 30%, 20%)
  static const darkBorder = Color(0xFF213329);

  /// HSL(160, 30%, 20%)
  static const darkInput = Color(0xFF213329);

  /// HSL(160, 60%, 45%)
  static const darkRing = Color(0xFF2E9E7A);
}
