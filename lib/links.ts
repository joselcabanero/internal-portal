/**
 * The portal's other tools: apps that are not platform zones. Moved here
 * unchanged from app/page.tsx. Use a relative href for apps living under a
 * /path of this portal (see STATIC_ZONES in lib/zones.ts), or a full URL for
 * apps on their own domain.
 */

export type PortalLink = {
  name: string;
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
        name: "Startup Intelligence",
        description:
          "Startup ecosystem database — companies, technologies and markets across the agrifood ecosystem.",
        href: "https://ecosystem.eatableadventures.com",
        tag: "Ecosystem",
        external: true,
      },
      {
        name: "Open Innovation",
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
        name: "Agrifood Ontology",
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
        name: "Business Model Planner",
        description:
          "Modular financial planning tool for building and comparing plans and projections.",
        href: "https://financial-planning-app-mauve.vercel.app/",
        tag: "Finance",
        external: true,
      },
      {
        name: "Business Model Comparator",
        description:
          "Compare and simulate 15 startup revenue models side by side, with monthly projections rolled up to annual results.",
        href: "/business-model-comparator",
        tag: "Finance",
        external: false,
      },
    ],
  },
];
