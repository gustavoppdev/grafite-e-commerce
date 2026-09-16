# A Product has one image, uploaded by an Admin

This reverses part of ADR 0001, which excluded Product images and settled for a neutral placeholder. A storefront without images reads as a wireframe, and the upload path is itself worth building: validating the file's real type (never the client's `Content-Type`), capping size, and serving from storage instead of the database are the kind of decisions this project exists to practise.

Scope stays deliberately narrow. One image per Product, not a gallery. The image is optional: a Product without one still sells and still falls back to the `muted` placeholder, so the catalog never depends on an upload having happened. Files live in Supabase Storage, not in Postgres — the database stores a key, and storing binaries in a row would bloat every query that reads a Product.

The Admin uploads; there is no customer-facing upload anywhere in the store, which keeps the attack surface to a single authenticated, Admin-only entry point.

Everything else in ADR 0001 stands. This is one item removed from that list, not permission to reopen it.
