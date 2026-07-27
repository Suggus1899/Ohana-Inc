const BRAND_COLOR = '#166534';
const BRAND_NAME = 'Ohana';
const LOGO_URL = 'https://Ohanaweb.me/perfil_correo.png';

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND_NAME}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#f4f6f9;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:20px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND_COLOR} 0%, #14532d 100%);padding:24px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="56" height="56" style="display:inline-block;border-radius:50%;vertical-align:middle;margin-bottom:6px;border:3px solid rgba(255,255,255,0.2);" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${BRAND_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. Todos los derechos reservados.
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">
                <a href="https://Ohanaweb.me" style="color:${BRAND_COLOR};text-decoration:none;">Ohanaweb.me</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function codeBlock(code: string): string {
  return `
    <div style="margin:20px 0;text-align:center;">
      <div style="display:inline-block;background-color:#f1f5f9;border:2px dashed ${BRAND_COLOR};border-radius:10px;padding:16px 32px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#1e293b;font-family:'Courier New',monospace;">${code}</span>
      </div>
    </div>
  `;
}

function ctaButton(url: string, text: string): string {
  return `
    <div style="margin:20px 0;text-align:center;">
      <a href="${url}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
        ${text}
      </a>
    </div>
  `;
}

function infoBox(content: string, bgColor = '#fef3c7', borderColor = '#f59e0b', textColor = '#92400e'): string {
  return `
    <div style="margin:16px 0;padding:14px 16px;background-color:${bgColor};border-radius:8px;border-left:4px solid ${borderColor};">
      <p style="margin:0;color:${textColor};font-size:13px;line-height:1.5;">${content}</p>
    </div>
  `;
}

export function emailVerificationTemplate(userName: string, code: string): string {
  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Verifica tu correo</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${userName}</strong>, usa el siguiente código para verificar tu dirección de correo electrónico:
    </p>
    ${codeBlock(code)}
    <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
      El código expira en <strong>30 minutos</strong> y es de un solo uso.
    </p>
    ${infoBox('Si no creaste una cuenta en ' + BRAND_NAME + ', puedes ignorar este correo.', '#f0fdf4', '#22c55e', '#166534')}
  `;
  return baseLayout(content, `Tu código de verificación es ${code}`);
}

export function passwordResetTemplate(userName: string, code: string): string {
  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Restablecer contraseña</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${userName}</strong>, recibimos una solicitud para restablecer tu contraseña. Ingresa el siguiente código:
    </p>
    ${codeBlock(code)}
    <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
      El código expira en <strong>30 minutos</strong> y es de un solo uso.
    </p>
    ${infoBox('Si no solicitaste este cambio, ignora este correo. Tu contraseña permanecerá segura.')}
  `;
  return baseLayout(content, `Tu código de restablecimiento es ${code}`);
}

export function unreadMessagesDigestTemplate(
  recipientName: string,
  senderNames: string[]
): string {
  const count = senderNames.length;
  const senderList = senderNames.map(name =>
    `<tr><td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px;"><strong>${name}</strong></td></tr>`
  ).join('');

  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Tienes mensajes sin leer</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 12px;">
      Hola <strong>${recipientName}</strong>, ${count === 1 ? 'una persona te escribió' : `${count} personas te escribieron`} mientras no estabas:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      ${senderList}
    </table>
    ${ctaButton('https://Ohanaweb.me/dashboard', 'Ver mensajes')}
    <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;padding-top:12px;border-top:1px solid #e2e8f0;">
      Recibes este correo porque tienes mensajes sin leer en la plataforma.
    </p>
  `;
  return baseLayout(content, `Tienes ${count} mensaje${count > 1 ? 's' : ''} sin leer`);
}

export function welcomeTemplate(userName: string): string {
  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">¡Correo verificado!</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${userName}</strong>, tu correo ha sido verificado exitosamente. Ya tienes acceso completo a la plataforma.
    </p>
    ${ctaButton('https://Ohanaweb.me', 'Explorar ' + BRAND_NAME)}
    <div style="margin:16px 0 0;padding:16px;background-color:#f0fdf4;border-radius:8px;">
      <p style="margin:0 0 6px;color:#1e293b;font-size:13px;font-weight:600;">¿Qué puedes hacer ahora?</p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="padding:2px 0;color:#475569;font-size:13px;">&bull; Buscar propiedades disponibles</td></tr>
        <tr><td style="padding:2px 0;color:#475569;font-size:13px;">&bull; Publicar tu propiedad</td></tr>
        <tr><td style="padding:2px 0;color:#475569;font-size:13px;">&bull; Contactar directamente con propietarios</td></tr>
        <tr><td style="padding:2px 0;color:#475569;font-size:13px;">&bull; Gestionar tus favoritos</td></tr>
      </table>
    </div>
  `;
  return baseLayout(content, '¡Tu cuenta está lista!');
}

export function passwordChangedTemplate(userName: string): string {
  const content = `
    <h2 style="margin:0 0 12px;color:#1e293b;font-size:20px;font-weight:600;">Contraseña actualizada</h2>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 4px;">
      Hola <strong>${userName}</strong>, tu contraseña ha sido restablecida exitosamente.
    </p>
    ${infoBox('Si no realizaste este cambio, contacta a soporte@Ohanaweb.me inmediatamente.')}
    ${ctaButton('https://Ohanaweb.me/login', 'Iniciar sesión')}
  `;
  return baseLayout(content, 'Tu contraseña fue actualizada');
}