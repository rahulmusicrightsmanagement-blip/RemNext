import { Link } from 'react-router-dom'
import styles from '../styles/Landing.module.css'

function Landing() {
  return (
    <div className={styles.landing}>

      {/* Hero */}
      <section className={styles.hero}>
        <span className={styles.heroBadge}>AI-Powered Freelance Marketplace</span>
        <h1 className={styles.heroTitle}>
          Where Great Work<br />Finds Great Talent
        </h1>
        <p className={styles.heroSub}>
          Connect with world-class freelancers or land your next big project —
          powered by AI matching, secured by escrow.
        </p>
        <div className={styles.heroActions}>
          <Link to="/signup" className={styles.btnPrimary}>Find Talent</Link>
          <Link to="/signup" className={styles.btnOutline}>Start Earning</Link>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.steps}>
        <span className={styles.badge}>How It Works</span>
        <h2 className={styles.sectionTitle}>Hire or Get Hired in 3 Steps</h2>
        <div className={styles.stepGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>01</div>
            <h3>Create Your Profile</h3>
            <p>Showcase your skills or describe your project. Get verified and join a global community of professionals.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>02</div>
            <h3>Get AI-Matched</h3>
            <p>Our smart algorithm pairs clients and freelancers based on skills, budget, and timeline — instantly.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>03</div>
            <h3>Work & Get Paid</h3>
            <p>Collaborate in a dedicated workspace. Payments are held in escrow and released when you're satisfied.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.stat}>
          <h2>500K+</h2>
          <p>Verified Freelancers</p>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <h2>80+</h2>
          <p>Countries Supported</p>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <h2>$1B+</h2>
          <p>Paid Out to Freelancers</p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Your Next Opportunity<br />Starts Here</h2>
        <p className={styles.ctaSub}>Join thousands of freelancers and businesses already thriving on RemNext.</p>
        <Link to="/signup" className={styles.btnWhite}>Get Started Free</Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>RemNext</span>
            <p className={styles.footerTagline}>Where opportunity is borderless.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Platform</p>
              <p>Find Talent</p>
              <p>Find Work</p>
              <p>How It Works</p>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Company</p>
              <p>About Us</p>
              <p>Careers</p>
              <p>Contact</p>
            </div>
            <div className={styles.footerCol}>
              <p className={styles.footerColTitle}>Legal</p>
              <p>Terms</p>
              <p>Privacy</p>
              <p>Trust & Safety</p>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2026 RemNext. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}

export default Landing
