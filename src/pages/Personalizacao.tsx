import React, { useState, useEffect } from 'react';
import { Palette, Upload, Save, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useToast } from '@/hooks/use-toast';

const colorPresets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#22c55e', '#06b6d4', '#3b82f6', '#0ea5e9', '#14b8a6',
];

const Personalizacao: React.FC = () => {
  const { profile, isLoading, updateProfile, uploadLogo } = useCompanyProfile();
  const { toast } = useToast();

  const [storeName, setStoreName] = useState('');
  const [systemColor, setSystemColor] = useState('#6366f1');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setStoreName(profile.store_name || '');
      setSystemColor(profile.system_color || '#6366f1');
      setLogoPreview(profile.logo_url || null);
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 2MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      setLogoPreview(url);
      await updateProfile.mutateAsync({ logo_url: url });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate({
      store_name: storeName || null,
      system_color: systemColor,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Carregando...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Personalização</h1>
          <p className="text-sm text-muted-foreground">Personalize o sistema com a identidade visual da sua empresa</p>
        </div>

        <div className="space-y-6">
          {/* Logo */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Logotipo da Empresa
              </CardTitle>
              <CardDescription>Faça upload do logotipo (PNG, JPG — máx. 2MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Store className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <label>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" asChild disabled={uploading}>
                      <span className="cursor-pointer">
                        {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Name */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Nome da Loja
              </CardTitle>
              <CardDescription>Nome que aparecerá nos orçamentos e documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="Ex: Gráfica Rápida"
                maxLength={100}
              />
            </CardContent>
          </Card>

          {/* System Color */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Cor do Sistema
              </CardTitle>
              <CardDescription>Escolha a cor principal do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setSystemColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${systemColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Label>Cor personalizada:</Label>
                <input type="color" value={systemColor} onChange={e => setSystemColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="text-sm text-muted-foreground font-mono">{systemColor}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {updateProfile.isPending ? 'Salvando...' : 'Salvar Personalização'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Personalizacao;
