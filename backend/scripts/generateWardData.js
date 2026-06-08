import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const generateGridWards = (city, bounds, rows, cols, names) => {
  const { minLng, maxLng, minLat, maxLat } = bounds;
  const lngStep = (maxLng - minLng) / cols;
  const latStep = (maxLat - minLat) / rows;
  const features = [];
  let idx = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const west = minLng + c * lngStep;
      const east = minLng + (c + 1) * lngStep;
      const south = minLat + r * latStep;
      const north = minLat + (r + 1) * latStep;

      const wardName = idx < names.length ? names[idx] : `Area ${idx + 1}`;

      const ring = [
        [west, south], [east, south], [east, north], [west, north], [west, south],
      ];

      features.push({
        type: "Feature",
        properties: {
          ward_no: idx + 1,
          ward_name: wardName,
        },
        geometry: {
          type: "Polygon",
          coordinates: [ring],
        },
      });
      idx++;
    }
  }

  return {
    type: "FeatureCollection",
    name: city.toLowerCase(),
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features,
  };
};

const prayagrajNames = [
  "Civil Lines", "Teliyarganj", "Old Cantt", "Govindpur", "Ashok Nagar",
  "Mumfordganj", "George Town", "Chowk", "Daraganj", "Jhunsi",
  "Naini", "Attarsuiya", "Rajapur", "Kydganj", "Tagore Town",
  "Dhoomanganj", "Lukerganj", "Muthiganj", "Katra", "Allapur",
  "Kareli", "Bairahana", "Soraon", "Phaphamau", "Karchana",
  "Shahganj", "Rambagh", "New Cantt", "Jhalwa", "Dhanpur",
  "Mau Aima", "Shivkuti", "Pipalganj", "Chatham Lines", "Bharatganj",
  "Pura Mufti", "Salori", "Katra Kotwali", "Baluaghat", "Purai",
  "Havelia", "Sarai Inayat", "Dandi", "Deohat", "Garwa",
  "Gauhaniya", "Ghorahwa", "Harirampur", "Iradatganj", "Jariyari",
  "Jhusi Khas", "Kadipur", "Kailashpuri", "Khuldabad", "Koeripur",
  "Kolhuwa", "Korari", "Kotwa", "Kumhwa", "Lalapur",
  "Mauhari", "Mavi", "Mawaiya", "Mirpur", "Mishirpur",
  "Muradpur", "Nagwa", "Nathupur", "Nehariya", "Newada",
  "Pandari", "Parsara", "Paschim Patti", "Pataitha", "Patti",
  "Pipri", "Pureni", "Rampur", "Sahari", "Sarai Mamrez",
];

const gorakhpurNames = [
  "Golghar", "Mohaddiganj", "Hata", "Shahpur", "Basharatpur",
  "Kasya", "Campierganj", "Buxipur", "Railway Colony", "Rapti Nagar",
  "Ramgarh Tal", "Beltar", "Chargawan", "Piprauli", "Sindhi Bazar",
  "Nakhas", "Bhainsa", "Gulariya", "Kauriram", "Sahjanwa",
  "Butari", "Chimghat", "Dharmshala", "Gheempur", "Jhungiya",
  "Khadar", "Khajani", "Khari", "Khorabar", "Mahatwa",
  "Majhauli", "Mangalpur", "Manikpur", "Mohanpur", "Mote Nagar",
  "Muktidham", "Nathmalpur", "Nausar", "Padrauna", "Pakka Bagh",
  "Pali", "Paraspur", "Parsa", "Patauna", "Patkhapura",
  "Peppiganj", "Phulwariya", "Pipara", "Pipiganj", "Prem Nagar",
  "Qadirganj", "Raja Bazar", "Ramwapur", "Raniganj", "Rasoolpur",
  "Ratanpur", "Salempur", "Sardar Nagar", "Semra", "Shahbazganj",
  "Shiv Nagar", "Shyam Nagar", "Siddiqpur", "Sikta", "Siswa",
  "Sonbarsa", "Sujanpur", "Takia", "Tamkuhi", "Uttar Tola",
];

const prayagrajBounds = { minLng: 81.78, maxLng: 81.93, minLat: 25.38, maxLat: 25.55 };
const gorakhpurBounds = { minLng: 83.34, maxLng: 83.44, minLat: 26.70, maxLat: 26.82 };

const prayagraj = generateGridWards("Prayagraj", prayagrajBounds, 8, 10, prayagrajNames);
const gorakhpur = generateGridWards("Gorakhpur", gorakhpurBounds, 7, 10, gorakhpurNames);

const dataDir = path.resolve(__dirname, "../data");
fs.writeFileSync(`${dataDir}/prayagraj.geojson`, JSON.stringify(prayagraj, null, 2));
fs.writeFileSync(`${dataDir}/gorakhpur.geojson`, JSON.stringify(gorakhpur, null, 2));

console.log(`✅ Generated ${prayagraj.features.length} Prayagraj wards`);
console.log(`✅ Generated ${gorakhpur.features.length} Gorakhpur wards`);
console.log("✅ Files saved to backend/data/");
