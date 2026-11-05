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
            wishPanel.hidden = true;
            cartPanel.hidden = !cartPanel.hidden;
            return;
        }

        if (event.target.closest("#wishLink")) {
            event.preventDefault();
            cartPanel.hidden = true;
            wishPanel.hidden = !wishPanel.hidden;
            return;
        }

        if (!event.target.closest(".bag-panel")) {
            closePanels();
        }
    });

    render();
})();
