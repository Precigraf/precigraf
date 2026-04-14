import React, { forwardRef } from 'react';
import AppLayout from '@/components/AppLayout';
import CostCalculator from '@/components/CostCalculator';
import { useSecurityCheck } from '@/hooks/useSecurityCheck';

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  useSecurityCheck();

  return (
    <AppLayout>
      <div ref={ref} className="container mx-auto px-4 py-8">
        <CostCalculator />
      </div>
    </AppLayout>
  );
});

Index.displayName = 'Index';

export default Index;
