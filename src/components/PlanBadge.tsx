import React from 'react';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  plan: 'free' | 'pro' | string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, onClick, className }) => {
  const isPro = plan === 'pro';
  
  return (
    <Badge
      variant={isPro ? 'default' : 'secondary'}
      className={cn(
        'cursor-pointer text-xs transition-all hover:scale-105',
        isPro 
          ? 'bg-primary/90 hover:bg-primary text-primary-foreground' 
          : 'bg-success hover:bg-success/90 text-white',
        className
      )}
      onClick={onClick}
    >
      {isPro && <Crown className="w-3 h-3 mr-1" />}
      {isPro ? 'Plano Profissional' : 'Plano Gratuito'}
    </Badge>
  );
};

export default PlanBadge;
