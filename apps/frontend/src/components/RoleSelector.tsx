import * as SelectPrimitive from "@radix-ui/react-select";
import { GraduationCap, User, Building, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = 'cliente' | 'propietario' | 'estudiante';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  disabledRoles?: UserRole[];
}

const roles = [
  {
    id: 'estudiante' as const,
    title: 'Estudiante',
    description: 'Residencia para alquilar',
    icon: GraduationCap,
  },
  {
    id: 'cliente' as const,
    title: 'Cliente',
    description: 'Propiedad para alquilar',
    icon: User,
  },
  {
    id: 'propietario' as const,
    title: 'Propietario',
    description: 'Publico propiedades',
    icon: Building,
  },
];

const roleIcons: Record<string, typeof GraduationCap> = {
  estudiante: GraduationCap,
  cliente: User,
  propietario: Building,
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  disabledRoles = [],
}) => {
  const selected = roles.find((r) => r.id === value);
  const SelectedIcon = selected ? roleIcons[value] : null;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(v) => onChange(v as UserRole)}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        className={cn(
          "w-full h-10 flex items-center gap-2.5 rounded-lg border-2 bg-white px-3 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "data-[placeholder]:border-gray-300",
          "aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      >
        {SelectedIcon && (
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary flex-shrink-0">
            <SelectedIcon className="h-3.5 w-3.5" />
          </div>
        )}
        <SelectPrimitive.Value placeholder="Seleccionar" />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-[10000] min-w-[var(--radix-select-trigger-width)] max-h-96 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:pointer-events-none"
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="p-1">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = value === role.id;
              const isDisabled = disabled || disabledRoles.includes(role.id);

              return (
                <SelectPrimitive.Item
                  key={role.id}
                  value={role.id}
                  disabled={isDisabled}
                  className={cn(
                    "relative flex w-full select-none items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                    "data-[highlighted]:bg-gray-50 data-[highlighted]:outline-none",
                    isSelected ? "bg-primary/5 text-primary" : "text-gray-700"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0",
                    isSelected ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 text-left">
                    <SelectPrimitive.ItemText>
                      <span className="font-medium leading-tight">{role.title}</span>
                    </SelectPrimitive.ItemText>
                    <div className="text-[11px] text-gray-400 leading-tight">{role.description}</div>
                  </div>
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
};

export default RoleSelector;
