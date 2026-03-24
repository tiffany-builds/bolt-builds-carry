import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { AffirmationCard } from './components/AffirmationCard';
import { TimelineSection } from './components/TimelineSection';
import { BoxesSection } from './components/BoxesSection';
import { NudgesSection } from './components/NudgesSection';
import { FloatingActionButton } from './components/FloatingActionButton';
import { timelineItems, boxes, nudges } from './data';

function App() {
  return (
    <div className="min-h-screen bg-cream pb-32">
      <div className="max-w-2xl mx-auto">
        <StatusBar />

        <div className="px-5 space-y-8">
          <Header />
          <AffirmationCard />
          <TimelineSection items={timelineItems} />
          <BoxesSection boxes={boxes} />
          <NudgesSection initialNudges={nudges} />
        </div>
      </div>

      <FloatingActionButton />
    </div>
  );
}

export default App;
