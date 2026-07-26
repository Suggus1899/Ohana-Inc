# Instrucciones para el Video de Fondo del Hero

## ✅ Cambios Aplicados

Se ha actualizado el componente Hero con las siguientes mejoras:

1. ✅ **Altura 100vh**: El hero ahora ocupa toda la altura de la ventana
2. ✅ **Video de fondo**: Preparado para reproducir video en loop
3. ✅ **Overlay oscuro**: Filtro oscuro para legibilidad del texto
4. ✅ **Sin efecto ondulado**: Eliminado el SVG wave del fondo
5. ✅ **Texto legible**: Colores ajustados para contraste sobre video

---

## 📹 Cómo Agregar el Video

### Opción 1: Video Local (Recomendado para Producción)

#### Paso 1: Crear carpeta de videos
```bash
mkdir frontend-residencias/public/videos
```

#### Paso 2: Agregar tu video
Coloca tu video en: `frontend-residencias/public/videos/hero-background.mp4`

**Recomendaciones del video:**
- Formato: MP4 (H.264)
- Resolución: 1920x1080 (Full HD) o 1280x720 (HD)
- Duración: 10-30 segundos (se reproduce en loop)
- Tamaño: < 5MB (optimizado)
- FPS: 30fps
- Contenido: Imágenes de casas, apartamentos, interiores modernos, exteriores

#### Paso 3: Optimizar el video (opcional pero recomendado)

Usa FFmpeg para optimizar:
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -vf scale=1920:1080 -b:v 2M -movflags +faststart hero-background.mp4
```

---

### Opción 2: Video desde URL Externa

Si prefieres usar un video desde una CDN o servicio externo:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="https://tu-cdn.com/video.mp4" type="video/mp4" />
</video>
```

---

### Opción 3: Usar Imagen de Fondo (Alternativa Temporal)

Si aún no tienes el video, puedes usar una imagen temporalmente:

```tsx
{/* Reemplaza el video con esto temporalmente */}
<div 
  className="absolute inset-0 w-full h-full bg-cover bg-center"
  style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
/>
```

---

## 🎨 Personalización del Overlay

### Ajustar Opacidad del Overlay

En el componente Hero, puedes ajustar la oscuridad del overlay:

```tsx
{/* Más oscuro (mejor para videos muy claros) */}
<div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />

{/* Más claro (mejor para videos ya oscuros) */}
<div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/50" />

{/* Con color primario más intenso */}
<div className="absolute inset-0 bg-primary/30" />
```

### Cambiar Color del Overlay

```tsx
{/* Overlay azul */}
<div className="absolute inset-0 bg-blue-900/40" />

{/* Overlay verde (actual) */}
<div className="absolute inset-0 bg-primary/20" />

{/* Sin overlay de color */}
{/* Simplemente comenta o elimina la línea del overlay de color */}
```

---

## 🎬 Dónde Conseguir Videos Gratuitos

### Sitios Recomendados:

1. **Pexels Videos** (https://www.pexels.com/videos/)
   - Búsqueda: "real estate", "house interior", "apartment", "modern home"
   - Gratis, sin atribución requerida

2. **Pixabay Videos** (https://pixabay.com/videos/)
   - Búsqueda: "casa", "apartamento", "inmuebles"
   - Gratis, sin atribución requerida

3. **Coverr** (https://coverr.co/)
   - Categoría: Architecture, Interior
   - Gratis, sin atribución requerida

4. **Videvo** (https://www.videvo.net/)
   - Búsqueda: "real estate", "property"
   - Gratis (algunos requieren atribución)

### Palabras Clave de Búsqueda:
- "real estate"
- "house interior"
- "modern apartment"
- "luxury home"
- "property tour"
- "casa moderna"
- "apartamento"
- "inmuebles"

---

## 🔧 Solución de Problemas

### El video no se reproduce

**Problema**: El video no aparece o no se reproduce.

**Soluciones**:
1. Verifica que el archivo existe en `public/videos/hero-background.mp4`
2. Verifica que el formato es MP4 (H.264)
3. Asegúrate de que el atributo `muted` está presente (los navegadores bloquean autoplay con audio)
4. Verifica la consola del navegador para errores

### El video se ve pixelado

**Problema**: El video se ve de baja calidad.

**Soluciones**:
1. Usa un video de al menos 1920x1080
2. Aumenta el bitrate al exportar: `-b:v 3M` o más
3. Usa un codec de mejor calidad

### El video tarda mucho en cargar

**Problema**: La página carga lento por el video.

**Soluciones**:
1. Optimiza el video para web (< 5MB)
2. Usa el flag `-movflags +faststart` en FFmpeg
3. Considera usar un poster image mientras carga:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  poster="/images/hero-poster.jpg"
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-background.mp4" type="video/mp4" />
</video>
```

### El video no se ve bien en móviles

**Problema**: El video consume muchos datos o no se reproduce en móvil.

**Soluciones**:
1. Crea una versión móvil más pequeña del video
2. Usa una imagen de fondo para móviles:

```tsx
{/* Video solo en desktop */}
<video
  autoPlay
  loop
  muted
  playsInline
  className="hidden md:block absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-background.mp4" type="video/mp4" />
</video>

{/* Imagen en móvil */}
<div 
  className="md:hidden absolute inset-0 w-full h-full bg-cover bg-center"
  style={{ backgroundImage: 'url(/images/hero-mobile.jpg)' }}
/>
```

---

## 📱 Responsive Design

El hero ya está optimizado para diferentes tamaños de pantalla:

- **Desktop**: Video completo con todos los elementos
- **Tablet**: Video con elementos ajustados
- **Mobile**: Video o imagen de fondo con layout vertical

---

## 🎯 Ejemplo de Video Ideal

**Características del video perfecto para tu landing:**

- ✅ Duración: 15-20 segundos
- ✅ Contenido: Tour suave por un apartamento moderno o exterior de casas
- ✅ Movimiento: Lento y suave (no mareante)
- ✅ Iluminación: Bien iluminado (natural o artificial)
- ✅ Sin texto o logos en el video
- ✅ Colores: Neutros o cálidos
- ✅ Formato: 16:9 (landscape)

---

## 🚀 Próximos Pasos

1. **Conseguir el video**
   - Descarga un video de los sitios recomendados
   - O graba tu propio video de propiedades

2. **Optimizar el video**
   - Usa FFmpeg o un editor de video
   - Reduce el tamaño a < 5MB

3. **Agregar al proyecto**
   - Coloca en `public/videos/hero-background.mp4`
   - Reinicia el servidor de desarrollo

4. **Ajustar overlay**
   - Prueba diferentes opacidades
   - Asegúrate de que el texto sea legible

5. **Probar en diferentes dispositivos**
   - Desktop
   - Tablet
   - Mobile

---

## 💡 Tips Adicionales

### Agregar Múltiples Formatos de Video

Para mejor compatibilidad:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-background.webm" type="video/webm" />
  <source src="/videos/hero-background.mp4" type="video/mp4" />
  Tu navegador no soporta video HTML5.
</video>
```

### Lazy Loading del Video

Para mejorar el rendimiento inicial:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  loading="lazy"
  className="absolute inset-0 w-full h-full object-cover"
>
  <source src="/videos/hero-background.mp4" type="video/mp4" />
</video>
```

### Pausar Video cuando no está visible

Para ahorrar recursos:

```tsx
import { useEffect, useRef } from 'react';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    // ...
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="/videos/hero-background.mp4" type="video/mp4" />
    </video>
    // ...
  );
};
```

---

## ✅ Checklist Final

- [ ] Video descargado u obtenido
- [ ] Video optimizado (< 5MB)
- [ ] Video colocado en `public/videos/hero-background.mp4`
- [ ] Servidor de desarrollo reiniciado
- [ ] Overlay ajustado para legibilidad
- [ ] Probado en desktop
- [ ] Probado en tablet
- [ ] Probado en móvil
- [ ] Rendimiento verificado

---

**¡Tu hero con video de fondo está listo! 🎉**
