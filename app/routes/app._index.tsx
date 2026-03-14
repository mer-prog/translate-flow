import { useState, useCallback } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
  Banner,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { fetchProducts } from "../services/product-fetcher.server";
import { ProductTranslationList } from "../components/ProductTranslationList";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const products = await fetchProducts(admin);
  return json({ products });
};

export default function Dashboard() {
  const { products } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleTranslate = useCallback(() => {
    if (selectedProductIds.length === 0) return;
    const params = new URLSearchParams();
    selectedProductIds.forEach((id) => params.append("productId", id));
    navigate(`/app/translate?${params.toString()}`);
  }, [selectedProductIds, navigate]);

  return (
    <Page>
      <TitleBar title="TranslateFlow" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              <Banner tone="info">
                <Text as="p" variant="bodyMd">
                  Select products to translate, then click "Translate Selected" to start.
                </Text>
              </Banner>
              <Card padding="0">
                <ProductTranslationList
                  products={products}
                  onSelectionChange={setSelectedProductIds}
                />
              </Card>
              <Button
                variant="primary"
                disabled={selectedProductIds.length === 0}
                onClick={handleTranslate}
              >
                Translate Selected ({selectedProductIds.length})
              </Button>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
