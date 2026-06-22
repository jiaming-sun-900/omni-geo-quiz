// City list for the World City Satellite Quiz (Mode IV). Mirrors the shape of
// satellite-cities.js but for international cities, with fields the satellite
// fetch + quiz need: name, lat, lng, country, region (continent), funFact, and
// imageFile (the file under public/satellite/world-cities/).
//
// region is one of: Africa, Asia, Europe, North America, South America, Oceania.
//
// lat/lng target the specific landmark / crop point named in
// world-city-quiz-roster.md (e.g. the Eiffel Tower, not the geocoded center of
// Paris), so the fetched image frames a recognizable feature. Coordinates I was
// not fully confident about are tagged // VERIFY for image-review double-check.
//
// imageFile follows the City_Country.jpg convention (spaces -> underscores); a
// country suffix is on every entry for consistency with satellite-cities.js even
// though this list has no name collisions today.
export const satelliteWorldCities = [
  // ---- Asia (16) ----
  { name: "Beijing", lat: 39.9163, lng: 116.3972, country: "China", region: "Asia", funFact: "This city is home to the largest surviving ancient palace complex in the world.", imageFile: "Beijing_China.jpg" },
  { name: "Shanghai", lat: 31.2389, lng: 121.4900, country: "China", region: "Asia", funFact: "This is the country's largest financial center, with a river splitting the skyline into an old bund and a futuristic new district.", imageFile: "Shanghai_China.jpg" },
  { name: "Hong Kong", lat: 22.2880, lng: 114.1680, country: "China", region: "Asia", funFact: "A former British colony known for its skyscraper skyline rising on both sides of a deep natural harbor.", imageFile: "Hong_Kong_China.jpg" },
  { name: "Tokyo", lat: 35.6852, lng: 139.7528, country: "Japan", region: "Asia", funFact: "One of the most populous metropolitan areas in the world, and a global hub for anime and pop culture.", imageFile: "Tokyo_Japan.jpg" },
  { name: "Osaka", lat: 34.6873, lng: 135.5262, country: "Japan", region: "Asia", funFact: "Famous for a 16th century castle surrounded by a massive moat, and widely considered the food capital of its country.", imageFile: "Osaka_Japan.jpg" },
  { name: "Kyoto", lat: 35.0394, lng: 135.7292, country: "Japan", region: "Asia", funFact: "Once the imperial capital for over a thousand years, home to more UNESCO World Heritage temples than any other city in its country.", imageFile: "Kyoto_Japan.jpg" }, // VERIFY landmark choice (Kinkaku-ji vs Kiyomizu-dera)
  { name: "Seoul", lat: 37.5200, lng: 126.9920, country: "South Korea", region: "Asia", funFact: "A major river splits this capital into northern and southern halves, with mountains ringing the city.", imageFile: "Seoul_South_Korea.jpg" }, // VERIFY diffuse crop (Han River bend + Namsan)
  { name: "Singapore", lat: 1.2830, lng: 103.8600, country: "Singapore", region: "Asia", funFact: "A city-state known for a futuristic garden complex topped with structures shaped like a giant ship.", imageFile: "Singapore_Singapore.jpg" },
  { name: "Bangkok", lat: 13.7500, lng: 100.4915, country: "Thailand", region: "Asia", funFact: "Home to an ornate royal palace complex along the banks of a winding river.", imageFile: "Bangkok_Thailand.jpg" },
  { name: "Dubai", lat: 25.1124, lng: 55.1390, country: "UAE", region: "Asia", funFact: "Home to the world's tallest building and a set of artificial islands shaped like palm trees.", imageFile: "Dubai_UAE.jpg" }, // VERIFY zoom: Palm Jumeirah is larger than a single-landmark frame
  { name: "Doha", lat: 25.3690, lng: 51.5510, country: "Qatar", region: "Asia", funFact: "The capital of a Gulf nation that hosted a recent FIFA World Cup.", imageFile: "Doha_Qatar.jpg" },
  { name: "Mumbai", lat: 18.9430, lng: 72.8230, country: "India", region: "Asia", funFact: "The center of the country's film industry, located on a peninsula along the coast.", imageFile: "Mumbai_India.jpg" }, // VERIFY diffuse peninsula crop
  { name: "Agra", lat: 27.1751, lng: 78.0421, country: "India", region: "Asia", funFact: "Home to a white marble mausoleum built for a deceased queen, often called one of the new seven wonders of the world.", imageFile: "Agra_India.jpg" },
  { name: "Istanbul", lat: 41.0250, lng: 28.9740, country: "Turkey", region: "Asia", funFact: "One of the few cities in the world that sits on two continents at once.", imageFile: "Istanbul_Turkey.jpg" },
  { name: "Hanoi", lat: 21.0287, lng: 105.8524, country: "Vietnam", region: "Asia", funFact: "This capital's old quarter wraps around a lake said to be home to a legendary giant turtle.", imageFile: "Hanoi_Vietnam.jpg" },
  { name: "Kuala Lumpur", lat: 3.1579, lng: 101.7116, country: "Malaysia", region: "Asia", funFact: "Home to twin towers that once held the record for the tallest buildings in the world, and still the tallest twin towers today.", imageFile: "Kuala_Lumpur_Malaysia.jpg" },

  // ---- Europe (14) ----
  { name: "Paris", lat: 48.8584, lng: 2.2945, country: "France", region: "Europe", funFact: "A tower built as a temporary structure for a World's Fair became this city's defining landmark.", imageFile: "Paris_France.jpg" },
  { name: "Venice", lat: 45.4380, lng: 12.3358, country: "Italy", region: "Europe", funFact: "An entire city built across more than a hundred small islands in a lagoon, with canals instead of streets.", imageFile: "Venice_Italy.jpg" },
  { name: "Rome", lat: 41.8902, lng: 12.4922, country: "Italy", region: "Europe", funFact: "Once the capital of an empire that lasted a thousand years, and still home to an independent papal state within its walls.", imageFile: "Rome_Italy.jpg" },
  { name: "Milan", lat: 45.4642, lng: 9.1900, country: "Italy", region: "Europe", funFact: "A global fashion capital with one of the largest Gothic cathedrals in Europe.", imageFile: "Milan_Italy.jpg" },
  { name: "London", lat: 51.5033, lng: -0.1196, country: "UK", region: "Europe", funFact: "A large observation wheel stands on one bank of this river, facing a parliament building and its famous clock tower.", imageFile: "London_UK.jpg" },
  { name: "Frankfurt", lat: 50.1106, lng: 8.6700, country: "Germany", region: "Europe", funFact: "Home to the headquarters of the European Central Bank, often called continental Europe's financial center.", imageFile: "Frankfurt_Germany.jpg" },
  { name: "Munich", lat: 48.1374, lng: 11.5755, country: "Germany", region: "Europe", funFact: "Host to the world's largest beer festival every autumn.", imageFile: "Munich_Germany.jpg" }, // VERIFY crop (old town ring vs Olympic Park)
  { name: "Moscow", lat: 55.7539, lng: 37.6208, country: "Russia", region: "Europe", funFact: "A fortified citadel beside a famous red-paved square serves as the seat of power for this country.", imageFile: "Moscow_Russia.jpg" },
  { name: "Barcelona", lat: 41.4036, lng: 2.1744, country: "Spain", region: "Europe", funFact: "Home to a cathedral that has been under construction for more than 140 years.", imageFile: "Barcelona_Spain.jpg" },
  { name: "Amsterdam", lat: 52.3667, lng: 4.8845, country: "Netherlands", region: "Europe", funFact: "A city built around a network of concentric canals, with more bicycles than residents.", imageFile: "Amsterdam_Netherlands.jpg" },
  { name: "Vienna", lat: 48.2082, lng: 16.3650, country: "Austria", region: "Europe", funFact: "Once the imperial capital of a major European dynasty, famous for its classical music tradition.", imageFile: "Vienna_Austria.jpg" }, // VERIFY crop (Ringstrasse ring)
  { name: "Prague", lat: 50.0865, lng: 14.4114, country: "Czechia", region: "Europe", funFact: "An astronomical clock in the old town square has been telling time here since the medieval era.", imageFile: "Prague_Czechia.jpg" },
  { name: "Santorini", lat: 36.4150, lng: 25.4310, country: "Greece", region: "Europe", funFact: "A crescent-shaped island formed by a volcanic eruption, known for its white and blue buildings.", imageFile: "Santorini_Greece.jpg" },
  { name: "Reykjavik", lat: 64.1466, lng: -21.9426, country: "Iceland", region: "Europe", funFact: "One of the northernmost capitals of any sovereign country, heated almost entirely by geothermal energy.", imageFile: "Reykjavik_Iceland.jpg" }, // VERIFY high-latitude coastline crop

  // ---- North America (5, excluding the US) ----
  { name: "Vancouver", lat: 49.2900, lng: -123.1300, country: "Canada", region: "North America", funFact: "A port city surrounded by mountains on three sides and the sea on the fourth, regularly ranked among the world's most livable cities.", imageFile: "Vancouver_Canada.jpg" },
  { name: "Toronto", lat: 43.6426, lng: -79.3871, country: "Canada", region: "North America", funFact: "Once home to the tallest freestanding structure in North America, sitting beside one of the Great Lakes.", imageFile: "Toronto_Canada.jpg" },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332, country: "Mexico", region: "North America", funFact: "Built atop a drained lakebed, once the capital of an ancient empire.", imageFile: "Mexico_City_Mexico.jpg" },
  { name: "Havana", lat: 23.1450, lng: -82.3700, country: "Cuba", region: "North America", funFact: "A seaside city famous for its colorful vintage cars and colonial architecture.", imageFile: "Havana_Cuba.jpg" }, // VERIFY diffuse Malecon coastline crop
  { name: "Panama City", lat: 8.9430, lng: -79.5560, country: "Panama", region: "North America", funFact: "Located right beside a canal that connects the Pacific and Atlantic Oceans.", imageFile: "Panama_City_Panama.jpg" }, // VERIFY canal-entrance crop point

  // ---- South America (6) ----
  { name: "Rio de Janeiro", lat: -22.9519, lng: -43.2105, country: "Brazil", region: "South America", funFact: "A giant statue with outstretched arms stands on a mountaintop overlooking this bay city.", imageFile: "Rio_de_Janeiro_Brazil.jpg" },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, country: "Brazil", region: "South America", funFact: "The most populous city in the Southern Hemisphere, known for its dense high rise skyline.", imageFile: "Sao_Paulo_Brazil.jpg" }, // VERIFY diffuse skyline crop
  { name: "Buenos Aires", lat: -34.6080, lng: -58.3650, country: "Argentina", region: "South America", funFact: "The birthplace of tango, sitting along the banks of a wide river estuary.", imageFile: "Buenos_Aires_Argentina.jpg" },
  { name: "Santiago", lat: -33.4489, lng: -70.6300, country: "Chile", region: "South America", funFact: "A city at the foot of a famous mountain range, with snow capped peaks visible most of the year.", imageFile: "Santiago_Chile.jpg" }, // VERIFY diffuse crop (Andes backdrop)
  { name: "Cartagena", lat: 10.4236, lng: -75.5510, country: "Colombia", region: "South America", funFact: "A Caribbean port city famous for its well preserved colonial walls.", imageFile: "Cartagena_Colombia.jpg" },
  { name: "La Paz", lat: -16.5000, lng: -68.1336, country: "Bolivia", region: "South America", funFact: "The highest administrative capital in the world, built inside a massive valley basin.", imageFile: "La_Paz_Bolivia.jpg" }, // VERIFY diffuse basin crop

  // ---- Africa (7) ----
  { name: "Cairo", lat: 29.9792, lng: 31.1342, country: "Egypt", region: "Africa", funFact: "On the edge of this city stands the only surviving structure from the seven wonders of the ancient world.", imageFile: "Cairo_Egypt.jpg" },
  { name: "Cape Town", lat: -33.9550, lng: 18.4150, country: "South Africa", region: "Africa", funFact: "A seaside city backed by a famous flat-topped mountain.", imageFile: "Cape_Town_South_Africa.jpg" },
  { name: "Marrakech", lat: 31.6258, lng: -7.9890, country: "Morocco", region: "Africa", funFact: "An ancient walled city known for its red walls and bustling open air market square.", imageFile: "Marrakech_Morocco.jpg" },
  { name: "Casablanca", lat: 33.6086, lng: -7.6326, country: "Morocco", region: "Africa", funFact: "A port city made world famous by a classic Hollywood film, even though the movie was never actually filmed there.", imageFile: "Casablanca_Morocco.jpg" },
  { name: "Nairobi", lat: -1.3580, lng: 36.8400, country: "Kenya", region: "Africa", funFact: "One of the few capital cities in the world with a wildlife national park right at its edge.", imageFile: "Nairobi_Kenya.jpg" }, // VERIFY diffuse park-edge crop
  { name: "Zanzibar", lat: -6.1620, lng: 39.1885, country: "Tanzania", region: "Africa", funFact: "An old town on an Indian Ocean island that was once the center of the East African spice trade.", imageFile: "Zanzibar_Tanzania.jpg" }, // VERIFY name simplified from roster's "Zanzibar (Stone Town)"
  { name: "Lagos", lat: 6.4480, lng: 3.4060, country: "Nigeria", region: "Africa", funFact: "One of the most populous cities in Africa, built across a lagoon.", imageFile: "Lagos_Nigeria.jpg" }, // VERIFY diffuse lagoon crop

  // ---- Oceania (6) ----
  { name: "Sydney", lat: -33.8568, lng: 151.2153, country: "Australia", region: "Oceania", funFact: "A white sail shaped opera house stands beside the harbor, the city's most famous landmark.", imageFile: "Sydney_Australia.jpg" },
  { name: "Melbourne", lat: -37.8200, lng: 144.9600, country: "Australia", region: "Oceania", funFact: "Regularly ranked among the world's most livable cities, known for its coffee culture and tram network.", imageFile: "Melbourne_Australia.jpg" },
  { name: "Auckland", lat: -36.8485, lng: 174.7633, country: "New Zealand", region: "Oceania", funFact: "Built on a narrow isthmus between two harbors, with nearly fifty dormant volcanic cones within the city.", imageFile: "Auckland_New_Zealand.jpg" },
  { name: "Wellington", lat: -41.2865, lng: 174.7762, country: "New Zealand", region: "Oceania", funFact: "The southernmost national capital in the world, known for being very windy.", imageFile: "Wellington_New_Zealand.jpg" }, // VERIFY diffuse harbour crop
  { name: "Gold Coast", lat: -28.0023, lng: 153.4300, country: "Australia", region: "Oceania", funFact: "Famous for its long stretch of surf beaches, one of the most popular vacation destinations in its country.", imageFile: "Gold_Coast_Australia.jpg" }, // VERIFY crop (Surfers Paradise beach + canals)
  { name: "Nadi", lat: -17.7730, lng: 177.3770, country: "Fiji", region: "Oceania", funFact: "An island nation in the South Pacific known for its coral reefs and resorts.", imageFile: "Nadi_Fiji.jpg" }, // VERIFY name: roster lists "Fiji (Nadi/Denarau)"; using Nadi/Denarau as the crop
];
