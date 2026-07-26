import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, User, Star, Loader2, Mail, Phone, Calendar, ShieldCheck, BadgeCheck, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PropertyCard from "@/components/common/PropertyCard";
import Footer from "@/components/layout/Footer";
import ProfileIcon from "@/components/common/ProfileIcon";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useToast } from "@/hooks/use-toast";
import api, { User as UserType } from "@/services/api";
import { UserReviewsModal } from "@/components/reviews";

const PublicProfile = () => {
  const { userId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [userProperties, setUserProperties] = useState<any[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      // Validar que userId sea un número válido
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        toast({
          title: "Error",
          description: "ID de usuario inválido",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch user data
        const userResponse = await api.getUserById(userIdNum);
        if (userResponse.success && userResponse.data?.user) {
          setUserData(userResponse.data.user);
        } else {
          toast({
            title: "Error",
            description: "No se pudo cargar la información del usuario",
            variant: "destructive"
          });
        }
        
        // Fetch user properties
        const propertiesResponse = await api.getProperties({ 
          authorId: userIdNum,
          status: 'approved'
        });
        if (propertiesResponse.success && propertiesResponse.data?.properties) {
          setUserProperties(propertiesResponse.data.properties);
        }
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información del usuario",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, toast]);

  const authorName = userData?.name || userId || "Usuario";

  return (
    <div className="min-h-screen bg-background">
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
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  {userData?.profilePhotoUrl ? (
                    <img 
                      src={userData.profilePhotoUrl} 
                      alt={authorName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold">{authorName}</h1>
                  <p className="text-primary-foreground/80 mt-1">
                    {userProperties.length} {userProperties.length === 1 ? 'propiedad' : 'propiedades'}
                  </p>
                  {/* Reputation summary */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(userData?.avgRatingAsOwner || 0).toFixed(1)}</span>
                      <span className="text-sm opacity-80">({userData?.reviewCountAsOwner || 0})</span>
                    </div>
                    <span className="text-sm opacity-80">•</span>
                    <span className="text-sm opacity-80">
                      {(userData?.reviewCountAsOwner || 0) + (userData?.reviewCountAsTenant || 0)} reseñas en total
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <ProfileIcon />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Información del Usuario */}
        {userData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Correo electrónico</p>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{userData.phonePrefix} {userData.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cédula</p>
                    <p className="font-medium">{userData.cedulaType} {userData.cedula}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Miembro desde</p>
                    <p className="font-medium">{new Date(userData.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
                {userData.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de nacimiento</p>
                      <p className="font-medium">{userData.dateOfBirth}</p>
                    </div>
                  </div>
                )}
                {userData.gender && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Género</p>
                      <p className="font-medium">{userData.gender}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de usuario</p>
                    <p className="font-medium capitalize">{userData.role === "estudiante" ? "Estudiante" : userData.role === "propietario" ? "Propietario" : userData.role === "operator" ? "Operador" : userData.role === "admin" ? "Administrador" : userData.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {userData.isVerified ? (
                    <BadgeCheck className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Verificación</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={userData.isVerified ? "default" : "outline"} className={userData.isVerified ? "bg-green-500" : ""}>
                        {userData.isVerified ? "Verificado" : "No verificado"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">({userData.accountStatus})</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reputation Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Reputación</CardTitle>
            <CardDescription>
              Calificación de {authorName} como propietario e inquilino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Rating as Owner */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Como propietario</h4>
                  <div className="text-sm text-muted-foreground">
                    {userData?.reviewCountAsOwner || 0} reseñas
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold text-primary">
                    {(userData?.avgRatingAsOwner || 0).toFixed(1)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="relative h-5 w-5"
                        >
                          <Star className="h-5 w-5 text-gray-300 fill-current" />
                          {userData?.avgRatingAsOwner && star <= Math.floor(userData.avgRatingAsOwner) && (
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                          {userData?.avgRatingAsOwner && star === Math.floor(userData.avgRatingAsOwner) + 1 && 
                           userData.avgRatingAsOwner % 1 > 0 && (
                            <div 
                              className="absolute top-0 left-0 overflow-hidden" 
                              style={{ width: `${(userData.avgRatingAsOwner % 1) * 100}%` }}
                            >
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Promedio de {userData?.reviewCountAsOwner || 0} reseñas
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating as Tenant */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Como inquilino</h4>
                  <div className="text-sm text-muted-foreground">
                    {userData?.reviewCountAsTenant || 0} reseñas
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-bold text-primary">
                    {(userData?.avgRatingAsTenant || 0).toFixed(1)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          className="relative h-5 w-5"
                        >
                          <Star className="h-5 w-5 text-gray-300 fill-current" />
                          {userData?.avgRatingAsTenant && star <= Math.floor(userData.avgRatingAsTenant) && (
                            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '100%' }}>
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                          {userData?.avgRatingAsTenant && star === Math.floor(userData.avgRatingAsTenant) + 1 && 
                           userData.avgRatingAsTenant % 1 > 0 && (
                            <div 
                              className="absolute top-0 left-0 overflow-hidden" 
                              style={{ width: `${(userData.avgRatingAsTenant % 1) * 100}%` }}
                            >
                              <Star className="h-5 w-5 text-yellow-400 fill-current" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Promedio de {userData?.reviewCountAsTenant || 0} reseñas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* View all reviews button */}
            <div className="mt-6">
              <Button variant="outline" className="w-full" onClick={() => setShowReviewsModal(true)}>
                Ver todas las reseñas de {authorName}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">Propiedades publicadas</h2>
            <p className="text-muted-foreground">
              Todas las propiedades de {authorName}
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : userProperties.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                image={property.mainImage || (property.images?.[0] || '')}
                title={property.title}
                description={property.description}
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                area={property.area}
                type={property.type}
                location={property.location}
                listingType={property.listingType}
                index={index}
                rating={property.avgRating || 0}
                reviews={property.reviewCount || 0}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Este usuario aún no ha publicado propiedades
              </p>
            </CardContent>
          </Card>
        )}
          </div>
      <Footer />
      {userData && (
        <UserReviewsModal
          isOpen={showReviewsModal}
          onOpenChange={setShowReviewsModal}
          userId={userData.id}
          userName={userData.name}
          userRole={userData.role}
        />
      )}
    </div>
  );
};

export default PublicProfile;
