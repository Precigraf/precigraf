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

type Typography = (typeof TYPOGRAPHY_PRESETS)[keyof typeof TYPOGRAPHY_PRESETS];

/** Reduz a fonte proporcionalmente quando o texto é longo (limite controlado). */
function fitFont(text: string, base: number, comfortable: number, min = 0.72) {
  if (!text) return base;
  const ratio = Math.min(1, Math.max(min, comfortable / Math.max(comfortable, text.length)));
  return Math.round(base * ratio);
}

/** Cabeçalho institucional da marca — variantes centralizada e lateral. */
const BrandHeader: React.FC<{ config: CatalogConfig; type: Typography }> = ({ config, type }) => {
  const { brand, appearance } = config;
  const showLogo = brand.showLogo && !!brand.logoUrl;
  const showName = brand.showName !== false && !!brand.name.trim();
  const showSlogan = brand.showSlogan && !!brand.slogan.trim();
  const centered = brand.headerLayout !== 'side';

  if (!showLogo && !showName && !showSlogan) return null;

  const logo = showLogo ? (
    <img
      src={brand.logoUrl as string}
      alt=""
      crossOrigin="anonymous"
      style={{
        maxWidth: centered ? 150 : 120,
        maxHeight: centered ? 84 : 100,
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  ) : null;

  const name = showName ? (
    <div
      style={{
        fontFamily: type.heading,
        fontWeight: type.headingWeight,
        letterSpacing: type.tracking,
        fontSize: fitFont(brand.name, 46, 20),
        lineHeight: 1.05,
        color: appearance.textColor,
        maxWidth: centered ? 900 : 520,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {brand.name}
    </div>
  ) : null;

  const slogan = showSlogan ? (
    <div
      style={{
        fontSize: fitFont(brand.slogan, 19, 42, 0.8),
        fontWeight: 400,
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: appearance.secondaryColor,
        lineHeight: 1.3,
        marginTop: showLogo || showName ? 12 : 0,
        maxWidth: centered ? 1100 : 520,
        textAlign: centered ? 'center' : 'left',
      }}
    >
      {brand.slogan}
    </div>
  ) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: 'center',
        width: '100%',
        flexShrink: 0,
      }}
    >
      {(logo || name) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }}>
          {logo}
          {name}
        </div>
      )}
      {slogan}
    </div>
  );
};

/** Bloco de título do produto — title + highlight na mesma linha. */
const ProductTitleBlock: React.FC<{ config: CatalogConfig; type: Typography }> = ({ config, type }) => {
  const { product, appearance } = config;
  const inline = `${product.title} ${product.highlight}`.trim();
  if (!inline && !product.subtitle) return null;

  return (
    <div style={{ marginBottom: 26 }}>
      {inline && (
        <div
          style={{
            fontFamily: type.heading,
            fontWeight: type.headingWeight,
            letterSpacing: type.tracking,
            fontSize: fitFont(inline, 58, 14, 0.62),
            lineHeight: 1.05,
            color: appearance.textColor,
            overflowWrap: 'break-word',
          }}
        >
          {product.title}
          {product.title && product.highlight ? ' ' : ''}
          {product.highlight && (
            <span style={{ color: appearance.secondaryColor }}>{product.highlight}</span>
          )}
        </div>
      )}
      {product.subtitle && (
        <div
          style={{
            fontSize: fitFont(product.subtitle, 20, 26, 0.8),
            fontWeight: 400,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            marginTop: 8,
            opacity: 0.65,
            color: appearance.textColor,
          }}
        >
          {product.subtitle}
        </div>
      )}
    </div>
  );
};

const ClassicCatalog: React.FC<Props> = ({ config }) => {
  const { product, pricing, idealFor, specifications, appearance } = config;
  const footer = config.footer ?? { showCnpj: false, cnpj: '' };
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
        minHeight: CATALOG_HEIGHT,
        backgroundColor: appearance.backgroundColor,
        color: appearance.textColor,
        fontFamily: type.body,
        padding: 72,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      {/* Cabeçalho da marca */}
      <BrandHeader config={config} type={type} />

      <div
        style={{
          height: 3,
          backgroundColor: appearance.secondaryColor,
          opacity: 0.28,
          margin: '28px 0 32px',
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
          <ProductTitleBlock config={config} type={type} />

          <div
            style={{
              fontFamily: type.heading,
              fontWeight: type.headingWeight,
              letterSpacing: type.tracking,
              fontSize: fitFont(pricing.title, 34, 20),
              color: appearance.primaryColor,
              marginBottom: 16,
            }}
          >
            {pricing.title}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pricing.rows.map((row, i) => {
              const promo =
                pricing.showDiscount && typeof row.promoPrice === 'number' && row.promoPrice > 0
                  ? row.promoPrice
                  : null;
              const hasPromo = promo !== null && promo < row.price;
              const off = hasPromo ? Math.round(((row.price - promo!) / row.price) * 100) : 0;
              const unitLabel = pricing.type === 'unit' && pricing.showUnitLabel && (
                <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.65 }}> /un.</span>
              );
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '12px 20px',
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
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: type.heading,
                        fontWeight: hasPromo ? 500 : 700,
                        fontSize: hasPromo ? 22 : 30,
                        color: hasPromo ? appearance.textColor : appearance.primaryColor,
                        opacity: hasPromo ? 0.55 : 1,
                        textDecoration: hasPromo ? 'line-through' : 'none',
                      }}
                    >
                      {formatBRL(row.price)}
                      {!hasPromo && unitLabel}
                    </span>
                    {hasPromo && (
                      <>
                        <span
                          style={{
                            fontFamily: type.heading,
                            fontWeight: 700,
                            fontSize: 30,
                            color: appearance.primaryColor,
                          }}
                        >
                          {formatBRL(promo!)}
                          {unitLabel}
                        </span>
                        {off > 0 && (
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 999,
                              backgroundColor: appearance.secondaryColor,
                              color: appearance.backgroundColor,
                            }}
                          >
                            -{off}%
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          {idealFor.items.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: 28 }}>
              <div
                style={{
                  fontFamily: type.heading,
                  fontWeight: type.headingWeight,
                  letterSpacing: type.tracking,
                  fontSize: 26,
                  color: appearance.primaryColor,
                  marginBottom: 14,
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
                        padding: '14px 8px',
                        borderRadius: smallRadius,
                        border: `2px solid ${appearance.secondaryColor}33`,
                      }}
                    >
                      <Icon
                        width={32}
                        height={32}
                        strokeWidth={1.6}
                        color={appearance.secondaryColor}
                        style={{ display: 'block', margin: '0 auto 8px' }}
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
            marginTop: 36,
            display: 'flex',
            flexWrap: 'nowrap',
            gap: Math.max(6, 26 - specifications.length * 2),
            borderRadius: smallRadius,
            backgroundColor: appearance.primaryColor,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {specifications.map((spec) => {
            const Icon = getCatalogIcon(spec.icon);
            return (
              <div
                key={spec.id}
                style={{
                  flex: '1 1 0%',
                  minWidth: 0,
                  padding: `${22}px ${Math.max(6, 18 - specifications.length)}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  color: appearance.backgroundColor,
                  textAlign: 'center',
                }}
              >
                <Icon
                  width={Math.max(22, 30 - specifications.length)}
                  height={Math.max(22, 30 - specifications.length)}
                  strokeWidth={1.6}
                  style={{ flexShrink: 0, opacity: 0.9 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: Math.max(11, 15 - specifications.length * 0.4),
                      opacity: 0.7,
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {spec.label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: Math.max(13, 20 - specifications.length * 0.8),
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

      {footer.showCnpj && footer.cnpj.trim() && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 28,
            textAlign: 'center',
            fontSize: 17,
            letterSpacing: '0.06em',
            opacity: 0.6,
            color: appearance.textColor,
            flexShrink: 0,
          }}
        >
          CNPJ: {footer.cnpj}
        </div>
      )}
    </div>
  );
};

export default ClassicCatalog;
