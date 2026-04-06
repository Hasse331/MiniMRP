/* eslint-disable @next/next/no-img-element */
import { Panel } from "@/shared/ui";
import type { ProductDetail } from "@/lib/types/domain";

export function ProductSummaryPanel(props: { product: ProductDetail | null }) {
  const { product } = props;

  return (
    <Panel title="Product" description="Basic product information.">
      <div className="stack">
        <div className="image-frame">
          {product?.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <span className="muted">No image</span>
          )}
        </div>
        <div className="detail-list">
          <div className="detail-item">
            <span>Name</span>
            <strong>{product?.name ?? "Unknown product"}</strong>
          </div>
          <div className="detail-item">
            <span>Versions</span>
            <strong>{product?.versions.length ?? 0}</strong>
          </div>
        </div>
      </div>
    </Panel>
  );
}
