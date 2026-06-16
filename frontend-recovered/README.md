# Recovered Frontend Builds

These files were extracted from the live production Docker containers and locally cached GHCR images for:

- `Uyanik-app/uyanik-admin`
- `Uyanik-app/uyanik-mobile-web`

The original GitHub repositories were not accessible, so this is not a clean source checkout. It contains production build artifacts, static assets, available source maps, and source files recovered from those source maps where possible.

Notes:

- `container-inspect.json` files were intentionally removed because they can contain runtime env values.
- Extracted third-party `node_modules` sources from source maps were removed to keep the repository focused.
- Installer binaries, raw backups, private keys, `.env` files, and service-account JSON files are intentionally excluded.
- Treat this as recovery material, not as a trusted upstream codebase.