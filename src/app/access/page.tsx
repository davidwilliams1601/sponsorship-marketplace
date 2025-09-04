import Link from 'next/link';

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex justify-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600">SponsorConnect</h1>
          </Link>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              ✅ Access Granted!
            </h2>
            <p className="text-green-700 mb-4">
              Welcome to SponsorConnect! While we're fixing some technical issues, 
              you can access the main features through the links below.
            </p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/" 
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🏠 Go to Homepage
            </Link>
            
            <Link 
              href="/browse" 
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              🔍 Browse Sponsorship Opportunities
            </Link>
            
            <Link 
              href="/sponsorships/create" 
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              ✨ Create Sponsorship Request
            </Link>
            
            <Link 
              href="/dashboard" 
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              📊 Dashboard (Testing)
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Some pages are still being fixed. If a page doesn't load, 
              come back to this page and try a different link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}