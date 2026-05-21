import Link from 'next/link';
import { Infinity, Store, UploadCloud, FileCheck2, CreditCard } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 px-4 flex flex-col items-center text-center">
        <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl">
          Skip the queue. <br /> <span className="text-primary">Print smarter.</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Upload documents remotely, pay online securely, and track your spot in the live queue. Never waste time waiting at the xerox shop again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/upload" className="w-full sm:w-auto bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
            Upload & Print
          </Link>
          <Link href="/signup" className="w-full sm:w-auto bg-card border-2 border-border text-foreground px-8 py-4 rounded-xl font-semibold text-lg hover:border-primary/50 transition-colors">
            I'm a Shop Owner
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full max-w-6xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload from anywhere</h3>
          <p className="text-muted-foreground">Send your PDFs directly from your phone or laptop. No pen drives needed.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <FileCheck2 className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Live queue tracking</h3>
          <p className="text-muted-foreground">Watch your document move through the queue in real-time. Arrive just in time.</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Pay online securely</h3>
          <p className="text-muted-foreground">No cash hassles. Pay exact amounts instantly via UPI or cards.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-muted/50 py-24 px-4 mt-auto border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-primary/20">1</div>
              <h4 className="font-semibold text-lg mb-2">Upload</h4>
              <p className="text-sm text-muted-foreground">Upload your document securely</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-primary/20">2</div>
              <h4 className="font-semibold text-lg mb-2">Configure</h4>
              <p className="text-sm text-muted-foreground">Choose B&W/Color and sides</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-primary/20">3</div>
              <h4 className="font-semibold text-lg mb-2">Pay</h4>
              <p className="text-sm text-muted-foreground">Complete payment online</p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl mb-4 shadow-lg shadow-primary/20">4</div>
              <h4 className="font-semibold text-lg mb-2">Collect</h4>
              <p className="text-sm text-muted-foreground">Pick up when ready</p>
            </div>
            
            {/* Connecting line */}
            <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-[2px] bg-primary/20 -z-0"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        <div className="flex items-center justify-center mb-2">
          <span className="font-bold text-foreground flex items-center">
            <span className="text-lg">L</span>
            <Infinity className="w-5 h-5 -ml-[1px] stroke-[3]" />
          </span>
          <span className="ml-1 font-semibold">PrintLOO</span>
        </div>
        <p>© 2026 PrintLOO. The modern way to print.</p>
      </footer>
    </div>
  );
}
