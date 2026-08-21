import React from 'react';
import {
  CATALOG_HEIGHT,
  CATALOG_WIDTH,
  CatalogConfig,
  TYPOGRAPHY_PRESETS,
  formatBRL,
  getCatalogIcon,
} from '@/lib/catalogBuilder/types';

interface Props {
  config: CatalogConfig;
}

/** Reduz a fonte proporcionalmente quando o texto é longo (limite controlado). */
function fitFont(text: string, base: number, comfortable: number, min = 0.72) {
  if (!text) return base;
  const ratio = Math.min(1, Math.max(min, comfortable / Math.max(comfortable, text.length)));
  return Math.round(base * ratio);
}

const ClassicCatalog: React.FC<Props> = ({ config }) => {
  const { brand, product, pricing, idealFor, specifications, appearance } = config;
  const type = TYPOGRAPHY_PRESETS[appearance.typography] ?? TYPOGRAPHY_PRESETS.moderna;
  const radius = appearance.corners === 'rounded' ? 24 : 0;
  const smallRadius = appearance.corners === 'rounded' ? 12 : 0;
  const borderColor =
    appearance.photoBorder === 'primary'
      ? appearance.primaryColor
      : appearance.photoBorder === 'secondary'
        ? appearance.secondaryColor
        : 'transparent';

  const { zoom, x, y } = product.imageTransform;

  return (
    <div
      style={{
        width: CATALOG_WIDTH,
        height: CATALOG_HEIGHT,
        backgroundColor: appearance.backgroundColor,
        color: appearance.textColor,
        fontFamily: type.body,
        padding: 72,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 620 }}>
          {brand.showLogo && brand.logoUrl && (
            <img
              src={brand.logoUrl}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 108, height: 108, objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: type.heading,
                fontWeight: type.headingWeight,
                letterSpacing: type.tracking,
                fontSize: fitFont(brand.name, 40, 18),
                lineHeight: 1.1,
                color: appearance.primaryColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {brand.name}
            </div>
            {brand.showSlogan && brand.slogan && (
              <div
                style={{
                  fontSize: 20,
                  marginTop: 8,
                  opacity: 0.7,
                  lineHeight: 1.3,
                  maxWidth: 460,
                }}
              >
                {brand.slogan}
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', fontFamily: type.heading, letterSpacing: type.tracking }}>
          <div
            style={{
              fontSize: fitFont(product.title, 62, 10),
              fontWeight: type.headingWeight,
              lineHeight: 1,
              color: appearance.textColor,
            }}
          >
            {product.title}
          </div>
          {product.highlight && (
            <div
              style={{
                fontSize: fitFont(product.highlight, 78, 8),
                fontWeight: 800,
                lineHeight: 1,
                color: appearance.secondaryColor,
                marginTop: 4,
              }}
            >
              {product.highlight}
            </div>
          )}
          {product.subtitle && (
            <div
              style={{
                fontSize: fitFont(product.subtitle, 30, 16),
                fontWeight: 400,
                letterSpacing: '0.24em',
                marginTop: 10,
                opacity: 0.75,
              }}
            >
              {product.subtitle}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          height: 4,
          backgroundColor: appearance.primaryColor,
          opacity: 0.15,
          margin: '36px 0',
          flexShrink: 0,
        }}
      />

      {/* Corpo */}
      <div style={{ display: 'flex', gap: 56, flex: 1, minHeight: 0 }}>
        {/* Foto */}
        <div
          style={{
            width: 600,
            flexShrink: 0,
            borderRadius: radius,
            border: appearance.photoBorder === 'none' ? 'none' : `6px solid ${borderColor}`,
            backgroundColor: 'rgba(0,0,0,0.03)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: `${x}% ${y}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${x}% ${y}%`,
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                opacity: 0.4,
              }}
            >
              Fotografia do produto
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              fontFamily: type.heading,
              fontWeight: type.headingWeight,
              letterSpacing: type.tracking,
              fontSize: fitFont(pricing.title, 38, 20),
              color: appearance.primaryColor,
              marginBottom: 22,
            }}
          >
            {pricing.title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pricing.rows.map((row, i) => (
              <div
                key={row.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '14px 20px',
                  borderRadius: smallRadius,
                  backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.quantity}
                </span>
                <span
                  style={{
                    fontFamily: type.heading,
                    fontWeight: 700,
                    fontSize: 30,
                    whiteSpace: 'nowrap',
                    color: appearance.primaryColor,
                  }}
                >
                  {formatBRL(row.price)}
                  {pricing.type === 'unit' && pricing.showUnitLabel && (
                    <span style={{ fontSize: 18, fontWeight: 400, opacity: 0.65 }}> /un.</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {idealFor.items.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: 36 }}>
              <div
                style={{
                  fontFamily: type.heading,
                  fontWeight: type.headingWeight,
                  letterSpacing: type.tracking,
                  fontSize: 28,
                  color: appearance.primaryColor,
                  marginBottom: 18,
                }}
              >
                {idealFor.title}
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                {idealFor.items.map((item) => {
                  const Icon = getCatalogIcon(item.icon);
                  return (
                    <div
                      key={item.id}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'center',
                        padding: '16px 8px',
                        borderRadius: smallRadius,
                        border: `2px solid ${appearance.secondaryColor}33`,
                      }}
                    >
                      <Icon
                        width={34}
                        height={34}
                        strokeWidth={1.6}
                        color={appearance.secondaryColor}
                        style={{ display: 'block', margin: '0 auto 10px' }}
                      />
                      <div style={{ fontSize: 16, lineHeight: 1.25 }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      {specifications.length > 0 && (
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            borderRadius: smallRadius,
            backgroundColor: appearance.primaryColor,
            overflow: 'hidden',
          }}
        >
          {specifications.map((spec) => {
            const Icon = getCatalogIcon(spec.icon);
            return (
              <div
                key={spec.id}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '22px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  color: appearance.backgroundColor,
                }}
              >
                <Icon width={30} height={30} strokeWidth={1.6} style={{ flexShrink: 0, opacity: 0.9 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, opacity: 0.7, letterSpacing: '0.08em' }}>
                    {spec.label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {spec.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClassicCatalog;
