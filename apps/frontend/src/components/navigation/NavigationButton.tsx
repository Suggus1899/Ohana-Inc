import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NavigationButtonProps {
  propertyId: string;
  className?: string;
}

const NavigationButton = ({ propertyId, className }: NavigationButtonProps) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/navigation/${propertyId}`);
  };

  return (
    <Button 
      onClick={handleNavigate}
      className={className}
      variant="secondary"
    >
      <Navigation className="h-4 w-4 mr-2" />
      Cómo llegar
    </Button>
  );
};

export default NavigationButton;
