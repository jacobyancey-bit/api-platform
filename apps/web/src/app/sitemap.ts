import { MetadataRoute } from "next";
import { STUDIO_TOOLS } from "../components/toolsCatalog";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://tools.dangling-dice-studios.com";

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${SITE_URL}/`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/dashboard`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.8,
        },
    ];

    const toolRoutes: MetadataRoute.Sitemap = STUDIO_TOOLS.map((tool) => ({
        url: `${SITE_URL}/tools/${tool.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.9,
    }));

    return [...staticRoutes, ...toolRoutes];
}

