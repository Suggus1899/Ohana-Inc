import * as fs from 'fs-extra';
import * as path from 'path';
import * as https from 'https';

// Configuración
const MODELS_DIR = path.join(__dirname, '../../models/face-api');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Modelos requeridos según requisitos 19.4-19.6
const MODELS = {
  ssd_mobilenetv1: [
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'ssd_mobilenetv1_model-weights_manifest.json'
  ],
  face_landmark_68: [
    'face_landmark_68_model-shard1',
    'face_landmark_68_model-weights_manifest.json'
  ],
  face_recognition: [
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_recognition_model-weights_manifest.json'
  ]
};

/**
 * Descarga un archivo desde una URL y lo guarda en el sistema de archivos
 */
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Manejar redirecciones
        file.close();
        fs.unlinkSync(destPath);
        if (response.headers.location) {
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirección sin location header: ${response.statusCode}`));
        }
      } else {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Error al descargar: ${response.statusCode} ${response.statusMessage}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

/**
 * Calcula el progreso de descarga
 */
function calculateProgress(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filledLength = Math.round((barLength * current) / total);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  return `[${bar}] ${percentage}%`;
}

/**
 * Descarga todos los modelos de face-api.js
 */
async function downloadModels(): Promise<void> {
  console.log('🚀 Iniciando descarga de modelos de face-api.js...\n');
  
  // Crear directorio si no existe
  await fs.ensureDir(MODELS_DIR);
  console.log(`📁 Directorio de modelos: ${MODELS_DIR}\n`);
  
  // Calcular total de archivos
  const totalFiles = Object.values(MODELS).reduce((sum, files) => sum + files.length, 0);
  let downloadedFiles = 0;
  
  // Descargar cada modelo
  for (const [modelName, files] of Object.entries(MODELS)) {
    console.log(`📦 Descargando modelo: ${modelName}`);
    
    for (const fileName of files) {
      const url = `${BASE_URL}/${fileName}`;
      const destPath = path.join(MODELS_DIR, fileName);
      
      // Verificar si el archivo ya existe
      if (await fs.pathExists(destPath)) {
        console.log(`   ⏭️  ${fileName} (ya existe)`);
        downloadedFiles++;
        continue;
      }
      
      try {
        await downloadFile(url, destPath);
        downloadedFiles++;
        const progress = calculateProgress(downloadedFiles, totalFiles);
        console.log(`   ✅ ${fileName}`);
        console.log(`   ${progress} (${downloadedFiles}/${totalFiles})\n`);
      } catch (error) {
        console.error(`   ❌ Error descargando ${fileName}:`, error);
        throw error;
      }
    }
  }
  
  console.log('\n🎉 ¡Descarga completada exitosamente!');
  console.log(`\n📊 Resumen:`);
  console.log(`   • Modelos descargados: ${Object.keys(MODELS).length}`);
  console.log(`   • Archivos totales: ${totalFiles}`);
  console.log(`   • Ubicación: ${MODELS_DIR}`);
  console.log(`\n✨ Los modelos están listos para usar con face-api.js\n`);
}

/**
 * Verifica la integridad de los modelos descargados
 */
async function verifyModels(): Promise<boolean> {
  console.log('🔍 Verificando integridad de modelos...\n');
  
  let allFilesExist = true;
  
  for (const [modelName, files] of Object.entries(MODELS)) {
    console.log(`   Verificando ${modelName}:`);
    
    for (const fileName of files) {
      const filePath = path.join(MODELS_DIR, fileName);
      const exists = await fs.pathExists(filePath);
      
      if (exists) {
        const stats = await fs.stat(filePath);
        console.log(`      ✅ ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`      ❌ ${fileName} (no encontrado)`);
        allFilesExist = false;
      }
    }
    console.log('');
  }
  
  return allFilesExist;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  try {
    // Descargar modelos
    await downloadModels();
    
    // Verificar integridad
    const isValid = await verifyModels();
    
    if (isValid) {
      console.log('✅ Todos los modelos están correctamente descargados y verificados.\n');
      process.exit(0);
    } else {
      console.error('❌ Algunos modelos no se descargaron correctamente.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error durante la descarga de modelos:', error);
    process.exit(1);
  }
}

// Ejecutar script
main();
