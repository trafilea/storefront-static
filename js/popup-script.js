let defaultPopupConfig = {
  name: "TrafiPopup",
  triggered_by: ".openPopup",
  accent_color: "#457a41",
  title: "CONGRATULATIONS!",
  subtitle: "You <b>Unlocked</b> A <b>FREE GIFT!</b>",
  label: "⏰ <b>Hurry up!</b> Offer ends today!",
  image:
    "https://cdn.shopify.com/s/files/1/0912/0596/files/konjac_1_607a6a43-e9d7-4087-aded-14fe74842e33.jpg?v=1692224035",
  price: "FREE",
  compare_at_price: "$9.95",
  buttons: {
    accept: {
      text: "YES, I want it!",
      class: "",
      onClick: () => {},
    },
    decline: {
      text: "NO, thanks",
      class: "",
      onClick: () => {},
    },
  },
};

const TrafiPopup = (overrideConfig = defaultPopupConfig) => {
  const config = { ...(defaultPopupConfig ?? {}), ...overrideConfig };
  const forEachElement = (trigger, callback) => {
    const array = document.querySelectorAll(trigger);

    if (array?.length) {
      Array.prototype.forEach.call(array, (element) => {
        callback(element);
      });
    }
  };

  const open = () => {
    const popup = document.createElement("div");
    popup.id = config.name;
    popup.innerHTML = `
                            <style>
                            .loading-overlay {
                              overflow: auto;
                              position: fixed;
                              top: 0;
                              bottom: 0;
                              left: 0;
                              right: 0;
                              background: rgba(0, 0, 0, 0.7);
                              transition: opacity 500ms;
                              opacity: 1;
                              z-index: 111;
                              width: 100%;
                            }

                            .popup {
                              margin: auto;
                              margin-top: 10%;
                              padding: 20px;
                              background: #fff;
                              border-radius: 5px;
                              width: 100%;
                              max-width: 350px;
                              position: relative;
                              text-align: center;
                            }

                            .popup .popup_content {
                              max-height: 30%;
                              overflow: unset;
                            }

                            .pp_buttons {
                              width: 100%;
                              display: flex;
                              flex-direction: column;
                              gap: 16px;
                            }

                            .pp_buttons button {
                              cursor: pointer;
                              height: 50px;
                              padding: 0px 10px;
                              justify-content: center;
                              align-items: center;
                              gap: 15px;
                              flex-shrink: 0;
                              border-radius: 10px;
                              color: #000000;
                              text-align: center;
                              font-family: Poppins, Jost, Montserrat;
                              font-size: 16px;
                              font-style: normal;
                              font-weight: 700;
                              line-height: 22px;
                            }

                            .pp_accept {
                              background: #FFC700;
                              border: 1px solid #FFC700;
                            }

                            .pp_accept:hover {
                              background: #E4B100;
                            }

                            .pp_decline {
                              border-width: 1px;
                              background: white;
                              border: 1px solid #FFC700;
                            }

                            .pp_decline:hover {
                              border: 1px solid #000000;
                            }

                            .pp_title {
                              text-transform: uppercase;
                              color: ${config.accent_color};
                              font-family: Poppins, Jost, Montserrat;
                              font-size: 20px;
                              font-style: normal;
                              font-weight: 700;
                              line-height: normal;
                            }

                            .pp_subtitle {
                              margin-bottom: 10px;
                              color: #000;
                              text-align: center;
                              font-family: Poppins, Jost, Montserrat;
                              font-size: 17px;
                              font-style: normal;
                              font-weight: 400;
                              line-height: 25px;
                            }

                            .pp_label {
                              text-align: center;
                              font-size: 14px;
                              line-height: 22px;
                              font-weight: 400;
                              margin-bottom: 0px;
                              color: ${config.accent_color};
                            }

                            .pp_image {
                              margin-bottom: 10px;
                              border: 2px solid ${config.accent_color};
                              border-radius: 20px;
                              width: 80%;
                              height: auto;
                            }

                            .css-141nkgt {
                              position: relative;
                              top: 16px;
                              margin-bottom: -80px;
                              float: right;
                            }

                            .css-nnhxy {
                              background-color:  ${config.accent_color};
                              width: 80px;
                              height: 80px;
                              border-radius: 50%;
                              display: flex;
                              flex-direction: column;
                              -webkit-box-align: center;
                              align-items: center;
                              -webkit-box-pack: center;
                              justify-content: center;
                            }
                            .css-vgmnak {
                              font-size: 14px;
                              line-height: 18px;
                              color: white;
                              text-decoration: line-through;
                            }
                            .css-101f6se {
                              font-size: 14px;
                              line-height: 18px;
                              color: white;
                              font-weight: bold;
                            }
                            </style>
                            <div class="loading-overlay">
                              <div class="popup">
                                <div class="popup_content">
                                    <h2 class="pp_title">${config.title}</h2>
                                    <h3 class="pp_subtitle">${config.subtitle}</h2>
                                    <div class="css-141nkgt"><div class="css-nnhxy"><div class="css-vgmnak">${config.compare_at_price}</div><div class="css-101f6se">${config.price}</div></div></div>
                                    <img class="pp_image" src="${config.image}" alt="Popup Image" />
                                    <div class="pp_buttons">
                                      <h6 class="pp_label">${config.label}</h6>
                                      <button class="pp_accept ${config.buttons.accept.class}">${config.buttons.accept.text}</button>
                                      <button class="pp_decline ${config.buttons.decline.class}">${config.buttons.decline.text}</button>
                                    </div>
                                </div>
                              </div>
                            </div>`;

    document.body.appendChild(popup);

    window.addEventListener(
      "pageshow",
      function () {
        popup.remove();
      },
      false
    );

    return popup;
  };

  const openPopup = () => {
    const popup = open();

    if (config.buttons.accept.onClick) {
      popup.querySelector(".pp_accept").addEventListener("click", () => {
        config.buttons.accept.onClick();
      });
    }

    if (config.buttons.decline.onClick) {
      popup.querySelector(".pp_decline").addEventListener("click", () => {
        config.buttons.decline.onClick();
      });
    }

    return popup;
  };

  forEachElement(config.triggered_by, (element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();

      return openPopup();
    });
  });

  return {
    close: () => {
      document.getElementById(config.name)?.remove();
    },
  };
};
