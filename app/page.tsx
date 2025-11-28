import { Suspense } from 'react';
import HyperbeamEmbed from './components/HyperbeamEmbed';
import PasswordGate from './components/PasswordGate';

export default function Home() {
  return (
    <PasswordGate>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-[#0f0f1a] text-white">
          <div className="animate-pulse text-pink-500 text-2xl">💕</div>
        </div>
      }>
        <HyperbeamEmbed />
      </Suspense>
    </PasswordGate>
  );
}
