const TrafiCheckout = {
    config: {
        /**
              * One of 'USD' or 'CAD'
              * @type String
              */
        currency: "USD",
        /**
              * One of 'thespadr.com' or 'thespadr-dev.com' or 'shapees.com'
              * @type String
              */
        domain: "thespadr.com",
        /**
              * One of 'shopify' or 'big_commerce'
              * @type String
              */
        vendor: 'shopify',
        /**
              * One of 'the-spa-dr' or 'thespadr-dev'
              * @type String
              */
        store: "the-spa-dr",
        /**
              * One of 'production' or 'stage'
              * @type String
              */
        environment: "production",
        /**
          * Headless Checkout checkout url string
          * @type String
          */
        checkout_url: 'https://checkout.{domain}/hc/checkout/{cart_id}',
        /**
              * Cart public endpoint
              * @type String
              */
        cart_url: 'https://api.{vendor}.{environment}.trafilea.io/cart',
    },
    _: {
        formatValue: (number) => Number(number.toFixed(2)),
        generatePayload: (cart) => {
            const data = {
                token: cart.token,
                currency: cart.currency,
                currency_ratio: 1,
                email: 'script@trafilea.com',
                items: cart.items,
                totals: cart.totals
            };

            const context = {};

            const config = TrafiCheckout.config

            const payload = {
                vendor: config.vendor,
                shop: config.store,
                token: cart.token,
                data,
                context
            };

            return payload;
        },
        calculateTotals: (items) => items.reduce((totals, item) => ({
            products: totals.products + item.unit_price_total,
            discount: totals.discount + item.discounts_total,
            total: totals.total + item.unit_price_total - item.discounts_total,
            shipping: 0,
            taxes: 0,
        }), {
            products: 0,
            discount: 0,
            total: 0,
            shipping: 0,
            taxes: 0
        }),
        updateCart: async (cart) => {
            const url = TrafiCheckout.config.cart_url.replace("{vendor}", TrafiCheckout.config.vendor)
                .replace("{environment}", TrafiCheckout.config.environment);

            console.log('Endpoint is:', url, 'HC Cart is:', cart)

            const payload = TrafiCheckout._.generatePayload(cart)

            try {
                const controller = new AbortController()

                setTimeout(() => controller.abort(), 6000)

                const cartResponse = await fetch(url, {
                    signal: controller.signal,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                    ,
                })
                if (cartResponse.status !== 200) throw new Error(cartResponse)

                return cartResponse.json()

            } catch (error) {
                if (error.status >= 500) {
                    //TODO retry
                    console.log("Gateway error")
                }
                console.log("Error Hitting HC Create/Update Cart:", error)
                throw error

            }

        }
    },
    init: (configOverride) => {
        TrafiCheckout.config = { ...TrafiCheckout.config, ...configOverride }
        console.log("HC Init with [STORE]:" + TrafiCheckout.config.store)
    },
    cart: {
        createItem: ({ product, variant, quantity = 1, ...rest }) => ({
            "tags": product.tags,
            "type": product.type ?? 'product',
            "product_uuid": product.id,
            "product_id": product.vendor_product.product_id,
            "variant_uuid": variant.id,
            "variant_id":  product.vendor_product.variations_id[variant.id],
            "sku": variant.sku,
            "compare_at_price": variant.compare_at_price,
            "compare_at_price_total": TrafiCheckout._.formatValue(variant.compare_at_price * quantity),
            "name": product.title,
            "description": variant.title,
            "quantity": quantity,
            "unit_price": variant.price,
            "unit_price_total": TrafiCheckout._.formatValue(variant.price * quantity),
            "image_url": variant.images[0].src,
            "vendor": product.vendor_product.vendor_id,
            "shop": product.vendor_product.store_id,
            "discounts_total": rest.discount,
            "discount_label": rest.discount_label,
            "subscription": rest.subscription
        }),
        buildFromItems: (itemsToTransform) => {
            const items = itemsToTransform.map(item => TrafiCheckout.cart.createItem(item));
            const totals = TrafiCheckout._.calculateTotals(items)
            return { currency: TrafiCheckout.config.currency, items, totals }
        },
        create: async (cart) => TrafiCheckout._.updateCart(cart),
        update: async (cart) => TrafiCheckout._.updateCart(cart),
        transform: {
            shopify: (cart) => {

                // Yes. Why.
                // A conundrum. That's why.
                // So here's the deal, on one side, cart.js does not return the right compare at price. On the other hand, the cart drop
                // in Liquid no longer has the token available. Since we need both things to build the proper payload, got to handle both scenarios.
                const items = cart.items.map(item => ({
                    "tags": [],
                    "type": item.product_type,
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "sku": item.sku,
                    "compare_at_price": parseFloat(
                        (item.original_price / 100).toFixed(3)
                    ),
                    "compare_at_price_total": parseFloat(
                        (item.original_price * item.quantity / 100).toFixed(3)
                    ),
                    "name": item.product_title,
                    "description": item.variant_title || 'description',
                    "quantity": item.quantity,
                    "unit_price": parseFloat(
                        (item.final_price / 100).toFixed(3)
                    ),
                    "unit_price_total": parseFloat(
                        (item.final_line_price / 100).toFixed(3)
                    ),
                    "image_url": item.image,
                    "vendor": headless.vendor,
                    "shop": headless.store,
                    "discounts_total": parseFloat(
                        (item.total_discount / 100).toFixed(3)
                    ) || 0,
                    "discount_label": 'BUNDLE APPLIED',
                    "subscription": item.properties?.payload ?
                        (item.variant_id == item.properties.variantId ?
                            item.properties.payload.subscription
                            : null)
                        : null
                }));


                const totals = {
                    products: parseFloat(
                        (cart.total_price / 100).toFixed(3)
                    ),
                    discount: parseFloat(
                        (cart.total_discount / 100).toFixed(3)
                    ) || 0,
                    total: parseFloat(
                        (cart.total_price / 100).toFixed(3)
                    ),
                    shipping: 0,
                    taxes: 0
                };

                return { items, totals }
            }
            ,
            big_commerce: (cart) => cart
        },
    },
    checkout: {
        redirect: async (cartId) => {
            const hc_url = TrafiCheckout.config.checkout_url.replace("{domain}", TrafiCheckout.config.domain).replace("{cart_id}", cartId);
            console.log('HC URL is:', hc_url);
            window.location.assign(hc_url);
        },
        buyNow: async (item) => {
            const cart = await TrafiCheckout.cart.create(TrafiCheckout.cart.buildFromItems([item]))
            TrafiCheckout.checkout.redirect(cart.token)
        },
        start: async (cart) => {
            const updatedCart = await TrafiCheckout._.updateCart(cart)
            TrafiCheckout.checkout.redirect(updatedCart.token)
        },
    }

}
