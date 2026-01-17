import React from 'react';
import { Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message?: string;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  message,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center text-center py-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl text-center">
              Você atingiu o limite do plano gratuito
            </DialogTitle>
            <DialogDescription className="text-center">
              {message || 'Libere acesso completo com o plano vitalício.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-6 w-full">
            <Button onClick={onUpgrade} className="w-full gap-2">
              <Crown className="w-4 h-4" />
              Desbloquear acesso vitalício
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal;
