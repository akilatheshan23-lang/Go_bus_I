import Navbar from "./Navbar"
import Footer from "./Footer"

const Homepage = () => (
  <div className="min-h-screen bg-blue-50">


    {/* Hero Section */}
    <main className="max-w-7xl mx-auto px-6">
      <section className="py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-5xl md:text-7xl font-bold text-blue-800 mb-6 text-balance">
              Travel just got <span className="text-blue-600">easier</span>
            </h1>
            <p className="text-xl text-blue-700 mb-8 max-w-2xl text-pretty leading-relaxed">
              Book your bus tickets easily, securely, and instantly online. Enjoy a hassle-free travel experience with
              real-time seat selection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/booking"
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Book Now
              </a>
              <a
                href="/routes"
                className="border border-blue-600 text-blue-800 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-100 transition-colors"
              >
                View Routes
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <img
              src="/modern-bus-traveling-on-highway-with-beautiful-lan.jpg"
              alt="Modern bus on scenic route"
              className="w-full h-auto rounded-2xl shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">Why choose GoBus?</h2>
          <p className="text-xl text-blue-700">Experience the best in bus travel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-blue-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <img
                src="/person-booking-bus-ticket-on-smartphone-app-interf.jpg"
                alt="Easy booking process"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-blue-800 mb-3">Instant Booking</h3>
            <p className="text-blue-700 leading-relaxed">
              Select your route, choose your seat, and book in minutes with our streamlined process.
            </p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <img
                src="/secure-payment-with-credit-card-and-shield-icon-di.jpg"
                alt="Secure payment system"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-blue-800 mb-3">Secure Payment</h3>
            <p className="text-blue-700 leading-relaxed">
              Pay securely online with multiple payment options and get instant confirmation.
            </p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <img
                src="/friendly-customer-support-representative-with-head.jpg"
                alt="24/7 customer support"
                className="w-full h-48 object-cover rounded-xl"
              />
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636l-1.414 1.414A9 9 0 105.636 18.364l1.414-1.414"
                />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-blue-800 mb-3">24/7 Support</h3>
            <p className="text-blue-700 leading-relaxed">
              Our dedicated support team is here to help you anytime, anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="bg-blue-100 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src="/abstract-geometric-pattern-with-bus-and-travel-ico.jpg" alt="Background pattern" className="w-full h-full object-cover" />
          </div>

          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">Trusted by thousands of travelers</h2>
              <p className="text-blue-700 text-lg">Join our growing community of satisfied customers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-blue-700">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
                <div className="text-blue-700">Routes Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-blue-700">Uptime Guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-800 mb-4">What our customers say</h2>
          <p className="text-xl text-blue-700">Real experiences from real travelers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <img
                src="/professional-headshot-of-happy-female-customer-smi.jpg"
                alt="Customer testimonial"
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-semibold text-blue-800">Sarah Johnson</h4>
                <p className="text-blue-600 text-sm">Business Traveler</p>
              </div>
            </div>
            <p className="text-blue-700 leading-relaxed">
              "GoBus made my weekly commute so much easier. The booking process is seamless and the buses are always on
              time!"
            </p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <img
                src="/professional-headshot-of-happy-male-customer-smili.jpg"
                alt="Customer testimonial"
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-semibold text-blue-800">Mike Chen</h4>
                <p className="text-blue-600 text-sm">Student</p>
              </div>
            </div>
            <p className="text-blue-700 leading-relaxed">
              "As a student, I love the affordable prices and reliable service. Perfect for weekend trips home!"
            </p>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center mb-4">
              <img
                src="/abstract-geometric-pattern-with-bus-and-travel-ico.jpg"
                alt="Customer testimonial"
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h4 className="font-semibold text-blue-800">Emma Davis</h4>
                <p className="text-blue-600 text-sm">Retiree</p>
              </div>
            </div>
            <p className="text-blue-700 leading-relaxed">
              "The customer service is exceptional. They helped me reschedule my trip with no hassle at all."
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img
              src="/scenic-highway-with-mountains-and-sunset-for-trave.jpg"
              alt="Travel inspiration background"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Ready to start your journey?</h2>
            <p className="text-xl mb-8 text-pretty opacity-90">
              Book your next bus ticket in just a few clicks and travel with confidence.
            </p>
            <a
              href="/booking"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors inline-block"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>
    </main>


  </div>
)

export default Homepage
