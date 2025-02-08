import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../src/utils/db';

// Dutch city data
const cities = [
  { city: 'Amsterdam', province: 'Noord-Holland' },
  { city: 'Rotterdam', province: 'Zuid-Holland' },
  { city: 'Den Haag', province: 'Zuid-Holland' },
  { city: 'Utrecht', province: 'Utrecht' },
  { city: 'Eindhoven', province: 'Noord-Brabant' },
  { city: 'Groningen', province: 'Groningen' },
  { city: 'Tilburg', province: 'Noord-Brabant' },
  { city: 'Almere', province: 'Flevoland' },
  { city: 'Breda', province: 'Noord-Brabant' },
  { city: 'Nijmegen', province: 'Gelderland' },
];

// Dutch street names
const streetNames = [
  'Hoofdstraat', 'Kerkstraat', 'Schoolstraat', 'Molenweg',
  'Dorpsstraat', 'Stationsweg', 'Julianalaan', 'Wilhelminastraat',
  'Beatrixlaan', 'Oranjelaan', 'Marktplein', 'Nieuwstraat',
  'Voorstraat', 'Emmaweg', 'Prins Bernhardstraat', 'Koningsweg',
  'Industrieweg', 'Parkweg', 'Lindenlaan', 'Eikenstraat',
];

// Dutch neighborhood names
const neighborhoods = [
  'Centrum', 'Oud-West', 'Noord', 'Oost',
  'Zuid', 'Nieuw-Zuid', 'Westpoort', 'Zuidoost',
  'Buitenveldert', 'Slotervaart', 'Overtoomse Veld', 'De Pijp',
  'Rivierenbuurt', 'Oud-Zuid', 'Watergraafsmeer', 'IJburg',
];

// Dutch municipality names (gemeentes)
const municipalities = [
  'Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht',
  'Eindhoven', 'Groningen', 'Tilburg', 'Almere',
  'Breda', 'Nijmegen', 'Enschede', 'Apeldoorn',
  'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort',
];

// Dutch district names (wijken)
const districts = [
  'Binnenstad', 'Scheveningen', 'Segbroek', 'Loosduinen',
  'Escamp', 'Laak', 'Haagse Hout', 'Centrum',
  'Noord', 'Oost', 'Zuid', 'West',
];

function generateRandomPostalCode(): string {
  const numbers = Math.floor(Math.random() * 9000) + 1000;
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                 String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${numbers}${letters}`;
}

function generateRandomCoordinates(): { latitude: number; longitude: number } {
  // Netherlands approximate boundaries
  const minLat = 50.75;
  const maxLat = 53.55;
  const minLng = 3.35;
  const maxLng = 7.22;

  return {
    latitude: minLat + Math.random() * (maxLat - minLat),
    longitude: minLng + Math.random() * (maxLng - minLng),
  };
}

async function seedAddresses(count: number) {
  console.log('Starting address seeding...');
  const batchSize = 100;
  const batches = Math.ceil(count / batchSize);

  for (let i = 0; i < batches; i++) {
    const addressBatch = Array.from({ length: Math.min(batchSize, count - i * batchSize) }, () => {
      const cityData = cities[Math.floor(Math.random() * cities.length)];
      const coordinates = generateRandomCoordinates();
      
      return {
        streetName: streetNames[Math.floor(Math.random() * streetNames.length)],
        houseNumber: String(Math.floor(Math.random() * 200) + 1),
        postalCode: generateRandomPostalCode(),
        city: cityData.city,
        municipality: municipalities[Math.floor(Math.random() * municipalities.length)],
        province: cityData.province,
        neighborhood: Math.random() > 0.3 ? neighborhoods[Math.floor(Math.random() * neighborhoods.length)] : null,
        district: Math.random() > 0.3 ? districts[Math.floor(Math.random() * districts.length)] : null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
    });

    await prisma.address.createMany({
      data: addressBatch,
    });

    console.log(`Seeded batch ${i + 1}/${batches} (${(i + 1) * batchSize} addresses)`);
  }

  console.log('Address seeding completed!');
}

async function main() {
  try {
    const addressCount = 1000;
    await seedAddresses(addressCount);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 