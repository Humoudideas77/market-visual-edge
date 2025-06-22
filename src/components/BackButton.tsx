
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
    // Try to go back in history, fallback to specified path
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBack}
      className={`flex items-center space-x-2 bg-exchange-panel border-exchange-border text-exchange-text-primary hover:bg-exchange-accent hover:text-exchange-blue transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
