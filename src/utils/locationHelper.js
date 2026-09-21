/**
 * Location Intelligence & Regional Micro-Market Normalizer
 * Extracts and maps regional zone (East, North, South, West, Central Bangalore)
 * and sub-localities (Whitefield, Yelahanka, Panathur, Soukya Road, Budigere Cross, etc.)
 */

// Micro-market mapping rules for Bangalore
const BANGALORE_LOCALITIES = [
  // EAST BANGALORE
  {
    name: 'Whitefield',
    zone: 'East Bangalore',
    keywords: ['whitefield', 'windsor', 'radical rhapsody', 'pursuit of a radical rhapsody', 'hope farm', 'kadugodi', 'itpl', 'channasandra', 'seegehalli']
  },
  {
    name: 'Panathur',
    zone: 'East Bangalore',
    keywords: ['panathur', 'neopolis', 'sobha neopolis', 'balagere', 'varthur road', 'bellandur road']
  },
  {
    name: 'Soukya Road',
    zone: 'East Bangalore',
    keywords: ['soukya', 'sky samurai', 'ds max sky samurai', 'samurai', 'soukya road', 'huskur']
  },
  {
    name: 'Budigere Cross',
    zone: 'East Bangalore',
    keywords: ['budigere', 'citrine', 'brigade citrine', 'natures nest', 'nps natures nest', 'budigere cross', 'mandur', 'old madras road']
  },
  {
    name: 'Sarjapur Road',
    zone: 'East Bangalore',
    keywords: ['sarjapur', 'sarjapur road', 'carmelaram', 'dommasandra', 'sompura', 'hadosiddapura', 'harlur', 'kasavanahalli', 'kaikondrahalli']
  },
  {
    name: 'Marathahalli',
    zone: 'East Bangalore',
    keywords: ['marathahalli', 'marathalli', 'munnekollal', 'kundanahalli', 'brookefield', 'aecs layout']
  },
  {
    name: 'KR Puram',
    zone: 'East Bangalore',
    keywords: ['kr puram', 'k.r. puram', 'krishnarajapuram', 'battarahalli', 'hoodi', 'tc palya', 'ramamurthy nagar', 'kasturi nagar']
  },
  {
    name: 'Varthur',
    zone: 'East Bangalore',
    keywords: ['varthur', 'gunjur', 'sorahunase']
  },
  {
    name: 'Bellandur',
    zone: 'East Bangalore',
    keywords: ['bellandur', 'outer ring road east', 'ecospace', 'ibblur', 'green glen layout']
  },

  // NORTH BANGALORE
  {
    name: 'Yelahanka',
    zone: 'North Bangalore',
    keywords: ['yelahanka', 'kindle', 'century kindle', 'yelahanka new town', 'attur', 'kogilu', 'crpf campus']
  },
  {
    name: 'Thanisandra',
    zone: 'North Bangalore',
    keywords: ['thanisandra', 'fiorana', 'beaumont', 'lodha fiorana', 'manyata', 'manyata tech park', 'nagavara', 'bhartiya city']
  },
  {
    name: 'Hebbal',
    zone: 'North Bangalore',
    keywords: ['hebbal', 'kempapura', 'sahakara nagar', 'amruthahalli', 'kodigehalli', 'bellary road']
  },
  {
    name: 'Devanahalli',
    zone: 'North Bangalore',
    keywords: ['devanahalli', 'airport', 'bial', 'kia', 'aerotropolis', 'shettigere', 'kundana']
  },
  {
    name: 'Bagalur',
    zone: 'North Bangalore',
    keywords: ['bagalur', 'palm acres', 'adarsh palm acres', 'aerospace park', 'kiadb', 'bandikodigehalli', 'bagalur road']
  },
  {
    name: 'Hennur Road',
    zone: 'North Bangalore',
    keywords: ['hennur', 'hennur road', 'geddalahalli', 'kothanur', 'horamavu', 'horamavu agara', 'byrathi', 'guggal']
  },
  {
    name: 'Jakkur',
    zone: 'North Bangalore',
    keywords: ['jakkur', 'jakkur aerodrome', 'talacauvery', 'sampigehalli']
  },

  // SOUTH BANGALORE
  {
    name: 'Kanakapura Road',
    zone: 'South Bangalore',
    keywords: ['kanakapura', 'kanakapura road', 'vajarahalli', 'thalaghattapura', 'kaggalipura', 'konanakunte', 'anujanapura']
  },
  {
    name: 'Bannerghatta Road',
    zone: 'South Bangalore',
    keywords: ['bannerghatta', 'bannerghatta road', 'hulimavu', 'arekere', 'bilekahalli', 'gottigere', 'kalena agrahara']
  },
  {
    name: 'Electronic City',
    zone: 'South Bangalore',
    keywords: ['electronic city', 'electronics city', 'e-city', 'neotown', 'chandapura', 'bommasandra', 'attibele', 'hosa road']
  },
  {
    name: 'JP Nagar',
    zone: 'South Bangalore',
    keywords: ['jp nagar', 'j.p. nagar', 'sarakki', 'puttenahalli', 'elita promenade']
  },
  {
    name: 'Jayanagar',
    zone: 'South Bangalore',
    keywords: ['jayanagar', 'south end', 'yediyur', 'tilak nagar']
  },
  {
    name: 'BTM Layout',
    zone: 'South Bangalore',
    keywords: ['btm', 'btm layout', 'madiwala', 'tavarekere', 'kuvempu nagar']
  },
  {
    name: 'Banashankari',
    zone: 'South Bangalore',
    keywords: ['banashankari', 'bsk', 'padmanabhanagar', 'girinagar', 'chikkalasandra', 'kathriguppe', 'uttarahalli']
  },
  {
    name: 'HSR Layout',
    zone: 'South Bangalore',
    keywords: ['hsr', 'hsr layout', 'sector 1', 'sector 2', 'sector 3', 'sector 7', 'haralur']
  },

  // WEST BANGALORE
  {
    name: 'Rajajinagar',
    zone: 'West Bangalore',
    keywords: ['rajajinagar', 'rajaji nagar', 'orion mall', 'brigade gateway', 'dr rajkumar road']
  },
  {
    name: 'Malleshwaram',
    zone: 'West Bangalore',
    keywords: ['malleshwaram', 'malleswaram', 'sadashivanagar', 'vyalikaval', 'malleswaram west']
  },
  {
    name: 'Yeshwanthpur',
    zone: 'West Bangalore',
    keywords: ['yeshwanthpur', 'yeshvantpur', 'gorguntepalya', 'peenya', 'tumkur road', 'mathikere', 'jalahalli']
  },
  {
    name: 'Vijayanagar',
    zone: 'West Bangalore',
    keywords: ['vijayanagar', 'nagarbhavi', 'chandra layout', 'attiguppe', 'deepanjali nagar']
  },
  {
    name: 'Kengeri',
    zone: 'West Bangalore',
    keywords: ['kengeri', 'kengeri satellite town', 'mysore road', 'rajarajeshwari nagar', 'rr nagar', 'channasandra mysore rd']
  },

  // CENTRAL BANGALORE
  {
    name: 'Indiranagar',
    zone: 'Central Bangalore',
    keywords: ['indiranagar', 'indira nagar', 'defense colony', 'hal 2nd stage', 'hal 3rd stage', 'domlur', 'tippasandra']
  },
  {
    name: 'Koramangala',
    zone: 'Central Bangalore',
    keywords: ['koramangala', 'ejipura', 'st johns', 'sony world signal']
  },
  {
    name: 'CBD / Central',
    zone: 'Central Bangalore',
    keywords: ['mg road', 'm.g. road', 'brigade road', 'lavelle road', 'richmond town', 'vasanth nagar', 'cunningham road', 'cbd', 'cubbon park', 'ulsoor', 'frazer town', 'cox town']
  }
];

/**
 * Standardize and enrich location data from raw inputs (99acres, Meta, Excel, manual)
 */
function normalizeLocation(cityName = '', property = '', projectName = '', notes = '') {
  const combinedText = `${cityName || ''} ${property || ''} ${projectName || ''} ${notes || ''}`.toLowerCase();

  // 1. Direct Zone detection from CityName if 99acres provided "Bangalore East", "Bangalore North", etc.
  let detectedZone = null;
  let detectedSubLocality = null;

  const cleanCity = String(cityName || '').trim();

  if (/bangalore\s*east|east\s*bangalore|bengaluru\s*east/i.test(cleanCity)) {
    detectedZone = 'East Bangalore';
  } else if (/bangalore\s*north|north\s*bangalore|bengaluru\s*north/i.test(cleanCity)) {
    detectedZone = 'North Bangalore';
  } else if (/bangalore\s*south|south\s*bangalore|bengaluru\s*south/i.test(cleanCity)) {
    detectedZone = 'South Bangalore';
  } else if (/bangalore\s*west|west\s*bangalore|bengaluru\s*west/i.test(cleanCity)) {
    detectedZone = 'West Bangalore';
  } else if (/bangalore\s*central|central\s*bangalore|bengaluru\s*central/i.test(cleanCity)) {
    detectedZone = 'Central Bangalore';
  }

  // 2. Scan for specific Micro-market locality keywords in the combined property/project text
  for (const loc of BANGALORE_LOCALITIES) {
    for (const kw of loc.keywords) {
      // Word boundary match or exact substring match
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combinedText) || combinedText.includes(kw)) {
        detectedSubLocality = loc.name;
        if (!detectedZone) {
          detectedZone = loc.zone;
        }
        break;
      }
    }
    if (detectedSubLocality) break;
  }

  // 3. Fallback for other Indian metro cities if not Bangalore
  if (!detectedZone) {
    if (/(?:noida|greater noida|yamuna expressway)/i.test(combinedText)) {
      detectedZone = 'Delhi NCR';
      detectedSubLocality = 'Noida';
    } else if (/(?:gurgaon|gurugram|golf course road|sohna)/i.test(combinedText)) {
      detectedZone = 'Delhi NCR';
      detectedSubLocality = 'Gurugram';
    } else if (/(?:mumbai|navi mumbai|thane|bandra|andheri|worli|powai)/i.test(combinedText)) {
      detectedZone = 'Mumbai MMR';
      detectedSubLocality = 'Mumbai';
    } else if (/(?:hyderabad|gachibowli|hitec city|kondapur|kokapet|financial district)/i.test(combinedText)) {
      detectedZone = 'Hyderabad';
      detectedSubLocality = 'Gachibowli / Financial Dist';
    } else if (/(?:pune|hinjewadi|wakad|baner|kharadi)/i.test(combinedText)) {
      detectedZone = 'Pune';
      detectedSubLocality = 'Pune';
    } else if (/(?:chennai|omr|ecr|anna nagar)/i.test(combinedText)) {
      detectedZone = 'Chennai';
      detectedSubLocality = 'Chennai';
    } else if (cleanCity && cleanCity.toLowerCase() !== 'bangalore' && cleanCity.toLowerCase() !== 'bengaluru') {
      detectedZone = cleanCity;
      detectedSubLocality = cleanCity;
    } else {
      // Default fallback for Bangalore listings without specified micro-market
      detectedZone = 'East Bangalore'; // Prime focus market for Horizon listings (Sobha Windsor, Neopolis, Sky Samurai)
      detectedSubLocality = 'East Zone';
    }
  }

  // If sublocality is missing but zone is detected
  if (!detectedSubLocality) {
    detectedSubLocality = detectedZone.replace('Bangalore', '').trim() + ' Sub-Market';
  }

  const displayLocation = detectedSubLocality && !detectedSubLocality.includes('Sub-Market')
    ? `${detectedZone} • ${detectedSubLocality}`
    : detectedZone;

  return {
    locationZone: detectedZone,
    subLocality: detectedSubLocality,
    displayLocation,
    cityName: cleanCity || detectedZone
  };
}

module.exports = {
  BANGALORE_LOCALITIES,
  normalizeLocation
};
