import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { Search, MapPin, Home, Building, TreePine, Store, GraduationCap, Clock, X, Mountain, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { historyService } from "@/services/historyService";
import api from "@/services/api";
import { retryWithBackoff } from "@/utils/retryWithBackoff";

const typeLabelMap: Record<string, string> = {
  Residencias: "Residencia",
  Apartamentos: "Apartamento",
  Casas: "Casa",

  Locales: "Local",
  Terrenos: "Terreno",
  Fincas: "Finca",
};

const categoryDefs = [
  { icon: GraduationCap, label: "Residencias" },
  { icon: Building, label: "Apartamentos" },
  { icon: Home, label: "Casas" },

  { icon: Store, label: "Locales" },
  { icon: Mountain, label: "Terrenos" },
  { icon: TreePine, label: "Fincas" },
];

const slides = ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"];

const Hero = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    retryWithBackoff(
      () => api.getPropertyCountsByType().then((res) => {
        if (!res.success || !res.data?.counts) {
          throw new Error(res.error?.message || 'Error al cargar conteos');
        }
        return res.data.counts;
      }),
      { maxRetries: 3, baseDelay: 1000, onRetry: (attempt) => console.warn(`Reintentando cargar conteos (intento ${attempt}/3)...`) }
    ).then((counts) => {
      const map: Record<string, number> = {};
      counts.forEach((c) => { map[c.type] = Number(c.count); });
      setCounts(map);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setHistory(historyService.getHistory());
  }, []);

  const categories = categoryDefs.map((cat) => ({
    ...cat,
    count: counts[typeLabelMap[cat.label]] ?? 0,
  }));

  const handleSearch = () => {
    if (searchQuery.trim()) {
      historyService.addSearch(searchQuery.trim());
      setHistory(historyService.getHistory());
    }
  };

  const removeHistoryItem = (item: string) => {
    historyService.removeSearch(item);
    setHistory(historyService.getHistory());
  };

  return (
    <section className="relative h-[calc(100dvh-56px)] min-h-[600px] overflow-hidden">
        {/* Image Slider Background */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((img, i) => (
            <div
              key={img}
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url('/images/slider/${img}')`,
                opacity: currentSlide === i ? 1 : 0,
              }}
            />
          ))}
          
          {/* Dark Overlay para legibilidad */}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center overflow-y-auto pt-14 pb-6">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center text-white">
              {/* Title */}
              <m.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight leading-tight"
              >
                Tu{" "}
                <span className="relative">
                  residencia ideal
                  <m.span
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute bottom-1 left-0 h-2 bg-white/20 -z-10 rounded"
                  />
                </span>
                {" "}para estudiar
              </m.h1>

              {/* Subtitle */}
              <m.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg mb-6 text-white/90 max-w-2xl mx-auto"
              >
                Alquiler y venta de apartamentos, casas, cuartos, locales, terrenos y fincas cerca de tu universidad o trabajo en Bogotá
              </m.p>

              {/* Search Bar */}
              <m.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="max-w-xl mx-auto mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                    <Input
                      placeholder="¿Dónde quieres vivir?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowHistory(true)}
                      className="pl-10 h-10 bg-white border-0 text-foreground placeholder:text-muted-foreground rounded-lg text-sm"
                    />

                    {/* Recent Searches Dropdown */}
                    {showHistory && history.length > 0 && (
                      <m.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden text-left z-50"
                      >
                        <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Búsquedas recientes</span>
                          <button
                            onClick={() => setShowHistory(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {history.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors group cursor-pointer"
                            >
                              <div
                                className="flex items-center gap-3 flex-1"
                                onClick={() => {
                                  setSearchQuery(item);
                                  setShowHistory(false);
                                }}
                              >
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeHistoryItem(item);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-500 transition-all"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </m.div>
                    )}
                  </div>
                  <Link to="/estudiante">
                    <Button
                      variant="secondary"
                      className="h-10 px-5 rounded-lg w-full sm:w-auto text-sm"
                      onClick={handleSearch}
                    >
                      <Search className="h-4 w-4 mr-1.5" />
                      Buscar
                    </Button>
                  </Link>
                </div>
              </m.div>

              {/* Categories */}
              <m.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="hidden sm:flex flex-wrap lg:flex-nowrap justify-center gap-2"
              >
                {categories.map((cat, index) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={index}
                      to="/estudiante"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm border border-white/30 text-sm"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                      <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded-full">{cat.count}</span>
                    </Link>
                  );
                })}
              </m.div>
            </div>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
        >
          <m.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white/90 transition-colors cursor-pointer"
            onClick={() => {
              document.getElementById("propiedades")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="text-[10px] font-medium tracking-wider uppercase">Descubre</span>
            <ChevronDown className="h-4 w-4" />
          </m.div>
        </m.div>
    </section>
  );
};

export default Hero;
