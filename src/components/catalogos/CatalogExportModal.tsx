import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { ExportFormat } from '@/lib/catalogBuilder/export';
import { sanitizeFileName } from '@/lib/catalogBuilder/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultFileName: string;
  onExport: (format: ExportFormat, fileName: string) => Promise<void>;
}

const CatalogExportModal: React.FC<Props> = ({ open, onOpenChange, defaultFileName, onExport }) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [fileName, setFileName] = useState(defaultFileName);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => {
    if (open) setFileName(defaultFileName);
  }, [open, defaultFileName]);

  const handleExport = async () => {
    setBusy(true);
    try {
      await onExport(format, fileName);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar catálogo</DialogTitle>
          <DialogDescription>Escolha o formato e o nome do arquivo.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Formato</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="flex gap-4">
              {([
                ['png', 'PNG'],
                ['jpeg', 'JPEG'],
                ['pdf', 'PDF'],
              ] as const).map(([value, label]) => (
                <div key={value} className="flex items-center gap-1.5">
                  <RadioGroupItem value={value} id={`fmt-${value}`} />
                  <Label htmlFor={`fmt-${value}`} className="text-sm font-normal">{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="export-name" className="text-xs">Nome do arquivo</Label>
            <Input
              id="export-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              Será salvo como {sanitizeFileName(fileName)}.{format === 'jpeg' ? 'jpg' : format}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Baixar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogExportModal;
