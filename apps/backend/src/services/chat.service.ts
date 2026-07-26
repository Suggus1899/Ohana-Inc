import { Op } from 'sequelize';

// Content filter patterns with risk scores
interface PatternConfig {
  pattern: RegExp;
  score: number;
  type: string;
}

// Whitelist: contextos legítimos que no deben bloquearse
const LEGITIMATE_CONTEXTS = [
  // Dinero: $100, 100$, 100 bs, precios, etc.
  { pattern: /\$\s*\d+/g, description: 'monto_dinero' },
  { pattern: /\d+\s*\$/g, description: 'monto_dinero' },
  { pattern: /\d+\s*(bs|Bs|BS|bol[ií]vares|USD|EUR)/gi, description: 'monto_dinero' },
  // Horas: 3:00, 15:30, etc.
  { pattern: /\b\d{1,2}\s*:\s*\d{2}\b/g, description: 'hora' },
  { pattern: /\b\d{1,2}\s*(am|pm|AM|PM|hrs|horas)\b/g, description: 'hora' },
  // Fechas: 12/05, 2024, etc.
  { pattern: /\b\d{1,2}\s*[\/\-]\s*\d{1,2}\s*[\/\-]?\s*\d{2,4}\b/g, description: 'fecha' },
  // Cantidades, metros, etc.
  { pattern: /\d+\s*(m|m2|mts|metros|km|kg|g|ml|lts)/gi, description: 'unidad_medida' },
];

// Verificar si un número está en contexto legítimo
function isLegitimateContext(text: string, matchIndex: number, matchLength: number): boolean {
  // Obtener contexto alrededor del match (20 chars antes y después)
  const contextStart = Math.max(0, matchIndex - 20);
  const contextEnd = Math.min(text.length, matchIndex + matchLength + 20);
  const context = text.substring(contextStart, contextEnd);
  
  for (const legit of LEGITIMATE_CONTEXTS) {
    legit.pattern.lastIndex = 0;
    if (legit.pattern.test(context)) {
      return true;
    }
  }
  return false;
}

const CONTACT_PATTERNS: PatternConfig[] = [
  // Venezuelan phone numbers - complete format
  { pattern: /\b0(412|414|416|424|426)\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}\b/gi, score: 40, type: 'phone' },
  { pattern: /\b(412|414|416|424|426)\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}\b/gi, score: 40, type: 'phone' },
  { pattern: /\+58\s*[-.]?\s*(412|414|416|424|426)\s*[-.]?\s*\d{3}\s*[-.]?\s*\d{4}\b/gi, score: 40, type: 'phone' },
  // Phone numbers split across messages (e.g., "412" in one, "7541234" in another)
  // Pattern: operadora venezolana seguida de 7 dígitos
  { pattern: /\b(412|414|416|424|426)\s*[\n\r,;]+\s*\d{7}\b/gi, score: 50, type: 'phone_split' },
  // Pattern: solo operadora venezolana (posible parte 1) - con word boundary estricto
  { pattern: /^(\s*412\s*|\s*414\s*|\s*416\s*|\s*424\s*|\s*426\s*)$/gi, score: 35, type: 'phone_operator_only' },
  // Pattern: 7 dígitos exactos que parecen ser parte de teléfono (posible parte 2)
  { pattern: /^\s*\d{7}\s*$/gi, score: 35, type: 'phone_number_part' },
  // Pattern: 6-7 dígitos con separadores (754-1234, 754 1234)
  { pattern: /^\s*\d{3}\s*[\s\-]\s*\d{4}\s*$/gi, score: 35, type: 'phone_number_part' },
  // Pattern: 4 dígitos exactos (posible continuación de operadora + número corto)
  { pattern: /^\s*\d{4}\s*$/gi, score: 25, type: 'phone_short_part' },
  // Pattern: 3 dígitos exactos (posible inicio de número)
  { pattern: /^\s*\d{3}\s*$/gi, score: 20, type: 'phone_tiny_part' },
  // Evasive phone patterns (spaced out numbers)
  { pattern: /\b0\s*4\s*1\s*2\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/gi, score: 45, type: 'phone_evasive' },
  { pattern: /\b0\s*4\s*1\s*4\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/gi, score: 45, type: 'phone_evasive' },
  { pattern: /\b0\s*4\s*1\s*6\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/gi, score: 45, type: 'phone_evasive' },
  { pattern: /\b0\s*4\s*2\s*4\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/gi, score: 45, type: 'phone_evasive' },
  { pattern: /\b0\s*4\s*2\s*6\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\s*\d\b/gi, score: 45, type: 'phone_evasive' },
  // Special characters between digits
  { pattern: /\b0[._\-]*4[._\-]*1[._\-]*[2-6][._\-]*\d[._\-]*\d[._\-]*\d[._\-]*\d[._\-]*\d[._\-]*\d[._\-]*\d\b/gi, score: 45, type: 'phone_evasive' },
  // International formats
  { pattern: /\b\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g, score: 35, type: 'phone_international' },
  // Sequential numbers that could be phones (but be more strict)
  { pattern: /\b\d{10,11}\b/g, score: 25, type: 'numeric_sequence' },
  // Email addresses
  { pattern: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/gi, score: 35, type: 'email' },
  { pattern: /\b[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}\b/gi, score: 40, type: 'email_evasive' },
  { pattern: /\b(gmail|hotmail|yahoo|outlook)\s*[:.]?\s*(com|es|net)?\b/gi, score: 20, type: 'email_domain' },
  // WhatsApp / social media - comprehensive evasive patterns
  { pattern: /\bwhatsapp|whats\s*app|watsap|wsp|wpp|wasap|wh@ts@pp|wh4ts4pp|w.h.a.t.s.a.p.p|w-h-a-t-s-a-p-p\b/gi, score: 30, type: 'whatsapp' },
  { pattern: /\bws|w\.a|w@p|wp\b/gi, score: 35, type: 'whatsapp_evasive' },
  { pattern: /wa\.me\/\S+/gi, score: 40, type: 'whatsapp_link' },
  { pattern: /api\.whatsapp\.com\/send\?phone=\S+/gi, score: 40, type: 'whatsapp_api' },
  // Instagram variants - incluyendo ig
  { pattern: /\binstagram|insta\s*gram|ig\b|inst@gr@m|[i1]nst[a4]gr[a4]m|i.n.s.t.a.g.r.a.m\b/gi, score: 30, type: 'instagram' },
  { pattern: /\big\.\w{2,}|instagram\.com\/\S+/gi, score: 35, type: 'instagram_link' },
  // Telegram variants
  { pattern: /\btelegram|telegr[aá]m|tg\b|t\.me\/\S+|t\.g|t-l-g\b/gi, score: 30, type: 'telegram' },
  // Facebook variants - incluyendo fb
  { pattern: /\bfacebook|face\s*book|fb\b|fb\.com|f@cebook|f[4a]cebook|f.a.c.e.b.o.o.k\b/gi, score: 30, type: 'facebook' },
  { pattern: /\bfb\.me\/\S+|facebook\.com\/\S+/gi, score: 35, type: 'facebook_link' },
  // Other platforms
  { pattern: /\bmessenger|msn\b/gi, score: 25, type: 'messenger' },
  { pattern: /\btiktok|tik\s*tok\b/gi, score: 25, type: 'tiktok' },
  { pattern: /\bsnapchat|snap\b/gi, score: 25, type: 'snapchat' },
  { pattern: /\bsignal\b/gi, score: 25, type: 'signal' },
  { pattern: /\bzoom\s*(?:id|meeting)?\b/gi, score: 25, type: 'zoom' },
  { pattern: /\bgmeet|google\s*meet\b/gi, score: 25, type: 'gmeet' },
  // URLs and links
  { pattern: /https?:\/\/\S+/gi, score: 25, type: 'url' },
  { pattern: /www\.\S+/gi, score: 20, type: 'www' },
  { pattern: /\b(bit\.ly|tinyurl|short\.link|t\.co|ow\.ly|buff\.ly)\/\S+/gi, score: 30, type: 'short_url' },
];

// Banned phrases with scores
const BANNED_PHRASES = [
  { phrase: /\b(pasa|pásame|dame|danos|comparte)\s+(tu|su|el)\s+(número|numero|teléfono|telefono|celular|contacto|whatsapp|wsp|wpp|ws|ig|fb|instagram|face)\b/gi, score: 25 },
  { phrase: /\b(mi\s+(número|numero|teléfono|telefono|whatsapp|wsp|wpp|ws|ig|fb|instagram|face)\s+(es|:\s*))\b/gi, score: 25 },
  { phrase: /\b(llámame|llamame|te\s+llamo|me\s+llamas|hablemos\s+por\s+teléfono)\b/gi, score: 25 },
  { phrase: /\b(fuera\s+de\s+(la\s+plataforma|el\s+sistema))\b/gi, score: 30 },
  { phrase: /\b(hablemos|contactame|contáctame|comunícate|comunicate)\s+(por|fuera|afuera)\b/gi, score: 30 },
  { phrase: /\b(coordinamos|coordinar|quedamos|quedar)\s+(por|fuera|afuera)\b/gi, score: 30 },
  // Abreviaciones de contacto directo
  { phrase: /\b(sigueme|sígueme|follow|add|agrega|agregame)\s+(en|por|al)\s+(ig|ws|fb|wsp|wp|insta|face|whatsapp|instagram|facebook)\b/gi, score: 30 },
  { phrase: /\b(escríbeme|escribeme|hablame|chat)\s+(por|en|al)\s+(ig|ws|fb|wsp|wp|insta|face|whatsapp|instagram|facebook)\b/gi, score: 30 },
  { phrase: /\b(mándame|mandame|envíame|enviame)\s+(foto|fotos|mi\s+foto|mi\s+instagram|mi\s+facebook|mi\s+whatsapp)\s+(al|por|a)\s*(ig|ws|fb|wsp|wp|whatsapp|instagram|facebook)?\b/gi, score: 35 },
  { phrase: /\b(te\s+dejo|dejo)\s+(mi|el)\s+(ig|ws|fb|wsp|wp|instagram|facebook|whatsapp)\b/gi, score: 30 },
  { phrase: /\b(búscame|buscame|encuentrame|ubícame)\s+(en|por|como)\s+(ig|ws|fb|wsp|wp|instagram|facebook|whatsapp)\b/gi, score: 30 },
  // Frases con @ (menciones)
  { phrase: /\b(arroba|@)\s*\w+\s+(en\s+ig|en\s+instagram|en\s+fb|en\s+facebook|en\s+ws|en\s+whatsapp)\b/gi, score: 30 },
  // Contacto externo
  { phrase: /\b(contacto|contactarme|contactarte)\s+(directo|personal|externo|por)\s+(ig|ws|fb|whatsapp|instagram|facebook)\b/gi, score: 30 },
];

const BLOCKED_REPLACEMENT = '[CONTENIDO BLOQUEADO]';
const HIGH_RISK_THRESHOLD = 61;

interface FilterResult {
  filtered: string;
  wasBlocked: boolean;
  riskScore: number;
  violations: string[];
}

export function filterContent(text: string): FilterResult {
  let filtered = text;
  let riskScore = 0;
  const violations: string[] = [];
  const matchedPatterns = new Set<string>();

  // Check regex patterns
  for (const config of CONTACT_PATTERNS) {
    config.pattern.lastIndex = 0;
    const matches = [...filtered.matchAll(config.pattern)];
    if (matches.length > 0) {
      // Verificar si el match está en contexto legítimo (dinero, hora, etc.)
      const isLegit = matches.some(match => {
        const matchIndex = match.index || 0;
        return isLegitimateContext(text, matchIndex, match[0].length);
      });
      
      // Si está en contexto legítimo, reducir drásticamente el riesgo o ignorar
      if (isLegit && config.type.includes('phone')) {
        continue; // Saltar este patrón si es contexto legítimo
      }
      
      if (!matchedPatterns.has(config.type)) {
        riskScore += config.score;
        violations.push(config.type);
        matchedPatterns.add(config.type);
      } else {
        riskScore += Math.floor(config.score * 0.3);
      }
      config.pattern.lastIndex = 0;
      filtered = filtered.replace(config.pattern, BLOCKED_REPLACEMENT);
    }
  }

  // Check banned phrases
  for (const config of BANNED_PHRASES) {
    config.phrase.lastIndex = 0;
    if (config.phrase.test(filtered)) {
      violations.push('banned_phrase');
      riskScore += config.score;
      config.phrase.lastIndex = 0;
    }
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);
  const wasBlocked = riskScore >= HIGH_RISK_THRESHOLD;

  return { filtered, wasBlocked, riskScore, violations };
}
