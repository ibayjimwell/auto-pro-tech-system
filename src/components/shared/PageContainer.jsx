import React from 'react';
import Header from '@/components/layout/Header';

export default function PageContainer({ title, subtitle, actions, children }) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className="p-4 md:p-6">
        {actions && (
          <div className="flex items-center justify-end mb-4 md:mb-6">
            <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          </div>
        )}
        {children}
      </div>
    </>
  );
}