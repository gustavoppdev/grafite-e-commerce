# Store

A study e-commerce: customers browse a catalog, place orders through a simulated card checkout, and admins manage products, categories and orders. Terms are in English (as used in code) with the pt-BR UI label in parentheses.

## People

**Customer** (Cliente):
A signed-in person who buys from the store. Browsing the catalog does not require being a Customer; using a Cart or placing an Order does.
_Avoid_: Client, buyer, account, "user" in domain language (the auth role named `user` is what makes someone a Customer)

**Admin** (Administrador):
A signed-in person who manages the catalog and Orders. The first Admin is created by a script, never through the UI.
_Avoid_: Staff, manager, owner

**Banned Customer** (Cliente banido):
A Customer an Admin has blocked from signing in. Their past Orders remain unchanged. Admins cannot ban themselves or other Admins.
_Avoid_: Blocked, suspended, disabled account

**Visitor** (Visitante):
Someone browsing the store without being signed in.
_Avoid_: Guest, anonymous user

## Catalog

**Product** (Produto):
A single sellable item with one price and one Stock count. There are no variants: a different size or color is a different Product.
_Avoid_: Item, SKU, variant

**Archived Product** (Produto arquivado):
A Product hidden from the storefront and no longer purchasable, but still visible to Admins and in past Orders. Products are archived, never deleted.
_Avoid_: Deleted product, inactive product, disabled product

**Product Image** (Imagem do Produto):
The single image an Admin uploads for a Product. Optional: a Product without one is sold normally and shows a neutral placeholder. There is no gallery — a Product has at most one. Customers never upload anything.
_Avoid_: Photo, thumbnail, gallery, media

**Category** (Categoria):
A flat grouping of Products. Every Product belongs to exactly one Category; Categories have no subcategories. A Category can only be removed when it has no Products.
_Avoid_: Collection, department, tag

**Stock** (Estoque):
The number of units of a Product available to sell. It decreases when an Order is placed and is restored when an Order is cancelled.
_Avoid_: Inventory, quantity

**Out of Stock** (Esgotado):
A non-archived Product whose Stock is zero. It stays visible in the storefront but cannot be added to a Cart.
_Avoid_: Unavailable, sold out

**Low Stock** (Estoque baixo):
A Product whose Stock is at or below a fixed store-wide threshold, flagged for Admins.

**Slug** (Slug):
The unique, human-readable name of a Product in its storefront address. Generated from the Product name and editable by Admins.

## Shopping

**Cart** (Carrinho):
A Customer's single, persistent list of Products they intend to buy. It holds no prices of its own: it always reflects current Product prices.
_Avoid_: Basket, bag

**Cart Item** (Item do carrinho):
One Product in a Cart with a quantity, capped at the Product's current Stock.
_Avoid_: Line, cart line

**Address** (Endereço):
A Brazilian delivery address saved to a Customer's account. A Customer may have several; one is the Default Address.
_Avoid_: Location, shipping info

**Default Address** (Endereço padrão):
The Address preselected at Checkout.

## Ordering

**Checkout** (Finalização da compra):
The step where a Customer confirms the delivery Address, fills in the Payment form and places the Order. Prices and Stock are re-checked here; any change blocks the Order until the Customer reviews it.
_Avoid_: Purchase flow

**Payment** (Pagamento):
A simulated credit card charge made during Checkout. No real money moves and no card is verified with any provider. Only the card brand and last four digits are kept.
_Avoid_: Transaction, charge

**Declined Payment** (Pagamento recusado):
A Payment the simulation refuses. A Declined Payment creates no Order and leaves Stock untouched.
_Avoid_: Failed order

**Order** (Pedido):
The record created when a Customer's Payment is approved at Checkout. It keeps its own copy of the delivery Address, Subtotal, Shipping Fee and Total, so later edits elsewhere never change it.
_Avoid_: Purchase, sale, transaction

**Order Number** (Número do pedido):
The sequential, human-readable number a Customer sees for an Order (e.g. #1001). It is for reference only and never used to look up an Order in an address.
_Avoid_: Order ID, order code

**Order Item** (Item do pedido):
One Product within an Order, with the Product name, unit price and quantity copied at the moment of purchase.
_Avoid_: Line item, order line

**Order Status** (Status do pedido):
Where an Order is in its lifecycle: Paid (Pago), Shipped (Enviado), Delivered (Entregue) or Cancelled (Cancelado). An Order starts Paid; an Admin moves it Paid → Shipped → Delivered.
_Avoid_: State, stage

**Cancellation** (Cancelamento):
Moving an Order to Cancelled, allowed only while it is Paid, by its Customer or an Admin. It restores Stock; there is no refund because no real money moved.
_Avoid_: Refund, return

**Revenue** (Faturamento):
The sum of the Totals of all Orders that are not Cancelled.
_Avoid_: Sales, income, profit

**Subtotal** (Subtotal):
The sum of an Order's or Cart's item prices times quantities, before the Shipping Fee.

**Shipping Fee** (Frete):
A flat delivery charge added to the Subtotal, waived when the Subtotal reaches the free-shipping threshold. It is a fixed store rule, not calculated per destination.
_Avoid_: Freight, delivery cost

**Total** (Total):
Subtotal plus Shipping Fee.
