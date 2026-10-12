
const productCards = [
    ...document.querySelectorAll(".product-card")
].map(card => ({
    id: card.dataset.id,
    name: card.dataset.name,
    category: card.dataset.category,
    price: Number(card.dataset.price),
    image: card.querySelector("img").getAttribute("src"),
    imageAlt: card.querySelector("img").alt
}));

const productMap = new Map(productCards.map(product => [
    product.id,
    product
]));

const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryButtons = document.querySelectorAll(".category-btn");

const cartBtn = document.getElementById("cartBtn");
const cartCount = document.getElementById("cartCount");
const cartSection = document.getElementById("cartSection");
const catalog = document.getElementById("catalog");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartSummary = document.getElementById("cartSummary");
const emptyCart = document.getElementById("emptyCart");
const emptyProducts = document.getElementById("emptyProducts");
const resultCount = document.getElementById("resultCount");

const checkoutDialog = document.getElementById("checkoutDialog");
const successDialog = document.getElementById("successDialog");

let activeCategory = "all";
let cart = loadCart();

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem("albertCart") || "{}");

        if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
            return {};
        }

        const validCart = {};

        for (const [id, quantity] of Object.entries(saved)) {
            if (
                productMap.has(id) &&
                Number.isInteger(quantity) &&
                quantity > 0 &&
                quantity <= 99
            ) {
                validCart[id] = quantity;
            }
        }

        return validCart;
    } catch {
        return {};
    }
}

function saveCart() {
    try {
        localStorage.setItem("albertCart", JSON.stringify(cart));
    } catch {
        alert("Your browser could not save the cart. You can still use it during this visit.");
    }
}

function formatPrice(price) {
    return price.toLocaleString("fr-FR") + " so'm";
}

function getCartQuantity() {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function getCartTotal() {
    return Object.entries(cart).reduce((total, [id, quantity]) => {
        const product = productMap.get(id);
        return total + (product ? product.price * quantity : 0);
    }, 0);
}

function renderCartCount() {
    cartCount.textContent = getCartQuantity();
}

function filterProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    document.querySelectorAll(".product-card").forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const category = card.dataset.category;

        const matchesSearch =
            name.includes(searchTerm) ||
            category.includes(searchTerm);

        const matchesCategory =
            activeCategory === "all" ||
            category === activeCategory;

        const visible = matchesSearch && matchesCategory;

        card.hidden = !visible;

        if (visible) {
            visibleCount++;
        }
    });

    resultCount.textContent =
        `${visibleCount} product${visibleCount === 1 ? "" : "s"}`;

    emptyProducts.hidden = visibleCount !== 0;
}

function setCategory(category) {
    activeCategory = category;

    categoryButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === category
        );
    });

    filterProducts();
}

function addToCart(id) {
    if (!productMap.has(id)) return;

    if ((cart[id] || 0) >= 99) {
        alert("You can add up to 99 of this product.");
        return;
    }

    cart[id] = (cart[id] || 0) + 1;

    saveCart();
    renderCartCount();

    const button = document.querySelector(`[data-add="${id}"]`);

    if (button) {
        const originalText = "+ Add to cart";
        button.textContent = "✓ Added to cart";

        setTimeout(() => {
            if (button.isConnected) {
                button.textContent = originalText;
            }
        }, 1000);
    }
}

function changeQuantity(id, amount) {
    if (!productMap.has(id) || !cart[id]) return;

    const newQuantity = cart[id] + amount;

    if (newQuantity <= 0) {
        delete cart[id];
    } else if (newQuantity <= 99) {
        cart[id] = newQuantity;
    }

    saveCart();
    renderCartCount();
    renderCart();
}

function removeFromCart(id) {
    delete cart[id];

    saveCart();
    renderCartCount();
    renderCart();
}

function renderCart() {
    cartItems.replaceChildren();

    const entries = Object.entries(cart).filter(([id, quantity]) =>
        productMap.has(id) && quantity > 0
    );

    emptyCart.hidden = entries.length !== 0;
    cartSummary.hidden = entries.length === 0;

    entries.forEach(([id, quantity]) => {
        const product = productMap.get(id);

        const item = document.createElement("article");
        item.className = "cart-item";

        const image = document.createElement("img");
        image.src = product.image;
        image.alt = product.imageAlt;

        const details = document.createElement("div");
        details.className = "cart-item-details";

        const name = document.createElement("h3");
        name.textContent = product.name;

        const unitPrice = document.createElement("p");
        unitPrice.textContent = formatPrice(product.price) + " each";

        const subtotal = document.createElement("p");
        subtotal.textContent = "Subtotal: " +
            formatPrice(product.price * quantity);

        const controls = document.createElement("div");
        controls.className = "quantity-controls";

        const decrease = document.createElement("button");
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `Remove one ${product.name}`);
        decrease.addEventListener("click", () => changeQuantity(id, -1));

        const quantityLabel = document.createElement("span");
        quantityLabel.textContent = quantity;

        const increase = document.createElement("button");
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `Add one ${product.name}`);
        increase.disabled = quantity >= 99;
        increase.addEventListener("click", () => changeQuantity(id, 1));

        controls.append(decrease, quantityLabel, increase);
        details.append(name, unitPrice, subtotal, controls);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-button";
        remove.textContent = "Remove";
        remove.addEventListener("click", () => removeFromCart(id));

        item.append(image, details, remove);
        cartItems.append(item);
    });

    cartTotal.textContent = formatPrice(getCartTotal());
}

function showCart() {
    catalog.hidden = true;
    cartSection.hidden = false;

    renderCart();

    cartSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function showCatalog() {
    cartSection.hidden = true;
    catalog.hidden = false;

    catalog.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function startCheckout() {
    if (getCartQuantity() === 0) {
        alert("Your cart is empty. Add a product first!");
        return;
    }

    document.getElementById("checkoutDetails").textContent =
        `${getCartQuantity()} item(s) — total ${formatPrice(getCartTotal())}.`;

    checkoutDialog.showModal();
}

function confirmOrder() {
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!name || !phone) {
        alert("Please enter your name and phone number.");
        return;
    }

    if (!phoneInput.checkValidity()) {
        alert("Please enter a valid phone number.");
        return;
    }

    const orderNumber = "ALB-" + Date.now().toString().slice(-8);
    const total = formatPrice(getCartTotal());

    // This is a demonstration checkout, not a real payment.
    cart = {};
    saveCart();
    renderCartCount();
    renderCart();

    checkoutDialog.close();

    document.getElementById("successMessage").textContent =
        `Thank you, ${name}! Your demo order ${orderNumber} ` +
        `has been recorded. Total: ${total}. No payment was taken.`;

    successDialog.showModal();

    nameInput.value = "";
    phoneInput.value = "";
}

categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        setCategory(button.dataset.category);
        showCatalog();
    });
});

searchInput.addEventListener("input", filterProducts);

searchBtn.addEventListener("click", () => {
    filterProducts();
    showCatalog();
});

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        filterProducts();
        showCatalog();
    }
});

productsContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");

    if (button) {
        addToCart(button.dataset.add);
    }
});

cartBtn.addEventListener("click", showCart);

document.getElementById("continueShoppingBtn")
    .addEventListener("click", showCatalog);

document.getElementById("shopNowBtn")
    .addEventListener("click", showCatalog);

document.getElementById("homeLink")
    .addEventListener("click", event => {
        event.preventDefault();

        searchInput.value = "";
        setCategory("all");
        showCatalog();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

document.getElementById("checkoutBtn")
    .addEventListener("click", startCheckout);

document.getElementById("confirmOrderBtn")
    .addEventListener("click", confirmOrder);

document.getElementById("closeDialogBtn")
    .addEventListener("click", () => checkoutDialog.close());

document.getElementById("finishBtn")
    .addEventListener("click", () => {
        successDialog.close();
        showCatalog();
    });

renderCartCount();
renderCart();
filterProducts();
