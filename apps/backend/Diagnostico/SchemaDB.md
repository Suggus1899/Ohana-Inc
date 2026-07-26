// ==========================================
// 1. GESTIÓN DE USUARIOS Y SEGURIDAD (KYC)
// ==========================================

Table users {
  id integer [primary key, increment]
  name varchar
  email varchar [unique, not null]
  password varchar [not null]
  role varchar [not null, note: 'admin, operator, propietario, cliente']
  phone_prefix varchar
  phone varchar
  cedula_type varchar
  cedula varchar [unique]
  date_of_birth date
  city varchar
  is_verified boolean [default: false]
  account_status varchar [not null, note: 'pending, active, suspended, rejected, blocked']
  verified_by_id integer [ref: > users.id]
  verification_level integer [default: 0, note: '1-5']
  profile_photo_url text
  created_at timestamp
  updated_at timestamp
}

Table kyc_verifications {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  reviewed_by integer [ref: > users.id]
  status varchar [note: 'pending, approved, rejected']
  rejection_reason text
  verified_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table kyc_documents {
  id integer [primary key, increment]
  verification_id integer [ref: > kyc_verifications.id]
  type varchar [note: 'id_front, id_back, selfie']
  url varchar
  created_at timestamp
  updated_at timestamp
}

Table kyc_attempts {
  id integer [primary key, increment]
  verification_id integer [ref: > kyc_verifications.id]
  attempt_number integer
  result_data json
  created_at timestamp
  updated_at timestamp
}

Table notifications {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  title varchar
  message text
  type varchar [note: 'info, success, warning, error']
  is_read boolean [default: false]
  link varchar
  created_at timestamp
  updated_at timestamp
}

Table user_actions {
  id integer [primary key, increment]
  action varchar [note: 'block, unblock, suspend, activate, warn']
  target_user_id integer [ref: > users.id]
  performed_by integer [ref: > users.id]
  reason text
  duration integer
  expires_at timestamp
  created_at timestamp
  updated_at timestamp
}

// ==========================================
// 2. INVENTARIO Y REPUTACIÓN (SEPARADA)
// ==========================================

Table properties {
  id integer [primary key, increment]
  author_id integer [ref: > users.id]
  moderator_id integer [ref: > users.id]
  title varchar [not null]
  description text
  type varchar [note: 'Residencia, Apartamento, Casa, Cuarto, Finca, Local, Terreno']
  listing_type varchar [note: 'Alquiler, Venta']
  price decimal [not null]
  price_type varchar [note: 'monthly, daily, weekly']
  lat decimal
  lng decimal
  address varchar
  location varchar
  city varchar
  state varchar
  zip_code varchar
  neighborhood varchar
  bedrooms integer
  bathrooms integer
  area decimal
  floor integer
  total_floors integer
  furnished boolean
  status varchar [note: 'pending, approved, rejected']
  is_verified boolean [default: false]
  is_featured boolean [default: false]
  views integer [default: 0]
  main_image varchar
  images jsonb
  verified_by_id integer [ref: > users.id]
  verified_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table characteristics {
  id integer [primary key, increment]
  name varchar [not null]
  description text
  icon varchar
  category varchar [note: 'service, amenity, policy']
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table property_characteristics {
  property_id integer [ref: > properties.id]
  characteristic_id integer [ref: > characteristics.id]
  primary key (property_id, characteristic_id)
}

Table favorites {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  property_id integer [ref: > properties.id]
  created_at timestamp
  updated_at timestamp
}

// Calificaciones de Estudiantes a las Residencias
Table property_reviews {
  id integer [primary key, increment]
  property_id integer [ref: > properties.id]
  tenant_id integer [ref: > users.id, note: 'Estudiante que califica']
  rating integer [note: '1-5 estrellas']
  comment text
  created_at timestamp
  updated_at timestamp
}

// Calificaciones entre Usuarios (Dueño <-> Estudiante)
Table user_reviews {
  id integer [primary key, increment]
  reviewer_id integer [ref: > users.id, note: 'Quién califica']
  target_user_id integer [ref: > users.id, note: 'Quién es calificado']
  rental_request_id integer [ref: > rental_requests.id, note: 'Vínculo al alquiler']
  rating integer [note: '1-5 estrellas']
  comment text
  type varchar [note: 'to_tenant, to_owner']
  created_at timestamp
  updated_at timestamp
}

// ==========================================
// 3. OPERACIONES Y CHAT
// ==========================================

Table rental_requests {
  id integer [primary key, increment]
  property_id integer [ref: > properties.id]
  tenant_id integer [ref: > users.id]
  owner_id integer [ref: > users.id]
  status varchar [note: 'pending, viewed, accepted, rejected, cancelled']
  message text
  phone_number varchar
  move_in_date date
  lease_duration integer
  responded_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table chat_conversations {
  id integer [primary key, increment]
  rent_request_id integer [ref: - rental_requests.id]
  participant1_id integer [ref: > users.id]
  participant2_id integer [ref: > users.id]
  last_message_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table chat_messages {
  id integer [primary key, increment]
  conversation_id integer [ref: > chat_conversations.id]
  sender_id integer [ref: > users.id]
  content text
  is_blocked boolean [default: false]
  read_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table property_assignments {
  id integer [primary key, increment]
  property_id integer [ref: > properties.id]
  client_id integer [ref: > users.id]
  transaction_id integer [ref: > transactions.id]
  status varchar
  created_at timestamp
  updated_at timestamp
}

// ==========================================
// 4. FINANZAS Y DISPUTAS
// ==========================================

Table transactions {
  id integer [primary key, increment]
  rental_request_id integer [ref: > rental_requests.id]
  property_id integer [ref: > properties.id]
  client_id integer [ref: > users.id]
  owner_id integer [ref: > users.id]
  amount decimal
  status varchar
  payment_method varchar
  escrow_status varchar
  created_at timestamp
  updated_at timestamp
}

Table transaction_timeline {
  id integer [primary key, increment]
  transaction_id integer [ref: > transactions.id]
  action varchar [note: 'created, approved, payment_submitted, etc.']
  actor varchar [note: 'client, owner, operator, system']
  actor_id integer [ref: > users.id]
  previous_status varchar
  new_status varchar
  details text
  metadata json
  created_at timestamp
}

Table disputes {
  id integer [primary key, increment]
  transaction_id integer [ref: > transactions.id]
  reported_by integer [ref: > users.id]
  reported_against integer [ref: > users.id]
  resolved_by integer [ref: > users.id]
  reason text
  description text
  evidence_urls text[]
  resolution text
  status varchar [note: 'open, investigating, resolved, closed']
  created_at timestamp
  updated_at timestamp
}

// ==========================================
// 5. SOPORTE Y ANALÍTICAS
// ==========================================

Table tickets {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  category varchar [note: 'technical, billing, property, account, other']
  priority varchar [note: 'low, medium, high, urgent']
  status varchar [note: 'open, assigned, in_progress, waiting_user, resolved, closed']
  subject varchar
  description text
  message text
  assigned_to integer [ref: > users.id]
  moderator_id integer [ref: > users.id]
  resolved_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table ticket_responses {
  id integer [primary key, increment]
  ticket_id integer [ref: > tickets.id]
  user_id integer [ref: > users.id]
  message text
  is_internal boolean [default: false]
  attachments json
  created_at timestamp
  updated_at timestamp
}

Table reports {
  id integer [primary key, increment]
  reported_by integer [ref: > users.id]
  reported_entity varchar [note: 'user, property, comment, message']
  entity_id integer
  reason varchar [note: 'spam, inappropriate, fraud, harassment, other']
  description text
  status varchar [note: 'pending, investigating, resolved, dismissed']
  assigned_to integer [ref: > users.id]
  resolution text
  resolved_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table audit_logs {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  action varchar
  entity varchar
  entity_id integer
  changes json
  ip_address varchar
  user_agent varchar
  timestamp timestamp
}

Table tasks {
  id integer [primary key, increment]
  title varchar
  description text
  priority varchar [note: 'low, medium, high, urgent']
  status varchar [note: 'pending, in_progress, completed, cancelled']
  type varchar [default: 'manual']
  related_id integer
  due_date timestamp
  completed_at timestamp
  assigned_to_id integer [ref: > users.id]
  assigned_by_id integer [ref: > users.id]
  created_at timestamp
  updated_at timestamp
}

// ==========================================
// 6. ANALÍTICAS (COMPORTAMIENTO)
// ==========================================

Table property_views {
  id integer [primary key, increment]
  property_id integer [ref: > properties.id]
  user_id integer [ref: > users.id]
  session_id varchar
  view_duration integer
  source varchar [note: 'search, direct, favorite, recommendation']
  device_type varchar [note: 'desktop, mobile, tablet']
  timestamp timestamp
}

Table search_histories {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  session_id varchar
  search_query varchar
  filters json
  result_count integer
  clicked_results json
  timestamp timestamp
}

Table user_behaviors {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  session_id varchar
  event_type varchar [note: 'search, view, favorite, request, filter, click']
  event_data json
  timestamp timestamp
}

Table user_sessions {
  id integer [primary key, increment]
  user_id integer [ref: > users.id]
  started_at timestamp
  ended_at timestamp
  duration_seconds integer
  os_device varchar
  created_at timestamp
  updated_at timestamp
}

Table user_behavior_events {
  id integer [primary key, increment]
  session_id integer [ref: > user_sessions.id]
  user_id integer [ref: > users.id]
  event_type varchar [note: 'CLICK, SEARCH, VIEW, SCROLL_LIMIT']
  target_element varchar
  metadata json
  created_at timestamp
}

// ==========================================
// GRUPOS LÓGICOS
// ==========================================

TableGroup Usuarios_y_Seguridad {
  users
  kyc_verifications
  kyc_documents
  kyc_attempts
  notifications
  user_actions
}

TableGroup Inventario_y_Reputacion {
  properties
  characteristics
  property_characteristics
  favorites
  property_reviews
  user_reviews
}

TableGroup Operaciones_y_Chat {
  rental_requests
  chat_conversations
  chat_messages
  property_assignments
}

TableGroup Finanzas_y_Legal {
  transactions
  transaction_timeline
  disputes
}

TableGroup Soporte_y_Control {
  tickets
  ticket_responses
  reports
  audit_logs
  tasks
}

TableGroup Analiticas {
  property_views
  search_histories
  user_behaviors
  user_sessions
  user_behavior_events
}
