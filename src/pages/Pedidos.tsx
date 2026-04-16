import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AppLayout from '@/components/AppLayout';
import KanbanBoard from '@/components/gestao/KanbanBoard';
import { useOrders } from '@/hooks/useOrders';
import { useExpenses } from '@/hooks/useExpenses';

type PeriodFilter = 'all' | 'week' | 'month';

const Pedidos: React.FC = () => {
  const { orders } = useOrders();
  const { expenses, createExpense, deleteExpense } = useExpenses();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'operational' });

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getDateRange = (period: PeriodFilter) => {
    const now = new Date();
    if (period === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return start;
    }
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return start;
    }
    return null; // all
  };

  const filteredOrders = useMemo(() => {
    const start = getDateRange(periodFilter);
    if (!start) return orders;
    return orders.filter(o => new Date(o.created_at) >= start);
  }, [orders, periodFilter]);

  const filteredExpenses = useMemo(() => {
    const start = getDateRange(periodFilter);
    if (!start) return expenses;
    return expenses.filter(e => new Date(e.expense_date) >= start);
  }, [expenses, periodFilter]);

  const faturamento = filteredOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  const aReceber = filteredOrders
    .filter(o => o.status !== 'delivered')
    .reduce((sum, o) => sum + (o.quotes?.total_value ?? 0), 0);

  const despesas = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lucro = faturamento - despesas;

  const kpis = [
    { label: 'Faturamento', value: formatCurrency(faturamento), icon: DollarSign, color: 'text-green-500' },
    { label: 'Despesas', value: formatCurrency(despesas), icon: TrendingDown, color: 'text-red-500' },
    { label: 'Lucro', value: formatCurrency(lucro), icon: TrendingUp, color: lucro >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'A Receber', value: formatCurrency(aReceber), icon: Clock, color: 'text-yellow-500' },
  ];

  const handleCreateExpense = () => {
    const amount = parseFloat(newExpense.amount.replace(',', '.'));
    if (!newExpense.description.trim() || isNaN(amount) || amount <= 0) return;
    createExpense.mutate({
      description: newExpense.description.trim(),
      amount,
      expense_date: new Date().toISOString().split('T')[0],
      category: newExpense.category,
    }, {
      onSuccess: () => {
        setNewExpense({ description: '', amount: '', category: 'operational' });
        setExpenseOpen(false);
      },
    });
  };

  const periodLabels: Record<PeriodFilter, string> = { all: 'Todo período', week: 'Última semana', month: 'Este mês' };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
            <p className="text-sm text-muted-foreground">Arraste os pedidos entre as colunas para atualizar o status</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map(kpi => (
            <Card key={kpi.label} className="p-4 bg-card border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-sm font-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Expenses Section */}
        <Card className="p-4 bg-card border-border mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Despesas
            </h2>
            <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm bg-card">
                <DialogHeader>
                  <DialogTitle>Registrar Despesa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Tinta, Energia" />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} placeholder="0,00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={newExpense.category} onValueChange={v => setNewExpense(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operacional</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="fixed">Custo Fixo</SelectItem>
                        <SelectItem value="other">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateExpense} disabled={createExpense.isPending} className="w-full">
                    {createExpense.isPending ? 'Salvando...' : 'Registrar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {filteredExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredExpenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(exp.expense_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-500">-{formatCurrency(exp.amount)}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExpense.mutate(exp.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <KanbanBoard />
      </div>
    </AppLayout>
  );
};

export default Pedidos;
