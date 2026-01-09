import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipLabelProps {
  label: string;
  tooltip: string;
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({ label, tooltip }) => {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium text-secondary-foreground">{label}</span>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button 
              type="button" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Ajuda: ${label}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs bg-card border-border text-foreground p-3"
          >
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default TooltipLabel;
