import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

export interface ShopLocale {
  locale: string;
  name: string;
  primary: boolean;
  published: boolean;
}

const SHOP_LOCALES_QUERY = `#graphql
  query shopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }
`;

export async function getShopLocales(
  admin: AdminApiContext["admin"],
): Promise<ShopLocale[]> {
  const response = await admin.graphql(SHOP_LOCALES_QUERY);
  const data = await response.json();
  return data.data?.shopLocales ?? [];
}

const REGISTER_TRANSLATION_MUTATION = `#graphql
  mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
    translationsRegister(resourceId: $resourceId, translations: $translations) {
      userErrors {
        message
        field
      }
      translations {
        locale
        key
        value
      }
    }
  }
`;

export interface TranslationEntry {
  locale: string;
  key: string;
  value: string;
  translatableContentDigest: string;
}

const TRANSLATABLE_CONTENT_QUERY = `#graphql
  query getTranslatableContent($resourceId: ID!) {
    translatableResource(resourceId: $resourceId) {
      translatableContent {
        key
        value
        digest
        locale
      }
    }
  }
`;

export async function getTranslatableContent(
  admin: AdminApiContext["admin"],
  resourceId: string,
): Promise<Array<{ key: string; value: string; digest: string; locale: string }>> {
  const response = await admin.graphql(TRANSLATABLE_CONTENT_QUERY, {
    variables: { resourceId },
  });
  const data = await response.json();
  return data.data?.translatableResource?.translatableContent ?? [];
}

export async function registerTranslations(
  admin: AdminApiContext["admin"],
  resourceId: string,
  translations: TranslationEntry[],
): Promise<{ success: boolean; errors: string[] }> {
  const response = await admin.graphql(REGISTER_TRANSLATION_MUTATION, {
    variables: { resourceId, translations },
  });
  const data = await response.json();
  const userErrors = data.data?.translationsRegister?.userErrors ?? [];

  if (userErrors.length > 0) {
    return {
      success: false,
      errors: userErrors.map((e: { message: string }) => e.message),
    };
  }

  return { success: true, errors: [] };
}
