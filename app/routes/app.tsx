import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Frame, TopBar, InlineStack } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate } from "../shopify.server";
import { I18nProvider } from "../i18n/i18nContext";
import { useTranslation } from "../i18n/i18nContext";
import { LanguageToggle } from "../components/LanguageToggle";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

function AppContent() {
  const { t } = useTranslation();

  return (
    <>
      <NavMenu>
        <Link to="/app" rel="home">
          {t("common.dashboard")}
        </Link>
        <Link to="/app/settings">{t("common.settings")}</Link>
      </NavMenu>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "8px 16px",
        }}
      >
        <LanguageToggle />
      </div>
      <Outlet />
    </>
  );
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <I18nProvider defaultLocale="ja">
        <AppContent />
      </I18nProvider>
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
