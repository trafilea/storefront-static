const ProductSelector = {
    config: {
        triggered_by: "",
        image_selector: "",
        default_selected: 0,
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
        setLoading: () => {
            const loading = document.createElement("div")
            loading.innerHTML = `
                                <style>
                                .loader,
                                .loader:before,
                                .loader:after {
                                border-radius: 50%;
                                width: 2.5em;
                                height: 2.5em;
                                -webkit-animation-fill-mode: both;
                                animation-fill-mode: both;
                                -webkit-animation: load7 1.8s infinite ease-in-out;
                                animation: load7 1.8s infinite ease-in-out;
                                }
                                .loader {
                                color: #000000;
                                font-size: 10px;
                                margin: 10px auto 50px;
                                position: relative;
                                text-indent: -9999em;
                                -webkit-transform: translateZ(0);
                                -ms-transform: translateZ(0);
                                transform: translateZ(0);
                                -webkit-animation-delay: -0.16s;
                                animation-delay: -0.16s;
                                }
                                .loader:before,
                                .loader:after {
                                content: '';
                                position: absolute;
                                top: 0;
                                }
                                .loader:before {
                                left: -3.5em;
                                -webkit-animation-delay: -0.32s;
                                animation-delay: -0.32s;
                                }
                                .loader:after {
                                left: 3.5em;
                                }
                                @-webkit-keyframes load7 {
                                0%,
                                80%,
                                100% {
                                box-shadow: 0 2.5em 0 -1.3em;
                                }
                                40% {
                                box-shadow: 0 2.5em 0 0;
                                }
                                }
                                @keyframes load7 {
                                0%,
                                80%,
                                100% {
                                box-shadow: 0 2.5em 0 -1.3em;
                                }
                                40% {
                                box-shadow: 0 2.5em 0 0;
                                }
                                }

                                .loading-overlay {
                                position: fixed;
                                top: 0;
                                bottom: 0;
                                left: 0;
                                right: 0;
                                background: rgba(0, 0, 0, 0.7);
                                transition: opacity 500ms;
                                opacity: 1;
                                z-index: 111;
                                }
                                .popup {
                                margin: 20% auto;
                                padding: 40px;
                                background: #fff;
                                border-radius: 5px;
                                width: 30%;
                                min-width: 300px;
                                position: relative;
                                transition: all 5s ease-in-out;
                                text-align: center;
                                }

                                .popup h2 {
                                margin-top: 0;
                                color: #333;
                                font-family: Tahoma, Arial, sans-serif;
                                }

                                .popup .content {
                                max-height: 30%;
                                overflow: auto;
                                }
                                </style>
                                <div class="loading-overlay">
                                <div class="popup">
                                <div class="loader"></div>
                                <div class="content">
                                    Checking availability...		
                                </div>
                                </div>
                                </div>`

            document.body.appendChild(loading)
        },
        trackAddToCart: ({ product, variant, quantity }) => {
            window.dataLayer = window.dataLayer || [];

            window.dataLayer.push({
                event: "enhanceEcom addToCart",
                ecommerce: {
                    currencyCode: "USD",
                    add: {
                        products: [
                            {
                                name: product.title,
                                id: String(product.id),
                                price: product.price,
                                brand: product.vendor,
                                category: product.type,
                                variant: variant.id,
                                sku: variant.sku,
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
                //TODO: make this configurable
                variant: product.variations_definition.product_variations[0],
                quantity: 1,
                ...ProductSelector.config.products.extras[index],
            }

            if (ProductSelector.config.image_selector) {
                const newImage = ProductSelector.state.product_selected.variant.images[0].src
                document.getElementsByClassName(ProductSelector.config.image_selector)[0].src = newImage
            }

            const elementClassToMark = ProductSelector.config.products.elementsToMark[index]
            const elementToMark = document.getElementsByClassName(elementClassToMark)[0]

            if (elementToMark) {
                ProductSelector.config.products.elementsToMark?.forEach((element) => {
                    document.getElementsByClassName(element)[0]?.classList.remove("selected")
                })
                elementToMark.classList.add("selected")
            }

            console.log("ProductSelector: Successfully selected product:", ProductSelector.state.product_selected)
        },
        checkout: async () => {
            if (!ProductSelector.state.product_selected) throw new Error("ProductSelector: No product selected")

            ProductSelector._.setLoading()

            ProductSelector._.trackAddToCart(ProductSelector.state.product_selected)

            await TrafiCheckout.checkout.buyNow(ProductSelector.state.product_selected)

        },
        setupTriggers: () => {

            ProductSelector.config.products.triggers.forEach((trigger) => {
                document.getElementsByClassName(trigger)[0]?.removeEventListener("click", () => { })
                document.getElementsByClassName(trigger)[0]?.addEventListener("click", () => {
                    ProductSelector._.onSelect(trigger)
                })
            })

            if (ProductSelector.config.triggered_by) {
                const triggeredBy = document.getElementsByClassName(ProductSelector.config.triggered_by)[0]
                triggeredBy?.removeEventListener("click", () => { })
                triggeredBy?.addEventListener("click", (event) => {
                    event.preventDefault()
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

        if (typeof ProductSelector.config.default_selected === "number") {
            ProductSelector._.onSelect(ProductSelector.config.products.triggers[ProductSelector.config.default_selected])
        }

        console.log("ProductSelector: Successfully set config")
    },
    checkout: () => ProductSelector._.checkout(),
}