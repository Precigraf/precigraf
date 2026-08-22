import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, Download, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePriceCatalog, useCatalogAutosave } from '@/hooks/usePriceCatalogs';
import CatalogEditor, { CatalogValidationErrors } from '@/components/catalogos/CatalogEditor';
import CatalogPreview from '@/components/catalogos/CatalogPreview';
import CatalogExportModal from '@/components/catalogos/CatalogExportModal';
import { CatalogConfig, TEXT_LIMITS, sanitizeFileName, injectCatalogBuilderFonts } from '@/lib/catalogBuilder/types';
import { exportCatalog, ExportFormat } from '@/lib/catalogBuilder/export';
import { removeCatalogImage, uploadCatalogImage } from '@/lib/catalogBuilder/storage';
import { logError } from '@/lib/logger';

const CatalogoBuilderEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: catalog, isLoading } = usePriceCatalog(id);
  const { status, schedule, retry } = useCatalogAutosave(id);

  const [config, setConfig] = useState<CatalogConfig | null>(null);
  const [name, setName] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    injectCatalogBuilderFonts();
  }, []);

  useEffect(() => {
    if (catalog && !hydrated.current) {
      hydrated.current = true;
      setConfig(catalog.configuration);
      setName(catalog.name);
      if (searchParams.get('download') === '1') {
        setExportOpen(true);
        searchParams.delete('download');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [catalog, searchParams, setSearchParams]);

  const update = useCallback(
    (fn: (c: CatalogConfig) => CatalogConfig) => {
      setConfig((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        schedule(name, next);
        return next;
      });
    },
    [name, schedule],
  );

  const handleNameChange = (value: string) => {
    setName(value);
    if (config) schedule(value, config);
  };

  const errors: CatalogValidationErrors = useMemo(() => {
    if (!config || !showErrors) return {};
    const validRows = config.pricing.rows.filter((r) => r.quantity.trim() && r.price > 0);
    return {
      productTitle: config.product.title.trim() ? null : 'Informe o nome do produto.',
      pricingRows: validRows.length
        ? null
        : 'Adicione ao menos uma linha com quantidade e preço válidos.',
    };
  }, [config, showErrors]);

  const validate = () => {
    if (!config) return false;
    const validRows = config.pricing.rows.filter((r) => r.quantity.trim() && r.price > 0);
    const ok = !!config.product.title.trim() && validRows.length > 0;
    setShowErrors(!ok);
    if (!ok) {
      toast({
        title: 'Complete o catálogo',
        description: 'Informe o nome do produto e ao menos uma linha de preço válida.',
        variant: 'destructive',
      });
    }
    return ok;
  };

  const handleUpload = async (kind: 'logo' | 'product', file: File) => {
    if (!user || !id || !config) return;
    try {
      const previous = kind === 'logo' ? config.brand.logoPath : config.product.imagePath;
      const uploaded = await uploadCatalogImage(user.id, id, kind, file);
      update((c) =>
        kind === 'logo'
          ? { ...c, brand: { ...c.brand, logoUrl: uploaded.url, logoPath: uploaded.path } }
          : {
              ...c,
              product: {
                ...c.product,
                imageUrl: uploaded.url,
                imagePath: uploaded.path,
                imageWidth: uploaded.width,
                imageHeight: uploaded.height,
                imageTransform: { zoom: 1, x: 50, y: 50 },
              },
            },
      );
      await removeCatalogImage(previous);
      toast({ title: kind === 'logo' ? 'Logotipo atualizado' : 'Fotografia atualizada' });
    } catch (e) {
      logError('catalog upload', e);
      toast({
        title: 'Erro no upload',
        description: e instanceof Error ? e.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveImage = async (kind: 'logo' | 'product') => {
    if (!config) return;
    const path = kind === 'logo' ? config.brand.logoPath : config.product.imagePath;
    update((c) =>
      kind === 'logo'
        ? { ...c, brand: { ...c.brand, logoUrl: null, logoPath: null } }
        : { ...c, product: { ...c.product, imageUrl: null, imagePath: null, imageWidth: null, imageHeight: null } },
    );
    await removeCatalogImage(path);
  };

  const handleExport = async (format: ExportFormat, fileName: string) => {
    if (!canvasRef.current || !config) return;
    try {
      await exportCatalog(canvasRef.current, format, fileName, config.appearance.backgroundColor);
      toast({ title: 'Download iniciado' });
    } catch (e) {
      logError('catalog export', e);
      toast({
        title: 'Não foi possível exportar',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  const defaultFileName = sanitizeFileName(
    `catalogo-${config.product.title || name || 'precigraf'}`,
  );

  const statusBadge = (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando…
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-primary" /> Alterações salvas
        </>
      )}
      {status === 'error' && (
        <button
          type="button"
          onClick={retry}
          className="flex items-center gap-1.5 text-destructive hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Não foi possível salvar. Tentar novamente.
        </button>
      )}
    </div>
  );

  const editorPanel = (
    <div className="p-4">
      <CatalogEditor
        config={config}
        update={update}
        errors={errors}
        onUploadLogo={(f) => handleUpload('logo', f)}
        onRemoveLogo={() => handleRemoveImage('logo')}
        onUploadPhoto={(f) => handleUpload('product', f)}
        onRemovePhoto={() => handleRemoveImage('product')}
      />
    </div>
  );

  const previewPanel = (
    <div className="w-full h-full p-4 bg-muted/40">
      <CatalogPreview config={config} canvasRef={canvasRef} />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border flex items-center gap-2 px-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/catalogos')} aria-label="Voltar">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Input
          value={name}
          maxLength={TEXT_LIMITS.catalogName}
          aria-label="Nome do catálogo"
          onChange={(e) => handleNameChange(e.target.value)}
          className="h-9 max-w-[240px] font-medium"
        />
        <div className="hidden sm:block">{statusBadge}</div>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => {
              if (validate()) setExportOpen(true);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Baixar catálogo</span>
            <span className="sm:hidden">Baixar</span>
          </Button>
        </div>
      </header>

      <div className="sm:hidden px-3 py-1 border-b border-border">{statusBadge}</div>

      {isMobile ? (
        <Tabs defaultValue="editar" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
          </TabsList>
          <TabsContent value="editar" className="flex-1 overflow-y-auto mt-0">
            {editorPanel}
          </TabsContent>
          <TabsContent value="visualizar" className="flex-1 min-h-0 mt-0">
            {previewPanel}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex-1 flex min-h-0">
          <aside className="w-[38%] max-w-[460px] border-r border-border overflow-y-auto">
            {editorPanel}
          </aside>
          <main className="flex-1 min-w-0">{previewPanel}</main>
        </div>
      )}

      <CatalogExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        defaultFileName={defaultFileName}
        onExport={handleExport}
      />
    </div>
  );
};

export default CatalogoBuilderEditor;
