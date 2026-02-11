# Shopify Integration Files

This folder contains a native Shopify integration for the commissioning form.

## Files

- `sections/commissioning.liquid`
- `assets/commissioning.js`
- `assets/commissioning.css`

## Install

1. Copy each file into the matching folder in your Shopify theme.
2. Open the Theme Editor and add the **Commissioning form** section to your page/template.
3. Set the section endpoint to:
   - `https://commissioning.acclaim.guide/api/submit`
4. Ensure this app's Vercel env var `FORM_CORS_ORIGINS` includes your storefront URL(s), for example:
   - `https://acclaimlighting.com,https://your-store.myshopify.com`
5. Redeploy the Vercel project after env var changes.

## Notes

- This section submits directly to the existing Next.js API route.
- `fixturesOperable` and core contact/job fields are required in the Shopify form as well.
