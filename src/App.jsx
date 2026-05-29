import { useState } from "react";
import HomeScreen from "./components/HomeScreen";
import StateQuiz from "./components/StateQuiz";
import CityQuiz from "./components/CityQuiz";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState(null);

  if (mode === "state") return <StateQuiz onHome={() => setMode(null)} />;
  if (mode === "city") return <CityQuiz onHome={() => setMode(null)} />;
  return <HomeScreen onSelectMode={setMode} />;
}
