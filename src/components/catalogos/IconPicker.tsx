import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CATALOG_ICONS, CATALOG_ICON_KEYS, CatalogIconKey } from '@/lib/catalogBuilder/types';
import { cn } from '@/lib/utils';

interface Props {
  value: CatalogIconKey;
  onChange: (key: CatalogIconKey) => void;
}

const IconPicker: React.FC<Props> = ({ value, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CATALOG_ICON_KEYS;
    return CATALOG_ICON_KEYS.filter(
      (k) => CATALOG_ICONS[k].label.toLowerCase().includes(q) || k.includes(q),
    );
  }, [query]);
  const Current = CATALOG_ICONS[value]?.Icon ?? CATALOG_ICONS.star.Icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Escolher ícone"
        >
          <Current className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ícone…"
          aria-label="Buscar ícone"
          className="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="grid grid-cols-6 gap-1 max-h-64 overflow-y-auto pr-1">
          {filtered.map((key) => {
            const { Icon, label } = CATALOG_ICONS[key];
            return (
              <button
                key={key}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center justify-center h-10 rounded-md border transition-colors hover:bg-accent',
                  key === value ? 'border-primary bg-accent' : 'border-transparent',
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
