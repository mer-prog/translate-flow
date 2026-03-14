import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export interface Product {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  featuredImage?: {
    url: string;
    altText: string | null;
  };
  translatedLocales: string[];
}

const PRODUCTS_QUERY = `#graphql
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          handle
          descriptionHtml
          featuredImage {
            url
            altText
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const TRANSLATIONS_QUERY = `#graphql
  query getTranslatableResource($resourceId: ID!) {
    translatableResource(resourceId: $resourceId) {
      translations {
        locale
        key
      }
    }
  }
`;

export async function fetchProducts(
  admin: AdminApiContext["admin"],
  first: number = 50,
): Promise<Product[]> {
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first },
  });
  const data = await response.json();
  const edges = data.data?.products?.edges ?? [];

  const products: Product[] = [];

  for (const edge of edges) {
    const node = edge.node;

    let translatedLocales: string[] = [];
    try {
      const transResponse = await admin.graphql(TRANSLATIONS_QUERY, {
        variables: { resourceId: node.id },
      });
      const transData = await transResponse.json();
      const translations = transData.data?.translatableResource?.translations ?? [];
      translatedLocales = [...new Set(translations.map((t: { locale: string }) => t.locale))];
    } catch {
      // Translations API may not be available, continue without translation data
    }

    products.push({
      id: node.id,
      title: node.title,
      handle: node.handle,
      descriptionHtml: node.descriptionHtml ?? "",
      featuredImage: node.featuredImage ?? undefined,
      translatedLocales,
    });
  }

  return products;
}

export async function fetchProduct(
  admin: AdminApiContext["admin"],
  productId: string,
): Promise<Product | null> {
  const response = await admin.graphql(
    `#graphql
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          descriptionHtml
          featuredImage {
            url
            altText
          }
        }
      }
    `,
    { variables: { id: productId } },
  );
  const data = await response.json();
  const node = data.data?.product;
  if (!node) return null;

  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    descriptionHtml: node.descriptionHtml ?? "",
    featuredImage: node.featuredImage ?? undefined,
    translatedLocales: [],
  };
}
