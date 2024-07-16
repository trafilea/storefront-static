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
    vendor: "shopify",
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
    checkout_url: "https://checkout.{domain}/hc/checkout/{cart_id}",
    /**
     * Cart public endpoint
     * @type String
     */
    cart_url: "https://api.{vendor}.{environment}.trafilea.io/cart",
  },
  _: {
    formatValue: (number) => Number(number.toFixed(2)),
    generatePayload: (cart) => {
      const data = {
        token: cart.token,
        currency: cart.currency,
        currency_ratio: 1,
        email: "script@trafilea.com",
        items: cart.items,
        totals: cart.totals,
      };

      const context = {};

      const config = TrafiCheckout.config;

      const payload = {
        vendor: config.vendor,
        shop: config.store,
        token: cart.token,
        data,
        context,
      };

      return payload;
    },
    calculateTotals: (items) =>
      items.reduce(
        (totals, item) => ({
          products: totals.products + item.unit_price_total,
          discount: totals.discount + item.discounts_total,
          total: totals.total + item.unit_price_total - item.discounts_total,
          shipping: 0,
          taxes: 0,
        }),
        {
          products: 0,
          discount: 0,
          total: 0,
          shipping: 0,
          taxes: 0,
        }
      ),
    updateCart: async (cart) => {
      const url = TrafiCheckout.config.cart_url
        .replace("{vendor}", TrafiCheckout.config.vendor)
        .replace("{environment}", TrafiCheckout.config.environment);

      console.log("Endpoint is:", url, "HC Cart is:", cart);

      const payload = TrafiCheckout._.generatePayload(cart);

      const controller = new AbortController();

      setTimeout(() => controller.abort("Timeout"), 5500);

      try {
        const cartResponse = await fetch(url, {
          signal: controller.signal,
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (cartResponse.status !== 200) throw new Error(cartResponse);

        return cartResponse.json();
      } catch (error) {
        if (controller.signal.aborted) {
          console.warn("Retrying HC Create/Update Cart after 5500ms timeout");

          const retryController = new AbortController();

          setTimeout(() => retryController.abort("Retry Timeout"), 6000);

          const cartResponse = await fetch(url, {
            signal: retryController.signal,
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (cartResponse.status !== 200) throw new Error(cartResponse);

          return cartResponse.json();
        }

        if (error.status >= 500) {
          //TODO retry
          console.error("Error Hitting HC Create/Update: Gateway error");
        }

        console.error(
          "Error Hitting HC Create/Update Cart:",
          JSON.stringify(error)
        );

        throw error;
      }
    },
  },
  init: (configOverride) => {
    TrafiCheckout.config = { ...TrafiCheckout.config, ...configOverride };
    console.log("HC Init with [STORE]:" + TrafiCheckout.config.store);
  },
  cart: {
    createItem: ({ product, variant, quantity = 1, ...rest }) => ({
      tags: product.tags,
      type: product.type ?? "product",
      product_uuid: product.id,
      product_id: product.vendor_product.product_id,
      variant_uuid: variant.id,
      variant_id: product.vendor_product.variations_id[variant.id],
      sku: variant.sku,
      compare_at_price: variant.compare_at_price,
      compare_at_price_total: TrafiCheckout._.formatValue(
        variant.compare_at_price * quantity
      ),
      name: product.title,
      description: variant.title,
      quantity: quantity,
      unit_price: variant.price,
      unit_price_total: TrafiCheckout._.formatValue(variant.price * quantity),
      image_url: variant.images[0]?.src ?? product.images[0]?.src,
      vendor: product.vendor_product.vendor_id,
      shop: product.vendor_product.store_id,
      discounts_total: rest.discount,
      discount_label: rest.discount_label,
      subscription: rest.subscription,
      try_before_you_buy: product.try_before_you_buy,
    }),
    buildFromItems: (itemsToTransform) => {
      const items = itemsToTransform.map((item) =>
        TrafiCheckout.cart.createItem(item)
      );
      const totals = TrafiCheckout._.calculateTotals(items);
      return { currency: TrafiCheckout.config.currency, items, totals };
    },
    create: (cart) => TrafiCheckout._.updateCart(cart),
    update: (cart) => TrafiCheckout._.updateCart(cart),
  },
  checkout: {
    redirect: async (cartId, baseCart) => {
      const hc_url = TrafiCheckout.config.checkout_url
        .replace("{domain}", TrafiCheckout.config.domain)
        .replace("{cart_id}", cartId);
      console.log("HC URL is:", hc_url);

      const isTBYB =
        baseCart &&
        baseCart.items &&
        baseCart.items.find((item) => item.try_before_you_buy);

      if (isTBYB) {
        document.cookie = `tbyb=true; domain=.${
          TrafiCheckout.config.domain
        }; path=${new URL(hc_url).pathname}`;
      }

      window.location.assign(hc_url);
    },
    buyNow: async (item) => {
      const baseCart = TrafiCheckout.cart.buildFromItems(
        Array.isArray(item) ? item : [item]
      );

      const cart = await TrafiCheckout.cart.create(baseCart);

      TrafiCheckout.checkout.redirect(cart.token, baseCart);
    },
    start: async (cart) => {
      const updatedCart = await TrafiCheckout._.updateCart(cart);
      TrafiCheckout.checkout.redirect(updatedCart.token, updatedCart);
    },
  },
};
