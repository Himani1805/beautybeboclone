(function () {
    var cart = load("beauty-cart");
    var wishes = load("beauty-wish");
    var toastTimer;

    var cartLink = document.getElementById("cartLink");
    var wishLink = document.getElementById("wishLink");
    var cartPanel = document.getElementById("cartPanel");
    var wishPanel = document.getElementById("wishPanel");
    var cartCount = document.getElementById("cartCount");
    var wishCount = document.getElementById("wishCount");
    var toast = document.getElementById("toast");
    var searchForm = document.getElementById("searchForm");
    var searchInput = document.getElementById("searchInput");
    var searchEmpty = document.getElementById("searchEmpty");
    var signLink = document.getElementById("signLink");
    var signedIn = sessionStorage.getItem("beauty-user") === "1";

    function load(key) {
        try {
            var saved = JSON.parse(sessionStorage.getItem(key));
            return Array.isArray(saved) ? saved : [];
        } catch (err) {
            return [];
        }
    }

    function save() {
        sessionStorage.setItem("beauty-cart", JSON.stringify(cart));
        sessionStorage.setItem("beauty-wish", JSON.stringify(wishes));
    }

    function productFrom(button) {
        var card = button.closest(".dealCard, .itemCard");
        var name = card.querySelector("p").textContent.trim();
        var price = "Price";
        card.querySelectorAll("p").forEach(function (p) {
            var text = p.textContent.trim();
            if (/^Rs\.?\s*[\d,]/.test(text) || text === "Price") {
                price = text;
            }
        });
        var img = card.querySelector("img");
        return {
            name: name,
            price: price,
            img: img ? img.getAttribute("src") : ""
        };
    }

    function rupees(text) {
        var cleaned = String(text).replace(/Rs\.?\s*/i, "").replace(/,/g, "");
        var match = cleaned.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    function money(amount) {
        return "Rs. " + amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function showToast(message) {
        toast.textContent = message;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.hidden = true;
        }, 1400);
    }

    function closePanels() {
        cartPanel.hidden = true;
        wishPanel.hidden = true;
    }

    function categoryOf(name) {
        var text = name.toLowerCase();
        if (/lehenga|saree|salwar|choli|dupatta|bath brush|body wash|bodywash|beard|perfume|roll on|baby|chicco/.test(text)) {
            return "other";
        }
        if (/shampoo|hair|dandruff|dryer|styler/.test(text)) {
            return "hair";
        }
        if (/lip|foundation|brush|eyeliner|kohl|blender|sponge|mascara|kajal/.test(text)) {
            return "makeup";
        }
        if (/scrub|face wash|serum|retinol|moistur|lotion|cream|pimple|face/.test(text)) {
            return "skin";
        }
        return "other";
    }

    function selectedCategory() {
        if (document.getElementById("c-makeup").checked) {
            return "makeup";
        }
        if (document.getElementById("c-skin").checked) {
            return "skin";
        }
        if (document.getElementById("c-hair").checked) {
            return "hair";
        }
        return "all";
    }

    function matchesQuery(name, query) {
        if (!query) {
            return true;
        }
        return query.split(/\s+/).every(function (word) {
            var keys = [word];
            if (word === "lipstick" || word === "lipsticks") {
                keys.push("lip");
            }
            if (word === "serum" || word === "serums") {
                keys.push("retinol", "vitamin");
            }
            if (word === "saree" || word === "sarees") {
                keys.push("saree");
            }
            return keys.some(function (key) {
                return name.indexOf(key) !== -1;
            });
        });
    }

    function applyFilter() {
        var query = searchInput.value.trim().toLowerCase();
        var category = selectedCategory();
        var shown = 0;

        document.querySelectorAll(".dealCard, .itemCard").forEach(function (card) {
            var name = card.querySelector("p").textContent.toLowerCase();
            var matchesText = matchesQuery(name, query);
            var matchesCat = category === "all" || categoryOf(name) === category;
            var visible = matchesText && matchesCat;
            card.classList.toggle("is-hidden", !visible);
            if (visible) {
                shown += 1;
            }
        });

        document.querySelectorAll(".wrapping, #sortedItems > div").forEach(function (box) {
            var any = box.querySelector(".dealCard:not(.is-hidden), .itemCard:not(.is-hidden)");
            box.classList.toggle("is-hidden", !any);
        });

        var filtering = Boolean(query) || category !== "all";
        document.querySelectorAll(".promo, .store-note").forEach(function (block) {
            block.classList.toggle("is-hidden", filtering);
        });
        searchEmpty.hidden = shown !== 0;
    }

    function renderSign() {
        signLink.textContent = signedIn ? "Sign out" : "Sign in";
    }

    function rowHtml(item, qty) {
        var extra = qty ? " × " + qty : "";
        return (
            '<li class="bag-row">' +
            '<img src="' + item.img + '" alt="">' +
            "<div><strong>" + item.name + "</strong><span>" + item.price + extra + "</span></div>" +
            '<button type="button" data-name="' + item.name.replace(/"/g, "&quot;") + '">Remove</button>' +
            "</li>"
        );
    }

    function render() {
        var pieces = cart.reduce(function (sum, item) {
            return sum + item.qty;
        }, 0);
        cartCount.textContent = pieces;
        wishCount.textContent = wishes.length;

        if (!cart.length) {
            cartPanel.innerHTML = "<p>Your cart is empty.</p>";
        } else {
            var total = cart.reduce(function (sum, item) {
                return sum + rupees(item.price) * item.qty;
            }, 0);
            cartPanel.innerHTML =
                "<ul>" + cart.map(function (item) {
                    return rowHtml(item, item.qty);
                }).join("") + "</ul>" +
                '<p class="bag-total">Total ' + money(total) + "</p>";
        }

        if (!wishes.length) {
            wishPanel.innerHTML = "<p>No items in your wishlist.</p>";
        } else {
            wishPanel.innerHTML = "<ul>" + wishes.map(function (item) {
                return rowHtml(item, 0);
            }).join("") + "</ul>";
        }

        document.querySelectorAll(".wishList").forEach(function (button) {
            var name = productFrom(button).name;
            var saved = wishes.some(function (item) {
                return item.name === name;
            });
            button.classList.toggle("is-wished", saved);
            button.textContent = saved ? "Wished" : "Wish";
        });
    }

    document.addEventListener("click", function (event) {
        var add = event.target.closest(".addToCart");
        var wish = event.target.closest(".wishList");
        var remove = event.target.closest(".bag-row button");

        if (add) {
            var product = productFrom(add);
            var existing = cart.find(function (item) {
                return item.name === product.name;
            });
            if (existing) {
                existing.qty += 1;
            } else {
                product.qty = 1;
                cart.push(product);
            }
            save();
            render();
            showToast("Added to cart");
            return;
        }

        if (wish) {
            var item = productFrom(wish);
            var index = wishes.findIndex(function (saved) {
                return saved.name === item.name;
            });
            if (index >= 0) {
                wishes.splice(index, 1);
                showToast("Removed from wishlist");
            } else {
                wishes.push(item);
                showToast("Saved to wishlist");
            }
            save();
            render();
            return;
        }

        if (remove) {
            var title = remove.getAttribute("data-name");
            var inCart = remove.closest("#cartPanel");
            if (inCart) {
                cart = cart.filter(function (item) {
                    return item.name !== title;
                });
            } else {
                wishes = wishes.filter(function (item) {
                    return item.name !== title;
                });
            }
            save();
            render();
            return;
        }

        if (event.target.closest("#cartLink")) {
            event.preventDefault();
            var showCart = cartPanel.hidden;
            closePanels();
            cartPanel.hidden = !showCart;
            return;
        }

        if (event.target.closest("#wishLink")) {
            event.preventDefault();
            var showWish = wishPanel.hidden;
            closePanels();
            wishPanel.hidden = !showWish;
            return;
        }

        if (event.target.closest("#signLink")) {
            event.preventDefault();
            signedIn = !signedIn;
            if (signedIn) {
                sessionStorage.setItem("beauty-user", "1");
                showToast("Signed in");
            } else {
                sessionStorage.removeItem("beauty-user");
                showToast("Signed out");
            }
            renderSign();
            return;
        }

        if (!event.target.closest(".bag-panel")) {
            closePanels();
        }
    });

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilter();
        document.getElementById("main").scrollIntoView({ behavior: "smooth" });
    });

    searchInput.addEventListener("input", applyFilter);
    document.querySelectorAll(".cat-drop input").forEach(function (input) {
        input.addEventListener("change", applyFilter);
    });

    renderSign();
    render();
})();
