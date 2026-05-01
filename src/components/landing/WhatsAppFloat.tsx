import React from 'react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const PHONE = '5574981209228';
const MESSAGE = encodeURIComponent('Olá! Tenho interesse no PreciGraf.');

const WhatsAppFloat: React.FC = () => {
  return (
    <a
      href={`https://wa.me/${PHONE}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center"
    >
      <span className="hidden md:flex mr-3 px-3 py-2 rounded-full bg-foreground text-background text-xs font-medium shadow-lg opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
        Fale conosco no WhatsApp
      </span>
      <span className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-60 animate-ping" />
        <span className="relative inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-5px_rgba(37,211,102,0.6)] hover:scale-110 active:scale-95 transition-transform duration-200">
          <WhatsAppIcon className="w-7 h-7" />
        </span>
      </span>
    </a>
  );
};

export default WhatsAppFloat;
