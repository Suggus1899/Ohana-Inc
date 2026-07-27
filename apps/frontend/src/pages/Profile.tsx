import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, Upload, Home, Camera, Plus, Trash2, Star } from "lucide-react";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KYCDialog } from "@/components/kyc/KYCDialog";
import { VerificationBadge } from "@/components/kyc/VerificationBadge";
import { UserReviewsModal } from "@/components/reviews";
import { useExchangeRate } from "@/contexts/ExchangeRateContext";
import { formatDualPriceShort, usdToCop } from "@/utils/formatPrice";
interface Property {
  id: string;
  title: string;
  description: string;
  price: string;
  type: string;
  bedrooms: number;
  furnished: boolean;
  phonePrefix: string;
  phone: string;
  image?: string;
  authorId: string;
  agreements?: string;
  location?: string;
  bathroom?: string;
}
const Profile = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { rate } = useExchangeRate();
  const {
    user,
    logout,
    isAuthenticated
  } = useAuth();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [propertyForm, setPropertyForm] = useState({
    title: "",
    description: "",
    price: "",
    type: "Apartamento",
    bedrooms: "1",
    furnished: "true",
    phonePrefix: user?.phonePrefix || "+57",
    phone: user?.phone || "",
    agreements: "",
    location: "",
    bathroom: "Propio"
  });
  const [propertyImage, setPropertyImage] = useState<File | null>(null);
  const [_profilePhoto, setProfilePhoto] = useState<File | null>(null);
  useEffect(() => {
    if (user) {
      const properties = JSON.parse(localStorage.getItem('properties') || '[]');
      const userProperties = properties.filter((p: Property) => p.authorId === user.id);
      setMyProperties(userProperties);
    }
  }, [user]);
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }
  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente"
    });
    navigate("/");
  };
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;

        // Update user in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.map((u: Record<string, unknown>) => u.id === user!.id ? {
          ...u,
          profilePhotoUrl: imageUrl
        } : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));

        // Update current user
        const updatedUser = {
          ...user!,
          profilePhotoUrl: imageUrl
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Force page reload to update context
        window.location.reload();
      };
      reader.readAsDataURL(file);
    }
  };
  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const _properties = JSON.parse(localStorage.getItem('properties') || '[]');
    let imageUrl = '';
    if (propertyImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        imageUrl = reader.result as string;
        saveProperty(imageUrl);
      };
      reader.readAsDataURL(propertyImage);
    } else {
      saveProperty('');
    }
  };
  const saveProperty = (imageUrl: string) => {
    const properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const newProperty: Property = {
      id: `prop_${Date.now()}`,
      title: propertyForm.title,
      description: propertyForm.description,
      price: `$ ${propertyForm.price}`,
      type: propertyForm.type,
      bedrooms: parseInt(propertyForm.bedrooms),
      furnished: propertyForm.furnished === 'true',
      phonePrefix: propertyForm.phonePrefix,
      phone: propertyForm.phone,
      image: imageUrl,
      authorId: user!.id,
      agreements: propertyForm.agreements,
      location: propertyForm.location,
      bathroom: propertyForm.bathroom
    };
    properties.push(newProperty);
    localStorage.setItem('properties', JSON.stringify(properties));
    toast({
      title: "¡Propiedad registrada!",
      description: "Tu propiedad ha sido publicada exitosamente"
    });
    setPropertyForm({
      title: "",
      description: "",
      price: "",
      type: "Apartamento",
      bedrooms: "1",
      furnished: "true",
      phonePrefix: user?.phonePrefix || "+57",
      phone: user?.phone || "",
      agreements: "",
      location: "",
      bathroom: "Propio"
    });
    setPropertyImage(null);
    setShowPropertyForm(false);

    // Update properties list
    setMyProperties([...myProperties, newProperty]);
  };
  const handlePropertyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPropertyForm({
      ...propertyForm,
      [e.target.name]: e.target.value
    });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPropertyImage(e.target.files[0]);
    }
  };
  const handleDeleteProperty = (propertyId: string) => {
    const properties = JSON.parse(localStorage.getItem('properties') || '[]');
    const updatedProperties = properties.filter((p: Property) => p.id !== propertyId);
    localStorage.setItem('properties', JSON.stringify(updatedProperties));
    setMyProperties(myProperties.filter(p => p.id !== propertyId));
    toast({
      title: "Propiedad eliminada",
      description: "La propiedad ha sido eliminada exitosamente"
    });
  };
  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase();
  };
  return <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <Link to="/">
                <Button variant="ghost" className="mb-4 text-primary-foreground hover:bg-primary-foreground/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
              <h1 className="text-4xl font-bold">Mi perfil</h1>
              
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Profile Photo Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Foto de perfil</CardTitle>
            <CardDescription>
              Sube una foto para personalizar tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.profilePhotoUrl} alt={user?.name} />
                  <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <label htmlFor="profilePhoto" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input id="profilePhoto" type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                </label>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground text-sm md:text-base break-all">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">Estado:</span>
                  <span className={`text-sm px-2 py-1 rounded ${user?.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user?.isVerified ? 'Verificado' : 'No verificado'}
                  </span>
                  {user?.verificationLevel !== undefined && (
                    <VerificationBadge level={user.verificationLevel} size="sm" />
                  )}
                </div>
              </div>
              {!user?.isVerified && (
                <Button 
                  onClick={() => setShowKYCForm(true)} 
                  size="sm"
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  Verificar datos
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
            <CardDescription>
              Información de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={user?.name || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input value={user?.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={`${user?.phonePrefix || ''} ${user?.phone || ''}`} disabled />
              </div>

              <div className="space-y-2">
                <Label>Cédula de identidad</Label>
                <Input value={`${user?.cedulaType || ''}-${user?.cedula || ''}`} disabled />
              </div>

              {user?.dateOfBirth && (
                <div className="space-y-2">
                  <Label>Fecha de nacimiento</Label>
                  <Input value={user.dateOfBirth} disabled />
                </div>
              )}

              {user?.gender && (
                <div className="space-y-2">
                  <Label>Género</Label>
                  <Input value={user.gender} disabled />
                </div>
              )}

              {user?.city && (
                <div className="space-y-2">
                  <Label>Ciudad natal</Label>
                  <Input value={user.city} disabled />
                </div>
              )}
            </div>

            {/* Become Owner Button or Register Property */}
            {!user?.isOwner && myProperties.length === 0 && (
              <div className="pt-4 border-t">
                {user?.isVerified ? (
                  <Dialog open={showPropertyForm} onOpenChange={setShowPropertyForm}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Registrar propiedad
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Registrar nueva propiedad</DialogTitle>
                      <DialogDescription>
                        Completa la información de tu propiedad para publicarla
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePropertySubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título de la propiedad</Label>
                        <Input id="title" name="title" placeholder="Ej: Apartamento moderno en el centro" value={propertyForm.title} onChange={handlePropertyChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" name="description" placeholder="Describe tu propiedad..." value={propertyForm.description} onChange={handlePropertyChange} required rows={4} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Input id="location" name="location" placeholder="Ej: Calle principal, Bogotá" value={propertyForm.location} onChange={handlePropertyChange} required />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Precio mensual ($)</Label>
                          <Input id="price" name="price" type="number" placeholder="250" value={propertyForm.price} onChange={handlePropertyChange} required />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Tipo de propiedad</Label>
                          <Select value={propertyForm.type} onValueChange={value => setPropertyForm({
                          ...propertyForm,
                          type: value
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Apartamento">Apartamento</SelectItem>
                              <SelectItem value="Casa">Casa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Número de habitaciones</Label>
                            <Select value={propertyForm.bedrooms} onValueChange={value => setPropertyForm({
                          ...propertyForm,
                          bedrooms: value
                        })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 habitación</SelectItem>
                                <SelectItem value="2">2 habitaciones</SelectItem>
                                <SelectItem value="3">3 habitaciones</SelectItem>
                                <SelectItem value="4">4+ habitaciones</SelectItem>
                              </SelectContent>
                              </Select>
                           </div>

                        <div className="space-y-2">
                          <Label htmlFor="bathroom">Baño</Label>
                          <Select value={propertyForm.bathroom} onValueChange={value => setPropertyForm({
                          ...propertyForm,
                          bathroom: value
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Propio">Propio</SelectItem>
                              <SelectItem value="Compartido">Compartido</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="furnished">Amueblado</Label>
                          <Select value={propertyForm.furnished} onValueChange={value => setPropertyForm({
                          ...propertyForm,
                          furnished: value
                        })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Sí</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="agreements">Acuerdos</Label>
                        <Textarea id="agreements" name="agreements" placeholder="Ej: No mascotas, no fiestas, depósito equivalente a 1 mes..." value={propertyForm.agreements} onChange={handlePropertyChange} rows={3} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono de contacto</Label>
                        <div className="flex gap-2">
                          <Select value={propertyForm.phonePrefix} onValueChange={value => setPropertyForm({
                          ...propertyForm,
                          phonePrefix: value
                        })}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="+57">🇨🇴 +57</SelectItem>
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+34">🇪🇸 +34</SelectItem>
                              <SelectItem value="+52">🇲🇽 +52</SelectItem>
                              <SelectItem value="+54">🇦🇷 +54</SelectItem>
                              <SelectItem value="+56">🇨🇱 +56</SelectItem>
                              <SelectItem value="+51">🇵🇪 +51</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input id="phone" name="phone" type="tel" placeholder="300-1234567" value={propertyForm.phone} onChange={handlePropertyChange} required className="flex-1" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="propertyImage">Foto de la propiedad</Label>
                        <div className="flex items-center gap-2">
                          <Input id="propertyImage" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {propertyImage && <p className="text-sm text-muted-foreground">
                            Archivo seleccionado: {propertyImage.name}
                          </p>}
                      </div>

                      <Button type="submit" className="w-full">
                        <Home className="w-4 h-4 mr-2" />
                        Publicar propiedad
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                ) : (
                  <Button 
                    onClick={() => setShowKYCForm(true)} 
                    className="w-full" 
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Conviértete en propietario
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reputation Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Reputación</CardTitle>
            <CardDescription>
              Tu calificación como propietario y como inquilino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Rating as Owner */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Como propietario</h4>
                  <div className="text-sm text-muted-foreground">
                    {user?.reviewCountAsOwner || 0} reseñas
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold text-primary">
                    {user?.avgRatingAsOwner?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="relative h-5 w-5"
                        >
                          <Star className="h-5 w-5 text-gray-300 fill-current" />
                          {user?.avgRatingAsOwner && star <= Math.floor(user.avgRatingAsOwner) && (
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                          {user?.avgRatingAsOwner && star === Math.floor(user.avgRatingAsOwner) + 1 && 
                           user.avgRatingAsOwner % 1 > 0 && (
                            <div 
                              className="absolute top-0 left-0 overflow-hidden" 
                              style={{ width: `${(user.avgRatingAsOwner % 1) * 100}%` }}
                            >
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Promedio de {user?.reviewCountAsOwner || 0} reseñas
                    </span>
                  </div>
                </div>
                {user?.reviewCountAsOwner === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aún no tienes reseñas como propietario
                  </p>
                )}
              </div>

              {/* Rating as Tenant */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Como inquilino</h4>
                  <div className="text-sm text-muted-foreground">
                    {user?.reviewCountAsTenant || 0} reseñas
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold text-primary">
                    {user?.avgRatingAsTenant?.toFixed(1) || '0.0'}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="relative h-5 w-5"
                        >
                          <Star className="h-5 w-5 text-gray-300 fill-current" />
                          {user?.avgRatingAsTenant && star <= Math.floor(user.avgRatingAsTenant) && (
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                          {user?.avgRatingAsTenant && star === Math.floor(user.avgRatingAsTenant) + 1 && 
                           user.avgRatingAsTenant % 1 > 0 && (
                            <div 
                              className="absolute top-0 left-0 overflow-hidden" 
                              style={{ width: `${(user.avgRatingAsTenant % 1) * 100}%` }}
                            >
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Promedio de {user?.reviewCountAsTenant || 0} reseñas
                    </span>
                  </div>
                </div>
                {user?.reviewCountAsTenant === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aún no tienes reseñas como inquilino
                  </p>
                )}
              </div>
            </div>

            {/* Reviews List - Load reviews button */}
            {(user?.reviewCountAsOwner || 0) + (user?.reviewCountAsTenant || 0) > 0 && (
              <div className="mt-6">
                <Button variant="outline" className="w-full" onClick={() => setShowReviewsModal(true)}>
                  Ver todas mis reseñas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Property Button - Only show if user already has properties */}
        {myProperties.length > 0 && (
          <div className="mb-6">
            <Dialog open={showPropertyForm} onOpenChange={setShowPropertyForm}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar nueva propiedad
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar nueva propiedad</DialogTitle>
                  <DialogDescription>
                    Completa la información de tu propiedad para publicarla
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePropertySubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la propiedad</Label>
                    <Input id="title" name="title" placeholder="Ej: Apartamento moderno en el centro" value={propertyForm.title} onChange={handlePropertyChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea id="description" name="description" placeholder="Describe tu propiedad..." value={propertyForm.description} onChange={handlePropertyChange} required rows={4} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Input id="location" name="location" placeholder="Ej: Calle principal, Bogotá" value={propertyForm.location} onChange={handlePropertyChange} required />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio mensual ($)</Label>
                      <Input id="price" name="price" type="number" placeholder="250" value={propertyForm.price} onChange={handlePropertyChange} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de propiedad</Label>
                      <Select value={propertyForm.type} onValueChange={value => setPropertyForm({
                      ...propertyForm,
                      type: value
                    })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Apartamento">Apartamento</SelectItem>
                          <SelectItem value="Casa">Casa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bedrooms">Número de habitaciones</Label>
                        <Select value={propertyForm.bedrooms} onValueChange={value => setPropertyForm({
                      ...propertyForm,
                      bedrooms: value
                    })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 habitación</SelectItem>
                            <SelectItem value="2">2 habitaciones</SelectItem>
                            <SelectItem value="3">3 habitaciones</SelectItem>
                            <SelectItem value="4">4+ habitaciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    <div className="space-y-2">
                      <Label htmlFor="bathroom">Baño</Label>
                      <Select value={propertyForm.bathroom} onValueChange={value => setPropertyForm({
                      ...propertyForm,
                      bathroom: value
                    })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Propio">Propio</SelectItem>
                          <SelectItem value="Compartido">Compartido</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="furnished">Amueblado</Label>
                      <Select value={propertyForm.furnished} onValueChange={value => setPropertyForm({
                      ...propertyForm,
                      furnished: value
                    })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sí</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agreements">Acuerdos</Label>
                    <Textarea id="agreements" name="agreements" placeholder="Ej: No mascotas, no fiestas, depósito equivalente a 1 mes..." value={propertyForm.agreements} onChange={handlePropertyChange} rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono de contacto</Label>
                    <div className="flex gap-2">
                      <Select value={propertyForm.phonePrefix} onValueChange={value => setPropertyForm({
                      ...propertyForm,
                      phonePrefix: value
                    })}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="+57">🇨🇴 +57</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+34">🇪🇸 +34</SelectItem>
                          <SelectItem value="+52">🇲🇽 +52</SelectItem>
                          <SelectItem value="+54">🇦🇷 +54</SelectItem>
                          <SelectItem value="+56">🇨🇱 +56</SelectItem>
                          <SelectItem value="+51">🇵🇪 +51</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input id="phone" name="phone" type="tel" placeholder="300-1234567" value={propertyForm.phone} onChange={handlePropertyChange} required className="flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyImage">Foto de la propiedad</Label>
                    <div className="flex items-center gap-2">
                      <Input id="propertyImage" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {propertyImage && <p className="text-sm text-muted-foreground">
                        Archivo seleccionado: {propertyImage.name}
                      </p>}
                  </div>

                  <Button type="submit" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Publicar propiedad
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* My Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Mis propiedades</CardTitle>
            <CardDescription>
              {myProperties.length === 0 ? "Aún no has registrado ninguna propiedad" : `Tienes ${myProperties.length} ${myProperties.length === 1 ? 'propiedad registrada' : 'propiedades registradas'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myProperties.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tienes propiedades registradas</p>
              </div> : <div className="space-y-4">
                {myProperties.map(property => <div key={property.id} className="border rounded-lg p-4 flex gap-4 hover:bg-accent/50 transition-colors">
                    {property.image && <img src={property.image} alt={property.title} className="w-32 h-32 object-cover rounded-md" />}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{property.description}</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">{rate?.usdToCop ? formatDualPriceShort(parseFloat(property.price.replace(/[^0-9.]/g, '')) || 0, usdToCop(parseFloat(property.price.replace(/[^0-9.]/g, '')) || 0, rate.usdToCop)) : property.price}</span>
                        <span className="bg-secondary/50 text-secondary-foreground px-2 py-1 rounded">{property.type}</span>
                        <span className="bg-muted px-2 py-1 rounded">{property.bedrooms} hab.</span>
                        <span className="bg-muted px-2 py-1 rounded">{property.furnished ? 'Amueblado' : 'Sin amueblar'}</span>
                      </div>
                    </div>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteProperty(property.id)} className="self-start">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>

      <KYCDialog open={showKYCForm} onOpenChange={setShowKYCForm} />

      {user && (
        <UserReviewsModal
          isOpen={showReviewsModal}
          onOpenChange={setShowReviewsModal}
          userId={user.id}
          userName={user.name}
          userRole={user.role}
        />
      )}

      <Footer />
    </div>;
};
export default Profile;