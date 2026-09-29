<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Saree Boutique Project Rules

## Project
Build a modern luxury Indian saree e-commerce application.

## Technology
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- Lucide React

## Design
- Premium Indian boutique aesthetic
- Mobile-first and fully responsive
- Clean, elegant, modern UI
- Use INR currency (₹)
- Use reusable React components
- Keep the UI accessible and easy to navigate

## Saree Product Data
Each saree can have:
- Product name
- SKU
- Price
- Fabric
- Craft
- Zari type
- Occasion
- Color
- Description
- Stock status

## Saree Images
Support multiple image types:
- Full View
- Pallu Close-up
- Border Close-up
- Pleats
- Drape Video

## Services
Support:
- Boutique assistance & styling consultation
- Saree selection guidance
- Live WhatsApp video drape previews
- Showroom in-person viewing in Armoor

## Product Detail Page
Include:
- Image gallery
- Image thumbnails
- Image zoom
- Product information
- Price in ₹
- Fabric and craft information
- Add to Cart
- Buy Now
- WhatsApp inquiry
- Stock status

## Development Rules
- Do not generate fake backend functionality and present it as real.
- Keep frontend, database, authentication, payments, and storage modular.
- Do not hardcode secrets or API keys.
- Use environment variables for Supabase and payment credentials.
- Build and test one feature at a time.