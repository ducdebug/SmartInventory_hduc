import type React from "react"
import { Link } from "react-router-dom"
import "./Footer.css"

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo" aria-label="Site footer">
      <div className="footer-container">
        <div className="footer-section">
          <Link to="/" className="footer-logo">
            <img src="/logo.png" alt="Smart Warehouse Logo" width="32" height="32" className="logo-white" />
            <h3 className="footer-title">Smart Warehouse</h3>
          </Link>
          <p className="footer-description">
            Streamline your inventory management with our powerful and intuitive platform.
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <nav aria-label="Quick links navigation">
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Help & Support</h4>
          <nav aria-label="Support navigation">
            <ul className="footer-links">
              <li>
                <Link to="/docs">Documentation</Link>
              </li>
              <li>
                <Link to="/faqs">FAQs</Link>
              </li>
              <li>
                <Link to="/support">Contact Support</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="copyright">&copy; {currentYear} Smart Warehouse Management System. All rights reserved.</div>
        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
