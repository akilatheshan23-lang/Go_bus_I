const Footer = () => (
  <footer className="bg-blue-900 mt-20">
    <div className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z" />
                <circle cx="6.5" cy="16.5" r="1.5" />
                <circle cx="17.5" cy="16.5" r="1.5" />
              </svg>
            </div>
            <span className="font-bold text-xl text-white">GoBus</span>
          </div>
          <p className="text-blue-100 text-lg leading-relaxed mb-6 max-w-md">
            Your trusted online bus ticket booking platform. Travel with confidence and convenience.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-blue-200 hover:text-white transition-colors">
              Facebook
            </a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-blue-200 hover:text-white transition-colors">
              Instagram
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-3">
            <li>
              <a href="/" className="text-blue-200 hover:text-white transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="/booking" className="text-blue-200 hover:text-white transition-colors">
                Book Tickets
              </a>
            </li>
            <li>
              <a href="/history" className="text-blue-200 hover:text-white transition-colors">
                Booking History
              </a>
            </li>
            <li>
              <a href="/support" className="text-blue-200 hover:text-white transition-colors">
                Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white mb-4">Contact</h3>
          <div className="space-y-3 text-blue-200">
            <p>support@gobus.com</p>
            <p>+94 77 123 4567</p>
            <p>
              123 Main St
              <br />
              Colombo, Sri Lanka
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-700 mt-12 pt-8 text-center text-blue-200">
        <p>&copy; {new Date().getFullYear()} GoBus. All rights reserved.</p>
      </div>
    </div>
  </footer>
)

export default Footer
