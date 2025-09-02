import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">SponsorConnect</h1>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">How It Works</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 font-medium">Benefits</a>
              <a href="#success-stories" className="text-gray-600 hover:text-gray-900 font-medium">Success Stories</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
            </div>
            <div className="flex space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white pt-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center bg-blue-500 bg-opacity-20 rounded-full px-4 py-2 mb-8">
                <span className="text-sm font-medium">🚀 Trusted by 500+ sports clubs across the UK</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Turn Your Sport Into
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                  Sponsored Success
                </span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-blue-100">
                The UK&apos;s premier marketplace connecting grassroots sports clubs with local businesses. 
                Get the equipment you need while businesses build genuine community connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/auth/register?type=club" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg">
                  🏆 I&apos;m a Sports Club
                </Link>
                <Link href="/auth/register?type=business" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg">
                  🤝 I&apos;m a Business
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-yellow-300">£2.5M+</div>
                  <div className="text-blue-200 text-sm">Sponsorship Matched</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-300">500+</div>
                  <div className="text-blue-200 text-sm">Active Partnerships</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-300">98%</div>
                  <div className="text-blue-200 text-sm">Success Rate</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="bg-white bg-opacity-10 rounded-2xl p-8 backdrop-blur-sm">
                <Image
                  src="/images/hero/business-handshake.jpg"
                  alt="Business partners shaking hands - representing successful sports sponsorship partnerships"
                  width={400}
                  height={320}
                  className="rounded-lg object-cover w-full h-64 md:h-80"
                  priority
                />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 rounded-full p-3 animate-bounce">
                <span className="text-white text-2xl">💰</span>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-yellow-500 rounded-full p-3 animate-pulse">
                <span className="text-white text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 text-6xl">⚽</div>
          <div className="absolute top-40 right-20 text-4xl">🏀</div>
          <div className="absolute bottom-20 left-20 text-5xl">🏈</div>
          <div className="absolute bottom-40 right-10 text-3xl">⚾</div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Grassroots Sports Funding Crisis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Over 40% of grassroots sports clubs struggle to afford basic equipment, while local businesses struggle to find authentic community marketing opportunities.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-red-50 rounded-xl p-8 border border-red-200">
              <h3 className="text-2xl font-bold text-red-800 mb-6">😰 Sports Clubs Struggle With:</h3>
              <ul className="space-y-3 text-red-700">
                <li className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Limited budgets for essential equipment and facilities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Time-consuming traditional fundraising methods</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Difficulty finding willing local sponsors</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-red-500 font-bold">•</span>
                  <span>Rising costs of sports equipment and maintenance</span>
                </li>
              </ul>
            </div>

            <div className="bg-orange-50 rounded-xl p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-orange-800 mb-6">🤔 Local Businesses Face:</h3>
              <ul className="space-y-3 text-orange-700">
                <li className="flex items-start space-x-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Wasted marketing budgets on ineffective advertising</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Lack of authentic community engagement opportunities</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>No clear way to measure sponsorship ROI</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Difficulty reaching their ideal local customer base</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-green-100 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-bold text-green-800">✨ THE SOLUTION</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              SponsorConnect: Where Community Meets Commerce
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;ve created the UK&apos;s first dedicated platform that makes sponsorship simple, transparent, and mutually beneficial.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* For Clubs */}
            <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 rounded-full p-3 mr-4">
                  <span className="text-white text-2xl">🏆</span>
                </div>
                <h3 className="text-2xl font-bold text-blue-900">For Sports Clubs</h3>
              </div>
              
              {/* Club Process Image */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <Image
                  src="/images/process/club-profile.jpg"
                  alt="Youth sports team celebrating together - representing clubs creating successful profiles"
                  width={300}
                  height={160}
                  className="rounded-lg object-cover w-full h-40"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-blue-800">List Your Needs</h4>
                    <p className="text-blue-700">Create a compelling profile showcasing what equipment you need</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-blue-800">Get Discovered</h4>
                    <p className="text-blue-700">Local businesses find you through smart matching</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-blue-800">Secure Funding</h4>
                    <p className="text-blue-700">Receive offers and get funded quickly</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">💡 Average club secures £2,500 within 30 days</p>
              </div>
            </div>

            {/* Connection Visual */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔄</div>
                  <h3 className="font-bold text-gray-800 mb-2">Smart Matching</h3>
                  <p className="text-gray-600 text-sm mb-4">AI-powered algorithm connects the right clubs with the right businesses</p>
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Arrow pointing down */}
              <div className="mt-4 text-4xl text-gray-400 animate-bounce">⬇️</div>
              
              <div className="mt-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full px-6 py-2 font-bold">
                Perfect Match! 🎯
              </div>
            </div>

            {/* For Businesses */}
            <div className="bg-green-50 rounded-xl p-8 border border-green-200">
              <div className="flex items-center mb-6">
                <div className="bg-green-600 rounded-full p-3 mr-4">
                  <span className="text-white text-2xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-green-900">For Businesses</h3>
              </div>
              
              {/* Business Process Image */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <Image
                  src="/images/process/analytics-dashboard.jpg"
                  alt="Business analytics dashboard showing ROI metrics - representing business sponsor tracking"
                  width={300}
                  height={160}
                  className="rounded-lg object-cover w-full h-40"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-green-800">Browse Opportunities</h4>
                    <p className="text-green-700">Filter clubs by location, sport, and budget</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-green-800">Make Strategic Offers</h4>
                    <p className="text-green-700">Choose packages that align with your goals</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-green-800">Track Impact</h4>
                    <p className="text-green-700">Measure ROI with detailed analytics</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800 font-medium">📈 300% better ROI vs traditional advertising</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SponsorConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;ve built the most comprehensive sponsorship platform designed specifically for UK grassroots sports.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Matching</h3>
              <p className="text-gray-600">Our AI-powered algorithm connects clubs with businesses based on location, values, and budget alignment.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">Built-in payment processing with escrow protection ensures safe transactions for both parties.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Track sponsorship performance, brand exposure, and community impact with detailed analytics.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Setup</h3>
              <p className="text-gray-600">Get your profile live in under 10 minutes. Start receiving sponsorship offers within 48 hours.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dedicated Support</h3>
              <p className="text-gray-600">Our UK-based support team helps optimize your sponsorship strategy and maximize success.</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Mobile Ready</h3>
              <p className="text-gray-600">Manage your sponsorships on-the-go with our fully responsive platform that works on any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how SponsorConnect has transformed grassroots sports across the UK.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-shadow">
              {/* Club Image */}
              <div className="bg-blue-100 rounded-lg h-32 mb-4 overflow-hidden">
                <Image
                  src="/images/testimonials/youth-football-team.jpg"
                  alt="Youth football team group photo - Millfield United FC success story"
                  width={280}
                  height={128}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">MU</span>
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Millfield United FC</h3>
                  <p className="text-blue-700 text-sm">Youth Football Club, Somerset</p>
                </div>
              </div>
              <p className="text-blue-800 italic mb-4">
                &ldquo;We secured £3,500 in sponsorship for new training equipment within 3 weeks. 
                SponsorConnect connected us with 5 local businesses who genuinely care about youth development.&rdquo;
              </p>
              <p className="text-blue-600 font-bold">📈 Result: Full season equipment funded</p>
            </div>

            <div className="bg-green-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-shadow">
              {/* Business Image */}
              <div className="bg-green-100 rounded-lg h-32 mb-4 overflow-hidden">
                <Image
                  src="/images/testimonials/business-partnership.jpg"
                  alt="Business partnership handshake - Tech Solutions Ltd success story"
                  width={280}
                  height={128}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Tech Solutions Ltd</h3>
                  <p className="text-green-700 text-sm">Local IT Company, Manchester</p>
                </div>
              </div>
              <p className="text-green-800 italic mb-4">
                &ldquo;Our sponsorship of three local rugby clubs generated more qualified leads than our previous 
                6 months of Google Ads. The community engagement has been incredible.&rdquo;
              </p>
              <p className="text-green-600 font-bold">📈 Result: 340% ROI increase</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow">
              {/* Netball Image */}
              <div className="bg-purple-100 rounded-lg h-32 mb-4 overflow-hidden">
                <Image
                  src="/images/testimonials/netball-team.jpg"
                  alt="Women's sports team athlete - Riverside Netball Club success story"
                  width={280}
                  height={128}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-sm">RN</span>
                </div>
                <div>
                  <h3 className="font-bold text-purple-900">Riverside Netball Club</h3>
                  <p className="text-purple-700 text-sm">Women&apos;s League, Birmingham</p>
                </div>
              </div>
              <p className="text-purple-800 italic mb-4">
                &ldquo;After struggling for years with fundraising, we found 4 sponsors in 2 months through 
                SponsorConnect. Our new uniforms and court equipment have transformed our club.&rdquo;
              </p>
              <p className="text-purple-600 font-bold">📈 Result: £4,200 raised total</p>
            </div>
          </div>
          
          {/* Before/After Visual */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">The Transformation</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-4">
                  <div className="text-6xl mb-4">😰</div>
                  <h4 className="font-bold text-red-800 mb-2">Before SponsorConnect</h4>
                  <ul className="text-red-700 text-sm space-y-2">
                    <li>• Struggling to fund basic equipment</li>
                    <li>• Hours spent on traditional fundraising</li>
                    <li>• Limited local business connections</li>
                    <li>• Uncertain funding for next season</li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200 mb-4">
                  <div className="text-6xl mb-4">🎉</div>
                  <h4 className="font-bold text-green-800 mb-2">After SponsorConnect</h4>
                  <ul className="text-green-700 text-sm space-y-2">
                    <li>• Equipment fully funded in weeks</li>
                    <li>• Strong community partnerships built</li>
                    <li>• Reliable sponsors for long-term growth</li>
                    <li>• Focus on what matters: the sport</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Only pay when you succeed. One simple fee structure for everyone.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-xl border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold">FOR EVERYONE</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">One Simple Fee</h3>
                <div className="text-6xl font-bold text-blue-600 mb-2">10%</div>
                <p className="text-xl text-gray-600">Platform fee on successful sponsorship deals</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-6 mb-4">
                    <div className="text-4xl mb-2">🏆</div>
                    <h4 className="font-bold text-blue-900 mb-2">Sports Clubs</h4>
                    <p className="text-blue-700 text-sm">Get started completely free</p>
                  </div>
                  <ul className="text-left space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Create unlimited sponsorship requests</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Access to all businesses</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Secure payment processing</span>
                    </li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <div className="bg-green-50 rounded-lg p-6 mb-4">
                    <div className="text-4xl mb-2">🤝</div>
                    <h4 className="font-bold text-green-900 mb-2">Businesses</h4>
                    <p className="text-green-700 text-sm">Get started completely free</p>
                  </div>
                  <ul className="text-left space-y-2 text-sm">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Browse all sponsorship opportunities</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Advanced filtering and search</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>ROI analytics and reporting</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h4 className="font-bold text-gray-900 mb-3 text-center">How it works:</h4>
                <div className="text-center text-gray-700">
                  <p className="mb-2">✨ <strong>No upfront costs</strong> - Join completely free</p>
                  <p className="mb-2">🤝 <strong>Connect & negotiate</strong> - Use our platform at no charge</p>
                  <p className="mb-2">💰 <strong>Pay only on success</strong> - 10% fee when sponsorship is completed</p>
                  <p className="text-sm text-gray-600 mt-3">The 10% fee is automatically deducted from sponsorship payments processed through our secure platform.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register?type=club" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors">
                  Join as Sports Club
                </Link>
                <Link href="/auth/register?type=business" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors">
                  Join as Business
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Community?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
            Join over 500 sports clubs and 200 businesses already using SponsorConnect to build stronger communities through sport.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?type=club" className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105">
              Join as Sports Club
            </Link>
            <Link href="/auth/register?type=business" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105">
              Join as Business
            </Link>
          </div>
          <p className="mt-8 text-blue-200 text-sm">
            ⭐ Rated 4.9/5 by users • 🔒 Secure & trusted • 📞 UK-based support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-blue-400 mb-4">SponsorConnect</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                The UK&apos;s leading marketplace connecting grassroots sports clubs with local business sponsors. 
                Building stronger communities through sport.
              </p>
              <div className="flex space-x-4">
                <span className="text-gray-400 text-sm">🏆 500+ Clubs</span>
                <span className="text-gray-400 text-sm">🤝 200+ Businesses</span>
                <span className="text-gray-400 text-sm">£2.5M+ Matched</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">For Sports Clubs</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/register?type=club" className="hover:text-white">Get Started Free</Link></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
                <li><a href="#success-stories" className="hover:text-white">Success Stories</a></li>
                <li><a href="#benefits" className="hover:text-white">Benefits</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">For Businesses</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/register?type=business" className="hover:text-white">Start Free Trial</Link></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#benefits" className="hover:text-white">Platform Benefits</a></li>
                <li><Link href="/auth/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 SponsorConnect. Made with ❤️ for grassroots sports in the UK.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}