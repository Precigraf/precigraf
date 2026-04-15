import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, ArrowLeft, Eye, EyeOff, CheckCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';

const Perfil = forwardRef<HTMLDivElement>((_, ref) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isLoading: profileLoading, updateProfile } = useCompanyProfile();

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
  const [companyDocument, setCompanyDocument] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyAddressNumber, setCompanyAddressNumber] = useState('');
  const [companyNeighborhood, setCompanyNeighborhood] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyState, setCompanyState] = useState('');

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setCompanyDocument(profile.company_document || '');
      setCompanyPhone(profile.company_phone || '');
      setCompanyEmail(profile.company_email || '');
      setCompanyAddress(profile.company_address || '');
      setCompanyAddressNumber(profile.company_address_number || '');
      setCompanyNeighborhood(profile.company_neighborhood || '');
      setCompanyCity(profile.company_city || '');
      setCompanyState(profile.company_state || '');
    }
  }, [profile]);

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
      company_document: companyDocument || null,
      company_phone: companyPhone || null,
      company_email: companyEmail || null,
      company_address: companyAddress || null,
      company_address_number: companyAddressNumber || null,
      company_neighborhood: companyNeighborhood || null,
      company_city: companyCity || null,
      company_state: companyState || null,
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
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {currentName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">Meu Perfil</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                  </div>
                </div>
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

            {/* Company Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Dados da Empresa</CardTitle>
                <CardDescription>Informações que aparecerão nos orçamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Empresa</Label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Razão Social" maxLength={150} />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input value={companyDocument} onChange={e => setCompanyDocument(e.target.value)} placeholder="00.000.000/0001-00" maxLength={20} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Celular</Label>
                      <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={20} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="contato@empresa.com" maxLength={100} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Endereço</Label>
                      <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Rua / Avenida" maxLength={200} />
                    </div>
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input value={companyAddressNumber} onChange={e => setCompanyAddressNumber(e.target.value)} placeholder="Nº" maxLength={10} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input value={companyNeighborhood} onChange={e => setCompanyNeighborhood(e.target.value)} placeholder="Bairro" maxLength={100} />
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
                  <Button onClick={handleSaveCompany} disabled={updateProfile.isPending}>
                    <Save className="w-4 h-4 mr-2" /> {updateProfile.isPending ? 'Salvando...' : 'Salvar Dados da Empresa'}
                  </Button>
                </div>
              </CardContent>
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
