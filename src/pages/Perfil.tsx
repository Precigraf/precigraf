import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, ArrowLeft, Eye, EyeOff, CheckCircle, Building2, Upload, Trash2, Store, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';

import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { maskCep, maskPhone, maskCnpj } from '@/lib/masks';

const Perfil = forwardRef<HTMLDivElement>((_, ref) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile, uploadLogo } = useCompanyProfile();

  const currentName = user?.user_metadata?.name || '';
  const [name, setName] = useState(currentName);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Company fields
  const [companyName, setCompanyName] = useState('');
  
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyFullAddress, setCompanyFullAddress] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(true);

  // Legacy fields for CEP
  const [companyCep, setCompanyCep] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyAddressNumber, setCompanyAddressNumber] = useState('');
  const [companyNeighborhood, setCompanyNeighborhood] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');

  // Store name & system color (moved from Personalização)
  const [storeName, setStoreName] = useState('');
  const [systemColor, setSystemColor] = useState('#6366f1');


  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setCompanyCnpj(profile.company_document || '');
      setCompanyPhone(profile.company_phone || '');
      setCompanyEmail(profile.company_email || '');
      setCompanyAddress(profile.company_address || '');
      setCompanyAddressNumber(profile.company_address_number || '');
      setCompanyNeighborhood(profile.company_neighborhood || '');
      setCompanyCity(profile.company_city || '');
      setCompanyState(profile.company_state || '');
      setCompanyCep(profile.company_cep || '');
      setPixKey(profile.pix_key || '');
      setCompanyFullAddress(profile.company_full_address || '');
      setLogoPreview(profile.logo_url || null);
      setStoreName(profile.store_name || '');
      setSystemColor(profile.system_color || '#6366f1');
      // Use company_document as CNPJ field too
      setCompanyCnpj(profile.company_document || '');
    }
  }, [profile]);

  const isCompanyConfigured = !!(profile?.company_name || profile?.logo_url || profile?.company_document);

  const handleCepChange = (value: string) => {
    setCompanyCep(maskCep(value));
  };

  const handleCepBlur = async () => {
    const cep = companyCep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCompanyAddress(data.logradouro || '');
        setCompanyNeighborhood(data.bairro || '');
        setCompanyCity(data.localidade || '');
        setCompanyState(data.uf || '');
      }
    } catch {
      // silently fail
    }
  };

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

  const handleRemoveLogo = async () => {
    await updateProfile.mutateAsync({ logo_url: null });
    setLogoPreview(null);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Erro', description: 'O nome não pode estar vazio.', variant: 'destructive' });
      return;
    }
    setIsUpdatingName(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
      if (error) throw error;
      toast({ title: 'Nome atualizado!' });
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar nome', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Senha atualizada!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar senha', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveCompany = () => {
    updateProfile.mutate({
      company_name: companyName || null,
      company_document: companyCnpj || null,
      company_phone: companyPhone || null,
      company_email: companyEmail || null,
      company_address: companyAddress || null,
      company_address_number: companyAddressNumber || null,
      company_neighborhood: companyNeighborhood || null,
      company_city: companyCity || null,
      company_state: companyState || null,
      company_cep: companyCep || null,
      pix_key: pixKey || null,
      company_full_address: companyFullAddress || null,
      store_name: storeName || null,
      system_color: systemColor,
      logo_url: logoPreview || null,
    });
  };

  return (
    <AppLayout>
      <div ref={ref}>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>

          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl">Meu Perfil</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </CardHeader>
            </Card>

            {/* Update Name */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Alterar Nome</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateName} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" />
                  </div>
                  <Button type="submit" disabled={isUpdatingName}>
                    <Save className="w-4 h-4 mr-2" /> {isUpdatingName ? 'Salvando...' : 'Salvar Nome'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Company Settings - Collapsible */}
            <Card className="bg-card border-border">
              <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
                <CardHeader className="cursor-pointer" onClick={() => setCompanyOpen(!companyOpen)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" /> Empresa
                      </CardTitle>
                      <CardDescription>Dados da empresa para orçamentos e pedidos</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isCompanyConfigured ? 'default' : 'secondary'} className={isCompanyConfigured ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}>
                        {isCompanyConfigured ? 'Configurado' : 'Não configurado'}
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {companyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-5">
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>Logotipo da empresa</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Store className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <label>
                              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                              <Button variant="outline" size="sm" asChild disabled={uploading}>
                                <span className="cursor-pointer">
                                  <Upload className="w-4 h-4 mr-1" />
                                  {uploading ? 'Enviando...' : 'Adicionar logotipo'}
                                </span>
                              </Button>
                            </label>
                            {logoPreview && (
                              <Button variant="destructive" size="sm" onClick={handleRemoveLogo} disabled={updateProfile.isPending}>
                                <Trash2 className="w-4 h-4 mr-1" /> Remover
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Recomendado: 400x200px, PNG/WebP, fundo transparente</p>
                      </div>

                      {/* Store Name */}
                      <div className="space-y-2">
                        <Label>Nome da empresa</Label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Print Gráfica" maxLength={150} />
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={companyPhone} onChange={e => setCompanyPhone(maskPhone(e.target.value))} placeholder="Ex: (00) 00000-0000" maxLength={15} />
                      </div>

                      {/* Full Address */}
                      <div className="space-y-2">
                        <Label>Endereço completo</Label>
                        <Textarea value={companyFullAddress} onChange={e => setCompanyFullAddress(e.target.value)} placeholder="Ex: Av. Paulista, 1000, Conj. 82, Bela Vista" rows={2} />
                      </div>

                      {/* CNPJ */}
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input value={companyCnpj} onChange={e => setCompanyCnpj(maskCnpj(e.target.value))} placeholder="Ex: 98.765.432/0001-10" maxLength={18} />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="Ex: vendas@graficaprint.com.br" maxLength={100} />
                      </div>

                      {/* PIX Key */}
                      <div className="space-y-2">
                        <Label>Chave PIX (opcional)</Label>
                        <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Ex: 98.765.432/0001-10 ou (85) 91234-5678" maxLength={100} />
                        <p className="text-xs text-muted-foreground">Será exibido apenas no PDF de Pedidos (não aparece em Orçamentos)</p>
                      </div>

                      {/* CEP auto-fill section */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input
                            value={companyCep}
                            onChange={e => handleCepChange(e.target.value)}
                            onBlur={handleCepBlur}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Input value={companyCity} onChange={e => setCompanyCity(e.target.value)} placeholder="Cidade" maxLength={100} />
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Input value={companyState} onChange={e => setCompanyState(e.target.value)} placeholder="UF" maxLength={2} />
                        </div>
                      </div>

                      {/* Info notice */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Todos os campos são opcionais. Apenas os campos preenchidos serão exibidos nos PDFs.
                        </p>
                      </div>

                      <Button onClick={handleSaveCompany} disabled={updateProfile.isPending} className="w-full">
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfile.isPending ? 'Salvando...' : 'Salvar Informações'}
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Update Password */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="pr-10" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword.length > 0 && newPassword.length < 8 && <p className="text-xs text-destructive">Mínimo 8 caracteres</p>}
                    {newPassword.length >= 8 && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Senha válida</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="pr-10" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && <p className="text-xs text-destructive">Senhas não conferem</p>}
                    {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8 && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Senhas conferem</p>}
                  </div>
                  <Button type="submit" disabled={isUpdatingPassword || newPassword.length < 8 || newPassword !== confirmPassword}>
                    <Lock className="w-4 h-4 mr-2" /> {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
});

Perfil.displayName = 'Perfil';
export default Perfil;
