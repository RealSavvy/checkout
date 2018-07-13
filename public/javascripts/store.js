/**
 * store.js
 * Stripe Payments Demo. Created by Romain Huet (@romainhuet).
 *
 * Representation of products, line items, and orders, and saving them on Stripe.
 * Please note this is overly simplified class for demo purposes (all products
 * are loaded for convenience, there is no cart management functionality, etc.).
 * A production app would need to handle this very differently.
 */

class Store {
  constructor() {
    this.lineItems = [];
    this.products = {};
    this.plans = {};
    this.displayOrderSummary();
  }

  // Compute the total for the order based on the line items (SKUs and quantity).
  getOrderTotal() {

    return Object.values(this.lineItems).reduce(
      (total, {product, sku, quantity}) =>
        total + quantity * this.plans[0].amount,
      0
    );
  }

  // Expose the line items for the order (in a way that is friendly to the Stripe Orders API).
  getOrderItems() {
    let items = [];
    items.push({
      type: 'sku',
      parent: this.lineItems[0].sku,
      quantity: this.lineItems[0].quantity,
    })
    return items;
  }

  // Retrieve the configuration from the API.
  async getConfig() {
    try {
      const response = await fetch('/config');
      const config = await response.json();

      return config;
    } catch (err) {
      return {error: err.message};
    }
  }

  // Load the product details.
  async loadProducts() {
    const url = window.location.href;
    const prod_id = getParameterByName('id',url);
    const productsResponse = await fetch('/products');
    const products = (await productsResponse.json()).data;
    products.forEach(product => {
      if(product.id === prod_id){
        this.products[product.id] = product
      }
    });
  }

  // Load the plans details.
  async loadPlans() {
    const plansResponse = await fetch('/plans');
    const plans = (await plansResponse.json()).data;
    plans.forEach(plan => {
      let product = this.products[plan.product];
      if (product) {
        if (!product.plans) {
          product.plans = [];
        }
        product.plans.push(plan);
      }
      this.plans[plan.id] = plan;
    });
    const url = window.location.href;
    const prod_id = getParameterByName('id',url);
    this.plans = plans.filter(plan=> plan.product===prod_id)
  }

  // Create an order object to represent the line items.
  async createSubscription(email, source, shipping, info) {
    try {
      const plans = this.plans;
      const response = await fetch('/subscriptions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          source,
          plans,
          shipping,
          info,
        }),
      });
      const data = await response.json();
      if (data.error) {
        return {error: data.error};
      } else {
        // Save the current order locally to lookup its status later.
        this.setActiveOrderId(data.order.id);
        return data.order;
      }
    } catch (err) {
      return {error: err.message};
    }
    return order;
  }

  // Create an order object to represent the line items.
  async createOrder(currency, items, email, shipping) {
    try {
      const response = await fetch('/orders', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          currency,
          items,
          email,
          shipping,
        }),
      });
      const data = await response.json();
      if (data.error) {
        return {error: data.error};
      } else {
        // Save the current order locally to lookup its status later.
        this.setActiveOrderId(data.order.id);
        return data.order;
      }
    } catch (err) {
      return {error: err.message};
    }
    return order;
  }

  // Pay the specified order by sending a payment source alongside it.
  async payOrder(order, source) {
    try {
      const response = await fetch(`/orders/${order.id}/pay`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source}),
      });
      const data = await response.json();
      if (data.error) {
        return {error: data.error};
      } else {
        return data;
      }
    } catch (err) {
      return {error: err.message};
    }
  }

  // Fetch an order status from the API.
  async getOrderStatus(orderId) {
    try {
      const response = await fetch(`/orders/${orderId}`);
      return await response.json();
    } catch (err) {
      return {error: err};
    }
  }

  // Format a price (assuming a two-decimal currency like EUR or USD for simplicity).
  formatPrice(amount, currency) {
    let price = (amount / 100).toFixed(2);
    let numberFormat = new Intl.NumberFormat(['en-US'], {
      style: 'currency',
      currency: 'usd',
      currencyDisplay: 'symbol',
    });
    return numberFormat.format(price);
  }

  // Set the active order ID in the local storage.
  setActiveOrderId(orderId) {
    localStorage.setItem('orderId', orderId);
  }

  // Get the active order ID from the local storage.
  getActiveOrderId() {
    return localStorage.getItem('orderId');
  }

  // Manipulate the DOM to display the order summary on the right panel.
  // Note: For simplicity, we're just using template strings to inject data in the DOM,
  // but in production you would typically use a library like React to manage this effectively.
  async displayOrderSummary() {
    // Fetch the products from the store to get all the details (name, price, etc.).
    await this.loadProducts();
    await this.loadPlans();
    const orderItems = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    let currency;

    // Build and append the line items to the order summary.
    for (let [id, product] of Object.entries(this.products)) {
      console.log('product',product);
      const quantity = 1;
      let plan = product.plans[0];
      currency = plan.currency;
      let planPrice = this.formatPrice(plan.amount, plan.currency);
      let lineItemPrice = this.formatPrice(plan.amount * quantity, plan.currency);

      let lineItem = document.createElement('div');
      lineItem.classList.add('line-item');
      lineItem.innerHTML = `
        <img class="image" src="${product.metadata.image}">
        <div class="label">
          <p class="product">${product.name}</p>
          <p class="sku">${product.metadata.description}</p>
        </div>
        <p class="price">${lineItemPrice}</p>`;
      orderItems.appendChild(lineItem);
      this.lineItems.push({
        product: product.id,
        sku: plan.id,
        quantity,
      });
    }
    const total = this.formatPrice(this.getOrderTotal(), currency);
    orderTotal.querySelector('[data-subtotal]').innerText = total;
    orderTotal.querySelector('[data-total]').innerText = total;
    document.getElementById('main').classList.remove('loading');
  }
}
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.store = new Store();
