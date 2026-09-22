export const secureAppUrl =
  process.env.NEXT_PUBLIC_SECURE_APP_URL ||
  "https://rtpsc-enterprise-tax-operations-os-h4r12a.v2.appdeploy.ai/";

export const routes = {
  home: "/",
  secureSignIn: "/sign-in",
  avalon: "/products/avalon",
  taxSoftware: "/#tax-software",
  clientServices: "/#client-services",
  eroResources: "/#ero-resources",
  training: "/#training",
  readiness: "/#readiness",
} as const;

export const campaignAssets = {
  hero: "/marketing/ross-tax-pro-brighter-tomorrows.webp",
  auth: "/marketing/ross-tax-pro-secure-workspace.webp",
  season: "/marketing/2026-tax-season-starts-here.webp",
  blueprint: "/marketing/ross-tax-pro-brand-blueprint.webp",
} as const;

export const ctas = [
  { label: "Get Started", href: routes.secureSignIn, style: "primary" },
  { label: "Secure Sign In", href: routes.secureSignIn, style: "outline" },
  { label: "Explore Avalon", href: routes.avalon, style: "outline" },
  { label: "Training & Academy", href: routes.training, style: "ghost" },
] as const;
