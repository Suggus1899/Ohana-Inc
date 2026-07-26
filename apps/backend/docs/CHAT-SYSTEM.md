# 💬 Sistema de Chat - Habitas

Este documento describe la arquitectura, flujo y funcionalidades del sistema de chat integrado en Habitas.

## 🏗️ Arquitectura
El sistema de chat es una implementación híbrida que utiliza **REST API** para la gestión de datos persistentes y **WebSockets (Socket.IO)** para la comunicación en tiempo real.

### Componentes Principales
- **Backend:**
  - `ChatConversation`: Modelo que agrupa a dos participantes. Puede ser de tipo `rent_request` (vinculado a una transacción) o `direct` (chat libre entre usuarios).
  - `ChatMessage`: Modelo para los mensajes individuales, incluye soporte para moderación automática.
  - `Socket.IO Server`: Maneja la presencia, indicadores de escritura y entrega de mensajes en tiempo real.
- **Frontend:**
  - `useChat` Hook: Centraliza la lógica de conexión, estados de mensajes y acciones de chat.
  - `MessagesSection`: Interfaz principal del panel de mensajes.
  - `NewConversationModal`: Componente para buscar usuarios e iniciar nuevos chats.

---

## 🔄 Flujo de Comunicación

### 1. Inicio de una Conversación
Existen dos formas de iniciar un chat:
- **Por Solicitud de Alquiler:** Se crea automáticamente cuando un inquilino solicita una propiedad. Vincula al inquilino con el propietario.
- **Conversación Directa:** Un usuario busca a otro por nombre a través del botón "Nueva Conversación" en la sección de mensajes e inicia un chat libre.

### 2. Envío de Mensajes
1. El cliente envía un evento `send_message` vía Socket.IO.
2. El servidor recibe el mensaje y aplica **filtros de moderación** (ver sección Moderación).
3. El mensaje se persiste en la base de datos PostgreSQL.
4. El servidor retransmite el mensaje al destinatario vía Socket.IO en tiempo real.
5. Si el destinatario no está conectado, el mensaje queda marcado como no leído para su posterior consulta.

### 3. Tiempo Real
El sistema soporta:
- **Indicadores de escritura:** Evento `user_typing` que muestra cuando el otro usuario está escribiendo.
- **Confirmación de lectura:** Evento `mark_read` que actualiza el estado de los mensajes cuando el chat es abierto.
- **Notificaciones globales:** Contador de mensajes no leídos disponible en toda la plataforma.

---

## 🛡️ Moderación Automática
Para proteger la integridad de la plataforma y evitar el "leakage" (transacciones fuera del sistema), el chat incluye un sistema de filtrado:
- **Detección de Datos de Contacto:** Filtra números de teléfono (incluyendo formatos evasivos), correos electrónicos y nombres de redes sociales.
- **Detección de Patrones Distribuidos:** Si un usuario intenta enviar un número de teléfono separado en varios mensajes (ej. "0412" y luego "1234567"), el sistema lo detecta y bloquea.
- **Acción:** Los mensajes sospechosos son bloqueados y reemplazados por un aviso de seguridad, notificando al remitente sobre la violación de las políticas.

---

## 🛠️ Comandos de Desarrollo Relacionados
Si necesitas realizar pruebas o resetear el estado del chat:
- **Limpiar conversaciones:** Accede a la base de datos y trunca `chat_conversations` y `chat_messages`.
- **Simular mensajes:** Puedes usar el cliente de Socket.IO en las herramientas de desarrollador o crear scripts en `src/scripts/`.

---
*Documentación generada en Mayo 2026*
