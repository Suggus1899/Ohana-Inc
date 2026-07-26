import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ChevronRight, ChevronLeft, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useExchangeRate } from '../../../contexts/ExchangeRateContext';
import { formatDualPrice } from '../../../utils/formatPrice';
import { ImageUploader } from '@/components/common/ImageUploader';
import { VideoUploader } from '@/components/common/VideoUploader';
import { MapPicker, MapPickerValue } from '@/components/common/MapPicker';
import { PricePreviewField } from '@/components/PricePreviewField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import api from '@/services/api';
import { getMyTransactions } from '@/services/transaction.service';

interface FormData {
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: number;
  priceType: string;
  priceRate: 'oficial' | 'paralelo';
  bedrooms: number;
  bathrooms: number;
  roomsWithBathroom?: number;
  outsideBathrooms?: number;
  area: number;
  areaUnknown: boolean;
  floor?: number;
  furnished: boolean;
  features: string[];
  zipCode: string;
  neighborhood: string;
  availableRooms?: number;
  occupiedRooms?: number;
}

interface CreatePropertyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PROPERTY_TYPES = ['Residencia', 'Apartamento', 'Casa', 'Finca', 'Local', 'Terreno'];

const AMENITIES = [
  'Internet fibra óptica',
  'Tanque de agua con bomba',
  'Planta eléctrica / Inversor',
  'Gas directo / Banco de bombonas',
  'Climatización (Aire acond.)',
  'Baño privado',
  'Mobiliario de estudio',
  'Cama y clóset',
  'Cocina totalmente equipada',
  'Área de lavandería',
  'Zona de estudio / Co-working',
  'Área de esparcimiento',
  'Estacionamiento cerrado',
  'Cerco eléctrico y CCTV',
  'Control de acceso inteligente',
  'Entrada independiente',
  'Piscina', 'Gimnasio', 'Seguridad 24h', 'Ascensor',
  'Terraza', 'Jardín', 'Balcón', 'Bodega',
  'Cancha deportiva', 'Área de juegos', 'Comedor', 'Sala de TV',
  'Patio', 'Servicio de limpieza',
];

const STEPS = ['Información', 'Características', 'Ubicación', 'Multimedia'];

export function CreatePropertyForm({ onSuccess, onCancel }: CreatePropertyFormProps) {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [location, setLocation] = useState<MapPickerValue | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasDispute, setHasDispute] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  useEffect(() => {
    getMyTransactions({ status: 'disputed' }).then((res) => {
      if (res.transactions && res.transactions.length > 0) {
        setHasDispute(true);
      }
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: {
      priceRate: 'paralelo',
      priceType: 'monthly',
      listingType: 'Alquiler',
      type: 'Residencia',
      furnished: false,
      bedrooms: 1,
      bathrooms: 1,
      roomsWithBathroom: 0,
      outsideBathrooms: 0,
      area: 50,
      areaUnknown: false,
      features: [],
      availableRooms: 1,
      occupiedRooms: 0,
    }
  });

  const propertyType = watch('type');
  const areaUnknown = watch('areaUnknown');
  const totalRooms = Number(watch('bedrooms')) || 0;
  const availRooms = Number(watch('availableRooms')) || 0;
  const occupRooms = Number(watch('occupiedRooms')) || 0;
  const roomMismatch = propertyType === 'Residencia' && totalRooms < (availRooms + occupRooms);

  const totalBathrooms = Number(watch('bathrooms')) || 0;
  const roomsWithBathroom = Number(watch('roomsWithBathroom')) || 0;
  const outsideBathrooms = Number(watch('outsideBathrooms')) || 0;
  const bathroomMismatch = propertyType === 'Residencia' && (roomsWithBathroom + outsideBathrooms) > totalBathrooms;

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedPrice = watch('price');

  // Auto-clamp roomsWithBathroom to not exceed bedrooms or bathrooms
  useEffect(() => {
    if (propertyType === 'Residencia') {
      const maxPrivate = Math.min(totalBathrooms, totalRooms);
      if (roomsWithBathroom > maxPrivate) {
        setValue('roomsWithBathroom', maxPrivate);
      }
    }
  }, [totalBathrooms, totalRooms, roomsWithBathroom, propertyType, setValue]);

  // Auto-clamp outsideBathrooms to not exceed remaining bathrooms
  useEffect(() => {
    if (propertyType === 'Residencia') {
      const maxOutside = Math.max(0, totalBathrooms - roomsWithBathroom);
      if (outsideBathrooms > maxOutside) {
        setValue('outsideBathrooms', maxOutside);
      }
    }
  }, [totalBathrooms, roomsWithBathroom, outsideBathrooms, propertyType, setValue]);

  // Auto-clamp availableRooms + occupiedRooms to not exceed bedrooms
  useEffect(() => {
    if (propertyType === 'Residencia' && (availRooms + occupRooms) > totalRooms) {
      const overflow = (availRooms + occupRooms) - totalRooms;
      if (availRooms >= overflow) {
        setValue('availableRooms', availRooms - overflow);
      } else {
        setValue('occupiedRooms', totalRooms - availRooms);
      }
    }
  }, [totalRooms, availRooms, occupRooms, propertyType, setValue]);

  // Auto-set defaults when property type is Residencia
  useEffect(() => {
    if (propertyType === 'Residencia') {
      setValue('listingType', 'Alquiler');
      setValue('priceType', 'monthly');
    }
  }, [propertyType, setValue]);

  // Fill system default area when "No sé" is checked
  useEffect(() => {
    if (areaUnknown) {
      setValue('area', 35);
    }
  }, [areaUnknown, setValue]);

  const toggleFeature = (f: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const canGoNext = () => {
    if (step === 0) {
      return !!watchedTitle?.trim() && !!watchedDescription?.trim() && Number(watchedPrice) > 0;
    }
    if (step === 1) {
      if (roomMismatch || bathroomMismatch) return false;
      if (propertyType !== 'Local' && propertyType !== 'Terreno') {
        const b = Number(watch('bedrooms'));
        if (!b || b < 1) return false;
      }
      if (propertyType !== 'Terreno') {
        const b = Number(watch('bathrooms'));
        if (b === undefined || b === null || b < 0) return false;
      }
      if (!areaUnknown) {
        const a = Number(watch('area'));
        if (!a || a < 1) return false;
      }
      return true;
    }
    if (step === 2) return !!location;
    if (step === 3) return images.length >= 5;
    return false;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (hasDispute) { setShowDisputeModal(true); return; }
    if (!location) { setSubmitError('Selecciona una ubicación en el mapa'); return; }
    if (images.length < 5) { setSubmitError('Se requieren mínimo 5 imágenes'); return; }
    if (roomMismatch) { setSubmitError('La suma de cuartos disponibles y ocupados debe coincidir con el total.'); return; }
    if (bathroomMismatch) { setSubmitError('La suma de baños privados y fuera de cuartos no puede exceder los baños totales.'); return; }
    // Video is optional

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      // Excluir areaUnknown y features del envío (features se agrega manualmente con JSON.stringify)
      const { areaUnknown, features: _ignoredFeatures, ...submitData } = data;
      console.log('[DEBUG CreateProperty] submitData keys:', Object.keys(submitData));
      console.log('[DEBUG CreateProperty] availableRooms:', submitData.availableRooms, typeof submitData.availableRooms);
      console.log('[DEBUG CreateProperty] occupiedRooms:', submitData.occupiedRooms, typeof submitData.occupiedRooms);
      Object.entries(submitData).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') formData.append(key, String(val));
      });

      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
      formData.append('address', location.address);
      formData.append('location', location.city ?? location.address);
      if (location.city) formData.append('city', location.city);
      if (location.state) formData.append('state', location.state);
      formData.append('features', JSON.stringify(selectedFeatures));

      images.forEach((img) => formData.append('images', img));
      if (video) formData.append('video', video);

      await api.createPropertyWithMedia(formData);
      onSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear la propiedad');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Step indicator */}
      <div className="flex px-4 sm:px-6 py-3 border-b bg-gray-50 shrink-0 overflow-x-auto scrollbar-hide">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium transition-colors',
                i === step ? 'text-blue-600' :
                i < step ? 'text-green-600 cursor-pointer' : 'text-gray-400 cursor-default'
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                i === step ? 'bg-blue-600 text-white' :
                i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              )}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Dispute warning */}
      {hasDispute && (
        <div className="px-4 sm:px-6 py-3 bg-red-50 border-b border-red-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>No puedes publicar propiedades mientras tengas una transacción en disputa.</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto scrollbar-hide px-4 sm:px-6 py-5">
        <form id="property-form" onSubmit={onSubmit}>

          {/* Step 0: Información básica */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  {...register('title', { required: 'Requerido' })}
                  placeholder="Ej: Apartamento moderno en Las Mercedes"
                  className="mt-1"
                />
                {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  {...register('description', { required: 'Requerido' })}
                  placeholder="Describe la propiedad con detalle..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de propiedad</Label>
                  <Select onValueChange={(v) => setValue('type', v)} defaultValue="Residencia">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Operación</Label>
                  <Select
                    onValueChange={(v) => setValue('listingType', v)}
                    defaultValue="Alquiler"
                    disabled={propertyType === 'Residencia'}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alquiler">Alquiler</SelectItem>
                      <SelectItem value="Venta">Venta</SelectItem>
                    </SelectContent>
                  </Select>
                  {propertyType === 'Residencia' && (
                    <p className="text-[10px] text-muted-foreground mt-1">Solo disponible en alquiler para residencias.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Precio (USD)</Label>
                  <Input
                    type="number"
                    {...register('price', { required: 'Requerido', min: 1 })}
                    placeholder="0.00"
                    className="mt-1"
                  />
                  <PricePreviewField value={watch('price')} rateType={watch('priceRate') || 'paralelo'} />
                </div>
                <div>
                  <Label>Tipo de precio</Label>
                  <Select
                    onValueChange={(v) => setValue('priceType', v)}
                    defaultValue="monthly"
                    disabled={propertyType === 'Residencia'}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                    </SelectContent>
                  </Select>
                  {propertyType === 'Residencia' && (
                    <p className="text-[10px] text-muted-foreground mt-1">Precio mensual para residencias.</p>
                  )}
                </div>
                <div>
                  <Label>Tasa de cambio</Label>
                  <Select onValueChange={(v: 'oficial' | 'paralelo') => setValue('priceRate', v)} defaultValue="paralelo">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paralelo">Paralelo</SelectItem>
                      <SelectItem value="oficial">BCV / Oficial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                </div>
              </div>
            )}

          {/* Step 1: Características */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {propertyType !== 'Local' && propertyType !== 'Terreno' && (
                  <div>
                    <Label>{propertyType === 'Residencia' ? 'Total de cuartos' : 'Habitaciones'}</Label>
                    <Input type="number" {...register('bedrooms', { min: 0 })} className="mt-1" />
                  </div>
                )}
                {propertyType === 'Residencia' && (
                  <>
                    <div>
                      <Label>Cuartos disponibles</Label>
                      <Input type="number" {...register('availableRooms', { min: 0 })} className="mt-1 border-green-200" placeholder="0" />
                      <p className="text-[10px] text-green-700 mt-1">Cuartos libres para alquilar.</p>
                    </div>
                    <div>
                      <Label>Cuartos ocupados</Label>
                      <Input type="number" {...register('occupiedRooms', { min: 0 })} className="mt-1 border-amber-200" placeholder="0" />
                      <p className="text-[10px] text-amber-700 mt-1">Cuartos ya rentados.</p>
                    </div>
                    {roomMismatch && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                          La suma de cuartos disponibles ({availRooms ?? 0}) y ocupados ({occupRooms ?? 0}) supera el total de cuartos ({totalRooms ?? 0}).
                        </p>
                      </div>
                    )}
                  </>
                )}
                {propertyType !== 'Terreno' && (
                  <div>
                    <Label>{propertyType === 'Local' ? 'Baños/Aseos' : 'Baños totales'}</Label>
                    <Input type="number" {...register('bathrooms', { min: 0 })} className="mt-1" />
                  </div>
                )}
                <div className={cn(
                  (propertyType === 'Terreno') ? 'sm:col-span-3' : 
                  (propertyType === 'Local') ? 'sm:col-span-2' : ''
                )}>
                  <Label>Área (m²)</Label>
                  <div className="flex gap-2 items-center mt-1">
                    <Input type="number" {...register('area', { min: 1 })} className="flex-1" disabled={areaUnknown} />
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                      <input type="checkbox" {...register('areaUnknown')} className="rounded" />
                      No sé
                    </label>
                  </div>
                  {areaUnknown && (
                    <p className="text-[10px] text-blue-600 mt-1">Se asignarán 35 m² estándar.</p>
                  )}
                </div>
              </div>

              {propertyType === 'Residencia' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <Label className="text-blue-800 mb-2 block font-medium">Distribución de baños</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-blue-800 text-sm">Cuartos con baño privado</Label>
                      <Input 
                        type="number" 
                        {...register('roomsWithBathroom', { min: 0 })} 
                        className="mt-1 border-blue-200" 
                        placeholder="0"
                      />
                      <p className="text-[10px] text-blue-600 mt-1">Cuántas habitaciones tienen baño propio.</p>
                    </div>
                    <div>
                      <Label className="text-blue-800 text-sm">Baños fuera de cuartos</Label>
                      <Input 
                        type="number" 
                        {...register('outsideBathrooms', { min: 0 })} 
                        className="mt-1 border-blue-200"
                        placeholder="0"
                      />
                      <p className="text-[10px] text-blue-600 mt-1">Baños de uso común o compartido.</p>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Privados ({roomsWithBathroom}) + Fuera ({outsideBathrooms}) = {roomsWithBathroom + outsideBathrooms} / {totalBathrooms} baños totales
                  </p>
                  {bathroomMismatch && (
                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-2">
                      La suma de baños privados y fuera de cuartos no puede exceder los {totalBathrooms} baños totales.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {propertyType !== 'Residencia' && (
                  <div>
                    <Label>Piso</Label>
                    <Input type="number" {...register('floor')} placeholder="Opcional" className="mt-1" />
                  </div>
                )}
                <div>
                  <Label>Amueblado</Label>
                  <Select
                    onValueChange={(v) => setValue('furnished', v === 'true')}
                    defaultValue="false"
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Sin amueblar</SelectItem>
                      <SelectItem value="true">Amueblado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Amenidades</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto p-1">
                  {AMENITIES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleFeature(a)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all text-left',
                        selectedFeatures.includes(a)
                          ? 'bg-primary/10 text-primary border-primary shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                      )}
                    >
                      <span className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        selectedFeatures.includes(a)
                          ? 'bg-primary border-primary'
                          : 'border-gray-300'
                      )}>
                        {selectedFeatures.includes(a) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ubicación */}
          {step === 2 && (
            <div className="space-y-4">
              <MapPicker
                value={location ?? undefined}
                onChange={(val) => setLocation(val)}
                height={380}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Código postal</Label>
                  <Input {...register('zipCode')} placeholder="Opcional" className="mt-1" />
                </div>
                <div>
                  <Label>Tipo de ubicación</Label>
                  <Select onValueChange={(v) => setValue('neighborhood', v)} defaultValue="">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Barrio">Barrio</SelectItem>
                      <SelectItem value="Urbanización">Urbanización</SelectItem>
                      <SelectItem value="Sector">Sector</SelectItem>
                      <SelectItem value="Residencial">Residencial</SelectItem>
                      <SelectItem value="Condominio">Condominio</SelectItem>
                      <SelectItem value="Conjunto Residencial">Conjunto Residencial</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {!location && (
                <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Haz clic en el mapa para seleccionar la ubicación exacta.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Multimedia */}
          {step === 3 && (
            <div className="space-y-6">
              <ImageUploader
                value={images}
                onChange={setImages}
                minFiles={5}
                maxFiles={20}
              />
              <hr />
              <VideoUploader
                value={video}
                onChange={setVideo}
                maxDurationSeconds={120}
              />
              {!video && (
                <p className="text-xs text-muted-foreground -mt-4">
                  El video es opcional. Puedes publicar la propiedad sin video.
                </p>
              )}
            </div>
          )}

        </form>
      </div>

      {/* Error global */}
      {submitError && (
        <div className="mx-4 sm:mx-6 mb-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {submitError}
        </div>
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-gray-50 shrink-0 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => step === 0 ? onCancel() : setStep((s) => s - 1)}
          disabled={submitting}
          size="sm"
          className="text-xs sm:text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
          <span className="hidden sm:inline">{step === 0 ? 'Cancelar' : 'Anterior'}</span>
          <span className="sm:hidden">{step === 0 ? 'Cancelar' : 'Atrás'}</span>
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canGoNext()}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
          </Button>
        ) : (
          <Button
            type="submit"
            form="property-form"
            disabled={submitting || !canGoNext()}
            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
            size="sm"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2 shrink-0" />
                <span>Crear</span>
              </>
            )}
          </Button>
        )}
      </div>
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Transacción en disputa
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            No puedes publicar propiedades mientras tengas una transacción en disputa.
            Resuelve la disputa primero para poder continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowDisputeModal(false)}>Entendido</Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  );
}
