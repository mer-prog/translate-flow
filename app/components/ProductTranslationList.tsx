import { useEffect } from "react";
import {
  IndexTable,
  Text,
  Badge,
  InlineStack,
  Thumbnail,
  useIndexResourceState,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

interface Product {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText: string | null;
  };
  translatedLocales: string[];
}

interface ProductTranslationListProps {
  products: Product[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function ProductTranslationList({
  products,
  onSelectionChange,
}: ProductTranslationListProps) {
  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products as unknown as Array<{ id: string; [key: string]: unknown }>);

  useEffect(() => {
    if (allResourcesSelected) {
      onSelectionChange(products.map((p) => p.id));
    } else {
      onSelectionChange(selectedResources);
    }
  }, [selectedResources, allResourcesSelected]);

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row
      id={product.id}
      key={product.id}
      selected={selectedResources.includes(product.id)}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="300" blockAlign="center">
          <Thumbnail
            source={product.featuredImage?.url ?? ImageIcon}
            alt={product.featuredImage?.altText ?? product.title}
            size="small"
          />
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {product.title}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="100">
          {product.translatedLocales.length > 0 ? (
            product.translatedLocales.map((locale) => (
              <Badge key={locale} tone="success">
                {locale.toUpperCase()}
              </Badge>
            ))
          ) : (
            <Badge tone="attention">No translations</Badge>
          )}
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <IndexTable
      resourceName={resourceName}
      itemCount={products.length}
      selectedItemsCount={
        allResourcesSelected ? "All" : selectedResources.length
      }
      onSelectionChange={handleSelectionChange}
      headings={[
        { title: "Product" },
        { title: "Translations" },
      ]}
    >
      {rowMarkup}
    </IndexTable>
  );
}
