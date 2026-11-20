const categories = [
  { icon: "🎧", name: "Audio & Sound" },
  { icon: "⌨️", name: "Computer Accessories" },
  { icon: "📱", name: "Mobile Accessories" },
  { icon: "📷", name: "Cameras & Gear" },
  { icon: "⌚", name: "Smart Wearables" },
  { icon: "🏠", name: "Smart Home" },
];

const products = [
  { icon: "🎧", name: "Wireless Bluetooth Headphones", price: "8,990", tag: "AUDIO" },
  { icon: "⌨️", name: "Mechanical Gaming Keyboard", price: "12,500", tag: "COMPUTER" },
  { icon: "⌚", name: "Smart Fitness Watch", price: "9,750", tag: "WEARABLES" },
  { icon: "🔊", name: "Portable Bluetooth Speaker", price: "6,490", tag: "AUDIO" },
];

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="announcement">A better way to shop tech in Sri Lanka · Islandwide delivery</div>
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href="/" aria-label="DZone home"><span className="brand-mark">D</span><span>DZone</span></a>
          <form className="search" action="/shop">
            <input name="q" type="search" placeholder="Search for products, brands and more..." aria-label="Search products" />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
          <div className="header-actions">
            <a className="header-action" href="/account"><span className="action-icon">♙</span><span>My Account</span></a>
            <a className="header-action" href="/cart"><span className="action-icon">🛒</span><span>Cart</span></a>
          </div>
        </div>
      </header>
      <nav className="main-nav" aria-label="Main navigation">
        <div className="container nav-inner">
          <a href="/">Home</a><a href="/shop">Shop all</a><a href="/shop?category=electronics">Electronics</a><a href="/shop?category=accessories">Accessories</a><a href="/track">Track order</a><a href="/contact">Contact</a>
        </div>
      </nav>
      <section className="hero">
        <div className="container">
          <div className="hero-panel">
            <div className="hero-copy">
              <div className="eyebrow">Discover what’s next</div>
              <h1>Everyday tech.<br />Made better.</h1>
              <p>Find the gadgets and essentials that make work, play and everyday life a little better. Shop your next favourite thing at DZone.</p>
              <a className="primary-button" href="/shop">Explore the collection <span aria-hidden="true">↗</span></a>
            </div>
            <div className="hero-art" aria-hidden="true"><div className="hero-orbit" /><div className="hero-device" /></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading"><div><h2>Shop by category</h2><p>Explore the essentials, all in one place.</p></div><a className="text-link" href="/shop">View all categories ↗</a></div>
          <div className="category-grid">
            {categories.map((category) => <a className="category-card" href="/shop" key={category.name}><span className="category-icon">{category.icon}</span><span>{category.name}</span></a>)}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading"><div><h2>Popular picks</h2><p>A first look at what DZone has to offer.</p></div><a className="text-link" href="/shop">Shop all products ↗</a></div>
          <div className="product-grid">
            {products.map((product) => <article className="product-card" key={product.name}><div className="product-art" aria-hidden="true">{product.icon}</div><div className="product-info"><div className="product-meta">{product.tag}</div><h3 className="product-name">{product.name}</h3><div className="product-price">LKR {product.price}<small>incl. taxes</small></div></div></article>)}
          </div>
        </div>
      </section>
      <section className="container trust-strip" aria-label="Shopping benefits">
        <div className="trust-item"><span className="trust-icon">🚚</span><div><strong>Islandwide delivery</strong><span>Delivery across Sri Lanka</span></div></div>
        <div className="trust-item"><span className="trust-icon">🔒</span><div><strong>Shop with confidence</strong><span>Secure customer accounts</span></div></div>
        <div className="trust-item"><span className="trust-icon">💬</span><div><strong>Here to help</strong><span>Friendly customer support</span></div></div>
      </section>
      <footer className="footer"><div className="container footer-inner"><div><a className="brand" href="/"><span className="brand-mark">D</span><span>DZone</span></a><p style={{marginTop:10}}>Everyday tech, made better.</p></div><div className="footer-links"><a href="/shop">Shop</a><a href="/contact">Contact</a><a href="/pages/privacy-policy">Privacy</a><a href="/pages/terms">Terms</a></div><p>© {new Date().getFullYear()} DZone. All rights reserved.</p></div></footer>
    </main>
  );
}
