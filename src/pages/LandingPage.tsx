import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Calculator,
  Layers,
  TrendingUp,
  Users,
  ShoppingCart,
  Truck,
  Sparkles,
  Check,
  ArrowRight,
  Star,
  Shield,
  Zap,
  BarChart3,
  Smartphone,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import LogoIcon from '@/components/LogoIcon';
import LandingNav from '@/components/landing/LandingNav';
import HeroMockup from '@/components/landing/HeroMockup';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const ctaPrimary = user ? '/' : '/cadastro';
  const ctaPrimaryLabel = user ? 'Ir para o app' : 'Começar período grátis';

  const handleSubscribePro = async () => {
    setIsCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.info('Crie sua conta para assinar o Pro');
        navigate('/cadastro?plan=pro');
        return;
      }
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout');
      if (error || !data?.url) {
        toast.error(data?.error || 'Erro ao iniciar checkout. Tente novamente.');
        setIsCheckoutLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error('Erro inesperado. Tente novamente.');
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />

      {/* HERO */}
      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 overflow-hidden">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <Badge
                variant="outline"
                className="mb-5 border-border text-muted-foreground gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                Feito para gráficas brasileiras
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
                Precifique seus serviços gráficos com a precisão que seu lucro merece
              </h1>

              <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                A calculadora completa para gráficas calcularem custos, margens e
                preços finais — sem planilhas confusas e sem prejuízo.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="h-12 px-7 text-base">
                  <Link to={ctaPrimary}>
                    {ctaPrimaryLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-7 text-base">
                  <a href="#como-funciona">Ver como funciona</a>
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Sem cartão de crédito • Acesso imediato
              </p>
            </div>

            <div>
              <HeroMockup />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { v: '+100', l: 'usuários ativos' },
              { v: '234', l: 'cálculos feitos' },
              { v: '4.9/5', l: 'avaliação média' },
              { v: '99.9%', l: 'disponibilidade' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {s.v}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-3xl text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            O problema
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Precificar &ldquo;no chute&rdquo; está custando o seu lucro
          </h2>
          <p className="mt-5 text-muted-foreground text-base sm:text-lg">
            Planilhas frágeis, fórmulas erradas, custos operacionais esquecidos.
            Resultado: trabalho dobrado e margem que evapora a cada orçamento
            fechado abaixo do ideal.
          </p>
        </div>
      </section>

      {/* SOLUTION PILLARS */}
      <section className="py-16 sm:py-24 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              A solução
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo que sua gráfica precisa, em um só lugar
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Calculator,
                title: 'Custo real',
                desc: 'Matéria-prima, tinta, mão de obra e acabamentos calculados com precisão.',
              },
              {
                icon: TrendingUp,
                title: 'Margem automática',
                desc: 'Preço final calculado pela margem real, sem arredondamentos enganosos.',
              },
              {
                icon: Layers,
                title: 'Simulação por quantidade',
                desc: 'Veja preços por tiragem em segundos. Feche orçamentos com segurança.',
              },
              {
                icon: Users,
                title: 'CRM integrado',
                desc: 'Clientes, orçamentos e pedidos com Kanban e área pública de rastreio.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-5 bg-card border-border">
                <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recursos
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Pensado para o dia a dia da gráfica
            </h2>
            <p className="mt-4 text-muted-foreground">
              Da calculadora ao pedido entregue — sem trocar de ferramenta.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Calculator,
                title: 'Calculadora completa',
                desc: 'Cálculo exato de custo total, margem real e preço final, com precisão de centavos.',
              },
              {
                icon: Zap,
                title: 'Custos operacionais',
                desc: 'Depreciação de equipamentos, energia e mão de obra rateados por tempo de produção.',
              },
              {
                icon: ShoppingCart,
                title: 'Marketplace builder',
                desc: 'Calcule taxas, cupons e frete para vender em qualquer canal sem perder margem.',
              },
              {
                icon: Users,
                title: 'CRM com Kanban',
                desc: 'Clientes → Orçamentos → Pedidos. Mova cards e acompanhe a produção em tempo real.',
              },
              {
                icon: Truck,
                title: 'Área de rastreio',
                desc: 'Página pública para o cliente acompanhar o status do pedido sem precisar logar.',
              },
              {
                icon: FileText,
                title: 'Histórico e exportação',
                desc: 'Histórico ilimitado de cálculos, exportação em PDF e Excel quando precisar.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card
                key={title}
                className="p-6 bg-card border-border hover:border-foreground/30 transition-colors"
              >
                <Icon className="w-6 h-6 text-foreground mb-4" />
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="como-funciona"
        className="py-20 sm:py-28 bg-muted/30 border-y border-border"
      >
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Como funciona
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Do custo ao pedido em 3 passos
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01',
                title: 'Cadastre seus custos',
                desc: 'Insira matéria-prima, tinta, mão de obra e custos operacionais uma única vez.',
              },
              {
                n: '02',
                title: 'Defina sua margem',
                desc: 'Escolha a margem real desejada e veja o preço final calculado na hora.',
              },
              {
                n: '03',
                title: 'Envie o orçamento',
                desc: 'Gere orçamento profissional, converta em pedido e acompanhe pelo Kanban.',
              },
            ].map((step) => (
              <Card key={step.n} className="p-6 bg-card border-border relative">
                <span className="text-5xl font-bold text-foreground/10 absolute top-3 right-4 leading-none">
                  {step.n}
                </span>
                <h3 className="font-semibold text-lg pr-12">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {step.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Quem usa, recomenda
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Resultados de quem precifica com confiança
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: 'Carlos M.',
                role: 'Gráfica Rápida — SP',
                text: 'Em 1 mês recuperei a margem que eu vinha perdendo no chute. Hoje fecho orçamento em 5 minutos.',
              },
              {
                name: 'Juliana R.',
                role: 'Print Express — RJ',
                text: 'O simulador por quantidade mudou meu jogo. Consigo defender o preço sem hesitar.',
              },
              {
                name: 'André F.',
                role: 'Studio Impressões — MG',
                text: 'Substituiu 3 planilhas e o WhatsApp de pedidos. Meu cliente acompanha tudo pela área de rastreio.',
              },
            ].map((t) => (
              <Card key={t.name} className="p-6 bg-card border-border">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-border">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="precos"
        className="py-20 sm:py-28 bg-muted/30 border-y border-border"
      >
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Preços
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Comece grátis. Evolua quando precisar.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sem surpresas. Cancele quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Free */}
            <Card className="p-7 bg-card border-border flex flex-col">
              <h3 className="text-lg font-semibold">Período Grátis</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Teste sem compromisso
              </p>

              <div className="mt-6 mb-6">
                <span className="text-5xl font-bold tabular-nums">R$ 0</span>
              </div>

              <ul className="space-y-3 text-sm flex-1">
                {[
                  'Acesso à calculadora',
                  'Cálculos básicos de custo e margem',
                  'Sem cartão de crédito',
                ].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="mt-7 w-full h-11">
                <Link to="/cadastro">Começar grátis</Link>
              </Button>
            </Card>

            {/* Pro */}
            <Card className="relative p-7 bg-card border-2 border-foreground shadow-[0_20px_60px_-20px_hsl(var(--foreground)/0.35)] md:scale-[1.03] flex flex-col">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background hover:bg-foreground">
                Mais popular
              </Badge>

              <h3 className="text-lg font-semibold flex items-center gap-2">
                Pro
                <Sparkles className="w-4 h-4 text-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tudo que sua gráfica precisa
              </p>

              <div className="mt-6 mb-6 flex items-baseline gap-1.5">
                <span className="text-5xl font-bold tabular-nums">R$ 15,90</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-3 text-sm flex-1">
                {[
                  'Cálculos ilimitados',
                  'Simulador por quantidade',
                  'Custos operacionais avançados',
                  'CRM completo (Clientes, Orçamentos, Pedidos)',
                  'Kanban de produção e área pública de rastreio',
                  'Marketplace builder com cupons e frete',
                  'Exportação PDF e Excel',
                  'Histórico ilimitado',
                  'Suporte prioritário',
                  'Todas as atualizações futuras',
                ].map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-7 w-full h-11 text-base">
                <Link to="/cadastro?plan=pro">
                  Assinar Pro <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Dúvidas frequentes
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo que você precisa saber
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: 'O que é o PreciGraf?',
                a: 'É uma plataforma completa de precificação e gestão para gráficas: calculadora de custos, simulador por quantidade, CRM com Kanban e área pública de rastreio para seus clientes.',
              },
              {
                q: 'Como funciona o período grátis?',
                a: 'Você cria sua conta sem cartão e usa a calculadora imediatamente para conhecer a ferramenta. Quando quiser desbloquear todos os recursos, basta assinar o Pro.',
              },
              {
                q: 'A assinatura Pro é mensal?',
                a: 'Sim. O Pro custa R$ 15,90 por mês, sem fidelidade. Você pode cancelar quando quiser direto pela sua conta.',
              },
              {
                q: 'Posso usar no celular?',
                a: 'Sim. O PreciGraf é totalmente responsivo e funciona em qualquer celular, tablet ou computador, com a mesma experiência.',
              },
              {
                q: 'Meus dados estão seguros?',
                a: 'Sim. Todos os dados são protegidos por autenticação, segurança a nível de linha (RLS) no banco e criptografia em trânsito. Apenas você acessa as informações da sua gráfica.',
              },
              {
                q: 'Como cancelo a assinatura?',
                a: 'Em poucos cliques no seu perfil. Sem ligações, sem burocracia, sem multa.',
              },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left hover:no-underline text-base font-medium">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="rounded-2xl bg-foreground text-background p-10 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl mx-auto leading-[1.1]">
                Pronto para precificar com confiança?
              </h2>
              <p className="mt-5 text-background/70 max-w-lg mx-auto">
                Crie sua conta e comece a calcular o preço justo dos seus
                serviços agora mesmo.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="h-12 px-8 text-base bg-background text-foreground hover:bg-background/90"
                >
                  <Link to={ctaPrimary}>
                    {ctaPrimaryLabel} <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base bg-transparent text-background border-background/30 hover:bg-background/10 hover:text-background"
                >
                  <Link to="#precos">Ver planos</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-5 text-xs text-background/60">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Seguro
                </span>
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Responsivo
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> Sem fidelidade
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/lp" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <LogoIcon className="w-3.5 h-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold">PreciGraf</span>
          </Link>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#precos" className="hover:text-foreground transition-colors">Preços</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar</Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PreciGraf. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
