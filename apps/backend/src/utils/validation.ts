export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface RegisterInput {
  name?: string;
  email?: string;
  password?: string;
  phonePrefix?: string;
  phone?: string;
  cedulaType?: string;
  cedula?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
}

const VALID_GENDERS = ['masculino', 'femenino', 'otro', 'prefiero-no-decir'];

export interface LoginInput {
  email?: string;
  password?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date validation regex (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Valid document types (Colombia)
const VALID_CEDULA_TYPES = ['CC', 'CE'];

// Valid phone prefixes (Colombia first)
const VALID_PHONE_PREFIXES = ['+57', '+1', '+34', '+52', '+54', '+56', '+51'];

export function validateEmail(email: string | undefined): ValidationError | null {
  if (!email || email.trim() === '') {
    return { field: 'email', message: 'El correo electrónico es obligatorio' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { field: 'email', message: 'El formato del correo electrónico no es válido. Ejemplo: usuario@ejemplo.com' };
  }
  return null;
}

export function validatePassword(password: string | undefined): ValidationError | null {
  if (!password || password.trim() === '') {
    return { field: 'password', message: 'La contraseña es obligatoria' };
  }
  if (password.length < 6) {
    return { field: 'password', message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  if (password.length > 100) {
    return { field: 'password', message: 'La contraseña no puede tener más de 100 caracteres' };
  }
  return null;
}

export function validateRequired(value: string | undefined, field: string, label: string): ValidationError | null {
  if (!value || value.trim() === '') {
    return { field, message: `${label} es obligatorio` };
  }
  return null;
}

export function validateCedulaType(cedulaType: string | undefined): ValidationError | null {
  if (!cedulaType || cedulaType.trim() === '') {
    return { field: 'cedulaType', message: 'El tipo de cédula es obligatorio' };
  }
  if (!VALID_CEDULA_TYPES.includes(cedulaType)) {
    return { field: 'cedulaType', message: 'Tipo de documento inválido. Debe ser CC (Cédula de Ciudadanía) o CE (Cédula de Extranjería)' };
  }
  return null;
}

export function validatePhonePrefix(phonePrefix: string | undefined): ValidationError | null {
  if (!phonePrefix || phonePrefix.trim() === '') {
    return { field: 'phonePrefix', message: 'El prefijo telefónico es obligatorio' };
  }
  if (!VALID_PHONE_PREFIXES.includes(phonePrefix)) {
    return { field: 'phonePrefix', message: 'Prefijo telefónico inválido. Selecciona uno de la lista' };
  }
  return null;
}

export function validateDateOfBirth(dateOfBirth: string | undefined): ValidationError | null {
  if (!dateOfBirth || dateOfBirth.trim() === '') {
    return { field: 'dateOfBirth', message: 'La fecha de nacimiento es obligatoria' };
  }
  
  if (!DATE_REGEX.test(dateOfBirth)) {
    return { field: 'dateOfBirth', message: 'Formato de fecha inválido. Usa YYYY-MM-DD' };
  }
  
  const date = new Date(dateOfBirth);
  if (isNaN(date.getTime())) {
    return { field: 'dateOfBirth', message: 'La fecha de nacimiento no es válida' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { field: 'dateOfBirth', message: 'La fecha de nacimiento no puede ser futura' };
  }
  
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return { field: 'dateOfBirth', message: 'La fecha de nacimiento no es válida' };
  }
  
  // Check minimum age (13 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);
  if (date > maxDate) {
    return { field: 'dateOfBirth', message: 'Debes tener al menos 13 años para registrarte' };
  }
  
  return null;
}

export function validateGender(gender: string | undefined): ValidationError | null {
  if (!gender || gender.trim() === '') {
    return { field: 'gender', message: 'El género es obligatorio' };
  }
  if (!VALID_GENDERS.includes(gender)) {
    return { field: 'gender', message: 'Selecciona un género válido de la lista' };
  }
  return null;
}

export function validateRegisterInput(input: RegisterInput): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const nameError = validateRequired(input.name, 'name', 'El nombre completo');
  if (nameError) errors.push(nameError);
  else if (input.name && (input.name.length < 2 || input.name.length > 100)) {
    errors.push({ field: 'name', message: 'El nombre debe tener entre 2 y 100 caracteres' });
  }

  const emailError = validateEmail(input.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.push(passwordError);

  const phonePrefixError = validatePhonePrefix(input.phonePrefix);
  if (phonePrefixError) errors.push(phonePrefixError);

  const phoneError = validateRequired(input.phone, 'phone', 'El número de teléfono');
  if (phoneError) errors.push(phoneError);
  else if (input.phone && (input.phone.length < 7 || input.phone.length > 20)) {
    errors.push({ field: 'phone', message: 'El número de teléfono debe tener entre 7 y 20 dígitos' });
  }

  const cedulaTypeError = validateCedulaType(input.cedulaType);
  if (cedulaTypeError) errors.push(cedulaTypeError);

  const cedulaError = validateRequired(input.cedula, 'cedula', 'El número de cédula');
  if (cedulaError) errors.push(cedulaError);
  else if (input.cedula && (input.cedula.length < 6 || input.cedula.length > 20)) {
    errors.push({ field: 'cedula', message: 'El número de cédula debe tener entre 6 y 20 caracteres' });
  }

  const dateOfBirthError = validateDateOfBirth(input.dateOfBirth);
  if (dateOfBirthError) errors.push(dateOfBirthError);

  const genderError = validateGender(input.gender);
  if (genderError) errors.push(genderError);

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateLoginInput(input: LoginInput): ValidationResult {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(input.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors
  };
}
