import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2, UserIcon, Mail, Phone, MapPin, Building, FileText, ArrowLeft, Calendar, ShieldCheck, CreditCard } from "lucide-react";
import { api, StudentUser } from "@/services/api";

const roleLabel: Record<string, string> = {
  estudiante: "Estudiante",
  cliente: "Cliente",
};

const UsersSection = () => {
  const [users, setUsers] = useState<StudentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<StudentUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await api.getStudentsList();
    if (res.success && res.data?.users) {
      setUsers(res.data.users as StudentUser[]);
    }
    setIsLoading(false);
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.cedula.toLowerCase().includes(term)
    );
  });

  if (selectedUser) {
    const u = selectedUser;
    const allProperties = [
      ...(u.rentalRequests || []).map((rr) => rr.property).filter(Boolean),
      ...(u.propertyAssignments || []).map((pa) => pa.property).filter(Boolean),
    ].filter((p, i, arr) => arr.findIndex((x) => x?.id === p?.id) === i);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
            ← Volver a usuarios
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {u.profilePhotoUrl ? (
                  <img src={u.profilePhotoUrl} alt={u.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{u.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {roleLabel[u.role] || u.role}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Información Personal
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{u.phonePrefix} {u.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{u.cedulaType}-{u.cedula}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registrado el {new Date(u.createdAt).toLocaleDateString("es-VE")}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Estado de la Cuenta
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span>Verificación: </span>
                    {u.isVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">Verificado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200">No verificado</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Estado: </span>
                    <Badge variant={u.accountStatus === 'active' ? 'default' : 'secondary'}>
                      {u.accountStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Solicitudes: {u.rentalRequests?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Asignaciones: {u.propertyAssignments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {allProperties.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Propiedades Relacionadas
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {allProperties.map((p) => p && (
                    <Card key={p.id} className="overflow-hidden">
                      <CardContent className="p-3 flex gap-3 items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.address || "Sin dirección"}</p>
                          <p className="text-xs font-semibold text-blue-600 mt-0.5">
                            ${p.price?.toLocaleString()} USD/mes
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {allProperties.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Este usuario no tiene propiedades asociadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground mt-1">
          Lista de estudiantes y clientes registrados en la plataforma
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o cédula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "Sin resultados" : "No hay usuarios"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "Ningún usuario coincide con tu búsqueda"
                : "Aún no hay estudiantes o clientes registrados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {filteredUsers.length} {filteredUsers.length === 1 ? "Usuario" : "Usuarios"}
            </CardTitle>
            <CardDescription>
              {users.filter((u) => u.role === "estudiante").length} estudiantes,{" "}
              {users.filter((u) => u.role === "cliente").length} clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {user.profilePhotoUrl ? (
                        <img src={user.profilePhotoUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{user.name}</h4>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {roleLabel[user.role] || user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.cedulaType}-{user.cedula}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {user.rentalRequests?.length || 0} solicitudes
                      </p>
                      {user.isVerified && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] h-5">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsersSection;