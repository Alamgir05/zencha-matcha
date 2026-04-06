import { useEffect, useRef, useState } from 'react'
import MatchaSequence from './components/MatchaSequence'

// ─── Cart counter hook ────────────────────────────────────────────────────────
function useCart() {
  const [count, setCount] = useState(0)
  const addItem = () => setCount((c) => c + 1)
  return { count, addItem }
}

// ─── Intersection observer hook (scroll reveal) ───────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

// Reusable reveal wrapper
function Reveal({ children, className = '', delay = 0, direction = 'up', id }: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'in' | 'scale'
  id?: string
}) {
  const { ref, visible } = useReveal()
  const baseStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : (
      direction === 'up' ? 'translateY(36px)' :
      direction === 'left' ? 'translateX(28px)' :
      direction === 'scale' ? 'scale(0.9)' : 'scale(0.97)'
    ),
    transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
  }
  return <div id={id} ref={ref} className={className} style={baseStyle}>{children}</div>
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const { count: cartCount, addItem } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Sticky nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HEADER / NAV
      ════════════════════════════════════════════════════════ */}
      <header id="site-header" className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <nav className="nav-inner">
          <a href="#hero" className="wordmark" id="logo-link">MATON</a>

          <ul className={`nav-links${menuOpen ? ' nav-links--open' : ''}`} id="main-nav">
            <li><a href="#hero"         className="nav-link" onClick={() => setMenuOpen(false)}>Home</a></li>
            <li><a href="#products"     className="nav-link" onClick={() => setMenuOpen(false)}>Products</a></li>
            <li><a href="#testimonials" className="nav-link" onClick={() => setMenuOpen(false)}>Testimonial</a></li>
          </ul>

          <div className="nav-utilities">
            <a href="#" className="nav-util" id="sign-in-link">Sign In</a>
            <a href="#" className="cart-btn" id="cart-btn" onClick={(e) => { e.preventDefault(); addItem() }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              My Cart
              <span className="cart-count">{cartCount}</span>
            </a>
            <button
              className={`hamburger${menuOpen ? ' open' : ''}`}
              id="hamburger-btn"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
          Architecture: The MatchaSequence component is 300vh tall
          and uses position:sticky internally. The hero left/right
          columns are positioned as overlays at the top of that
          scroll container, so they appear fixed while the sequence
          animates through its scroll travel.
      ════════════════════════════════════════════════════════ */}
      <section id="hero" className="hero">

        {/* Background orbs (decorative) */}
        <div className="hero-orb hero-orb-1" aria-hidden="true" />
        <div className="hero-orb hero-orb-2" aria-hidden="true" />

        {/* The full-width scroll container lives here */}
        <div className="hero-sequence-wrap">
          <MatchaSequence />
        </div>

        {/* Hero text overlay — sticky over the sequence scroll zone */}
        <div className="hero-overlay">
          <div className="hero-inner" style={{ position: 'sticky', top: 0, height: '100vh' }}>

            {/* Left Column */}
            <div className="hero-left">
              <div className="hero-tag">✦ Free Starter Kits</div>
              <p className="hero-left-copy">
                Discover the ritual of matcha with our curated beginner sets — everything you need to begin.
              </p>
              <div className="hero-thumbnails">
                <div className="thumb" id="thumb-1">
                  <img src="/matcha_starter_kit.png" alt="Matcha starter set" />
                </div>
                <div className="thumb" id="thumb-2">
                  <img src="/matcha_tools.png" alt="Whisk tools" />
                </div>
              </div>
              <div className="japanese-block">
                <span className="jp-text">プレミアム抹茶</span>
                <span className="jp-sub">— Premium Quality</span>
              </div>
            </div>

            {/* Center — headline floats above canvas */}
            <div className="hero-center hero-center--overlay">
              <h1 className="hero-headline">
                <span className="headline-line">Best Matcha</span>
                <span className="headline-line italic">in Town</span>
              </h1>
              {/* Scroll cue */}
              <div className="hero-scroll-cue" aria-hidden="true">
                <div className="hero-scroll-cue__line" />
                <span>Scroll</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="hero-right">
              <div className="hero-tag">Premium Matcha</div>
              <p className="hero-right-copy">
                First harvest Uji Matcha, stone-ground to silken perfection. Pure flavor. No additives.
              </p>
              <div className="hero-weight">30<span>gr</span></div>
              <a href="#products" className="btn-primary" id="hero-cta">Shop Now →</a>
            </div>

          </div>
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════
          STARTER KIT SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="starter-kit" id="starter">
        <div className="starter-inner">
          <div className="starter-top">

            <Reveal className="starter-label-col" direction="up">
              <div className="section-eyebrow">スターターキット</div>
              <h2 className="starter-title">Matcha<br/>Starter Kits</h2>
              <p className="starter-copy">Begin your matcha journey with just what you need. Expertly paired tools and powder.</p>
            </Reveal>

            <Reveal className="starter-image-col" direction="scale">
              <div className="starter-img-wrap">
                <img src="/matcha_starter_kit.png" alt="Matcha starter kit set" className="starter-main-img" />
                <div className="starter-badge" id="price-anchor">Get it for just<br/><strong>$25</strong></div>
              </div>
            </Reveal>

            <div className="starter-callouts-col">
              {[
                { id: 'callout-mug',    src: '/matcha_relax.png',    alt: 'Matcha Mug',   title: 'Matcha Mug',   desc: 'Hand-thrown ceramic mug designed for the perfect sip.', delay: 0 },
                { id: 'callout-whisk',  src: '/matcha_tools.png',    alt: 'Matcha Whisk', title: 'Matcha Whisk', desc: '80-prong bamboo chasen for silky, frothy matcha every time.', delay: 100 },
                { id: 'callout-powder', src: '/ceremonial_matcha.png', alt: 'Matcha Powder', title: 'Matcha Powder', desc: 'Stone-ground first harvest ceremonial green tea powder.', delay: 200 },
              ].map((item) => (
                <Reveal key={item.id} direction="left" delay={item.delay}>
                  <div className="callout-item" id={item.id}>
                    <div className="callout-img-wrap">
                      <img src={item.src} alt={item.alt} />
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

          </div>
          <div className="maton-logo-divider"><span>◆</span> MATON <span>◆</span></div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BENEFITS SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="benefits" id="benefits">
        <div className="benefits-inner">
          <div className="benefits-top">

            <Reveal className="benefits-headline-col" direction="up">
              <div className="section-eyebrow">Why Matcha?</div>
              <h2 className="benefits-title">Experience Wellness<br/>with Every Sip</h2>
              <p className="benefits-subtitle">Ancient wisdom, modern ritual. Each bowl is a moment of intentional calm.</p>
            </Reveal>

            <div className="benefits-tiles">
              <Reveal className="benefit-tile" id="tile-antioxidant" direction="up" delay={0}>
                <img src="/matcha_lifestyle.png" alt="Matcha antioxidant benefits" className="tile-img" />
                <div className="tile-label"><span className="tile-dot" />Anti Oxidant</div>
              </Reveal>
              <Reveal className="benefit-tile benefit-tile--offset" id="tile-relax" direction="up" delay={150}>
                <img src="/matcha_relax.png" alt="Relax and focus with matcha" className="tile-img" />
                <div className="tile-label"><span className="tile-dot" />Relax &amp; Focus</div>
              </Reveal>
            </div>

          </div>

          <div className="benefits-pillars">
            {[
              { id: 'pillar-flavor', title: 'Rich Flavor & Vibrant Color', desc: 'Our matcha is known for its vibrant emerald hue and deep umami flavor — a hallmark of superior quality.', delay: 0, path: 'M15 20c1.5-3 4-4.5 5-4.5s3.5 1.5 5 4.5' },
              { id: 'pillar-authentic', title: 'Authentic Japanese Matcha', desc: 'Sourced directly from Uji, Kyoto — the world\'s most revered matcha-growing region since the 12th century.', delay: 120 },
              { id: 'pillar-health', title: 'Health & Sustainability', desc: 'Shade-grown, hand-picked, and stone-milled. Sustainable farming practices that honor the land and your body.', delay: 240 },
            ].map((p) => (
              <Reveal key={p.id} className="pillar" direction="up" delay={p.delay}>
                <div className="pillar-icon">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="19" stroke="#B9FF3D" strokeWidth="1.5"/>
                    <circle cx="20" cy="20" r="8" fill="#B9FF3D" opacity=".2"/>
                    <circle cx="20" cy="20" r="3" fill="#B9FF3D"/>
                  </svg>
                </div>
                <h4>{p.title}</h4>
                <p>{p.desc}</p>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRODUCT COLLECTION SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="products" id="products">
        <div className="products-inner">

          <Reveal className="products-header" direction="up">
            <div className="section-eyebrow">Our Collection</div>
            <h2 className="products-title">Discover the World<br/><em>of Matcha</em></h2>
          </Reveal>

          <div className="products-grid">

            <div className="products-stack" id="products-stack">
              {[
                { id: 'mc-ceremonial', src: '/ceremonial_matcha.png', grade: 'Culinary Grade', gradeClass: '', title: 'Everyday Matcha', desc: 'Smooth and versatile for lattes, baking, and smoothies.', price: '$18', unit: '50gr', addId: 'add-everyday' },
                { id: 'mc-select',     src: '/matcha_starter_kit.png', grade: 'Select Grade', gradeClass: 'grade-tag--select', title: 'Seiun Matcha', desc: 'Balanced sweetness with a lingering finish, perfect for daily ceremony.', price: '$26', unit: '40gr', addId: 'add-seiun' },
              ].map((card, i) => (
                <Reveal key={card.id} direction="up" delay={i * 100}>
                  <div className="mini-card" id={card.id}>
                    <div className="mini-card-img">
                      <img src={card.src} alt={card.title} />
                    </div>
                    <div className="mini-card-info">
                      <span className={`grade-tag ${card.gradeClass}`}>{card.grade}</span>
                      <h5>{card.title}</h5>
                      <p>{card.desc}</p>
                      <div className="mini-card-footer">
                        <span className="price">{card.price} <small>/ {card.unit}</small></span>
                        <button className="btn-ghost-sm" id={card.addId} onClick={addItem}>Add to Cart</button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="featured-product" id="featured-ceremonial" direction="scale">
              <div className="featured-top">
                <span className="jp-label">儀式用抹茶</span>
                <span className="featured-grade">Ceremonial Grade Matcha</span>
              </div>
              <div className="featured-img-wrap">
                <div className="featured-circle-bg" />
                <img src="/hero_matcha_bowl.png" alt="Ceremonial Grade Matcha" className="featured-img" />
              </div>
              <div className="featured-info">
                <p className="featured-desc">The pinnacle of matcha craftsmanship. First harvest, shade-grown, stone-milled to order.</p>
                <div className="featured-price-row">
                  <span className="featured-price">$32 <small>/ 30gr</small></span>
                  <a href="#" className="btn-primary btn-sm" id="add-ceremonial" onClick={(e) => { e.preventDefault(); addItem() }}>Add to Cart</a>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Accessories row */}
          <div className="accessories-row" id="accessories">
            {[
              { id: 'acc-whisk',  src: '/matcha_tools.png',    title: 'Bamboo Whisk', desc: 'Traditional 80-prong chasen', price: '$16', delay: 0 },
              { id: 'acc-mug',    src: '/matcha_relax.png',    title: 'Matcha Mug',   desc: 'Hand-thrown chawan bowl',     price: '$22', delay: 100 },
              { id: 'acc-teapot', src: '/matcha_lifestyle.png', title: 'Ceramic Tea Pot', desc: 'Artisan Kyoto-style teapot', price: '$38', delay: 200 },
            ].map((acc) => (
              <Reveal key={acc.id} className="acc-card" direction="up" delay={acc.delay}>
                <div id={acc.id}>
                  <div className="acc-img"><img src={acc.src} alt={acc.title} /></div>
                  <h5>{acc.title}</h5>
                  <p>{acc.desc}</p>
                  <span className="acc-price">{acc.price}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="explore-cta" direction="up">
            <a href="#" className="btn-pill" id="explore-all-btn">Explore All Products →</a>
          </Reveal>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ESSENTIALS SECTION
      ════════════════════════════════════════════════════════ */}
      <section className="essentials" id="essentials">
        <div className="essentials-inner">

          <Reveal className="essentials-header" direction="up">
            <div className="section-eyebrow">Pairings</div>
            <h2 className="essentials-title">Matcha Pairing<br/><em>Essentials</em></h2>
            <p className="essentials-subtitle">Beyond the bowl — explore our curated culinary matcha blends for every occasion.</p>
          </Reveal>

          <div className="essentials-grid">
            <Reveal className="essential-card" id="ess-latte" direction="up" delay={0}>
              <div className="essential-img-wrap">
                <img src="/matcha_latte.png" alt="Matcha Latte Mix" className="essential-img" />
                <div className="essential-price-tag">$19</div>
              </div>
              <div className="essential-info">
                <span className="essential-label">New Arrival</span>
                <h3>Matcha Latte Mix</h3>
                <p>A harmonious blend of ceremonial matcha and oat milk powder — just add water for a creamy morning ritual.</p>
                <a href="#" className="btn-primary btn-sm" id="add-latte" onClick={(e) => { e.preventDefault(); addItem() }}>Shop Now</a>
              </div>
            </Reveal>
            <Reveal className="essential-card essential-card--alt" id="ess-cake" direction="up" delay={150}>
              <div className="essential-img-wrap">
                <img src="/matcha_cake.png" alt="Matcha Cake Powder" className="essential-img" />
                <div className="essential-price-tag">$23</div>
              </div>
              <div className="essential-info">
                <span className="essential-label">Best Seller</span>
                <h3>Matcha Cake Powder</h3>
                <p>Vibrant culinary-grade matcha blended to retain its color in baking — perfect for cakes, cookies, and pastries.</p>
                <a href="#" className="btn-primary btn-sm" id="add-cake" onClick={(e) => { e.preventDefault(); addItem() }}>Shop Now</a>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════ */}
      <section className="testimonials" id="testimonials">
        <div className="testimonials-inner">
          <div className="center-eyebrow section-eyebrow">What People Say</div>
          <Reveal className="testimonials-title-wrap" direction="up">
            <h2 className="testimonials-title">Loved by Matcha<br/><em>Enthusiasts</em></h2>
          </Reveal>
          <div className="testimonials-grid">
            {[
              { id: 'tcard-1', color: '#2d5a3d', name: 'Sarah Mitchell', loc: 'Verified Buyer · NYC', quote: '"MATON\'s ceremonial matcha has completely transformed my morning routine. The color is stunning and the taste is incomparable — floral, smooth, with just the right umami."', delay: 0 },
              { id: 'tcard-2', color: '#1a3a2a', name: 'James K.', loc: 'Verified Buyer · London', quote: '"I\'ve tried dozens of matcha brands and MATON sits at the very top. Ultra fine powder, no bitterness, whisks up beautifully. The starter kit was the perfect introduction."', delay: 120 },
              { id: 'tcard-3', color: '#0f2a1c', name: 'Yuki T.', loc: 'Verified Buyer · Tokyo', quote: '"The matcha latte mix is my new obsession. So convenient, yet somehow it tastes just as good as what I\'d get at a specialty café. Highly recommend."', delay: 240 },
            ].map((t) => (
              <Reveal key={t.id} className="testimonial-card" direction="up" delay={t.delay}>
                <div id={t.id}>
                  <div className="stars">★★★★★</div>
                  <p className="tcard-body">{t.quote}</p>
                  <div className="tcard-author">
                    <div className="author-avatar" style={{ background: t.color }} />
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.loc}</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="footer" id="footer">
        <div className="footer-inner">

          <div className="footer-cta-section">
            <Reveal className="footer-cta-text" direction="up">
              <div className="footer-eyebrow">Limited Time Offer</div>
              <h2 className="footer-offer">Save up to 50%<br/>or more on matcha powder</h2>
              <p className="footer-offer-sub">Fresh harvest. Direct from Uji. No compromises.</p>
              <a href="#products" className="btn-lime-pill" id="footer-cta-btn">Claim Your Discount →</a>
            </Reveal>
            <Reveal className="footer-imagery" direction="left">
              <img src="/footer_pour.png" alt="Matcha being poured" className="footer-pour-img" />
              <div className="footer-img-overlay" />
            </Reveal>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <div className="footer-col footer-brand-col">
              <div className="footer-wordmark">MATON</div>
              <p className="footer-tagline">Purity. Craft. Ritual.</p>
              <div className="footer-contact">
                <p>+62 812 3456 7895</p>
                <p>matcha@gmail.com</p>
              </div>
            </div>
            {[
              { title: 'Products', links: ['Matcha Powder', 'Matcha Starter Kits', 'Matcha Cake Powder', 'Accessories'] },
              { title: 'Company',  links: ['Our Story', 'Sourcing', 'Sustainability', 'Press'] },
              { title: 'Support',  links: ['FAQ', 'Shipping', 'Returns', 'Contact'] },
            ].map((col) => (
              <div className="footer-col" key={col.title}>
                <h6>{col.title}</h6>
                <ul>{col.links.map((l) => <li key={l}><a href="#">{l} →</a></li>)}</ul>
              </div>
            ))}
          </div>

          <div className="footer-legal">
            <span>© 2026 MATON. All rights reserved.</span>
            <div className="footer-legal-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
