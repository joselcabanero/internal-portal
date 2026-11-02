/**
 * The portal's other tools: apps that are not platform zones. Moved here
 * unchanged from app/page.tsx. Use a relative href for apps living under a
 * /path of this portal (see STATIC_ZONES in lib/zones.ts), or a full URL for
 * apps on their own domain.
 */

export type PortalLink = {
  /** Stable id in /api/portal-apps; derived from the name when absent. */
  id?: string;
  name: string;
  /** Icon name from the design system's portal set (see portalIcon in components/ads/portal.ts). */
  icon: string;
  description: string;
  href: string;
  tag?: string;
  external?: boolean;
};

export type PortalCategory = {
  name: string;
  blurb: string;
  apps: PortalLink[];
};

export const categories: PortalCategory[] = [
  {
    name: "Business Support",
    blurb: "Core tools we use in our day-to-day business.",
    apps: [
      {
        id: "startup-intelligence",
        name: "Startup Intelligence",
        icon: "Building2",
        description:
          "Startup ecosystem database — companies, technologies and markets across the agrifood ecosystem.",
        href: "https://ecosystem.eatableadventures.com",
        tag: "Ecosystem",
        external: true,
      },
      {
        id: "open-innovation",
        name: "Open Innovation",
        icon: "Handshake",
        description:
          "Open Innovation Platform — corporate innovation programs, challenges and startup collaborations.",
        href: "https://openinnovation.eatableadventures.com",
        tag: "Innovation",
        external: true,
      },
    ],
  },
  {
    name: "Companion Apps",
    blurb: "Deep dives to understand specific business areas better.",
    apps: [
      {
        id: "ontology",
        name: "Agrifood Ontology",
        icon: "LayoutGrid",
        description:
          "Canonical agrifood ontology: three orthogonal taxonomies describing every company in the global food system.",
        href: "/ontology",
        tag: "Research",
      },
    ],
  },
  {
    name: "Program Apps",
    blurb:
      "Tools we use with entrepreneurs in incubation and acceleration programs.",
    apps: [
      {
        id: "business-model-planner",
        name: "Business Model Planner",
        icon: "Calculator",
        description:
          "Modular financial planning tool for building and comparing plans and projections.",
        href: "https://financial-planning-app-mauve.vercel.app/",
        tag: "Finance",
        external: true,
      },
      {
        id: "business-model-comparator",
        name: "Business Model Comparator",
        icon: "ChartColumn",
        description:
          "Compare and simulate 15 startup revenue models side by side, with monthly projections rolled up to annual results.",
        href: "/business-model-comparator",
        tag: "Finance",
        external: false,
      },
    ],
  },
];
