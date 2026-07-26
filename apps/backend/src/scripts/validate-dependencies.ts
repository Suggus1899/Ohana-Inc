#!/usr/bin/env ts-node

/**
 * Script de validación de dependencias del sistema
 * Valida que todas las dependencias necesarias para liveness detection estén instaladas
 * 
 * Uso:
 *   npm run validate:dependencies
 *   ts-node src/scripts/validate-dependencies.ts
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

const results: ValidationResult[] = [];

/**
 * Imprime un mensaje con color
 */
function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Imprime el encabezado
 */
function printHeader(): void {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║     Validación de Dependencias - Liveness Detection       ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
}

/**
 * Valida que FFmpeg esté instalado
 */
function validateFFmpeg(): ValidationResult {
  log('🔍 Validando FFmpeg...', colors.blue);
  
  try {
    const output = execSync('ffmpeg -version', { encoding: 'utf-8', stdio: 'pipe' });
    const versionMatch = output.match(/ffmpeg version (\S+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    log(`  ✅ FFmpeg instalado: ${version}`, colors.green);
    
    return {
      name: 'FFmpeg',
      passed: true,
      message: `FFmpeg ${version} instalado correctamente`,
      critical: true
    };
  } catch (error) {
    log('  ❌ FFmpeg no encontrado', colors.red);
    log('     Instalar: sudo apt install ffmpeg (Linux) o brew install ffmpeg (macOS)', colors.yellow);
    
    return {
      name: 'FFmpeg',
      passed: false,
      message: 'FFmpeg no está instalado o no está en PATH',
      critical: true
    };
  }
}

/**
 * Valida que los modelos de face-api.js existan
 */
function validateFaceApiModels(): ValidationResult {
  log('🔍 Validando modelos de face-api.js...', colors.blue);
  
  const modelsPath = path.join(process.cwd(), 'models', 'face-api');
  
  if (!fs.existsSync(modelsPath)) {
    log('  ❌ Directorio de modelos no encontrado', colors.red);
    log(`     Crear directorio: mkdir -p ${modelsPath}`, colors.yellow);
    
    return {
      name: 'Face-API Models',
      passed: false,
      message: `Directorio de modelos no existe: ${modelsPath}`,
      critical: true
    };
  }
  
  const requiredModels = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
  ];
  
  const missingModels: string[] = [];
  
  for (const model of requiredModels) {
    const modelPath = path.join(modelsPath, model);
    if (!fs.existsSync(modelPath)) {
      missingModels.push(model);
    }
  }
  
  if (missingModels.length > 0) {
    log(`  ❌ Faltan ${missingModels.length} archivos de modelo`, colors.red);
    log('     Modelos faltantes:', colors.yellow);
    missingModels.forEach(model => log(`       - ${model}`, colors.yellow));
    log('     Descargar: npm run download:models', colors.yellow);
    
    return {
      name: 'Face-API Models',
      passed: false,
      message: `Faltan ${missingModels.length} archivos de modelo`,
      critical: true
    };
  }
  
  log(`  ✅ Todos los modelos presentes (${requiredModels.length} archivos)`, colors.green);
  
  return {
    name: 'Face-API Models',
    passed: true,
    message: `${requiredModels.length} archivos de modelo encontrados`,
    critical: true
  };
}

/**
 * Valida que Tesseract.js esté instalado
 */
function validateTesseract(): ValidationResult {
  log('🔍 Validando Tesseract.js...', colors.blue);
  
  try {
    // Intentar importar tesseract.js
    require('tesseract.js');
    
    log('  ✅ Tesseract.js instalado', colors.green);
    
    return {
      name: 'Tesseract.js',
      passed: true,
      message: 'Tesseract.js instalado correctamente',
      critical: true
    };
  } catch (error) {
    log('  ❌ Tesseract.js no encontrado', colors.red);
    log('     Instalar: npm install tesseract.js', colors.yellow);
    
    return {
      name: 'Tesseract.js',
      passed: false,
      message: 'Tesseract.js no está instalado',
      critical: true
    };
  }
}

/**
 * Valida que las variables de entorno estén configuradas
 */
function validateEnvironmentVariables(): ValidationResult {
  log('🔍 Validando variables de entorno...', colors.blue);
  
  const optionalVars = [
    'BLINK_EAR_THRESHOLD',
    'MIN_BLINKS_REQUIRED',
    'HEAD_MOVEMENT_THRESHOLD',
    'FACE_CONFIDENCE_THRESHOLD',
    'FACE_MATCH_THRESHOLD',
    'LIVENESS_FRAME_COUNT'
  ];
  
  const configuredVars: string[] = [];
  const defaultVars: string[] = [];
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      configuredVars.push(varName);
    } else {
      defaultVars.push(varName);
    }
  }
  
  if (configuredVars.length > 0) {
    log(`  ✅ ${configuredVars.length} variables configuradas`, colors.green);
    configuredVars.forEach(v => log(`     - ${v} = ${process.env[v]}`, colors.green));
  }
  
  if (defaultVars.length > 0) {
    log(`  ℹ️  ${defaultVars.length} variables usando valores por defecto`, colors.yellow);
    defaultVars.forEach(v => log(`     - ${v}`, colors.yellow));
  }
  
  return {
    name: 'Environment Variables',
    passed: true,
    message: `${configuredVars.length} configuradas, ${defaultVars.length} usando defaults`,
    critical: false
  };
}

/**
 * Valida que los directorios de almacenamiento existan
 */
function validateStorageDirectories(): ValidationResult {
  log('🔍 Validando directorios de almacenamiento...', colors.blue);
  
  const requiredDirs = [
    'storage/kyc',
    'logs',
    'uploads'
  ];
  
  const missingDirs: string[] = [];
  const createdDirs: string[] = [];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir);
    
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        createdDirs.push(dir);
        log(`  ✅ Directorio creado: ${dir}`, colors.green);
      } catch (error) {
        missingDirs.push(dir);
        log(`  ❌ No se pudo crear: ${dir}`, colors.red);
      }
    } else {
      log(`  ✅ Directorio existe: ${dir}`, colors.green);
    }
  }
  
  if (missingDirs.length > 0) {
    return {
      name: 'Storage Directories',
      passed: false,
      message: `No se pudieron crear ${missingDirs.length} directorios`,
      critical: false
    };
  }
  
  return {
    name: 'Storage Directories',
    passed: true,
    message: `Todos los directorios disponibles${createdDirs.length > 0 ? ` (${createdDirs.length} creados)` : ''}`,
    critical: false
  };
}

/**
 * Valida la configuración de liveness
 */
function validateLivenessConfig(): ValidationResult {
  log('🔍 Validando configuración de liveness...', colors.blue);
  
  try {
    // Intentar cargar la configuración
    const configPath = path.join(process.cwd(), 'src', 'config', 'liveness.config.ts');
    
    if (!fs.existsSync(configPath)) {
      log('  ❌ Archivo de configuración no encontrado', colors.red);
      return {
        name: 'Liveness Config',
        passed: false,
        message: 'Archivo liveness.config.ts no encontrado',
        critical: true
      };
    }
    
    log('  ✅ Archivo de configuración encontrado', colors.green);
    
    // Validar que los valores estén en rangos válidos
    const earThreshold = parseFloat(process.env.BLINK_EAR_THRESHOLD || '0.2');
    const minBlinks = parseInt(process.env.MIN_BLINKS_REQUIRED || '2', 10);
    
    if (earThreshold < 0 || earThreshold > 1) {
      log('  ⚠️  BLINK_EAR_THRESHOLD fuera de rango [0, 1]', colors.yellow);
    }
    
    if (minBlinks < 1) {
      log('  ⚠️  MIN_BLINKS_REQUIRED debe ser >= 1', colors.yellow);
    }
    
    return {
      name: 'Liveness Config',
      passed: true,
      message: 'Configuración válida',
      critical: true
    };
  } catch (error) {
    log(`  ❌ Error al validar configuración: ${error}`, colors.red);
    return {
      name: 'Liveness Config',
      passed: false,
      message: `Error: ${error}`,
      critical: true
    };
  }
}

/**
 * Imprime el resumen de resultados
 */
function printSummary(): void {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║                    Resumen de Validación                   ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.cyan);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? colors.green : colors.red;
    const critical = result.critical ? ' [CRÍTICO]' : '';
    
    log(`${icon} ${result.name}${critical}`, color);
    log(`   ${result.message}`, color);
  });
  
  log('\n' + '─'.repeat(60), colors.cyan);
  log(`Total: ${results.length} validaciones`, colors.blue);
  log(`Exitosas: ${passed}`, colors.green);
  log(`Fallidas: ${failed}`, failed > 0 ? colors.red : colors.green);
  
  if (criticalFailed > 0) {
    log(`\n⚠️  ${criticalFailed} validaciones críticas fallaron`, colors.red);
    log('El sistema NO puede funcionar correctamente.', colors.red);
    log('\nPor favor, corrige los errores críticos antes de continuar.', colors.yellow);
  } else if (failed > 0) {
    log('\n⚠️  Algunas validaciones no críticas fallaron', colors.yellow);
    log('El sistema puede funcionar, pero con funcionalidad limitada.', colors.yellow);
  } else {
    log('\n✅ Todas las validaciones pasaron exitosamente', colors.green);
    log('El sistema está listo para funcionar.', colors.green);
  }
  
  log('');
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  printHeader();
  
  // Ejecutar validaciones
  results.push(validateFFmpeg());
  results.push(validateFaceApiModels());
  results.push(validateTesseract());
  results.push(validateLivenessConfig());
  results.push(validateEnvironmentVariables());
  results.push(validateStorageDirectories());
  
  // Imprimir resumen
  printSummary();
  
  // Exit code
  const criticalFailed = results.filter(r => !r.passed && r.critical).length;
  process.exit(criticalFailed > 0 ? 1 : 0);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Error fatal: ${error}`, colors.red);
    process.exit(1);
  });
}

export { main as validateDependencies };
