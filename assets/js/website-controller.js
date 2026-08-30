// TS9 Designs Website Controller
const TS9_CART_STORAGE_KEY = "ts9_residential_cart"

class TS9WebsiteController {
  constructor() {
    this.cart = this.loadCart()
    this.currentPlan = null
    this.currentSlide = 0
    this.totalSlides = 3
    
    // Stripe payment links for each plan (base + MEP bundles)
    this.stripeLinks = {
      // Base plans
      1: "https://buy.stripe.com/28EfZh6lq8zZdc8eJ20kE03", // Plan #1 - $499
      2: "https://buy.stripe.com/6oU28r25adUj6NK9oI0kE01", // Plan #2 - $499
      3: "https://buy.stripe.com/14A3cv7pu3fF5JG6cw0kE02", // Plan #3 - $299
      
      // MEP bundle plans
      "1-mep": "https://buy.stripe.com/3cI4gzaBGbMb5JG44o0kE04", // Plan #1 + MEP - $849
      "2-mep": "https://buy.stripe.com/7sY7sLbFKdUj6NKfN60kE05", // Plan #2 + MEP - $849
      "3-mep": "https://buy.stripe.com/fZu14neRW8zZ5JGbwQ0kE06", // Plan #3 + MEP - $649
    }
    
    // Plan data
    this.planData = {
      1: {
        title: "4-Bedroom Residential Home Plan – 2,462 Sq Ft",
        basePrice: 499,
        description:
          "Modern, functional 2,462 sq ft home with permit-ready construction drawings—delivered at a fraction of custom design costs.",
        images: [
          "assets/images/676/676-1.webp",
          "assets/images/676/676-2.webp",
          "assets/images/676/676-3.webp",
        ],
        highlights: [
          "Total Living Area: 2,462 sq ft",
          "Bedrooms: 4",
          "Bathrooms: 3 (including master suite)",
          "Open Concept: Integrated kitchen, dining, and living area",
          "Roof Design: Sloped roof with scuppers",
        ],
        included: [
          "Residential floor plan",
          "Roof plan and elevations",
          "Foundation and structural framing plans",
          "Door and window schedules",
          "Construction detailing",
        ],
        perfectFor: [
          "Florida-based builders and homeowners",
          "Investors seeking fast permit approval",
          "Anyone who needs a high-quality, engineer-reviewed home plan",
        ],
      },
      2: {
        title: "Pre-Designed Residential Plan – 2,529 Sq Ft",
        basePrice: 499,
        description:
          "Ready-to-permit, 4-bedroom residential home plan with clean, functional layout designed for maximum efficiency and code compliance.",
        images: [
          "assets/images/wentworth/wentworth.webp",
          "assets/images/wentworth/wentworth-1.webp",
          "assets/images/wentworth/wentworth-2.webp",
        ],
        highlights: [
          "Total Living Area: 2,529 sq ft",
          "Bedrooms: 4",
          "Bathrooms: 3.5",
          "Open floor plan with great room concept",
          "Master suite with walk-in closet",
        ],
        included: [
          "Complete building-design drawings",
          "Structural engineering plans",
          "Foundation details",
          "Electrical layout",
          "Permit-ready documentation",
        ],
        perfectFor: ["Growing families", "Custom home builders", "Real estate developers"],
      },
      3: {
        title: "Pre-Designed Residential Plan – 1,694 Sq Ft",
        basePrice: 299,
        description:
          "Beautifully crafted residential plan with optimized living space, ideal for families or investors seeking a functional, stylish, and permit-ready home.",
        images: [
          "assets/images/2Bed/2-bed.webp",
          "assets/images/2Bed/2-bed1.webp",
          "assets/images/2Bed/2-bed2.webp",
        ],
        highlights: [
          "Total Living Area: 1,694 sq ft",
          "Bedrooms: 2",
          "Bathrooms: 2",
          "Efficient layout maximizes space",
          "Perfect for starter homes",
        ],
        included: [
          "Residential floor plan",
          "Elevation drawings",
          "Basic structural details",
          "Door and window schedules",
          "Construction notes",
        ],
        perfectFor: ["First-time homebuyers", "Small families", "Investment properties"],
      },
    }
    this.init()
  }
  init() {
    this.setupEventListeners()
    this.updateCartDisplay()
    this.setupMobileMenu()
  }
  loadCart() {
    try {
      const stored = localStorage.getItem(TS9_CART_STORAGE_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  saveCart() {
    try {
      localStorage.setItem(TS9_CART_STORAGE_KEY, JSON.stringify(this.cart))
    } catch (e) {}
  }
  setupEventListeners() {
    // Modal event listeners
    document.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const planId = e.target.getAttribute("data-plan")
        this.openModal(planId)
      })
    })
    // Clicking (or keyboard-activating) the plan image also opens the details modal
    document.querySelectorAll(".view-details-image").forEach((el) => {
      el.addEventListener("click", () => {
        this.openModal(el.getAttribute("data-plan"))
      })
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          this.openModal(el.getAttribute("data-plan"))
        }
      })
    })
    // Modal close listeners
    document.querySelector(".modal-close")?.addEventListener("click", () => {
      this.closeModal()
    })
    document.getElementById("details-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "details-modal") {
        this.closeModal()
      }
    })
    // Slideshow controls
    document.querySelector(".slideshow-prev")?.addEventListener("click", () => {
      this.previousSlide()
    })
    document.querySelector(".slideshow-next")?.addEventListener("click", () => {
      this.nextSlide()
    })
    // Slideshow dots
    document.querySelectorAll(".slideshow-dot").forEach((dot, index) => {
      dot.addEventListener("click", () => {
        this.goToSlide(index)
      })
    })
    // Quantity controls
    document.getElementById("quantity-decrease")?.addEventListener("click", () => {
      this.updateQuantity(-1)
    })
    document.getElementById("quantity-increase")?.addEventListener("click", () => {
      this.updateQuantity(1)
    })
    document.getElementById("quantity-input")?.addEventListener("change", (e) => {
      const value = Number.parseInt(e.target.value) || 1
      e.target.value = Math.max(1, value)
      this.updatePricing()
    })
    // Option selectors (these are commented out in your HTML, but the logic remains)
    document.querySelectorAll('select[id$="-options"]').forEach((select) => {
      select.addEventListener("change", () => {
        this.updatePricing()
      })
    })
    // MEP toggle
    document.getElementById("mep-toggle")?.addEventListener("click", (e) => {
      this.toggleMEP(e.target)
    })
    // Add to cart
    document.getElementById("add-to-cart-modal")?.addEventListener("click", () => {
      this.addToCart()
    })
    // Cart panel controls
    document.getElementById("cart-toggle")?.addEventListener("click", (e) => {
      e.preventDefault()
      this.toggleCartPanel()
    })
    document.getElementById("cart-panel-close")?.addEventListener("click", () => {
      this.closeCartPanel()
    })
    document.getElementById("cart-overlay")?.addEventListener("click", () => {
      this.closeCartPanel()
    })
    document.getElementById("continue-shopping")?.addEventListener("click", () => {
      this.closeCartPanel()
    })
    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      this.checkout()
    })
    // Cart notification close
    document.querySelector(".cart-notification-close")?.addEventListener("click", () => {
      this.hideCartNotification()
    })
    // Escape key to close modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal()
        this.closeCartPanel()
        this.hideCartNotification()
      }
    })
  }
  setupMobileMenu() {
    const toggleNew = document.getElementById("mobileNavToggle")
    const navNew = document.getElementById("topNav")
    if (toggleNew && navNew) {
      toggleNew.addEventListener("click", () => {
        const active = navNew.classList.toggle("active")
        toggleNew.classList.toggle("active", active)
        toggleNew.setAttribute("aria-expanded", active ? "true" : "false")
      })
      navNew.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          navNew.classList.remove("active")
          toggleNew.classList.remove("active")
          toggleNew.setAttribute("aria-expanded", "false")
        })
      })
      document.addEventListener("click", (e) => {
        if (!navNew.classList.contains("active")) return
        if (navNew.contains(e.target) || toggleNew.contains(e.target)) return
        navNew.classList.remove("active")
        toggleNew.classList.remove("active")
        toggleNew.setAttribute("aria-expanded", "false")
      })
      return
    }

    const toggle = document.querySelector(".mobile-menu-toggle")
    const nav = document.querySelector(".main-nav")
    const overlay = document.querySelector(".mobile-menu-overlay")
    const body = document.body
    toggle?.addEventListener("click", () => {
      const isActive = toggle.classList.contains("active")
      if (isActive) {
        // Close menu
        toggle.classList.remove("active")
        nav?.classList.remove("active")
        overlay?.classList.remove("active")
        body.classList.remove("mobile-menu-open")
      } else {
        // Open menu
        toggle.classList.add("active")
        nav?.classList.add("active")
        overlay?.classList.add("active")
        body.classList.add("mobile-menu-open")
      }
    })
    // Close menu when clicking overlay
    overlay?.addEventListener("click", () => {
      toggle?.classList.remove("active")
      nav?.classList.remove("active")
      overlay?.classList.remove("active")
      body.classList.remove("mobile-menu-open")
    })
    // Close menu when clicking nav links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        toggle?.classList.remove("active")
        nav?.classList.remove("active")
        overlay?.classList.remove("active")
        body.classList.remove("mobile-menu-open")
      })
    })
  }
  openModal(planId) {
    this.currentPlan = planId
    const plan = this.planData[planId]
    if (!plan) return
    const modalTitle = document.getElementById("modal-title")
    const modalDesc = document.getElementById("modal-description")
    const basePriceEl = document.getElementById("base-price")
    if (!modalTitle || !modalDesc || !basePriceEl) return
    // Update modal content
    modalTitle.textContent = plan.title
    modalDesc.textContent = plan.description
    basePriceEl.textContent = `$${plan.basePrice}.00`
    // Update slideshow images
    const slides = document.querySelectorAll(".slideshow-slide img")
    slides.forEach((img, index) => {
      if (plan.images[index]) {
        img.src = plan.images[index]
        img.alt = `${plan.title} - Image ${index + 1}`
      }
    })
    // Update plan highlights
    const highlightsList = document.getElementById("plan-highlights")
    if (highlightsList) {
      highlightsList.innerHTML = plan.highlights
        .map(
          (highlight) => `
        <li class="feature-item">
          <div class="feature-icon"></div>
          <span class="feature-text">${highlight}</span>
        </li>
      `,
        )
        .join("")
    }
    // Update included items
    const includedList = document.getElementById("plan-included")
    if (includedList) {
      includedList.innerHTML = plan.included
        .map(
          (item) => `
        <li class="feature-item">
          <div class="feature-icon"></div>
          <span class="feature-text">${item}</span>
        </li>
      `,
        )
        .join("")
    }
    // Update perfect for list
    const perfectForList = document.getElementById("perfect-for-list")
    if (perfectForList) {
      perfectForList.innerHTML = plan.perfectFor
        .map(
          (item) => `
        <li class="perfect-for-item">
          <div class="perfect-for-icon"></div>
          <span class="perfect-for-text">${item}</span>
        </li>
      `,
        )
        .join("")
    }
    // Reset form values
    this.resetModalForm()
    this.updatePricing()
    // Show modal
    const modal = document.getElementById("details-modal")
    if (!modal) return
    modal.style.display = "flex"
    modal.classList.add("open")
    modal.setAttribute("aria-hidden", "false")
    document.body.style.overflow = "hidden"
    // Reset slideshow
    this.currentSlide = 0
    this.updateSlideshow()
  }
  closeModal() {
    const modal = document.getElementById("details-modal")
    if (!modal) return
    modal.classList.remove("open")
    modal.setAttribute("aria-hidden", "true")
    document.body.style.overflow = ""
    setTimeout(() => {
      modal.style.display = "none"
    }, 300)
  }
  resetModalForm() {
    // Reset all select elements to their first option
    document.querySelectorAll('select[id$="-options"]').forEach((select) => {
      select.selectedIndex = 0
    })
    // Reset quantity
    const quantityInput = document.getElementById("quantity-input")
    if (quantityInput) quantityInput.value = 1
    // Reset MEP toggle
    const mepToggle = document.getElementById("mep-toggle")
    if (mepToggle) {
      mepToggle.textContent = "Add MEP"
      mepToggle.setAttribute("data-active", "false")
      mepToggle.classList.remove("btn-accent")
      mepToggle.classList.add("btn-outline")
    }
  }
  updateSlideshow() {
    const slides = document.querySelectorAll(".slideshow-slide")
    const dots = document.querySelectorAll(".slideshow-dot")
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === this.currentSlide)
    })
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === this.currentSlide)
    })
  }
  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides
    this.updateSlideshow()
  }
  previousSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides
    this.updateSlideshow()
  }
  goToSlide(index) {
    this.currentSlide = index
    this.updateSlideshow()
  }
  updateQuantity(change) {
    const quantityInput = document.getElementById("quantity-input")
    if (!quantityInput) return
    const currentValue = Number.parseInt(quantityInput.value) || 1
    const newValue = Math.max(1, currentValue + change)
    quantityInput.value = newValue
    this.updatePricing()
  }
  toggleMEP(button) {
    const isActive = button.getAttribute("data-active") === "true"
    if (isActive) {
      button.textContent = "Add MEP"
      button.setAttribute("data-active", "false")
      button.classList.remove("btn-accent")
      button.classList.add("btn-outline")
    } else {
      button.textContent = "Remove MEP"
      button.setAttribute("data-active", "true")
      button.classList.remove("btn-outline")
      button.classList.add("btn-accent")
    }
    this.updatePricing()
  }
  updatePricing() {
    if (!this.currentPlan) return
    const plan = this.planData[this.currentPlan]
    let total = plan.basePrice
    const quantity = Number.parseInt(document.getElementById("quantity-input")?.value) || 1
    // Clear existing option prices
    const optionPricesContainer = document.getElementById("option-prices")
    if (optionPricesContainer) {
      optionPricesContainer.innerHTML = ""
    }
    // Calculate option prices
    const selects = document.querySelectorAll('select[id$="-options"]')
    selects.forEach((select) => {
      const selectedOption = select.options[select.selectedIndex]
      const price = Number.parseInt(selectedOption.getAttribute("data-price")) || 0
      if (price > 0 && optionPricesContainer) {
        const optionName = select.previousElementSibling.textContent.replace(":", "")
        const optionText = selectedOption.textContent.replace(/\s*$$\+\$\d+$$/, "")
        optionPricesContainer.innerHTML += `
          <div class="price-row">
            <span>${optionName}: ${optionText}</span>
            <span>+$${price}.00</span>
          </div>
        `
      }
      total += price
    })
    // Add MEP if selected
    const mepToggle = document.getElementById("mep-toggle")
    if (mepToggle && mepToggle.getAttribute("data-active") === "true") {
      total += 350
      if (optionPricesContainer) {
        optionPricesContainer.innerHTML += `
          <div class="price-row">
            <span>MEP Plans Add-on</span>
            <span>+$350.00</span>
          </div>
        `
      }
    }
    // Apply quantity
    total *= quantity
    // Update total display
    const totalPriceElement = document.getElementById("total-price")
    if (totalPriceElement) {
      totalPriceElement.textContent = `$${total.toLocaleString()}.00`
    }
  }
  addToCart() {
    if (!this.currentPlan) return
    const plan = this.planData[this.currentPlan]
    const quantity = Number.parseInt(document.getElementById("quantity-input")?.value) || 1
    // Calculate total price
    let itemPrice = plan.basePrice
    const options = []
    // Get selected options
    document.querySelectorAll('select[id$="-options"]').forEach((select) => {
      const selectedOption = select.options[select.selectedIndex]
      const price = Number.parseInt(selectedOption.getAttribute("data-price")) || 0
      if (price > 0) {
        const optionName = select.previousElementSibling.textContent.replace(":", "")
        const optionText = selectedOption.textContent.replace(/\s*$$\+\$\d+$$/, "")
        options.push({ name: optionName, value: optionText, price })
        itemPrice += price
      }
    })
    // Check MEP
    const mepToggle = document.getElementById("mep-toggle")
    if (mepToggle && mepToggle.getAttribute("data-active") === "true") {
      options.push({ name: "MEP Plans", value: "Complete MEP drawings", price: 350 })
      itemPrice += 350
    }
    // If an identical item (same plan + same options) is already in the
    // cart, bump its quantity instead of adding a duplicate line item.
    const optionsSignature = JSON.stringify(options.map((o) => o.name).sort())
    const existingItem = this.cart.find(
      (item) => item.planId === this.currentPlan && JSON.stringify(item.options.map((o) => o.name).sort()) === optionsSignature,
    )
    let cartItem
    if (existingItem) {
      existingItem.quantity += quantity
      cartItem = existingItem
    } else {
      cartItem = {
        id: Date.now(),
        planId: this.currentPlan,
        title: plan.title,
        basePrice: plan.basePrice,
        itemPrice: itemPrice,
        quantity: quantity,
        options: options,
        image: plan.images[0],
      }
      this.cart.push(cartItem)
    }
    this.updateCartDisplay()
    this.showCartNotification(cartItem)
    this.closeModal()
  }
  showCartNotification(item) {
    const notification = document.getElementById("cart-notification")
    if (!notification) return
    // Update notification content
    const img = notification.querySelector(".cart-notification-image img")
    const title = notification.querySelector(".cart-notification-title")
    const message = notification.querySelector(".cart-notification-message")
    const price = notification.querySelector(".cart-notification-price")
    if (img) img.src = item.image
    if (title) title.textContent = "Added to cart"
    if (message) message.textContent = item.title
    if (price) price.textContent = `$${(item.itemPrice * item.quantity).toLocaleString()}.00`
    // Show notification
    notification.classList.add("show")
    // Auto hide after 4 seconds
    setTimeout(() => {
      this.hideCartNotification()
    }, 4000)
  }
  hideCartNotification() {
    const notification = document.getElementById("cart-notification")
    if (notification) {
      notification.classList.remove("show")
    }
  }
  updateCartDisplay() {
    this.saveCart()
    const cartCount = document.getElementById("cart-count")
    const cartBody = document.getElementById("cart-panel-body")
    if (!cartCount || !cartBody) return
    // Update cart count
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0)
    cartCount.textContent = totalItems
    cartCount.classList.toggle("has-items", totalItems > 0)
    // Update cart panel
    if (this.cart.length === 0) {
      cartBody.innerHTML = `
        <div class="cart-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <p>Your cart is empty</p>
        </div>
      `
    } else {
      const cartItemsHtml = this.cart.map((item) => this.generateCartItemHtml(item)).join("")
      const total = this.cart.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0)
      cartBody.innerHTML = `
        <div class="cart-items">
          ${cartItemsHtml}
        </div>
        <div class="cart-summary">
          <div class="cart-summary-row">
            <span>Subtotal:</span>
            <span>$${total.toLocaleString()}.00</span>
          </div>
          <div class="cart-total">
            <span>Total:</span>
            <span class="cart-total-value">$${total.toLocaleString()}.00</span>
          </div>
        </div>
      `
      // Add event listeners for cart item controls
      this.setupCartItemListeners()
    }
  }
  generateCartItemHtml(item) {
    const optionsHtml =
      item.options.length > 0
        ? `<div style="font-size: var(--font-size-xs); color: var(--color-gray-500); margin-top: var(--space-1);">
            ${item.options.map((opt) => `${opt.name}: ${opt.value}`).join(", ")}
          </div>`
        : ""
    return `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          ${optionsHtml}
          <div class="cart-item-price">$${(item.itemPrice * item.quantity).toLocaleString()}.00</div>
          <div class="cart-item-controls">
            <div class="cart-item-quantity">
              <button class="cart-quantity-btn" data-action="decrease" data-item-id="${item.id}">-</button>
              <input type="number" class="cart-quantity-input" value="${item.quantity}" min="1" data-item-id="${item.id}">
              <button class="cart-quantity-btn" data-action="increase" data-item-id="${item.id}">+</button>
            </div>
            <button class="cart-item-remove" data-item-id="${item.id}">Remove</button>
          </div>
        </div>
      </div>
    `
  }
  setupCartItemListeners() {
    // Quantity buttons
    document.querySelectorAll(".cart-quantity-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = Number.parseInt(e.target.getAttribute("data-item-id"))
        const action = e.target.getAttribute("data-action")
        this.updateCartItemQuantity(itemId, action === "increase" ? 1 : -1)
      })
    })
    // Quantity inputs
    document.querySelectorAll(".cart-quantity-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const itemId = Number.parseInt(e.target.getAttribute("data-item-id"))
        const newQuantity = Math.max(1, Number.parseInt(e.target.value) || 1)
        this.setCartItemQuantity(itemId, newQuantity)
      })
    })
    // Remove buttons
    document.querySelectorAll(".cart-item-remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const itemId = Number.parseInt(e.target.getAttribute("data-item-id"))
        this.removeCartItem(itemId)
      })
    })
  }
  updateCartItemQuantity(itemId, change) {
    const item = this.cart.find((item) => item.id === itemId)
    if (item) {
      item.quantity = Math.max(1, item.quantity + change)
      this.updateCartDisplay()
    }
  }
  setCartItemQuantity(itemId, quantity) {
    const item = this.cart.find((item) => item.id === itemId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      this.updateCartDisplay()
    }
  }
  removeCartItem(itemId) {
    this.cart = this.cart.filter((item) => item.id !== itemId)
    this.updateCartDisplay()
  }
  toggleCartPanel() {
    const panel = document.getElementById("cart-panel")
    const overlay = document.getElementById("cart-overlay")
    if (panel && overlay) {
      const isOpen = panel.classList.contains("open")
      if (isOpen) {
        this.closeCartPanel()
      } else {
        panel.classList.add("open")
        overlay.classList.add("open")
        panel.setAttribute("aria-hidden", "false")
        document.body.style.overflow = "hidden"
      }
    }
  }
  closeCartPanel() {
    const panel = document.getElementById("cart-panel")
    const overlay = document.getElementById("cart-overlay")
    if (panel && overlay) {
      panel.classList.remove("open")
      overlay.classList.remove("open")
      panel.setAttribute("aria-hidden", "true")
      document.body.style.overflow = ""
    }
  }
  checkout() {
    if (this.cart.length === 0) {
      alert("Your cart is empty")
      return
    }

    // Check if cart contains only one item with quantity 1 (eligible for direct Stripe link)
    if (this.cart.length === 1 && this.cart[0].quantity === 1) {
      const item = this.cart[0]
      
      // Check if item has other customizations (excluding MEP)
      // This will be true if any of the commented-out select options were active and selected
      const hasOtherCustomizations = item.options.some(option => option.name !== "MEP Plans")
      
      // If there are NO other customizations (meaning only base or base + MEP)
      if (!hasOtherCustomizations) {
        const hasMEP = item.options.some(option => option.name === "MEP Plans")
        const linkKey = hasMEP ? `${item.planId}-mep` : item.planId
        const stripeLink = this.stripeLinks[linkKey]
        
        if (stripeLink) {
          // Show loading state
          const checkoutBtn = document.getElementById("checkout-btn")
          const originalText = checkoutBtn.innerHTML
          checkoutBtn.innerHTML = `
            <div class="checkout-loading">
              <div class="checkout-spinner"></div>
              Redirecting to Stripe...
            </div>
          `
          checkoutBtn.disabled = true
          
          // Clear cart and redirect to Stripe after short delay
          setTimeout(() => {
            this.cart = [] // Clear cart before redirect
            this.updateCartDisplay()
            window.location.href = stripeLink
          }, 1000)
          return // Exit function after redirect
        }
      }
    }

    // Fallback for complex orders (multiple items, quantities > 1, or other customizations)
    this.handleCustomOrder()
  }
  handleCustomOrder() {
    // Build the cart payload in the shape contact.html's parseURLParameters()
    // actually reads (name/price/quantity/customized/optionsSummary).
    const cartForContact = this.cart.map((item) => ({
      name: item.title,
      price: item.itemPrice,
      quantity: item.quantity,
      customized: item.options.length > 0,
      optionsSummary: item.options.map((opt) => `${opt.name}: ${opt.value}`).join(", "),
    }))
    const total = this.cart.reduce((sum, item) => sum + item.itemPrice * item.quantity, 0)

    // Show loading state
    const checkoutBtn = document.getElementById("checkout-btn")
    const originalText = checkoutBtn.innerHTML
    checkoutBtn.innerHTML = `
      <div class="checkout-loading">
        <div class="checkout-spinner"></div>
        Preparing order...
      </div>
    `
    checkoutBtn.disabled = true
    // Redirect to contact page with the order pre-filled
    setTimeout(() => {
      const params = new URLSearchParams({
        cart: JSON.stringify(cartForContact),
        total: total.toFixed(2),
      })
      this.cart = [] // Clear cart now that the order has been handed off
      this.updateCartDisplay()
      window.location.href = `/contact.html?${params.toString()}`
    }, 1500)
  }
}
// Initialize the controller when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TS9WebsiteController()
})
// Handle page load animations
window.addEventListener("load", () => {
  const loadingBar = document.getElementById("loading-bar")
  if (loadingBar) {
    loadingBar.style.width = "100%"
    setTimeout(() => {
      loadingBar.parentElement.style.display = "none"
    }, 500)
  }
})