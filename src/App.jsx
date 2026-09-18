import { useState, lazy, Suspense } from "react";
import HomeScreen from "./components/HomeScreen";
import "./App.css";

// Every quiz mode is code-split, and so is the globe (lazily imported inside
// HomeScreen). The entry bundle is therefore just the shell and the menu: the
// us-atlas TopoJSON behind the map modes and the Three.js/d3-geo stack behind
// the globe each load only when something actually asks for them.
const StateQuiz = lazy(() => import("./components/StateQuiz"));
const CityQuiz = lazy(() => import("./components/CityQuiz"));
const AirportQuiz = lazy(() => import("./components/AirportQuiz"));
const AirportSatelliteQuiz = lazy(() =>
  import("./components/AirportSatelliteQuiz")
);
const CitySatelliteQuiz = lazy(() => import("./components/CitySatelliteQuiz"));
const WorldCitySatelliteQuiz = lazy(() =>
  import("./components/WorldCitySatelliteQuiz")
);
const WorldAirportSatelliteQuiz = lazy(() =>
  import("./components/WorldAirportSatelliteQuiz")
);

const QUIZZES = {
  state: StateQuiz,
  city: CityQuiz,
  airport: AirportQuiz,
  "airport-satellite": AirportSatelliteQuiz,
  "city-satellite": CitySatelliteQuiz,
  "world-city-satellite": WorldCitySatelliteQuiz,
  "world-airport-satellite": WorldAirportSatelliteQuiz,
};

export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) return <HomeScreen onSelectMode={setMode} />;

  const Quiz = QUIZZES[mode];
  return (
    <Suspense fallback={<div className="mode-loading">Loading…</div>}>
      <Quiz onHome={() => setMode(null)} />
    </Suspense>
  );
}
