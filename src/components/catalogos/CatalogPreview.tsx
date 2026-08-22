import React, { useEffect, useRef, useState } from 'react';
import { CATALOG_HEIGHT, CATALOG_WIDTH, CatalogConfig } from '@/lib/catalogBuilder/types';
import CatalogTemplateRenderer from './CatalogTemplateRenderer';

interface Props {
  config: CatalogConfig;
  canvasRef?: React.Ref<HTMLDivElement>;
}

/**
 * Mostra o catálogo em escala proporcional. A largura lógica é fixa, mas a
 * altura acompanha o conteúdo (mais linhas de preço = página mais alta),
 * garantindo que nenhuma seção fique escondida.
 */
const CatalogPreview: React.FC<Props> = ({ config, canvasRef }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.4);
  const [contentHeight, setContentHeight] = useState(CATALOG_HEIGHT);

  const setRefs = (node: HTMLDivElement | null) => {
    innerRef.current = node;
    if (typeof canvasRef === 'function') canvasRef(node);
    else if (canvasRef) (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  useEffect(() => {
    const el = wrapperRef.current;
    const inner = innerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const ch = Math.max(inner?.scrollHeight ?? CATALOG_HEIGHT, CATALOG_HEIGHT);
      setContentHeight(ch);
      if (!w || !h) return;
      setScale(Math.min(w / CATALOG_WIDTH, h / ch));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [config]);

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div
        style={{
          width: CATALOG_WIDTH * scale,
          height: contentHeight * scale,
        }}
        className="shadow-lg"
      >
        <div
          style={{
            width: CATALOG_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <CatalogTemplateRenderer ref={setRefs} config={config} />
        </div>
      </div>
    </div>
  );
};

export default CatalogPreview;
