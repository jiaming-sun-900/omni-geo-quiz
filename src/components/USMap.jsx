import { useRef, useEffect, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { select } from "d3-selection";
import * as topojson from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";

const EXCLUDED_IDS = ["02", "15", "60", "66", "69", "72", "78"];

const nation = topojson.feature(usAtlas, usAtlas.objects.nation);
const states = topojson.feature(usAtlas, usAtlas.objects.states).features.filter(
  (f) => !EXCLUDED_IDS.includes(f.id)
);

export { states };

const ASPECT = 0.62; // height / width for AlbersUsa continental fit
const MAX_WIDTH = 1400;

function computeDims() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Reserve vertical space for header (~12vh) and controls (~22vh) → map ~66vh
  const maxByWidth = vw * 0.94;
  const maxByHeight = (vh * 0.66) / ASPECT;
  const w = Math.min(maxByWidth, maxByHeight, MAX_WIDTH);
  return { width: w, height: w * ASPECT };
}

export default function USMap({ dotPosition, revealedStateId }) {
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState(() =>
    typeof window === "undefined"
      ? { width: 900, height: 900 * ASPECT }
      : computeDims()
  );

  useEffect(() => {
    const handleResize = () => setDimensions(computeDims());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const { width: w, height: h } = dimensions;
    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = geoAlbersUsa().fitSize([w, h], nation);
    const path = geoPath().projection(projection);

    // Nation fill — white base under continent + AK/HI insets
    svg
      .append("path")
      .datum(nation)
      .attr("d", path)
      .attr("fill", "#fff")
      .attr("stroke", "none");

    // White filled states — no visible borders
    svg
      .selectAll("path.state")
      .data(states)
      .join("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", (d) => (d.id === revealedStateId ? "#e8f4e8" : "#fff"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5);

    // National border outline (drawn last so it sits on top of state fills)
    svg
      .append("path")
      .datum(nation)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5);

    // Red dot
    if (dotPosition) {
      const projected = projection(dotPosition);
      if (projected) {
        svg
          .append("circle")
          .attr("cx", projected[0])
          .attr("cy", projected[1])
          .attr("r", 6)
          .attr("fill", "#e53e3e")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2);
      }
    }
  }, [dotPosition, revealedStateId, dimensions]);

  return (
    <svg
      ref={svgRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ display: "block", margin: "0 auto" }}
    />
  );
}
