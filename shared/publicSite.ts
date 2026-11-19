import type { Branch, ContentItem, Product } from './schema';

export type PublicProduct = Pick<Product, 'id' | 'name' | 'genericName' | 'description' | 'category' | 'strength' | 'dosageForm' | 'price'> & { prescriptionRequired: boolean };
export type PublicBranch = Pick<Branch, 'id' | 'name' | 'address' | 'city' | 'phone' | 'email'>;
export type PublicArticle = Pick<ContentItem, 'id' | 'title' | 'slug' | 'content' | 'excerpt' | 'category' | 'publishedAt'>;

export function isPublicProduct(product: Product): boolean {
  return product.isActive && product.onlineSaleAllowed && !product.controlledMedicine && product.prescriptionRequirement !== 'restricted_online';
}
export function publicProduct(product: Product): PublicProduct {
  const { id, name, genericName, description, category, strength, dosageForm, price } = product;
  return { id, name, genericName, description, category, strength, dosageForm, price,
    prescriptionRequired: product.prescriptionRequired || product.prescriptionRequirement !== 'none' || product.requiresPharmacistApproval };
}
export function publicBranch(branch: Branch): PublicBranch {
  const { id, name, address, city, phone, email } = branch;
  return { id, name, address, city, phone, email };
}
export function isPublishedArticle(article: ContentItem, now = Date.now()): boolean {
  return article.status === 'published' && Boolean(article.publishedAt) && new Date(article.publishedAt!).getTime() <= now;
}
export function publicArticle(article: ContentItem): PublicArticle {
  const { id, title, slug, content, excerpt, category, publishedAt } = article;
  return { id, title, slug, content, excerpt, category, publishedAt };
}
