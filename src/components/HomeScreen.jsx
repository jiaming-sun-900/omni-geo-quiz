export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="home-screen">
      <h1>US Geo Quiz</h1>
      <p className="subtitle">Test your knowledge of US geography</p>
      <div className="mode-buttons">
        <button className="mode-btn" onClick={() => onSelectMode("state")}>
          <span className="mode-icon">🗺</span>
          <span className="mode-label">State Quiz</span>
          <span className="mode-desc">Identify the state from a point on the map</span>
        </button>
        <button className="mode-btn" onClick={() => onSelectMode("city")}>
          <span className="mode-icon">📍</span>
          <span className="mode-label">City Quiz</span>
          <span className="mode-desc">Identify the city from its location</span>
        </button>
      </div>
    </div>
  );
}
