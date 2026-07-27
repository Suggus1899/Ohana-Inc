# 🗃️ Problemas Pendientes de Base de Datos — Ohana

> **Documento de referencia para el equipo de desarrollo.**  
> Este archivo describe las inconsistencias detectadas en el esquema actual de la base de datos,
> su impacto en el sistema y la solución conceptual propuesta para cada una.
>
> **Estado:** Pendiente de implementación  
> **Prioridad:** Alta — deben resolverse antes de conectar el frontend con datos reales

---

## Índice

1. [Sistema de mensajería duplicado (`messages` vs `chat_messages`)](#1-sistema-de-mensajería-duplicado)
2. [Campo `status` duplicado en la tabla `users`](#2-campo-status-duplicado-en-users)
3. [Tabla `transactions` sin vínculo a `rental_requests`](#3-transactions-sin-vínculo-a-rental_requests)
4. [Refactor de `services` a `characteristics`](#4-refactor-de-services-a-characteristics)

---

# Deteccion de error a solucionar cuanto antes

## Inconsistencia en Modelo de Usuario (`User.ts`)

**Descripción:**
Se ha detectado que los campos `dateOfBirth` y `city` están definidos como propiedades de la clase `User` en TypeScript, pero **no están incluidos** en la inicialización de Sequelize (`User.init`).

**Impacto:**
Aunque los tipos de TypeScript sugieren que estos campos existen, Sequelize no los reconocerá al realizar consultas (`SELECT`, `INSERT`, `UPDATE`). Esto resultará en:
- Los datos de fecha de nacimiento y ciudad no se persistirán en la base de datos.
- Las consultas devolverán `undefined` para estos campos incluso si se intentan asignar manualmente en el código.

**Ubicación:**
Archivo: `src/models/User.ts`
- Definición de clase: Líneas 17-18.
- Inicialización de Sequelize: Líneas 42-120 (faltan los campos).

**Recomendación:**
Agregar las definiciones de `dateOfBirth` (DataTypes.DATEONLY) y `city` (DataTypes.STRING) dentro del objeto de atributos en `User.init`.

---
## 1. Sistema de Mensajería Duplicado

### El problema

Existen **dos tablas de mensajería completamente separadas** en la base de datos que cumplen funciones similares pero con estructuras distintas, sin ninguna relación entre sí:

#### Tabla `messages` (modelo `Message.ts`)

- Es un sistema de mensajería **directo** entre dos usuarios.
- Opcionalmente referencia una propiedad, pero no una solicitud de alquiler.
- No tiene agrupación por conversación.
- No tiene moderación ni capacidad de bloquear mensajes.

#### Tabla `chat_messages` (modelo `ChatMessage.ts`)

Junto a su tabla de contexto `chat_conversations`:

- Vinculada al flujo de negocio (mediante `rentRequestId`).
- Agrupación por conversación.
- Timestamp de lectura preciso (`readAt`).
- Capacidad de moderación / bloqueo (`isBlocked`).

### Impacto actual

El flujo correcto del negocio dicta que la comunicación ocurre después de una solicitud de alquiler (`RentalRequest`), lo que abre una `ChatConversation` donde se envían los `ChatMessage`.

La tabla `messages` pertenece a un diseño anterior que fue reemplazado por el sistema de chat con conversaciones. Si el frontend consume ambas tablas, los mensajes quedarán dispersos y nunca habrá un historial unificado. La tabla `messages` actualmente está **huérfana** — ningún flujo activo la alimenta correctamente.

### Solución propuesta

**Eliminar la tabla `messages` y el modelo `Message.ts` del sistema.**

El sistema correcto y completo ya existe: `chat_conversations` + `chat_messages`. Además, se deben remover las rutas, controladores e interfaces relacionadas a la tabla huérfana.

---

## 2. Campo `status` Duplicado en `users`

### El problema

La tabla `users` tiene **dos columnas que describen el estado del usuario** con semánticas que se superponen:

- `accountStatus`: Pensado originalmente para el ciclo de aprobación de cuenta (admin/KYC).
- `status`: Pensado originalmente para moderación en caliente (operador).

### El conflicto concreto

Un usuario recién registrado tiene cuenta sin aprobar (`accountStatus = 'pending'`), pero su estado operativo podría decir activo (`status = 'active'`). Esto genera una contradicción directa.

Esto genera ambigüedad crítica en los middlewares de autenticación sobre cuál campo revisar para dejar operar al usuario, además de confusión cuando un rol cambia un estado y el otro queda desactualizado.

### Solución propuesta

**Eliminar la columna `status` y ampliar el ENUM de `accountStatus`** para que cubra todos los casos en un solo campo unificado:

| Estado      | Significado                                     |
| ----------- | ----------------------------------------------- |
| `pending`   | Recién registrado, esperando aprobación         |
| `active`    | Cuenta aprobada y operando normalmente          |
| `suspended` | Suspendido temporalmente (por admin u operador) |
| `rejected`  | Solicitud de cuenta rechazada definitivamente   |
| `blocked`   | Bloqueado por moderación (puede ser reversible) |

Se debe actualizar el modelo `User.ts`, los tipos y todos los controladores que referenciaban a `status`.

---

## 3. `transactions` Sin Vínculo a `rental_requests`

### El problema

El flujo de negocio es lineal y secuencial (Solicitud → Pago → Ocupación). Sin embargo, en la base de datos **la tabla `transactions` no tiene ninguna referencia a `rental_requests`**.

### Impacto concreto

#### A. No hay trazabilidad del origen del pago

Si un cliente tiene varias solicitudes activas, al registrarse un pago en `transactions` no hay forma directa ni segura de vincular ese pago a la solicitud específica que lo originó.

#### B. Las condiciones acordadas no se transfieren

La solicitud guarda la fecha de mudanza y la duración del contrato. La transacción no hereda esta información vital.

#### C. El chat queda desconectado de la transacción

Un operador resolviendo una disputa en una transacción no puede acceder al historial de chat del acuerdo, porque el chat está vinculado a la solicitud, y la transacción no sabe a qué solicitud pertenece.

### Solución propuesta

**Agregar un campo `rentalRequestId` a la tabla `transactions`** como llave foránea.

Debe ser una relación que persista si la solicitud cambia, o configurada con `SET NULL` si se requiere auditoría de pagos incluso si la solicitud es borrada. Se deben actualizar las relaciones correspondientes en `models/index.ts`.

---

## 4. Refactor de `services` a `characteristics`

### El problema

El modelo de datos para las características de una propiedad está fragmentado y tiene categorías incorrectas:

- La tabla `properties` almacena un campo `features` como un arreglo JSON (ej: `["wifi", "piscina"]`). Esto es un anti-patrón en bases relacionales porque impide hacer búsquedas y filtros eficientes desde SQL.
- Existe una tabla `services` y una pivote `property_services`, pero sus categorías actuales (`basic`, `premium`, `amenity`) no se alinean con la realidad del negocio habitacional.

### Solución propuesta

1. **Renombrar tablas:**
   - Cambiar la tabla `services` a `characteristics`.
   - Cambiar la tabla pivote `property_services` a `property_characteristics`.

2. **Actualizar categorías del ENUM:**
   El nuevo campo de categoría en `characteristics` debe estructurarse así:
   - `service`: Servicios utilitarios (ej. lavado de ropa, wifi, pozo de agua).
   - `amenity`: Comodidades o extras (ej. piscina, gym, áreas comunes).
   - `policy`: Reglas o políticas (ej. solo mujeres, no fiestas, no mascotas).

3. **Eliminar el campo `features`:**
   Borrar la columna `features` (JSON) de la tabla `properties`. Todos esos datos deben migrar y existir exclusivamente mediante la relación Many-to-Many con la nueva tabla `characteristics`.

---
## 5. Mejora de lógica de calificaciones y reviews para Usuarios Y Propiedades

### El problema

Actualmente, el sistema de reseñas está limitado a calificar la propiedad de forma genérica, lo que deja vacíos críticos:
1.  **Vulnerabilidad del Propietario**: No hay forma de calificar el comportamiento de los inquilinos (estudiantes), lo que impide filtrar a usuarios problemáticos o que incumplen reglas.
2.  **Confusión de Reputación**: Se mezcla la calidad física de la casa con el trato personal del dueño. Un buen dueño con una casa vieja, o un mal dueño con una casa de lujo, terminan con la misma métrica confusa.

### Solución propuesta

Separar las reseñas en dos tablas independientes para garantizar que cada entidad tenga su propia reputación y métricas específicas:

#### A. Tabla `property_reviews` (Enfoque: Infraestructura)
Permite al estudiante calificar la veracidad, limpieza y calidad de la residencia.
- **Campos**: `id`, `property_id`, `tenant_id`, `rating`, `comment`, `created_at`.

#### B. Tabla `user_reviews` (Enfoque: Comportamiento/Bilateral)
Permite la calificación mutua entre las personas involucradas en el alquiler para generar un historial de confianza.
- **Campos**: `id`, `reviewer_id`, `target_user_id`, `rental_request_id` (contexto obligatorio), `type` (`to_tenant` / `to_owner`), `rating`, `comment`, `created_at`.

### Impacto en el negocio
Este sistema bilateral crea un **Círculo de Confianza** real. Los estudiantes cuidarán más las propiedades para no tener reseñas negativas que les impidan alquilar en el futuro, y los dueños se esforzarán por dar un mejor trato para atraer a los mejores inquilinos del sistema.


## Resumen de cambios propuestos en DB

| # | Tabla afectada | Tipo de cambio |
|---|---|---|
| 1 | `messages` | Eliminar tabla y modelo |
| 2 | `users` | Eliminar columna `status`, agregar valor `blocked` a `accountStatus` |
| 3 | `transactions` | Agregar columna `rentalRequestId` |
| 4 | `services` | Renombrar a `characteristics` y ajustar categorías |
| 5 | `property_services` | Renombrar a `property_characteristics` |
| 6 | `properties` | Eliminar columna JSON `features` |
| 7 | `property_reviews` | Crear tabla para calificar específicamente el inmueble |
| 8 | `user_reviews` | Crear tabla para calificación bilateral entre personas |

---

## 🔗 Diagrama de Base de Datos (Actualizado y Normalizado)

Para ver cómo quedará la base de datos tras aplicar todas estas correcciones (incluyendo las nuevas tablas propuestas como `reviews` y `notifications`), consulta el esquema oficial depurado en DB Diagram:

**👉 [Ver Diagrama de Base de Datos de Ohana](https://dbdiagram.io/d/Ohana_DB-69f3ceeaddb9320fdca4df6c)**

---

_Analisis realizado por Julian Amer — Equipo Ohana_ <br> <br>
_Para que Bogotá tenga un marcado antes y despues luego de nuestra estancia aqui_
