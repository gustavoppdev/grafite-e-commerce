# The Cart requires sign-in

Visitors can browse the catalog, but adding to the Cart sends them to sign in and back to the Product. We chose this over a localStorage cart for Visitors because a server-side Cart is the single source of truth for Stock and price checks and avoids merging a Visitor cart into an existing Customer Cart on sign-in (duplicate Products, Stock that changed in between). The cost is slightly more friction for Visitors, which is acceptable for a study store.
