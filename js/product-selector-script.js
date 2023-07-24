const ProductSelector = {
    config: {
        triggered_by: "",
        image_selector: "",
        products: {
            slugs: [],
            extras: [],
            triggers: [],
            elementsToMark: []
        },
    },
    state: {
        products: [],
        product_selected: undefined
    },
    _: {
        trackAddToCart: function (productObj, quantity) {
            window.dataLayer = window.dataLayer || [];

            window.dataLayer.push({
                event: "enhanceEcom addToCart",
                ecommerce: {
                    currencyCode: "USD",
                    add: {
                        products: [
                            {
                                name: productObj.title,
                                id: String(productObj.id),
                                price: formatMoneyWithoutCurrency(productObj.price),
                                brand: productObj.vendor,
                                category: productObj.type,
                                variant: productObj.variants[0].id,
                                sku: productObj.variants[0].sku,
                                quantity
                            }
                        ]
                    }
                }
            });
        },
        fetchProducts: async () => {
            const products = await TrafiProducts.bySlug.getProducts(ProductSelector.config.products.slugs)

            ProductSelector.state.products = products

            console.log("ProductSelector: Successfully fetched Products");
        },
        onSelect: (trigger) => {
            const index = ProductSelector.config.products.triggers.indexOf(trigger)
            const product = ProductSelector.state.products[index]

            if (!product) {
                throw new Error("ProductSelector: error selecting product, it doenst exist on product list")
            }

            ProductSelector.state.product_selected = {
                product,
                variant: product.product_variations,
                ...ProductSelector.config.products.extras[index],
            }

            if (ProductSelector.config.image_selector) {
                const newImage = ProductSelector.state.product_selected.variant.images[0].src
                document.getElementsByClassName(ProductSelector.config.image_selector)[0].src = newImage
            }

            const elementToMark = ProductSelector.config.products.elementsToMark[index]

            if (elementToMark) {
                ProductSelector.config.products.elementsToMark?.forEach((element) => {
                    document.getElementsByClassName(element)[0].className.replace("selected", "")
                })
                document.getElementsByClassName(elementToMark)[0].className = + " selected"
            }

            console.log("ProductSelector: Successfully selected product:", ProductSelector.state.product_selected)
        },
        checkout: async () => {
            ProductSelector._.trackAddToCart(ProductSelector.state.product_selected)
            await TrafiCheckout.cart.buyNow(ProductSelector.state.product_selected)

        },
        setupTriggers: () => {
            ProductSelector.config.products.triggers.forEach((trigger) => {
                document.getElementsByClassName(trigger)[0]?.addEventListener("click", () => {
                    ProductSelector._.onSelect(trigger)
                })
            })

            if (ProductSelector.config.triggered_by) {
                document.getElementsByClassName(ProductSelector.config.triggered_by)[0]?.addEventListener("click", () => {
                    ProductSelector._.checkout()
                })
            }
            console.log("ProductSelector: Successfully setup triggers")
        }
    },
    init: async ({ base, ...configOverride }) => {
        if (!base) throw new Error("ProductSelector: base is required")

        if (!TrafiCheckout || !TrafiProducts) throw new Error("ProductSelector: TrafiCheckout & and TrafiProducts dependencies are required")

        TrafiCheckout.init(base)
        TrafiProducts.init(base)

        ProductSelector.config = { ...ProductSelector.config, ...configOverride }
        
        await ProductSelector._.fetchProducts()
        
        ProductSelector._.setupTriggers()

        console.log("ProductSelector: Successfully set config")
    },
    checkout: () => ProductSelector._.checkout(),
}