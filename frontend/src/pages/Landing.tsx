import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Landing.module.css'

function Landing() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Contact:', contactForm)
    setContactForm({ name: '', email: '', message: '' })
    alert('Thank you for reaching out! We will get back to you soon.')
  }

  return (
    <div className={styles.landing}>
      {/* Hero */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          One hub for<br />all your feedback
        </h1>
        <p className={styles.heroSub}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris.
        </p>
        <Link to="/signup" className={styles.ctaBtn}>Get Started Free</Link>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.stat}>
          <h2>100K+</h2>
          <p>Feedbacks Analyzed</p>
        </div>
        <div className={styles.stat}>
          <h2>10+</h2>
          <p>Channels Integrated</p>
        </div>
        <div className={styles.stat}>
          <h2>1M+</h2>
          <p>Response Automated</p>
        </div>
      </section>

      {/* Testimonial */}
      <section className={styles.testimonial}>
        <div className={styles.quoteIcon}>"</div>
        <p className={styles.quoteText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus
          magna, vel scelerisque nisl consectetur et. Donec sed odio dui.
        </p>
        <p className={styles.quoteAuthor}>— James Lee, Head of Product</p>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <span className={styles.badge}>Key Features</span>
        <h2 className={styles.featuresTitle}>
          to Enhance Feedback<br />Management
        </h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <h3>Automated Response</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio
              vitae vestibulum vestibulum. Cras vehicula diam vitae est commodo.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3>Sentiment Analysis</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dapibus, tellus
              ac cursus commodo, tortor mauris condimentum nibh ut fermentum.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3>Tagging & Categorization</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis risus eget
              urna mollis ornare vel eu leo. Donec ullamcorper nulla non metus.
            </p>
          </div>
          <div className={styles.featureCard}>
            <h3>Multi Channel Integration</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas faucibus mollis
              interdum. Sed posuere consectetur est at lobortis.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className={styles.about}>
        <span className={styles.badge}>About Us</span>
        <h2 className={styles.aboutTitle}>Who We Are</h2>
        <div className={styles.aboutContent}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi
            tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor
            quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet
            quam egestas semper. Aenean ultricies mi vitae est.
          </p>
          <p>
            Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.
            Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean
            fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus
            lacus enim ac dui.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className={styles.contact}>
        <span className={styles.badge}>Contact Us</span>
        <h2 className={styles.contactTitle}>Have a Query? Reach Out</h2>
        <p className={styles.contactSub}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. We'd love to hear from you.
        </p>
        <form className={styles.contactForm} onSubmit={handleContact}>
          <input
            type="text"
            placeholder="Your Name"
            value={contactForm.name}
            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={contactForm.email}
            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            required
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            value={contactForm.message}
            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
            required
          />
          <button type="submit" className={styles.ctaBtn}>Send Message</button>
        </form>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Elevate Your Feedback<br />Management</h2>
        <Link to="/signup" className={styles.ctaBtn}>Get Started</Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>RemNext</div>
        <p className={styles.footerDesc}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Centralizing customer
          insights from multiple channels for improved satisfaction.
        </p>
        <div className={styles.footerLinks}>
          <div>
            <h4>Features</h4>
            <h4>About</h4>
            <h4>How it works</h4>
          </div>
          <div>
            <h4>Contact</h4>
            <h4>Careers</h4>
          </div>
          <div>
            <h4>Terms</h4>
            <h4>Privacy</h4>
          </div>
        </div>
        <p className={styles.footerCopy}>&copy; 2026 RemNext. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Landing
