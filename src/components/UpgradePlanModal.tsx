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
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Você atingiu o limite do plano gratuito</DialogTitle>
          <DialogDescription className="text-center mt-2">
            {message || 'Libere acesso completo com o plano vitalício.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={onUpgrade} className="w-full gap-2">
            <Crown className="w-4 h-4" />
            Desbloquear acesso vitalício
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal;
