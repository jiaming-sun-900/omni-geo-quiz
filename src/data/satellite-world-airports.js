// Airport list for the World Airport Satellite Quiz (Mode V). Satellite only,
// 60 international airports (no US airports — those live in the US Airport Quiz),
// spanning six continents. Schema mirrors what the satellite fetch + quiz need:
//
//   { name, iata, city, country, region, lat, lng, imageFile }
//
// region is one of: Africa, Asia, Europe, North America, South America, Oceania.
//
// lat/lng target the geometric center of each airport's runway layout (the
// airport reference point), not the city centroid, so the fetched image frames
// the airfield. Coordinates I was not fully confident about — or where the
// runways are spread far enough apart that the crop center needs a review pass —
// are tagged // VERIFY for image-review double-check.
//
// imageFile is the IATA code + .jpg (HKG.jpg, LHR.jpg). IATA codes are globally
// unique, so no disambiguating suffix is needed.
export const satelliteWorldAirports = [
  // ---- Asia (23) ----
  { name: "Beijing Capital International", iata: "PEK", city: "Beijing", country: "China", region: "Asia", lat: 40.0725, lng: 116.5975, imageFile: "PEK.jpg" },
  { name: "Beijing Daxing International", iata: "PKX", city: "Beijing", country: "China", region: "Asia", lat: 39.5093, lng: 116.4108, imageFile: "PKX.jpg" },
  { name: "Shanghai Pudong International", iata: "PVG", city: "Shanghai", country: "China", region: "Asia", lat: 31.1443, lng: 121.8083, imageFile: "PVG.jpg" },
  { name: "Shanghai Hongqiao International", iata: "SHA", city: "Shanghai", country: "China", region: "Asia", lat: 31.1979, lng: 121.3363, imageFile: "SHA.jpg" },
  { name: "Hong Kong International", iata: "HKG", city: "Hong Kong", country: "China", region: "Asia", lat: 22.3089, lng: 113.9148, imageFile: "HKG.jpg" }, // crop: artificial island, frame the whole platform
  { name: "Tokyo Haneda", iata: "HND", city: "Tokyo", country: "Japan", region: "Asia", lat: 35.5494, lng: 139.7798, imageFile: "HND.jpg" }, // crop: large bay reclamation, fan of runways
  { name: "Tokyo Narita", iata: "NRT", city: "Tokyo", country: "Japan", region: "Asia", lat: 35.7720, lng: 140.3929, imageFile: "NRT.jpg" }, // VERIFY two offset parallel runways spread N-S
  { name: "New Chitose", iata: "CTS", city: "Sapporo", country: "Japan", region: "Asia", lat: 42.7752, lng: 141.6923, imageFile: "CTS.jpg" }, // VERIFY ARP recall
  { name: "Kansai International", iata: "KIX", city: "Osaka", country: "Japan", region: "Asia", lat: 34.4320, lng: 135.2304, imageFile: "KIX.jpg" }, // crop: oval artificial island, two long runways
  { name: "Itami", iata: "ITM", city: "Osaka", country: "Japan", region: "Asia", lat: 34.7855, lng: 135.4382, imageFile: "ITM.jpg" },
  { name: "Incheon International", iata: "ICN", city: "Seoul", country: "South Korea", region: "Asia", lat: 37.4630, lng: 126.4407, imageFile: "ICN.jpg" }, // crop: island airport, water on multiple sides
  { name: "Singapore Changi", iata: "SIN", city: "Singapore", country: "Singapore", region: "Asia", lat: 1.3592, lng: 103.9894, imageFile: "SIN.jpg" },
  { name: "Suvarnabhumi", iata: "BKK", city: "Bangkok", country: "Thailand", region: "Asia", lat: 13.6900, lng: 100.7501, imageFile: "BKK.jpg" },
  { name: "Kuala Lumpur International", iata: "KUL", city: "Kuala Lumpur", country: "Malaysia", region: "Asia", lat: 2.7456, lng: 101.7099, imageFile: "KUL.jpg" }, // VERIFY runways spread far apart; crop center may need nudging
  { name: "Tan Son Nhat International", iata: "SGN", city: "Ho Chi Minh City", country: "Vietnam", region: "Asia", lat: 10.8188, lng: 106.6519, imageFile: "SGN.jpg" },
  { name: "Ninoy Aquino International", iata: "MNL", city: "Manila", country: "Philippines", region: "Asia", lat: 14.5086, lng: 121.0194, imageFile: "MNL.jpg" },
  { name: "Soekarno-Hatta International", iata: "CGK", city: "Jakarta", country: "Indonesia", region: "Asia", lat: -6.1256, lng: 106.6559, imageFile: "CGK.jpg" },
  { name: "Ngurah Rai International", iata: "DPS", city: "Bali", country: "Indonesia", region: "Asia", lat: -8.7481, lng: 115.1672, imageFile: "DPS.jpg" }, // crop: single runway jutting over the coast
  { name: "Dubai International", iata: "DXB", city: "Dubai", country: "UAE", region: "Asia", lat: 25.2528, lng: 55.3644, imageFile: "DXB.jpg" },
  { name: "Abu Dhabi International", iata: "AUH", city: "Abu Dhabi", country: "UAE", region: "Asia", lat: 24.4330, lng: 54.6511, imageFile: "AUH.jpg" },
  { name: "Hamad International", iata: "DOH", city: "Doha", country: "Qatar", region: "Asia", lat: 25.2731, lng: 51.6081, imageFile: "DOH.jpg" }, // crop: reclamation jutting into the gulf
  { name: "Istanbul Airport", iata: "IST", city: "Istanbul", country: "Turkey", region: "Asia", lat: 41.2619, lng: 28.7414, imageFile: "IST.jpg" }, // VERIFY very large footprint, crop center approximate
  { name: "Indira Gandhi International", iata: "DEL", city: "Delhi", country: "India", region: "Asia", lat: 28.5562, lng: 77.1000, imageFile: "DEL.jpg" },

  // ---- Europe (15) ----
  { name: "London Heathrow", iata: "LHR", city: "London", country: "UK", region: "Europe", lat: 51.4700, lng: -0.4543, imageFile: "LHR.jpg" },
  { name: "London Gatwick", iata: "LGW", city: "London", country: "UK", region: "Europe", lat: 51.1537, lng: -0.1821, imageFile: "LGW.jpg" },
  { name: "Paris Charles de Gaulle", iata: "CDG", city: "Paris", country: "France", region: "Europe", lat: 49.0097, lng: 2.5479, imageFile: "CDG.jpg" },
  { name: "Amsterdam Schiphol", iata: "AMS", city: "Amsterdam", country: "Netherlands", region: "Europe", lat: 52.3105, lng: 4.7683, imageFile: "AMS.jpg" }, // crop: six runways spread wide; center is the terminal core
  { name: "Frankfurt Airport", iata: "FRA", city: "Frankfurt", country: "Germany", region: "Europe", lat: 50.0379, lng: 8.5622, imageFile: "FRA.jpg" },
  { name: "Munich Airport", iata: "MUC", city: "Munich", country: "Germany", region: "Europe", lat: 48.3538, lng: 11.7861, imageFile: "MUC.jpg" },
  { name: "Madrid Barajas", iata: "MAD", city: "Madrid", country: "Spain", region: "Europe", lat: 40.4719, lng: -3.5626, imageFile: "MAD.jpg" },
  { name: "Barcelona El Prat", iata: "BCN", city: "Barcelona", country: "Spain", region: "Europe", lat: 41.2971, lng: 2.0785, imageFile: "BCN.jpg" },
  { name: "Rome Fiumicino", iata: "FCO", city: "Rome", country: "Italy", region: "Europe", lat: 41.8003, lng: 12.2389, imageFile: "FCO.jpg" },
  { name: "Zurich Airport", iata: "ZRH", city: "Zurich", country: "Switzerland", region: "Europe", lat: 47.4582, lng: 8.5550, imageFile: "ZRH.jpg" },
  { name: "Vienna International", iata: "VIE", city: "Vienna", country: "Austria", region: "Europe", lat: 48.1103, lng: 16.5697, imageFile: "VIE.jpg" },
  { name: "Stockholm Arlanda", iata: "ARN", city: "Stockholm", country: "Sweden", region: "Europe", lat: 59.6498, lng: 17.9239, imageFile: "ARN.jpg" }, // VERIFY three runways spread out; crop center approximate
  { name: "Athens International", iata: "ATH", city: "Athens", country: "Greece", region: "Europe", lat: 37.9364, lng: 23.9445, imageFile: "ATH.jpg" },
  { name: "Keflavik International", iata: "KEF", city: "Reykjavik", country: "Iceland", region: "Europe", lat: 63.9850, lng: -22.6056, imageFile: "KEF.jpg" }, // high-latitude image quality note
  { name: "Helsinki Vantaa", iata: "HEL", city: "Helsinki", country: "Finland", region: "Europe", lat: 60.3172, lng: 24.9633, imageFile: "HEL.jpg" },

  // ---- North America (6, excluding the US) ----
  { name: "Toronto Pearson", iata: "YYZ", city: "Toronto", country: "Canada", region: "North America", lat: 43.6777, lng: -79.6248, imageFile: "YYZ.jpg" },
  { name: "Vancouver International", iata: "YVR", city: "Vancouver", country: "Canada", region: "North America", lat: 49.1939, lng: -123.1844, imageFile: "YVR.jpg" }, // crop: Sea Island, water on three sides
  { name: "Montreal Trudeau", iata: "YUL", city: "Montreal", country: "Canada", region: "North America", lat: 45.4706, lng: -73.7408, imageFile: "YUL.jpg" },
  { name: "Mexico City International", iata: "MEX", city: "Mexico City", country: "Mexico", region: "North America", lat: 19.4363, lng: -99.0721, imageFile: "MEX.jpg" },
  { name: "Cancun International", iata: "CUN", city: "Cancun", country: "Mexico", region: "North America", lat: 21.0365, lng: -86.8771, imageFile: "CUN.jpg" },
  { name: "Tocumen International", iata: "PTY", city: "Panama City", country: "Panama", region: "North America", lat: 9.0714, lng: -79.3835, imageFile: "PTY.jpg" }, // VERIFY ARP recall

  // ---- South America (6) ----
  { name: "Guarulhos International", iata: "GRU", city: "São Paulo", country: "Brazil", region: "South America", lat: -23.4356, lng: -46.4731, imageFile: "GRU.jpg" },
  { name: "Galeão International", iata: "GIG", city: "Rio de Janeiro", country: "Brazil", region: "South America", lat: -22.8099, lng: -43.2506, imageFile: "GIG.jpg" }, // crop: island in Guanabara Bay, water around
  { name: "Ezeiza International", iata: "EZE", city: "Buenos Aires", country: "Argentina", region: "South America", lat: -34.8222, lng: -58.5358, imageFile: "EZE.jpg" },
  { name: "Santiago International", iata: "SCL", city: "Santiago", country: "Chile", region: "South America", lat: -33.3930, lng: -70.7858, imageFile: "SCL.jpg" }, // VERIFY ARP recall
  { name: "El Dorado International", iata: "BOG", city: "Bogotá", country: "Colombia", region: "South America", lat: 4.7016, lng: -74.1469, imageFile: "BOG.jpg" }, // VERIFY ARP recall
  { name: "Jorge Chávez International", iata: "LIM", city: "Lima", country: "Peru", region: "South America", lat: -12.0219, lng: -77.1143, imageFile: "LIM.jpg" }, // crop: runway hugging the Pacific coast

  // ---- Africa (5) ----
  { name: "Cairo International", iata: "CAI", city: "Cairo", country: "Egypt", region: "Africa", lat: 30.1219, lng: 31.4056, imageFile: "CAI.jpg" },
  { name: "O.R. Tambo International", iata: "JNB", city: "Johannesburg", country: "South Africa", region: "Africa", lat: -26.1392, lng: 28.2460, imageFile: "JNB.jpg" },
  { name: "Cape Town International", iata: "CPT", city: "Cape Town", country: "South Africa", region: "Africa", lat: -33.9694, lng: 18.6019, imageFile: "CPT.jpg" },
  { name: "Mohammed V International", iata: "CMN", city: "Casablanca", country: "Morocco", region: "Africa", lat: 33.3675, lng: -7.5897, imageFile: "CMN.jpg" }, // VERIFY ARP recall
  { name: "Bole International", iata: "ADD", city: "Addis Ababa", country: "Ethiopia", region: "Africa", lat: 8.9778, lng: 38.7993, imageFile: "ADD.jpg" }, // VERIFY ARP recall

  // ---- Oceania (5) ----
  { name: "Sydney Kingsford Smith", iata: "SYD", city: "Sydney", country: "Australia", region: "Oceania", lat: -33.9399, lng: 151.1753, imageFile: "SYD.jpg" }, // crop: runways jutting into Botany Bay
  { name: "Melbourne Tullamarine", iata: "MEL", city: "Melbourne", country: "Australia", region: "Oceania", lat: -37.6690, lng: 144.8410, imageFile: "MEL.jpg" },
  { name: "Brisbane Airport", iata: "BNE", city: "Brisbane", country: "Australia", region: "Oceania", lat: -27.3842, lng: 153.1175, imageFile: "BNE.jpg" },
  { name: "Auckland Airport", iata: "AKL", city: "Auckland", country: "New Zealand", region: "Oceania", lat: -37.0081, lng: 174.7920, imageFile: "AKL.jpg" },
  { name: "Perth Airport", iata: "PER", city: "Perth", country: "Australia", region: "Oceania", lat: -31.9403, lng: 115.9669, imageFile: "PER.jpg" },
];
