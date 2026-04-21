import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PeriodKey = 'current_month' | 'last_7' | 'last_15' | 'last_30' | 'all' | 'custom';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'current_month', label: 'Mês Atual' },
  { value: 'last_7', label: 'Últimos 7 dias' },
  { value: 'last_15', label: 'Últimos 15 dias' },
  { value: 'last_30', label: 'Últimos 30 dias' },
  { value: 'all', label: 'Todo Histórico' },
  { value: 'custom', label: 'Personalizado' },
];

export function getDateRange(period: PeriodKey, customStart?: Date, customEnd?: Date): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (period) {
    case 'current_month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'last_7': {
      const s = new Date(now);
      s.setDate(now.getDate() - 7);
      return { start: s, end: now };
    }
    case 'last_15': {
      const s = new Date(now);
      s.setDate(now.getDate() - 15);
      return { start: s, end: now };
    }
    case 'last_30': {
      const s = new Date(now);
      s.setDate(now.getDate() - 30);
      return { start: s, end: now };
    }
    case 'all':
      return { start: null, end: null };
    case 'custom':
      return { start: customStart ?? null, end: customEnd ?? null };
  }
}

interface PeriodFilterProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
  customStart?: Date;
  customEnd?: Date;
  onCustomStartChange?: (d: Date | undefined) => void;
  onCustomEndChange?: (d: Date | undefined) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={value} onValueChange={(v) => onChange(v as PeriodKey)}>
        <SelectTrigger className="w-48">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('w-32 justify-start text-left font-normal', !customStart && 'text-muted-foreground')}>
                {customStart ? format(customStart, 'dd/MM/yyyy') : 'Início'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={onCustomStartChange} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">até</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn('w-32 justify-start text-left font-normal', !customEnd && 'text-muted-foreground')}>
                {customEnd ? format(customEnd, 'dd/MM/yyyy') : 'Fim'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={onCustomEndChange} initialFocus className="p-3 pointer-events-auto" locale={ptBR} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};

export default PeriodFilter;
