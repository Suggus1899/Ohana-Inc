# Instrucciones para Implementar Sistema de Comentarios y Calificaciones

**Objetivo**: Crear un sistema completo de reviews y calificaciones para propiedades  
**Tiempo estimado**: 14-18 horas  
**Prioridad**: Alta  
**Enfoque**: Experiencia similar a Airbnb/Booking con validaciones robustas

---

## 🎯 Visión General

Implementar un sistema de comentarios y calificaciones donde:
- Estudiantes pueden dejar reviews de propiedades donde han vivido
- Calificación con estrellas (1-5)
- Comentarios de texto con validación
- Solo usuarios autenticados pueden comentar
- Moderación y edición de comentarios
- Estadísticas agregadas de calificaciones
- Respuestas del propietario (opcional)

---

## 📋 FASE 1: Backend - Modelo y Base de Datos (3 horas)

### Tarea 1.1: Crear modelo Review (1.5 horas)

**Archivo a crear**: `backend-residencias/src/models/Review.ts`

**Instrucciones**:

1. **Definir estructura del modelo Review**:
   - `id`: Identificador único (autoincremental)
   - `propertyId`: ID de la propiedad (foreign key)
   - `userId`: ID del usuario que comenta (foreign key)
   - `rating`: Calificación en estrellas (1-5, tipo INTEGER)
   - `comment`: Texto del comentario (tipo TEXT, máximo 1000 caracteres)
   - `isVerifiedStay`: Boolean indicando si el usuario realmente se hospedó
   - `helpfulCount`: Contador de "útil" (likes)
   - `status`: Estado del review ('pending', 'approved', 'rejected', 'hidden')
   - `ownerResponse`: Respuesta del propietario (tipo TEXT, nullable)
   - `ownerResponseDate`: Fecha de respuesta del propietario (nullable)
   - `createdAt`: Fecha de creación
   - `updatedAt`: Fecha de última actualización

2. **Definir validaciones**:
   - Rating debe estar entre 1 y 5
   - Comment no puede estar vacío
   - Comment máximo 1000 caracteres
   - Un usuario solo puede dejar un review por propiedad

3. **Definir relaciones**:
   - Review pertenece a Property (belongsTo)
   - Review pertenece a User (belongsTo)
   - Property tiene muchos Reviews (hasMany)
   - User tiene muchos Reviews (hasMany)

4. **Crear índices**:
   - Índice en propertyId para búsquedas rápidas
   - Índice en userId para búsquedas por usuario
   - Índice compuesto en (propertyId, userId) para validar unicidad
   - Índice en status para filtrar por estado
   - Índice en rating para estadísticas

**Resultado esperado**:
- Modelo Review completo con validaciones
- Relaciones configuradas correctamente
- Índices para optimizar consultas

---

### Tarea 1.2: Crear migración para tabla reviews (1.5 horas)

**Archivo a crear**: `backend-residencias/src/migrations/YYYYMMDD-create-reviews-table.ts`

**Instrucciones**:

1. **Crear migración up**:
   - Crear tabla `reviews` con todos los campos del modelo
   - Definir foreign keys con ON DELETE CASCADE
   - Crear constraint UNIQUE en (propertyId, userId)
   - Crear constraint CHECK para rating entre 1 y 5
   - Crear todos los índices mencionados

2. **Crear migración down**:
   - Eliminar tabla `reviews` completamente
   - Eliminar índices asociados

3. **Ejecutar migración**:
   - Probar migración up
   - Probar migración down
   - Verificar que no hay errores

**Resultado esperado**:
- Tabla reviews creada en la base de datos
- Constraints y validaciones a nivel de BD
- Migración reversible

---

## 🔧 FASE 2: Backend - Controladores y Rutas (4 horas)

### Tarea 2.1: Crear controlador de reviews (3 horas)

**Archivo a crear**: `backend-residencias/src/controllers/review.controller.ts`

**Instrucciones**:

1. **Función createReview**:
   - Validar que el usuario esté autenticado
   - Validar que la propiedad exista
   - Validar que el usuario no haya dejado review previamente en esa propiedad
   - Validar rating (1-5) y comment (no vacío, max 1000 chars)
   - Opcional: Validar que el usuario haya tenido una transacción completada en esa propiedad (isVerifiedStay = true)
   - Crear review con status 'approved' (o 'pending' si requiere moderación)
   - Actualizar estadísticas de la propiedad (promedio de rating)
   - Retornar review creado

2. **Función getPropertyReviews**:
   - Recibir propertyId como parámetro
   - Obtener todos los reviews con status 'approved'
   - Incluir información del usuario (name, profileImage)
   - Ordenar por fecha descendente (más recientes primero)
   - Implementar paginación (10 reviews por página)
   - Incluir estadísticas: total de reviews, promedio de rating, distribución por estrellas

3. **Función getUserReviews**:
   - Obtener todos los reviews del usuario autenticado
   - Incluir información de la propiedad
   - Ordenar por fecha descendente

4. **Función updateReview**:
   - Validar que el usuario sea el autor del review
   - Permitir editar solo rating y comment
   - No permitir editar después de 7 días de creado
   - Actualizar estadísticas de la propiedad
   - Retornar review actualizado

5. **Función deleteReview**:
   - Validar que el usuario sea el autor o admin
   - Cambiar status a 'hidden' (soft delete)
   - Actualizar estadísticas de la propiedad
   - Retornar confirmación

6. **Función addOwnerResponse**:
   - Validar que el usuario sea el propietario de la propiedad
   - Agregar respuesta del propietario
   - Actualizar ownerResponseDate
   - Retornar review actualizado

7. **Función markHelpful**:
   - Incrementar helpfulCount del review
   - Guardar en tabla auxiliar qué usuarios marcaron como útil (evitar duplicados)
   - Retornar review actualizado

**Resultado esperado**:
- Controlador completo con todas las funciones CRUD
- Validaciones robustas
- Manejo de errores apropiado

---

### Tarea 2.2: Crear rutas de reviews (1 hora)

**Archivo a crear**: `backend-residencias/src/routes/review.routes.ts`

**Instrucciones**:

1. **Definir rutas públicas** (sin autenticación):
   - `GET /api/reviews/property/:propertyId` - Obtener reviews de una propiedad
   - `GET /api/reviews/property/:propertyId/stats` - Obtener estadísticas de reviews

2. **Definir rutas protegidas** (requieren autenticación):
   - `POST /api/reviews` - Crear review
   - `GET /api/reviews/my-reviews` - Obtener mis reviews
   - `PUT /api/reviews/:id` - Actualizar mi review
   - `DELETE /api/reviews/:id` - Eliminar mi review
   - `POST /api/reviews/:id/helpful` - Marcar review como útil

3. **Definir rutas de propietario**:
   - `POST /api/reviews/:id/response` - Agregar respuesta del propietario

4. **Registrar rutas en app.ts**:
   - Importar reviewRoutes
   - Agregar `app.use('/api/reviews', reviewRoutes)`

**Resultado esperado**:
- Rutas configuradas correctamente
- Middleware de autenticación aplicado donde corresponde
- Endpoints accesibles desde el frontend

---

## 🎨 FASE 3: Frontend - Componentes de UI (5 horas)

### Tarea 3.1: Crear componente ReviewCard (1.5 horas)

**Archivo a crear**: `frontend-residencias/src/components/reviews/ReviewCard.tsx`

**Instrucciones**:

1. **Diseñar tarjeta de review**:
   - Avatar del usuario (o iniciales si no tiene foto)
   - Nombre del usuario
   - Fecha del review (formato relativo: "hace 2 días")
   - Calificación con estrellas (visual)
   - Badge "Estancia verificada" si isVerifiedStay es true
   - Texto del comentario
   - Botón "Útil" con contador
   - Respuesta del propietario (si existe) en un recuadro diferenciado

2. **Implementar interacciones**:
   - Click en "Útil" incrementa contador
   - Mostrar/ocultar respuesta del propietario con animación
   - Botones de editar/eliminar solo si es el autor (y dentro de 7 días)

3. **Diseño responsive**:
   - Desktop: tarjeta completa con avatar a la izquierda
   - Mobile: avatar arriba, contenido abajo

**Resultado esperado**:
- Componente ReviewCard reutilizable y elegante
- Diseño similar a Airbnb/Booking
- Responsive y accesible

---

### Tarea 3.2: Crear componente ReviewForm (1.5 horas)

**Archivo a crear**: `frontend-residencias/src/components/reviews/ReviewForm.tsx`

**Instrucciones**:

1. **Diseñar formulario de review**:
   - Selector de estrellas interactivo (hover y click)
   - Textarea para comentario (máximo 1000 caracteres)
   - Contador de caracteres restantes
   - Botón "Publicar reseña"
   - Botón "Cancelar"

2. **Implementar validaciones**:
   - Rating es obligatorio (mínimo 1 estrella)
   - Comentario es obligatorio (mínimo 10 caracteres)
   - Comentario máximo 1000 caracteres
   - Mostrar errores de validación en tiempo real

3. **Implementar envío**:
   - Deshabilitar botón mientras se envía
   - Mostrar loading spinner
   - Mostrar mensaje de éxito/error
   - Limpiar formulario después de envío exitoso
   - Actualizar lista de reviews sin recargar página

4. **Diseño**:
   - Estrellas grandes y fáciles de clickear
   - Textarea con altura automática
   - Botones con colores de la marca

**Resultado esperado**:
- Formulario intuitivo y fácil de usar
- Validaciones claras
- Feedback inmediato al usuario

---

### Tarea 3.3: Crear componente ReviewsSection (2 horas)

**Archivo a crear**: `frontend-residencias/src/components/reviews/ReviewsSection.tsx`

**Instrucciones**:

1. **Diseñar sección completa de reviews**:
   - Título: "Reseñas de huéspedes"
   - Resumen de estadísticas:
     - Calificación promedio (grande y destacado)
     - Total de reseñas
     - Distribución por estrellas (barras horizontales)
   - Botón "Escribir reseña" (solo si está autenticado)
   - Lista de reviews (usando ReviewCard)
   - Paginación o "Cargar más"

2. **Implementar lógica de carga**:
   - Cargar reviews al montar el componente
   - Cargar estadísticas de la propiedad
   - Implementar paginación (10 reviews por página)
   - Mostrar loading skeleton mientras carga

3. **Implementar filtros y ordenamiento**:
   - Ordenar por: Más recientes, Más antiguos, Mejor calificados, Peor calificados
   - Filtrar por calificación (5 estrellas, 4+, 3+, etc.)
   - Dropdown de ordenamiento
   - Chips de filtros activos

4. **Manejo de estados**:
   - Estado vacío: "Sé el primero en dejar una reseña"
   - Estado de carga: Skeleton loaders
   - Estado de error: Mensaje de error con botón de reintentar
   - Estado con datos: Lista de reviews

5. **Integración con autenticación**:
   - Si no está autenticado, botón "Escribir reseña" muestra modal de login
   - Si está autenticado, botón abre ReviewForm
   - Si ya dejó review, mostrar su review destacado arriba

**Resultado esperado**:
- Sección completa y funcional de reviews
- Estadísticas visuales atractivas
- Experiencia fluida para el usuario

---

## 🔗 FASE 4: Integración en Páginas (3 horas)

### Tarea 4.1: Integrar en página de detalle de propiedad (2 horas)

**Archivo a modificar**: `frontend-residencias/src/pages/PropertyDetail.tsx`

**Instrucciones**:

1. **Agregar ReviewsSection al final de la página**:
   - Después de toda la información de la propiedad
   - Antes del footer
   - Con separador visual (línea o espacio)

2. **Pasar propertyId como prop**:
   - ReviewsSection debe recibir el ID de la propiedad actual
   - Cargar reviews específicos de esa propiedad

3. **Agregar scroll automático**:
   - Si el usuario viene desde un link directo a reviews (#reviews)
   - Scroll suave a la sección de reviews

4. **Actualizar promedio de rating en el header**:
   - Mostrar calificación promedio junto al título de la propiedad
   - Mostrar número total de reviews
   - Hacer clickeable para scroll a sección de reviews

**Resultado esperado**:
- Reviews integrados en la página de propiedad
- Navegación fluida a la sección
- Información de rating visible en el header

---

### Tarea 4.2: Integrar en landing page (1 hora)

**Archivo a modificar**: `frontend-residencias/src/pages/Index.tsx`

**Instrucciones**:

1. **Mostrar rating en tarjetas de propiedades**:
   - Agregar estrellas y promedio de rating
   - Mostrar número de reviews
   - Diseño compacto para no saturar la tarjeta

2. **Validar autenticación antes de comentar**:
   - Si usuario no autenticado intenta comentar, mostrar modal de login
   - Después de login, redireccionar a la propiedad con formulario abierto

3. **Agregar filtro por rating** (opcional):
   - Filtrar propiedades por calificación mínima
   - Slider o checkboxes para seleccionar rating mínimo

**Resultado esperado**:
- Rating visible en todas las propiedades del landing
- Flujo de autenticación claro
- Filtros funcionales

---

## ✨ FASE 5: Funcionalidades Avanzadas (3 horas)

### Tarea 5.1: Implementar sistema de "Útil" (1 hora)

**Archivo a crear**: `backend-residencias/src/models/ReviewHelpful.ts`

**Instrucciones**:

1. **Crear tabla auxiliar ReviewHelpful**:
   - `id`: Identificador único
   - `reviewId`: ID del review
   - `userId`: ID del usuario que marcó como útil
   - `createdAt`: Fecha
   - Constraint UNIQUE en (reviewId, userId)

2. **Implementar lógica en frontend**:
   - Botón "Útil" con ícono de pulgar arriba
   - Cambiar color cuando el usuario ya lo marcó
   - Actualizar contador en tiempo real
   - Deshabilitar si no está autenticado

**Resultado esperado**:
- Sistema de "Útil" funcional
- Sin duplicados por usuario
- Feedback visual inmediato

---

### Tarea 5.2: Implementar respuestas del propietario (1 hora)

**Archivo a crear**: `frontend-residencias/src/components/reviews/OwnerResponseForm.tsx`

**Instrucciones**:

1. **Crear formulario de respuesta**:
   - Solo visible para el propietario de la propiedad
   - Textarea para respuesta
   - Botón "Responder"
   - Máximo 500 caracteres

2. **Mostrar respuesta en ReviewCard**:
   - Recuadro diferenciado (fondo gris claro)
   - Etiqueta "Respuesta del propietario"
   - Fecha de respuesta
   - Texto de la respuesta

3. **Validaciones**:
   - Solo el propietario puede responder
   - Solo una respuesta por review
   - Puede editar su respuesta

**Resultado esperado**:
- Propietarios pueden responder a reviews
- Respuestas visibles para todos
- Diseño diferenciado

---

### Tarea 5.3: Implementar edición y eliminación (1 hora)

**Instrucciones**:

1. **Agregar botones de edición**:
   - Botón "Editar" solo visible para el autor
   - Solo editable dentro de 7 días de creado
   - Abrir formulario con datos pre-cargados
   - Actualizar review sin recargar página

2. **Agregar botón de eliminación**:
   - Botón "Eliminar" solo visible para el autor o admin
   - Modal de confirmación antes de eliminar
   - Soft delete (cambiar status a 'hidden')
   - Actualizar lista sin recargar página

3. **Validaciones**:
   - Verificar permisos en backend
   - Mostrar mensajes de error claros
   - Actualizar estadísticas después de editar/eliminar

**Resultado esperado**:
- Usuarios pueden editar sus reviews (dentro de 7 días)
- Usuarios pueden eliminar sus reviews
- Proceso seguro con confirmaciones

---

## 📊 FASE 6: Estadísticas y Optimizaciones (2 horas)

### Tarea 6.1: Calcular y cachear estadísticas (1 hora)

**Archivo a crear**: `backend-residencias/src/services/review-stats.service.ts`

**Instrucciones**:

1. **Crear servicio de estadísticas**:
   - Función para calcular promedio de rating
   - Función para contar reviews por propiedad
   - Función para obtener distribución por estrellas
   - Función para actualizar estadísticas en la tabla Property

2. **Agregar campos a Property**:
   - `averageRating`: Promedio de calificación (DECIMAL)
   - `totalReviews`: Total de reviews (INTEGER)
   - Actualizar estos campos cada vez que se crea/edita/elimina un review

3. **Implementar cache**:
   - Cachear estadísticas en Redis (5 minutos)
   - Invalidar cache al crear/editar/eliminar review
   - Reducir consultas a la base de datos

**Resultado esperado**:
- Estadísticas calculadas eficientemente
- Cache para mejorar rendimiento
- Datos siempre actualizados

---

### Tarea 6.2: Optimizar consultas y rendimiento (1 hora)

**Instrucciones**:

1. **Optimizar consultas de reviews**:
   - Usar eager loading para incluir usuario y propiedad
   - Limitar campos retornados (no enviar datos innecesarios)
   - Implementar paginación eficiente
   - Agregar índices faltantes

2. **Implementar lazy loading en frontend**:
   - Cargar reviews solo cuando el usuario scrollea a la sección
   - Usar Intersection Observer
   - Mostrar skeleton mientras carga

3. **Optimizar imágenes de avatares**:
   - Usar tamaño pequeño (50x50px)
   - Lazy load de avatares
   - Placeholder mientras carga

4. **Implementar debounce en búsqueda/filtros**:
   - Esperar 300ms antes de aplicar filtros
   - Cancelar peticiones anteriores
   - Mostrar loading indicator

**Resultado esperado**:
- Carga rápida de reviews
- Experiencia fluida sin lag
- Optimización de recursos

---

## ✅ Checklist de Validación

### Backend
- [ ] Modelo Review creado con todas las validaciones
- [ ] Migración ejecutada correctamente
- [ ] Controlador con todas las funciones CRUD
- [ ] Rutas configuradas y protegidas
- [ ] Validación de permisos funcionando
- [ ] Estadísticas calculándose correctamente
- [ ] Cache implementado

### Frontend - Componentes
- [ ] ReviewCard diseñado y funcional
- [ ] ReviewForm con validaciones
- [ ] ReviewsSection completa con estadísticas
- [ ] Selector de estrellas interactivo
- [ ] Paginación o "Cargar más" funcionando
- [ ] Filtros y ordenamiento operativos

### Integración
- [ ] Reviews visibles en página de propiedad
- [ ] Rating visible en tarjetas del landing
- [ ] Scroll automático a reviews funciona
- [ ] Autenticación requerida para comentar
- [ ] Modal de login aparece si no está autenticado

### Funcionalidades Avanzadas
- [ ] Sistema de "Útil" funcional
- [ ] Respuestas del propietario implementadas
- [ ] Edición de reviews (dentro de 7 días)
- [ ] Eliminación de reviews (soft delete)
- [ ] Validación de estancia verificada

### Rendimiento
- [ ] Consultas optimizadas con índices
- [ ] Cache de estadísticas funcionando
- [ ] Lazy loading de reviews
- [ ] Paginación eficiente
- [ ] Sin memory leaks

---

## 🧪 Casos de Prueba

### Prueba 1: Crear review como usuario autenticado
1. Iniciar sesión como estudiante
2. Ir a una propiedad
3. Scroll a sección de reviews
4. Click en "Escribir reseña"
5. Seleccionar 5 estrellas
6. Escribir comentario
7. Click en "Publicar"
8. Verificar que aparece en la lista
9. Verificar que estadísticas se actualizan

### Prueba 2: Intentar comentar sin autenticación
1. Ir a una propiedad sin iniciar sesión
2. Scroll a sección de reviews
3. Click en "Escribir reseña"
4. Verificar que aparece modal de login
5. Iniciar sesión
6. Verificar que se abre formulario de review

### Prueba 3: Editar review
1. Crear un review
2. Click en "Editar"
3. Cambiar rating y comentario
4. Guardar cambios
5. Verificar que se actualiza
6. Esperar 8 días
7. Verificar que ya no se puede editar

### Prueba 4: Marcar review como útil
1. Ver review de otro usuario
2. Click en "Útil"
3. Verificar que contador incrementa
4. Verificar que botón cambia de color
5. Intentar marcar de nuevo
6. Verificar que no se duplica

### Prueba 5: Respuesta del propietario
1. Iniciar sesión como propietario
2. Ver review en su propiedad
3. Click en "Responder"
4. Escribir respuesta
5. Publicar
6. Verificar que aparece debajo del review
7. Verificar que otros usuarios la ven

### Prueba 6: Validación de review único
1. Crear un review en una propiedad
2. Intentar crear otro review en la misma propiedad
3. Verificar que muestra error
4. Verificar que solo permite editar el existente

---

## 📊 Métricas de Éxito

Al completar la implementación, el sistema debe:
- ✅ Permitir crear reviews en < 30 segundos
- ✅ Cargar reviews en < 2 segundos
- ✅ Mostrar estadísticas actualizadas en tiempo real
- ✅ Soportar 1000+ reviews por propiedad sin lag
- ✅ Validar permisos correctamente (0 errores de seguridad)
- ✅ Tasa de conversión de reviews: 15%+ de usuarios que ven la propiedad
- ✅ Satisfacción del usuario: 9/10 o superior

---

## 🚨 Consideraciones Importantes

### Moderación de Contenido
- Implementar filtro de palabras ofensivas (opcional)
- Sistema de reportes para reviews inapropiados
- Panel de admin para aprobar/rechazar reviews
- Notificar al propietario de nuevos reviews

### Prevención de Spam
- Limitar a 1 review por usuario por propiedad
- Validar que el usuario haya completado una transacción (opcional)
- Rate limiting: máximo 5 reviews por día por usuario
- Captcha si se detecta comportamiento sospechoso

### SEO y Visibilidad
- Agregar schema.org markup para reviews
- Incluir reviews en meta tags de la propiedad
- Generar sitemap con reviews
- Optimizar para búsqueda de "reviews de [propiedad]"

### Notificaciones
- Notificar al propietario de nuevos reviews
- Notificar al usuario cuando el propietario responde
- Notificar cuando su review recibe "Útil"
- Email digest semanal con resumen de reviews

### Privacidad
- Permitir reviews anónimos (opcional)
- Ocultar información sensible del usuario
- Permitir al usuario eliminar su review permanentemente
- GDPR compliance: exportar/eliminar datos del usuario

---

## 📞 Recursos Recomendados

### Librerías de Estrellas
- **React Rating**: https://www.npmjs.com/package/react-rating
- **React Stars**: https://www.npmjs.com/package/react-stars
- **React Simple Star Rating**: https://www.npmjs.com/package/react-simple-star-rating

### Validación de Texto
- **Bad Words Filter**: https://www.npmjs.com/package/bad-words
- **Profanity Filter**: https://www.npmjs.com/package/profanity-filter

### Paginación
- **React Paginate**: https://www.npmjs.com/package/react-paginate
- **Infinite Scroll**: https://www.npmjs.com/package/react-infinite-scroll-component

### Referencias de Diseño
- **Airbnb Reviews**: https://www.airbnb.com/
- **Booking.com Reviews**: https://www.booking.com/
- **TripAdvisor**: https://www.tripadvisor.com/

---

## 🎨 Diseño de Referencia

### Distribución por Estrellas (Ejemplo Visual)
```
★★★★★  [████████████████████] 65% (130 reviews)
★★★★☆  [████████████        ] 25% (50 reviews)
★★★☆☆  [████                ]  8% (16 reviews)
★★☆☆☆  [█                   ]  1% (2 reviews)
★☆☆☆☆  [█                   ]  1% (2 reviews)
```

### Estructura de ReviewCard
```
┌─────────────────────────────────────────────┐
│ [Avatar] Juan Pérez        ★★★★★ 5.0       │
│          hace 2 días       ✓ Estancia verificada │
│                                             │
│ "Excelente propiedad, muy limpia y cerca   │
│  de la universidad. El propietario fue muy │
│  atento. Totalmente recomendado."          │
│                                             │
│ [👍 Útil (12)]  [Responder]  [Editar]      │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ 📝 Respuesta del propietario:           ││
│ │ "Gracias por tu comentario Juan..."     ││
│ │ hace 1 día                               ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

**Última actualización**: 13 de abril de 2026  
**Versión**: 1.0  
**Estado**: Listo para implementación  
**Prioridad**: Alta
