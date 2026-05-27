export function computeStockHealthLabel(stock: number, threshold: number): string {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= threshold) return 'Low Stock';
  return 'In Stock';
}

export function computeStockHealthClass(stock: number, threshold: number): string {
  if (stock <= 0) return 'badge--danger';
  if (stock <= threshold) return 'badge--warning';
  return 'badge--success';
}
