const HeadlessCheckout = {
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

            const payload = {
                vendor: config.vendor,
                shop: config.store,
                token: cart.token,
                data: data,
                context: context
            };

            return payload;
        },

        updateCart: async (cart) => {
            console.log('Hitting Trafilea APIs --------')
            const url = headless.cart_url.replace("{vendor}", HeadlessCheckout.config.vendor).replace("{environment}", HeadlessCheckout.config.environment);
            console.log('Endpoint is:', url)
            console.log('HC Cart is', cart);

            const payload = HeadlessCheckout._.generatePayload(cart)


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
        HeadlessCheckout.config = { ...HeadlessCheckout.config, ...configOverride }
        console.log("HC Init with [STORE]:" + config.store)
    },
    start: async (cart) => {
        const updatedCart = await HeadlessCheckout._.updateCart(cart)
        const hc_url = config.checkout_url.replace("{domain}", HeadlessCheckout.config.domain).replace("{cart_id}", updatedCart.token);
        console.log('HC URL is:', hc_url);
        window.location.assign(hc_url);
        return updatedCart
    },
    transformers: {
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
    }
}
