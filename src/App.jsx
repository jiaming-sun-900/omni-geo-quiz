import { lazy, Suspense, useEffect } from "react";
import HomeScreen from "./components/HomeScreen";
import { useRoute, navigate, setTitleFor } from "./router";
import "./App.css";

// Each mode's definition, keyed by its URL slug (see routes.js). Every one is
// its own chunk, as is the quiz engine and the globe (lazily imported inside
// HomeScreen), so the entry bundle is just the shell and the menu: the us-atlas
// TopoJSON behind the map modes and the Three.js stack behind the globe load
// only when something asks for them.
const MODES = {
  "us-state": () => import("./modes/usState"),
  "us-city": () => import("./modes/usCity"),
  "us-city-satellite": () => import("./modes/usCitySatellite"),
  "us-airport": () => import("./modes/usAirport"),
  "us-airport-satellite": () => import("./modes/usAirportSatellite"),
  "world-city": () => import("./modes/worldCity"),
  "world-airport": () => import("./modes/worldAirport"),
};

// One lazy component per mode: it loads the definition and the shared engine
// together, then renders the engine with that definition.
const QUIZZES = Object.fromEntries(
  Object.entries(MODES).map(([slug, load]) => [
    slug,
    lazy(async () => {
      const [{ default: def }, { default: QuizScreen }] = await Promise.all([
        load(),
        import("./quiz/QuizScreen"),
      ]);
      return { default: (props) => <QuizScreen def={def} {...props} /> };
    }),
  ])
);

// Pages that aren't quiz modes, also code-split.
const AboutScreen = lazy(() => import("./components/AboutScreen"));
const DailyScreen = lazy(() => import("./daily/DailyScreen"));
const PAGES = { about: AboutScreen, daily: DailyScreen };

export default function App() {
  const route = useRoute();

  useEffect(() => {
    setTitleFor(route);
  }, [route]);

  const goHome = () => navigate("");

  const Page = PAGES[route.slug];
  if (Page) {
    return (
      <Suspense fallback={<div className="mode-loading">Loading…</div>}>
        <Page onHome={goHome} />
      </Suspense>
    );
  }

  const Quiz = QUIZZES[route.slug];
  if (!Quiz) return <HomeScreen onSelectMode={navigate} />;

  return (
    <Suspense fallback={<div className="mode-loading">Loading…</div>}>
      {/* Keyed on the slug, so moving between modes is a fresh mount. */}
      <Quiz key={route.slug} onHome={goHome} />
    </Suspense>
  );
}
