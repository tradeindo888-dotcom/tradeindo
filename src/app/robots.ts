// src/app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://tradeindo.onrender.com/sitemap.xml', // <-- TIDAK ADA /id DI SINI
  }
}