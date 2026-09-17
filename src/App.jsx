import { useState, lazy, Suspense } from "react";
import HomeScreen from "./components/HomeScreen";
import "./App.css";

// The quiz modes are code-split. Only the home screen (and the globe with it) is
// in the initial bundle; each quiz's own dependencies — d3-geo, topojson and the
// us-atlas TopoJSON for the map modes — now load when that mode is first opened
// instead of being downloaded by every visitor up front.
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
