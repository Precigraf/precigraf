import React from 'react';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  subtitle,
  children,
}) => {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <h3 className="section-title">
        {icon}
        {title}
      </h3>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export default FormSection;
