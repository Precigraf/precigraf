import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { useCatalogFeatured } from '@/hooks/useCatalog';

export const FeaturedManager: React.FC = () => {
  const { products } = useProducts();
  const { featured, upsert } = useCatalogFeatured();

  const byProduct = new Map(featured.map((f) => [f.product_id, f]));

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-foreground">Destaques e ordem</h3>
        <p className="text-sm text-muted-foreground">Marque produtos como Promo ou Novo e defina a ordem de exibição.</p>
      </div>

      {products.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Nenhum produto cadastrado. Vá até Produtos e cadastre antes.
        </Card>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const f = byProduct.get(p.id);
            const badge = f?.badge ?? null;
            const sortOrder = f?.sort_order ?? 999;
            const setBadge = (b: 'promo' | 'new' | null) =>
              upsert.mutate({ product_id: p.id, badge: b, sort_order: sortOrder });
            const setOrder = (n: number) =>
              upsert.mutate({ product_id: p.id, badge, sort_order: n });

            return (
              <Card key={p.id} className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-medium text-sm text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.size}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={badge === null ? 'default' : 'outline'}
                    onClick={() => setBadge(null)}
                  >
                    Nenhum
                  </Button>
                  <Button
                    size="sm"
                    variant={badge === 'promo' ? 'default' : 'outline'}
                    className={badge === 'promo' ? 'bg-destructive hover:bg-destructive/90' : ''}
                    onClick={() => setBadge('promo')}
                  >
                    Promo
                  </Button>
                  <Button
                    size="sm"
                    variant={badge === 'new' ? 'default' : 'outline'}
                    onClick={() => setBadge('new')}
                  >
                    Novo
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Ordem:</span>
                  <Input
                    type="number"
                    defaultValue={sortOrder === 999 ? '' : sortOrder}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v)) setOrder(v);
                    }}
                    className="w-20 h-8"
                    placeholder="—"
                  />
                </div>
                {badge && (
                  <Badge variant={badge === 'promo' ? 'destructive' : 'default'} className="text-[10px]">
                    {badge === 'promo' ? 'PROMO' : 'NOVO'}
                  </Badge>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
