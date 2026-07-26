import * as crypto from 'crypto';

/**
 * Script para generar clave de encriptación AES-256-GCM
 * 
 * Requisito 37.4: THE Sistema_KYC SHALL requerir variable ENCRYPTION_KEY 
 * (64 caracteres hex) para encriptación AES-256
 * 
 * Uso: npm run generate:key
 */

/**
 * Genera una clave de encriptación de 32 bytes en formato hexadecimal
 */
function generateEncryptionKey(): string {
  // Generar 32 bytes aleatorios criptográficamente seguros
  const keyBuffer = crypto.randomBytes(32);
  
  // Convertir a formato hexadecimal (64 caracteres)
  const keyHex = keyBuffer.toString('hex');
  
  return keyHex;
}

/**
 * Valida que una clave tenga el formato correcto
 */
function validateKey(key: string): boolean {
  // Debe ser exactamente 64 caracteres hexadecimales
  const hexPattern = /^[0-9a-f]{64}$/i;
  return hexPattern.test(key);
}

/**
 * Muestra instrucciones de uso de la clave generada
 */
function displayInstructions(key: string): void {
  console.log('\n🔐 Clave de Encriptación AES-256-GCM Generada\n');
  console.log('═'.repeat(70));
  console.log('\n📋 Tu clave de encriptación:');
  console.log('\n   ' + key);
  console.log('\n═'.repeat(70));
  
  console.log('\n📝 Instrucciones de uso:\n');
  console.log('1. Copia la clave generada arriba');
  console.log('2. Abre tu archivo .env en el directorio apps/backend/');
  console.log('3. Busca la línea que contiene ENCRYPTION_KEY=');
  console.log('4. Reemplaza el valor con la clave generada:');
  console.log('\n   ENCRYPTION_KEY=' + key);
  
  console.log('\n⚠️  IMPORTANTE - Seguridad:\n');
  console.log('   • NUNCA compartas esta clave públicamente');
  console.log('   • NO la subas a repositorios de código (Git)');
  console.log('   • Guárdala en un gestor de contraseñas seguro');
  console.log('   • Usa diferentes claves para desarrollo y producción');
  console.log('   • Si la clave se compromete, genera una nueva inmediatamente');
  
  console.log('\n🔒 Características de la clave:\n');
  console.log('   • Algoritmo: AES-256-GCM');
  console.log('   • Longitud: 32 bytes (256 bits)');
  console.log('   • Formato: Hexadecimal (64 caracteres)');
  console.log('   • Generación: crypto.randomBytes() (criptográficamente seguro)');
  
  console.log('\n💡 Uso en el sistema:\n');
  console.log('   Esta clave se utiliza para encriptar documentos sensibles del');
  console.log('   sistema KYC (cédulas, selfies, videos de liveness) antes de');
  console.log('   almacenarlos, cumpliendo con requisitos GDPR/LOPD.');
  
  console.log('\n✅ Siguiente paso:\n');
  console.log('   Configura la clave en tu archivo .env y reinicia el servidor.\n');
}

/**
 * Función principal
 */
function main(): void {
  try {
    console.log('\n🚀 Generador de Clave de Encriptación AES-256-GCM');
    console.log('   Sistema KYC - Verificación de Identidad\n');
    
    // Generar clave
    const encryptionKey = generateEncryptionKey();
    
    // Validar formato
    if (!validateKey(encryptionKey)) {
      throw new Error('La clave generada no tiene el formato correcto');
    }
    
    // Mostrar clave e instrucciones
    displayInstructions(encryptionKey);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al generar la clave de encriptación:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();
