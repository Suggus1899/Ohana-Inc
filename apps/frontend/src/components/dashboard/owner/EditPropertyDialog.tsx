import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, X, GripVertical, ArrowUpDown } from 'lucide-react';
import { PricePreviewField } from '@/components/common/PricePreviewField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { MapPicker, MapPickerValue } from '@/components/common/MapPicker';
import { ImageUploader } from '@/components/common/ImageUploader';
import { VideoUploader } from '@/components/common/VideoUploader';
import { cn } from '@/lib/utils';
import api, { Property } from '@/services/api';

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

interface EditPropertyDialogProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inline?: boolean;
}

interface FormData {
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: number;
  priceType: string;
  priceRate: 'trm';
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

const STEPS = ['Información', 'Características', 'Ubicación', 'Multimedia'];

export function EditPropertyDialog({ property, open, onOpenChange, onSuccess, inline }: EditPropertyDialogProps) {
  const [step, setStep] = useState(0);

  // Helper to parse property features (used in initializer and elsewhere)
  const parseFeatures = (p: Property | null): string[] => {
    if (!p) return [];
    const raw = Array.isArray(p.features) ? p.features : [];
    return raw.map(f => {
      if (typeof f === 'string' && f.startsWith('[') && f.endsWith(']')) {
        try {
          const parsed = JSON.parse(f);
          return Array.isArray(parsed) ? parsed : f;
        } catch { return f; }
      }
      return f;
    }).flat().filter(f => typeof f === 'string' && f.length > 0);
  };

  const parseImages = (p: Property | null): string[] => {
    if (!p) return [];
    const raw = Array.isArray(p.images) ? p.images : [];
    if (typeof p.images === 'string' && (p.images as string).startsWith('[')) {
      try { const parsed = JSON.parse(p.images as string); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return raw.filter(img => typeof img === 'string' && img.length > 0);
  };

  const parseVideo = (p: Property | null): string | null => {
    if (!p) return null;
    const v = (p as any).videoUrl;
    if (typeof v === 'string' && v.startsWith('"') && v.endsWith('"')) {
      try { return JSON.parse(v); } catch { return v; }
    }
    return v || null;
  };

  const [originalFeatures, setOriginalFeatures] = useState<string[]>(() => parseFeatures(property));
  const [existingImages, setExistingImages] = useState<string[]>(() => parseImages(property));
  const [existingVideo, setExistingVideo] = useState<string | null>(() => parseVideo(property));

  const [location, setLocation] = useState<MapPickerValue | null>(() => {
    if (!property) return null;
    return {
      lat: property.lat,
      lng: property.lng,
      address: property.address,
      city: property.city,
      state: property.state,
    };
  });

  const [addedFeatures, setAddedFeatures] = useState<Set<string>>(new Set());
  const [removedFeatures, setRemovedFeatures] = useState<Set<string>>(new Set());
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentFeatures = [
    ...originalFeatures.filter((f) => !removedFeatures.has(f)),
    ...addedFeatures,
  ];

  const toggleFeature = (f: string) => {
    if (originalFeatures.includes(f)) {
      if (removedFeatures.has(f)) {
        setRemovedFeatures((prev) => { const next = new Set(prev); next.delete(f); return next; });
      } else {
        setRemovedFeatures((prev) => new Set(prev).add(f));
      }
    } else {
      if (addedFeatures.has(f)) {
        setAddedFeatures((prev) => { const next = new Set(prev); next.delete(f); return next; });
      } else {
        setAddedFeatures((prev) => new Set(prev).add(f));
      }
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
    defaultValues: property ? {
      title: property.title,
      description: property.description,
      type: property.type,
      listingType: property.listingType,
      price: Number(property.price),
      priceType: property.priceType || 'monthly',
      priceRate: (property as any).priceRate || 'trm',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      roomsWithBathroom: (property as any).roomsWithBathroom ?? 0,
      outsideBathrooms: (property as any).outsideBathrooms ?? 0,
      area: property.area,
      areaUnknown: false,
      floor: (property as any).floor ?? undefined,
      furnished: property.furnished,
      features: originalFeatures,
      zipCode: property.zipCode || '',
      neighborhood: property.neighborhood || '',
      availableRooms: (property as any).availableRooms ?? 0,
      occupiedRooms: (property as any).occupiedRooms ?? 0,
    } : undefined,
  });

  // Reset state and form values when property changes or dialog opens
  useEffect(() => {
    if (property && open) {
      setStep(0);
      setLocation({
        lat: property.lat,
        lng: property.lng,
        address: property.address,
        city: property.city,
        state: property.state,
      });
      setImages([]);
      setVideo(null);
      setSubmitError(null);
      setAddedFeatures(new Set());
      setRemovedFeatures(new Set());

      // Reset derived state
      setOriginalFeatures(parseFeatures(property));
      setExistingImages(parseImages(property));
      setExistingVideo(parseVideo(property));

      // Reset form values to the current property's data
      reset({
        title: property.title,
        description: property.description,
        type: property.type,
        listingType: property.listingType,
        price: Number(property.price),
        priceType: property.priceType || 'monthly',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        roomsWithBathroom: (property as any).roomsWithBathroom ?? 0,
        outsideBathrooms: (property as any).outsideBathrooms ?? 0,
        area: property.area,
        areaUnknown: false,
        floor: (property as any).floor ?? undefined,
        furnished: property.furnished,
        zipCode: property.zipCode || '',
        neighborhood: property.neighborhood || '',
        availableRooms: (property as any).availableRooms ?? 0,
        occupiedRooms: (property as any).occupiedRooms ?? 0,
      });
    }
  }, [property, open]);

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

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedPrice = watch('price');

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
    if (step === 3) {
      if (property) return (existingImages.length + images.length) >= 1;
      return (existingImages.length + images.length) >= 5;
    }
    return true;
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!location || !property) { setSubmitError('Selecciona una ubicación en el mapa'); return; }
    if (roomMismatch) { setSubmitError('La suma de cuartos disponibles y ocupados debe coincidir con el total.'); return; }
    if (bathroomMismatch) { setSubmitError('La suma de baños privados y fuera de cuartos no puede exceder los baños totales.'); return; }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      const { areaUnknown: _, ...submitData } = data;
      formData.append('title', submitData.title);
      formData.append('description', submitData.description);
      formData.append('type', submitData.type);
      formData.append('listingType', submitData.listingType);
      formData.append('price', String(submitData.price));
      formData.append('priceType', submitData.priceType);
      formData.append('priceRate', submitData.priceRate);
      formData.append('bedrooms', String(submitData.bedrooms));
      formData.append('bathrooms', String(submitData.bathrooms));
      if (submitData.roomsWithBathroom !== undefined) formData.append('roomsWithBathroom', String(submitData.roomsWithBathroom));
      if (submitData.outsideBathrooms !== undefined) formData.append('outsideBathrooms', String(submitData.outsideBathrooms));
      formData.append('area', String(submitData.area));
      if (submitData.floor !== undefined) formData.append('floor', String(submitData.floor));
      formData.append('furnished', String(submitData.furnished));
      formData.append('zipCode', submitData.zipCode);
      formData.append('neighborhood', submitData.neighborhood);
      if (submitData.availableRooms !== undefined) formData.append('availableRooms', String(submitData.availableRooms));
      if (submitData.occupiedRooms !== undefined) formData.append('occupiedRooms', String(submitData.occupiedRooms));

      formData.append('features', JSON.stringify(currentFeatures));

      formData.append('lat', String(location.lat));
      formData.append('lng', String(location.lng));
      formData.append('address', location.address);
      formData.append('location', location.city ?? location.address);
      if (location.city) formData.append('city', location.city);
      if (location.state) formData.append('state', location.state);

      // Multimedia — always send existing + new (backend merges them)
      formData.append('existingImages', JSON.stringify(existingImages));
      images.forEach((img) => formData.append('images', img));
      if (video) formData.append('video', video);

      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/properties/${property.id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Error al actualizar');

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al actualizar la propiedad');
    } finally {
      setSubmitting(false);
    }
  });

  const handleCancel = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      onOpenChange(false);
    }
  };

  const content = (
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

          {/* Body */}
          <div className="flex-1 overflow-auto scrollbar-hide px-6 py-5">
            <form id="edit-property-form" onSubmit={onSubmit}>
              {/* Step 0: Información básica */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      {...register('title', { required: 'Requerido' })}
                      className="mt-1"
                    />
                    {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      {...register('description', { required: 'Requerido' })}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de propiedad</Label>
                      <Select onValueChange={(v) => setValue('type', v)} defaultValue={property?.type}>
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
                        defaultValue={property?.listingType}
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
                        <p className="text-[10px] text-muted-foreground mt-1">Solo disponible en alquiler para esta categoría.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Precio (USD)</Label>
                      <Input
                        type="number"
                        {...register('price', { required: 'Requerido', min: 1 })}
                        className="mt-1"
                      />
                      <PricePreviewField value={watch('price')} rateType={watch('priceRate') || 'trm'} />
                    </div>
                    <div>
                      <Label>Tipo de precio</Label>
                      <Select
                        onValueChange={(v) => setValue('priceType', v)}
                        defaultValue={property?.priceType || 'monthly'}
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
                        <p className="text-[10px] text-muted-foreground mt-1">Precio mensual para esta categoría.</p>
                      )}
                    </div>
                    <div>
                      <Label>Tasa de cambio</Label>
                      <Select onValueChange={(v: 'trm') => setValue('priceRate', v)} defaultValue={((property as any)?.priceRate || 'trm') as 'trm'}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trm">TRM</SelectItem>
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
                        </div>
                        <div>
                          <Label className="text-blue-800 text-sm">Baños fuera de cuartos</Label>
                          <Input 
                            type="number" 
                            {...register('outsideBathrooms', { min: 0 })} 
                            className="mt-1 border-blue-200"
                            placeholder="0"
                          />
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
                        defaultValue={String(property?.furnished ?? false)}
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
                            currentFeatures.includes(a)
                              ? 'bg-primary/10 text-primary border-primary shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                          )}
                        >
                          <span className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            currentFeatures.includes(a)
                              ? 'bg-primary border-primary'
                              : 'border-gray-300'
                          )}>
                            {currentFeatures.includes(a) && (
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
                      <Select onValueChange={(v) => setValue('neighborhood', v)} defaultValue={property?.neighborhood || ''}>
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
                </div>
              )}

              {/* Step 3: Multimedia */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Imágenes Actuales</Label>
                      <p className="text-xs text-muted-foreground">Arrastrá para reordenar. La primera imagen es la principal.</p>
                      <ReorderableImageGrid
                        images={existingImages}
                        onChange={setExistingImages}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {property ? 'Agregar nuevas imágenes (opcional)' : 'Imágenes'}
                    </Label>
                    <p className="text-xs text-muted-foreground">Las nuevas imágenes se agregarán a las actuales.</p>
                    <ImageUploader
                      value={images}
                      onChange={setImages}
                      minFiles={property ? 0 : Math.max(0, 5 - existingImages.length)}
                      maxFiles={20}
                    />
                  </div>
                  <hr />
                  
                  {existingVideo && !video && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Video Actual</Label>
                      <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-40">
                        <video 
                          src={existingVideo} 
                          className="w-full h-full object-contain" 
                          onError={() => {
                            setExistingVideo(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setExistingVideo(null)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <VideoUploader
                    value={video}
                    onChange={setVideo}
                    maxDurationSeconds={120}
                  />
                </div>
              )}
            </form>
          </div>

          {/* Error */}
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
              onClick={handleCancel}
              disabled={submitting}
              size={step === 0 ? 'default' : 'sm'}
              className="text-xs sm:text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
              <span className="hidden sm:inline">{step === 0 ? 'Cancelar' : 'Anterior'}</span>
              <span className="sm:hidden">{step === 0 ? 'Cancelar' : 'Atrás'}</span>
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setStep((s) => s + 1);
                }}
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
                form="edit-property-form"
                disabled={submitting || !canGoNext()}
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 shrink-0" />
                    <span>Guardar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
  );

  if (inline) {
    return <div>{content}</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden"
        aria-describedby={undefined}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Editar Propiedad</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function ReorderableImageGrid({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIndex(idx);
  };

  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setOverIndex(null); return; }
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((url, i) => (
        <div
          key={`${url}-${i}`}
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={() => handleDrop(i)}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
          className={cn(
            'relative group rounded-lg overflow-hidden aspect-square border-2 transition-all cursor-grab active:cursor-grabbing',
            overIndex === i ? 'border-blue-500 scale-105' : 'border-gray-200'
          )}
        >
          <img src={url} alt={`${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-property.jpg'; }} />
          {i === 0 && (
            <div className="absolute bottom-1 left-1 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">Principal</div>
          )}
          <button
            type="button"
            onClick={() => onChange(images.filter((_, idx) => idx !== i))}
            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded p-0.5">
            <GripVertical className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] rounded px-1">{i + 1}</div>
        </div>
      ))}
    </div>
  );
}
