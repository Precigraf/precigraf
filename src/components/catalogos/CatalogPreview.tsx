import React, { useEffect, useRef, useState } from 'react';
import { CATALOG_HEIGHT, CATALOG_WIDTH, CatalogConfig } from '@/lib/catalogBuilder/types';
import CatalogTemplateRenderer from './CatalogTemplateRenderer';

interface Props {
  config: CatalogConfig;
  canvasRef?: React.Ref<HTMLDivElement>;
}

/**
 * Mostra o catálogo em escala proporcional. A composição interna nunca muda:
 * apenas aplicamos um transform de escala sobre a área lógica fixa.
 */
const CatalogPreview: React.FC<Props> = ({ config, canvasRef }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setScale(Math.min(w / CATALOG_WIDTH, h / CATALOG_HEIGHT));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          width: CATALOG_WIDTH * scale,
          height: CATALOG_HEIGHT * scale,
        }}
        className="shadow-lg"
      >
        <div
          style={{
            width: CATALOG_WIDTH,
            height: CATALOG_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CatalogTemplateRenderer ref={canvasRef} config={config} />
        </div>
      </div>
    </div>
  );
};

export default CatalogPreview;
