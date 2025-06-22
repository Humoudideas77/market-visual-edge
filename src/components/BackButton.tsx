import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  fallbackPath = '/', 
  label = 'Back',
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1 && document.referrer && document.referrer !== window.location.href) {
      // If there's a referrer and it's not the same page, go back
      window.history.back();
    } else {
      // Otherwise, navigate to fallback path
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={`flex items-center space-x-2 bg-exchange-panel border-exchange-red text-exchange-text-primary hover:bg-exchange-red hover:text-white transition-all duration-200 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
