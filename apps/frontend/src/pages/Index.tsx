import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Hero from "@/components/layout/Hero";
import Navbar from "@/components/layout/Navbar";
import PropertyCard from "@/components/common/PropertyCard";
import Features from "@/components/layout/Features";
import Footer from "@/components/layout/Footer";
import LocationMap from "@/components/common/LocationMap";
import api, { Property } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building, Home, Store, GraduationCap, TreePine, MapPin, ChevronLeft, ChevronRight, Mountain, ShieldAlert, ChevronsLeft, ChevronsRight } from "lucide-react";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { retryWithBackoff } from "@/utils/retryWithBackoff";

const categories = [
  { id: "Todos", label: "Todos", icon: null },
  { id: "Residencia", label: "Residencias", icon: GraduationCap },
  { id: "Apartamento", label: "Apartamentos", icon: Building },
  { id: "Casa", label: "Casas", icon: Home },
  { id: "Local", label: "Locales", icon: Store },

  { id: "Terreno", label: "Terrenos", icon: Mountain },
  { id: "Finca", label: "Fincas", icon: TreePine },
];

const getItemsPerPage = () => window.innerWidth < 640 ? 6 : 12;

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [showOwnerOnlyModal, setShowOwnerOnlyModal] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  useEffect(() => {
    retryWithBackoff(
      () => api.getProperties({ limit: 50 }).then((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.error?.message || 'Error al cargar propiedades');
        }
        return res.data.properties;
      }),
      { maxRetries: 3, baseDelay: 1000, onRetry: (attempt) => console.warn(`Reintentando cargar propiedades (intento ${attempt}/3)...`) }
    ).then(setProperties).catch(console.error);
  }, []);

  const featuredProperties = properties.filter((p) => p.isFeatured);

  const filteredProperties = activeFilter === "Todos"
    ? properties
    : properties.filter((p) => p.type === activeFilter);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    if (prevPageRef.current !== currentPage) {
      prevPageRef.current = currentPage;
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 }, [
    Autoplay({ delay: 4000, stopOnInteraction: false })
  ]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handlePublishProperty = () => {
    if (!isAuthenticated) {
      navigate('/registro');
      return;
    }
    if (user?.role === 'propietario') {
      navigate('/propietario');
      return;
    }
    setShowOwnerOnlyModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-100 via-[#F6F7F9] via-[#FEFEFE] to-[#F4F5F7]">
      <Navbar variant="default" />
      <Hero />

      {/* Featured Properties */}
      <section id="propiedades" className="py-16 md:py-20 bg-gradient-to-br from-white via-gray-100/70 to-green-100/50">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="text-primary font-medium mb-2 block">Destacados</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">Residencias y propiedades destacadas</h2>
            <p className="text-muted-foreground mt-2">Ideales para estudiantes y profesionales</p>
          </m.div>

          {featuredProperties.length > 0 ? (
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-1.5">
                  {featuredProperties.map((property, index) => (
                    <div key={property.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%] xl:flex-[0_0_25%] min-w-0 px-1.5">
                      <PropertyCard
                        id={property.id}
                        image={property.images[0]}
                        images={property.images}
                        title={property.title}
                        description={property.description}
                        price={`$${property.price}/${property.priceType === 'daily' ? 'día' : 'mes'}`}
                        bedrooms={property.bedrooms}
                        bathrooms={property.bathrooms}
                        area={property.area}
                        type={property.type}
                        location={property.location}
                        listingType={property.listingType}
                        isFeatured={property.isFeatured}
                        coordinates={{ lat: property.lat, lng: property.lng }}
                        index={index}
                        showFavorite={isAuthenticated}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={scrollPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white/90 hover:bg-white shadow-md rounded-full p-2 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Building className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">Aún no hay Residencias y propiedades destacadas</p>
              <p className="text-muted-foreground/60 mt-1">Pronto encontrarás aquí las mejores opciones</p>
            </div>
          )}
        </div>
      </section>

      {/* All Properties with Filter */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-gray-100 via-green-100/60 to-white/80">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <span className="text-primary font-medium mb-2 block">Explora</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Encuentra tu espacio ideal para estudiar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Residencias estudiantiles, apartamentos, casas, cuartos, locales, terrenos y fincas cerca de tu universidad
            </p>

            {/* Filter Tabs */}
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
              <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-full flex-wrap justify-center gap-1">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat.icon && <cat.icon className="h-4 w-4 mr-2" />}
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </m.div>

          <m.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredProperties.length > 0 ? (
              <div>
                <div ref={gridRef} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {paginatedProperties.map((property, index) => (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      image={property.images[0]}
                      images={property.images}
                      title={property.title}
                      description={property.description}
                      price={`$${property.price}/${property.priceType === 'daily' ? 'día' : 'mes'}`}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      area={property.area}
                      type={property.type}
                      location={property.location}
                      listingType={property.listingType}
                      isFeatured={property.isFeatured}
                      coordinates={{ lat: property.lat, lng: property.lng }}
                      index={index}
                      showFavorite={isAuthenticated}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProperties.length)} de {filteredProperties.length} propiedades
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push('ellipsis');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, i) =>
                          p === 'ellipsis' ? (
                            <span key={`e${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">...</span>
                          ) : (
                            <Button
                              key={p}
                              type="button"
                              variant={p === currentPage ? "default" : "outline"}
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </Button>
                          )
                        )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <Building className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No hay propiedades registradas</p>
                <p className="text-muted-foreground/60 mt-1">Sé el primero en publicar una propiedad</p>
              </div>
            )}
          </m.div>


        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <GraduationCap className="h-12 w-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-4 leading-tight">
              ¿Tienes una residencia o propiedad para alquilar?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Conecta con estudiantes y profesionales buscando su espacio ideal cerca de la universidad
            </p>
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                onClick={handlePublishProperty}
              >
                Publicar propiedad
              </Button>
            </div>
          </m.div>
        </div>
      </section>

      {/* Owner-only modal */}
      <Dialog open={showOwnerOnlyModal} onOpenChange={setShowOwnerOnlyModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Opción para propietarios
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              La publicación de propiedades es una funcionalidad exclusiva para propietarios.
              Si deseas publicar una propiedad, debes registrarte con el rol de propietario.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowOwnerOnlyModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div id="como-funciona">
        <Features />
      </div>

      {/* Location Map Section */}
      <section id="ubicacion" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="text-primary font-medium mb-2 block">Ubicación</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Nuestra zona de cobertura
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todas nuestras propiedades están ubicadas en San Juan de los Morros, Guárico, cerca de las principales universidades y centros educativos
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LocationMap />
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 inline-block mr-1" /> San Juan de los Morros, Estado Guárico, Venezuela
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Cerca de universidades</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full">
                <Building className="h-4 w-4 text-primary" />
                <span>Zona céntrica</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full">
                <Home className="h-4 w-4 text-primary" />
                <span>Ambiente seguro</span>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
