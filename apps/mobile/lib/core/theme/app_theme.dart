import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Ohana app theme.
///
/// Mirrors the web frontend design system:
/// - Primary: deep teal/green (HSL 160 84% 17%)
/// - Accent: medium green (HSL 160 60% 45%)
/// - Radius: 12px (0.75rem on web)
/// - Font: system sans-serif (matches web font stack)
class AppTheme {
  AppTheme._();

  /// Border radius matching web --radius: 0.75rem = 12px
  static const double radius = 12.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 10.0;
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;
  static const double radius2xl = 20.0;

  static ThemeData light() {
    final colorScheme = ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.primaryForeground,
      secondary: AppColors.secondary,
      onSecondary: AppColors.secondaryForeground,
      tertiary: AppColors.accent,
      onTertiary: AppColors.accentForeground,
      error: AppColors.destructive,
      onError: AppColors.destructiveForeground,
      surface: AppColors.background,
      onSurface: AppColors.foreground,
      surfaceContainerHighest: AppColors.muted,
      outline: AppColors.border,
      outlineVariant: AppColors.border,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,
      textTheme: _buildTextTheme(AppColors.foreground),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.foreground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.foreground,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: AppColors.border, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: BorderSide(color: AppColors.border),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.background,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.input),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.input),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.ring, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.destructive),
        ),
        labelStyle: TextStyle(color: AppColors.mutedForeground),
        hintStyle: TextStyle(color: AppColors.mutedForeground),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.secondary,
        labelStyle: TextStyle(color: AppColors.secondaryForeground),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.background,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.mutedForeground,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 1,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.primaryForeground,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.foreground,
        contentTextStyle: TextStyle(color: AppColors.background),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: AppColors.primary,
      ),
    );
  }

  static ThemeData dark() {
    final colorScheme = ColorScheme.dark(
      primary: AppColors.darkPrimary,
      onPrimary: AppColors.darkPrimaryForeground,
      secondary: AppColors.darkSecondary,
      onSecondary: AppColors.darkSecondaryForeground,
      tertiary: AppColors.darkAccent,
      onTertiary: AppColors.darkAccentForeground,
      error: AppColors.darkDestructive,
      onError: AppColors.darkDestructiveForeground,
      surface: AppColors.darkBackground,
      onSurface: AppColors.darkForeground,
      surfaceContainerHighest: AppColors.darkMuted,
      outline: AppColors.darkBorder,
      outlineVariant: AppColors.darkBorder,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.darkBackground,
      textTheme: _buildTextTheme(AppColors.darkForeground),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkBackground,
        foregroundColor: AppColors.darkForeground,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.darkForeground,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: AppColors.darkBorder, width: 1),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.darkPrimary,
          foregroundColor: AppColors.darkPrimaryForeground,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkPrimary,
          side: BorderSide(color: AppColors.darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.darkPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkBackground,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.darkInput),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.darkInput),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.darkRing, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: BorderSide(color: AppColors.darkDestructive),
        ),
        labelStyle: TextStyle(color: AppColors.darkMutedForeground),
        hintStyle: TextStyle(color: AppColors.darkMutedForeground),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.darkSecondary,
        labelStyle: TextStyle(color: AppColors.darkSecondaryForeground),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusSm),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkBackground,
        selectedItemColor: AppColors.darkPrimary,
        unselectedItemColor: AppColors.darkMutedForeground,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.darkBorder,
        thickness: 1,
        space: 1,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.darkPrimary,
        foregroundColor: AppColors.darkPrimaryForeground,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkCard,
        contentTextStyle: TextStyle(color: AppColors.darkForeground),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: AppColors.darkPrimary,
      ),
    );
  }

  static TextTheme _buildTextTheme(Color foreground) {
    return TextTheme(
      displayLarge: TextStyle(fontSize: 48, fontWeight: FontWeight.w800, color: foreground, height: 1.1),
      displayMedium: TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: foreground, height: 1.15),
      displaySmall: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: foreground, height: 1.2),
      headlineLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: foreground, height: 1.25),
      headlineMedium: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: foreground, height: 1.3),
      headlineSmall: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: foreground, height: 1.35),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: foreground, height: 1.4),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: foreground, height: 1.4),
      titleSmall: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: foreground, height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: foreground, height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: foreground, height: 1.5),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: foreground, height: 1.5),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: foreground, height: 1.4),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: foreground, height: 1.4),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: foreground, height: 1.4),
    );
  }
}
