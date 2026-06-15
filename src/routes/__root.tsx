import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">หลงทางในป่าเหรอ?</h2>
        <p className="mt-2 text-sm text-muted-foreground">หน้านี้ไม่มีในแผนที่ของหมู่บ้านไนลาโซ</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          กลับหมู่บ้าน
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">เกิดบางอย่างผิดพลาด</h1>
        <p className="mt-2 text-sm text-muted-foreground">ลองโหลดใหม่อีกครั้งนะ</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { name: "theme-color", content: "#4A5D4E" },
      { title: "Nylazo: No Lazy — เกมเดินสู้บอสในหมู่บ้านแฟนตาซี" },
      { name: "description", content: "เกม PWA สไตล์ Cottagecore เดินจริง ลุยบอสจริง พิชิตความขี้เกียจในหมู่บ้านไนลาโซ" },
      { property: "og:title", content: "Nylazo: No Lazy — เกมเดินสู้บอสในหมู่บ้านแฟนตาซี" },
      { property: "og:description", content: "เกม PWA สไตล์ Cottagecore เดินจริง ลุยบอสจริง พิชิตความขี้เกียจในหมู่บ้านไนลาโซ" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Nylazo: No Lazy — เกมเดินสู้บอสในหมู่บ้านแฟนตาซี" },
      { name: "twitter:description", content: "เกม PWA สไตล์ Cottagecore เดินจริง ลุยบอสจริง พิชิตความขี้เกียจในหมู่บ้านไนลาโซ" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6c48ea9c-05c8-475f-9611-370f0f498059/id-preview-ddcca273--2ce1b190-f3eb-4139-9f84-b7907784b5b2.lovable.app-1781532940034.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6c48ea9c-05c8-475f-9611-370f0f498059/id-preview-ddcca273--2ce1b190-f3eb-4139-9f84-b7907784b5b2.lovable.app-1781532940034.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Mitr:wght@500;700&family=Sarabun:wght@500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
