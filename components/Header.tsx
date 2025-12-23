import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">
              Life OS
            </h1>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/input"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Input
            </Link>
            <Link
              href="/logs"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Logs
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
