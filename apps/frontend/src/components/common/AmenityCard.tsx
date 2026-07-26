import {
  Wifi, Droplets, Zap, Wind, Bath, BookOpen, BedSingle,
  CookingPot, WashingMachine, Laptop, Gamepad2, Car,
  ShieldCheck, Fingerprint, DoorOpen, Waves, Dumbbell,
  Shield, ArrowUpDown, Sun, Flower2, Building2, Package,
  Trophy, ToyBrick, UtensilsCrossed, Tv, Trees, Sparkles,
  CheckCircle, type LucideIcon,
} from "lucide-react";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "Internet fibra óptica": Wifi,
  "Tanque de agua con bomba": Droplets,
  "Planta eléctrica / Inversor": Zap,
  "Gas directo / Banco de bombonas": Wind,
  "Climatización (Aire acond.)": Wind,
  "Baño privado": Bath,
  "Mobiliario de estudio": BookOpen,
  "Cama y clóset": BedSingle,
  "Cocina totalmente equipada": CookingPot,
  "Área de lavandería": WashingMachine,
  "Zona de estudio / Co-working": Laptop,
  "Área de esparcimiento": Gamepad2,
  "Estacionamiento cerrado": Car,
  "Cerco eléctrico y CCTV": ShieldCheck,
  "Control de acceso inteligente": Fingerprint,
  "Entrada independiente": DoorOpen,
  "Piscina": Waves,
  "Gimnasio": Dumbbell,
  "Seguridad 24h": Shield,
  "Ascensor": ArrowUpDown,
  "Terraza": Sun,
  "Jardín": Flower2,
  "Balcón": Building2,
  "Bodega": Package,
  "Cancha deportiva": Trophy,
  "Área de juegos": ToyBrick,
  "Comedor": UtensilsCrossed,
  "Sala de TV": Tv,
  "Patio": Trees,
  "Servicio de limpieza": Sparkles,
};

const FALLBACK_ICON = CheckCircle;

function getIcon(feature: string): LucideIcon {
  const normalized = feature.trim();
  if (FEATURE_ICONS[normalized]) return FEATURE_ICONS[normalized];

  const noAccent = normalized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [key, Icon] of Object.entries(FEATURE_ICONS)) {
    const keyNoAccent = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (keyNoAccent === noAccent) return Icon;
  }

  return FALLBACK_ICON;
}

export function AmenityCard({ feature }: { feature: string }) {
  const Icon = getIcon(feature);

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 transition-colors">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 text-white shrink-0">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <span className="text-[11px] leading-tight text-center font-medium text-gray-700 break-words line-clamp-2">
        {feature}
      </span>
    </div>
  );
}

export function AmenityGrid({ features }: { features: string[] | string }) {
  let parsed: string[];
  if (typeof features === 'string') {
    try {
      parsed = JSON.parse(features);
    } catch {
      parsed = [];
    }
  } else {
    parsed = features;
  }

  if (!parsed || parsed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta propiedad no tiene características registradas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
      {parsed.map((feature, index) => (
        <AmenityCard key={index} feature={feature} />
      ))}
    </div>
  );
}
