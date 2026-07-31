import 'package:flutter/material.dart';

/// Ohana design system colors.
///
/// Mirrors the web frontend CSS variables (HSL) from `apps/frontend/src/index.css`.
/// Brand palette: naranja (hue 25). All values converted from HSL to Color.
class AppColors {
  AppColors._();

  // ── Light theme ──────────────────────────────────────────────

  /// HSL(25, 80%, 18%) — deep orange-brown
  static const primary = Color(0xFF5A2A0A);

  /// HSL(0, 0%, 100%) — white
  static const primaryForeground = Color(0xFFFFFFFF);

  /// HSL(25, 10%, 95%) — very light warm gray
  static const secondary = Color(0xFFF5F1EF);

  /// HSL(25, 80%, 18%)
  static const secondaryForeground = Color(0xFF5A2A0A);

  /// HSL(25, 10%, 96%)
  static const muted = Color(0xFFF6F3F1);

  /// HSL(25, 10%, 45%)
  static const mutedForeground = Color(0xFF776B62);

  /// HSL(25, 85%, 58%) — bright orange
  static const accent = Color(0xFFF47A1E);

  /// HSL(0, 0%, 100%)
  static const accentForeground = Color(0xFFFFFFFF);

  /// HSL(0, 84.2%, 60.2%) — red
  static const destructive = Color(0xFFF43F5E);

  /// HSL(0, 0%, 100%)
  static const destructiveForeground = Color(0xFFFFFFFF);

  /// HSL(0, 0%, 100%)
  static const background = Color(0xFFFFFFFF);

  /// HSL(25, 80%, 18%)
  static const foreground = Color(0xFF5A2A0A);

  /// HSL(0, 0%, 100%)
  static const card = Color(0xFFFFFFFF);

  /// HSL(25, 20%, 25%)
  static const cardForeground = Color(0xFF4A3A2E);

  /// HSL(0, 0%, 100%)
  static const popover = Color(0xFFFFFFFF);

  /// HSL(25, 80%, 18%)
  static const popoverForeground = Color(0xFF5A2A0A);

  /// HSL(25, 10%, 90%)
  static const border = Color(0xFFE5DDD7);

  /// HSL(25, 10%, 90%)
  static const input = Color(0xFFE5DDD7);

  /// HSL(25, 95%, 53%) — vivid orange (brand mark)
  static const ring = Color(0xFFF97316);

  /// HSL(142, 70%, 49%) — WhatsApp green
  static const whatsapp = Color(0xFF25D366);

  /// HSL(0, 0%, 100%)
  static const whatsappForeground = Color(0xFFFFFFFF);

  // ── Dark theme ───────────────────────────────────────────────

  /// HSL(25, 30%, 8%)
  static const darkBackground = Color(0xFF1A120C);

  /// HSL(0, 0%, 98%)
  static const darkForeground = Color(0xFFFAFAFA);

  /// HSL(25, 25%, 12%)
  static const darkCard = Color(0xFF241A12);

  /// HSL(0, 0%, 98%)
  static const darkCardForeground = Color(0xFFFAFAFA);

  /// HSL(25, 30%, 8%)
  static const darkPopover = Color(0xFF1A120C);

  /// HSL(0, 0%, 98%)
  static const darkPopoverForeground = Color(0xFFFAFAFA);

  /// HSL(25, 90%, 55%) — bright orange
  static const darkPrimary = Color(0xFFE66E0F);

  /// HSL(0, 0%, 100%)
  static const darkPrimaryForeground = Color(0xFFFFFFFF);

  /// HSL(25, 20%, 15%)
  static const darkSecondary = Color(0xFF2E2218);

  /// HSL(0, 0%, 98%)
  static const darkSecondaryForeground = Color(0xFFFAFAFA);

  /// HSL(25, 20%, 20%)
  static const darkMuted = Color(0xFF3A2C20);

  /// HSL(25, 10%, 65%)
  static const darkMutedForeground = Color(0xFFA89484);

  /// HSL(25, 70%, 45%)
  static const darkAccent = Color(0xFFB55A1A);

  /// HSL(0, 0%, 100%)
  static const darkAccentForeground = Color(0xFFFFFFFF);

  /// HSL(0, 62.8%, 50%)
  static const darkDestructive = Color(0xFFDC2626);

  /// HSL(0, 0%, 100%)
  static const darkDestructiveForeground = Color(0xFFFFFFFF);

  /// HSL(25, 20%, 20%)
  static const darkBorder = Color(0xFF3A2C20);

  /// HSL(25, 20%, 20%)
  static const darkInput = Color(0xFF3A2C20);

  /// HSL(25, 90%, 55%)
  static const darkRing = Color(0xFFE66E0F);
}
