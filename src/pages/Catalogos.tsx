import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Copy, Download, LayoutTemplate, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePriceCatalogs } from '@/hooks/usePriceCatalogs';
import { PriceCatalog } from '@/lib/catalogBuilder/types';
import CatalogPreview from '@/components/catalogos/CatalogPreview';

const Catalogos: React.FC = () => {
  const navigate = useNavigate();
  const { catalogs, isLoading, create, duplicate, remove } = usePriceCatalogs();
  const [toDelete, setToDelete] = useState<PriceCatalog | null>(null);

  const handleCreate = async () => {
    const created = await create.mutateAsync(undefined);
    navigate(`/catalogos/${created.id}`);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Catálogos de Preços</h1>
            <p className="text-sm text-muted-foreground">
              Monte tabelas de preços profissionais para apresentar aos seus clientes.
            </p>
          </div>
          {catalogs.length > 0 && (
            <Button onClick={handleCreate} disabled={create.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Criar catálogo
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : catalogs.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <LayoutTemplate className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1 max-w-md">
              <h2 className="text-lg font-semibold">Crie seu primeiro catálogo de preços</h2>
              <p className="text-sm text-muted-foreground">
                Transforme seus preços em um material profissional para apresentar aos seus clientes.
              </p>
            </div>
            <Button onClick={handleCreate} disabled={create.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Criar meu primeiro catálogo
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((catalog) => (
              <Card key={catalog.id} className="overflow-hidden flex flex-col">
                <button
                  type="button"
                  onClick={() => navigate(`/catalogos/${catalog.id}`)}
                  aria-label={`Abrir ${catalog.name}`}
                  className="block w-full bg-muted/40 aspect-[4/3] overflow-hidden"
                >
                  <div className="pointer-events-none w-full h-full">
                    <CatalogPreview config={catalog.configuration} />
                  </div>
                </button>
                <div className="p-3 space-y-2 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{catalog.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[catalog.configuration.product.title, catalog.configuration.product.highlight]
                          .filter(Boolean)
                          .join(' ') || 'Sem produto'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Editado em {format(new Date(catalog.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Mais opções">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/catalogos/${catalog.id}`)}>
                          <Pencil className="w-4 h-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate.mutate(catalog)}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/catalogos/${catalog.id}?download=1`)}>
                          <Download className="w-4 h-4 mr-2" /> Baixar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setToDelete(catalog)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/catalogos/${catalog.id}`)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicate.mutate(catalog)}
                      aria-label="Duplicar catálogo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/catalogos/${catalog.id}?download=1`)}
                      aria-label="Baixar catálogo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir catálogo?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não poderá ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) remove.mutate(toDelete.id);
                setToDelete(null);
              }}
            >
              Excluir catálogo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Catalogos;
