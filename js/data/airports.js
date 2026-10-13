// js/data/airports.js (1310_R147) - Operational Aerodromes Database (OM-C Chapter 4.1.5)
// Contains IATA code, ICAO code, Aerodrome Name, and standard UTC Offset in hours.

export const MAB_AIRPORTS = [
  // Domestic - Peninsular Malaysia (UTC +8)
  { iata: 'KUL', icao: 'WMKK', name: 'Kuala Lumpur International', tzOffset: 8 },
  { iata: 'SZB', icao: 'WMSA', name: 'Sultan Abdul Aziz Shah (Subang)', tzOffset: 8 },
  { iata: 'PEN', icao: 'WMKP', name: 'Penang International', tzOffset: 8 },
  { iata: 'JHB', icao: 'WMKJ', name: 'Senai (Johor Bahru)', tzOffset: 8 },
  { iata: 'LGK', icao: 'WMKL', name: 'Langkawi International', tzOffset: 8 },
  { iata: 'KBR', icao: 'WMKC', name: 'Sultan Ismail Petra (Kota Bharu)', tzOffset: 8 },
  { iata: 'TGG', icao: 'WMKN', name: 'Sultan Mahmud (Kuala Terengganu)', tzOffset: 8 },
  { iata: 'KUA', icao: 'WMKD', name: 'Sultan Haji Ahmad Shah (Kuantan)', tzOffset: 8 },
  { iata: 'AOR', icao: 'WMKA', name: 'Sultan Abdul Halim (Alor Setar)', tzOffset: 8 },
  { iata: 'IPH', icao: 'WMKI', name: 'Sultan Azlan Shah (Ipoh)', tzOffset: 8 },

  // Domestic - Sabah & Sarawak (UTC +8)
  { iata: 'BKI', icao: 'WBKK', name: 'Kota Kinabalu International', tzOffset: 8 },
  { iata: 'KCH', icao: 'WBGG', name: 'Kuching International', tzOffset: 8 },
  { iata: 'MYY', icao: 'WBGR', name: 'Miri', tzOffset: 8 },
  { iata: 'SDK', icao: 'WBKS', name: 'Sandakan', tzOffset: 8 },
  { iata: 'TWU', icao: 'WBKW', name: 'Tawau', tzOffset: 8 },
  { iata: 'BKN', icao: 'WBGB', name: 'Bintulu', tzOffset: 8 },
  { iata: 'SBW', icao: 'WBGS', name: 'Sibu', tzOffset: 8 },
  { iata: 'LMN', icao: 'WBGJ', name: 'Limbang', tzOffset: 8 },
  { iata: 'LBU', icao: 'WBKL', name: 'Labuan', tzOffset: 8 },

  // ASEAN Regional Destinations
  { iata: 'SIN', icao: 'WSSS', name: 'Singapore Changi', tzOffset: 8 },
  { iata: 'BKK', icao: 'VTBS', name: 'Bangkok Suvarnabhumi', tzOffset: 7 },
  { iata: 'DMK', icao: 'VTBD', name: 'Bangkok Don Mueang', tzOffset: 7 },
  { iata: 'HKT', icao: 'VTSP', name: 'Phuket', tzOffset: 7 },
  { iata: 'CNX', icao: 'VTCC', name: 'Chiang Mai', tzOffset: 7 },
  { iata: 'CGK', icao: 'WIII', name: 'Jakarta Soekarno-Hatta', tzOffset: 7 },
  { iata: 'DPS', icao: 'WADD', name: 'Bali Denpasar', tzOffset: 8 },
  { iata: 'KNO', icao: 'WIMM', name: 'Medan Kualanamu', tzOffset: 7 },
  { iata: 'SUB', icao: 'WARR', name: 'Surabaya Juanda', tzOffset: 7 },
  { iata: 'MNL', icao: 'RPLL', name: 'Manila Ninoy Aquino', tzOffset: 8 },
  { iata: 'SGN', icao: 'VVTS', name: 'Ho Chi Minh City Tan Son Nhat', tzOffset: 7 },
  { iata: 'HAN', icao: 'VVNB', name: 'Hanoi Noi Bai', tzOffset: 7 },
  { iata: 'PNH', icao: 'VDPP', name: 'Phnom Penh', tzOffset: 7 },
  { iata: 'RGN', icao: 'VYYY', name: 'Yangon', tzOffset: 6.5 },
  { iata: 'BWN', icao: 'WBSB', name: 'Brunei Bandar Seri Begawan', tzOffset: 8 },

  // East Asia
  { iata: 'HKG', icao: 'VHHH', name: 'Hong Kong International', tzOffset: 8 },
  { iata: 'MFM', icao: 'VMMC', name: 'Macau', tzOffset: 8 },
  { iata: 'TPE', icao: 'RCTP', name: 'Taipei Taoyuan', tzOffset: 8 },
  { iata: 'NRT', icao: 'RJAA', name: 'Tokyo Narita', tzOffset: 9 },
  { iata: 'HND', icao: 'RJTT', name: 'Tokyo Haneda', tzOffset: 9 },
  { iata: 'KIX', icao: 'RJBB', name: 'Osaka Kansai', tzOffset: 9 },
  { iata: 'NGO', icao: 'RJGG', name: 'Nagoya Chubu Centrair', tzOffset: 9 },
  { iata: 'ICN', icao: 'RKSI', name: 'Seoul Incheon', tzOffset: 9 },
  { iata: 'PUS', icao: 'RKPK', name: 'Busan Gimhae', tzOffset: 9 },

  // China Destinations
  { iata: 'CAN', icao: 'ZGGG', name: 'Guangzhou Baiyun', tzOffset: 8 },
  { iata: 'PVG', icao: 'ZSPD', name: 'Shanghai Pudong', tzOffset: 8 },
  { iata: 'PEK', icao: 'ZBAA', name: 'Beijing Capital', tzOffset: 8 },
  { iata: 'PKX', icao: 'ZBAD', name: 'Beijing Daxing', tzOffset: 8 },
  { iata: 'XMN', icao: 'ZSAM', name: 'Xiamen Gaoqi', tzOffset: 8 },
  { iata: 'CTU', icao: 'ZUUU', name: 'Chengdu Shuangliu', tzOffset: 8 },
  { iata: 'TFU', icao: 'ZATE', name: 'Chengdu Tianfu', tzOffset: 8 },
  { iata: 'CKG', icao: 'ZUCK', name: 'Chongqing Jiangbei', tzOffset: 8 },
  { iata: 'KMG', icao: 'ZPPP', name: 'Kunming Changshui', tzOffset: 8 },
  { iata: 'HAK', icao: 'ZJHK', name: 'Haikou Meilan', tzOffset: 8 },

  // South Asia / India & Subcontinent
  { iata: 'DEL', icao: 'VIDP', name: 'Delhi Indira Gandhi', tzOffset: 5.5 },
  { iata: 'BOM', icao: 'VABB', name: 'Mumbai Chhatrapati Shivaji', tzOffset: 5.5 },
  { iata: 'MAA', icao: 'VOMM', name: 'Chennai', tzOffset: 5.5 },
  { iata: 'BLR', icao: 'VOBL', name: 'Bengaluru Kempegowda', tzOffset: 5.5 },
  { iata: 'HYD', icao: 'VOHS', name: 'Hyderabad Rajiv Gandhi', tzOffset: 5.5 },
  { iata: 'CCU', icao: 'VECC', name: 'Kolkata Netaji Subhash Chandra Bose', tzOffset: 5.5 },
  { iata: 'COK', icao: 'VOCI', name: 'Kochi', tzOffset: 5.5 },
  { iata: 'TRV', icao: 'VOTV', name: 'Trivandrum', tzOffset: 5.5 },
  { iata: 'AMD', icao: 'VAAH', name: 'Sardar Vallabhbhai Patel (Ahmedabad)', tzOffset: 5.5 },
  { iata: 'CMB', icao: 'VCBI', name: 'Colombo Bandaranaike', tzOffset: 5.5 },
  { iata: 'KTM', icao: 'VNKT', name: 'Kathmandu Tribhuvan', tzOffset: 5.75 },
  { iata: 'DAC', icao: 'VGHS', name: 'Dhaka Hazrat Shahjalal', tzOffset: 6 },
  { iata: 'MLE', icao: 'VRMM', name: 'Malé Velana', tzOffset: 5 },

  // Middle East & Haj/Umrah
  { iata: 'JED', icao: 'OEJN', name: 'Jeddah King Abdulaziz', tzOffset: 3 },
  { iata: 'MED', icao: 'OEMA', name: 'Madinah Prince Mohammad bin Abdulaziz', tzOffset: 3 },
  { iata: 'RUH', icao: 'OERK', name: 'Riyadh King Khalid', tzOffset: 3 },
  { iata: 'DXB', icao: 'OMDB', name: 'Dubai International', tzOffset: 4 },
  { iata: 'DOH', icao: 'OTHH', name: 'Doha Hamad International', tzOffset: 3 },
  { iata: 'AUH', icao: 'OMAA', name: 'Abu Dhabi International', tzOffset: 4 },

  // Australasia & Pacific
  { iata: 'SYD', icao: 'YSSY', name: 'Sydney Kingsford Smith', tzOffset: 10 },
  { iata: 'MEL', icao: 'YMML', name: 'Melbourne Tullamarine', tzOffset: 10 },
  { iata: 'PER', icao: 'YPPH', name: 'Perth International', tzOffset: 8 },
  { iata: 'BNE', icao: 'YBBN', name: 'Brisbane', tzOffset: 10 },
  { iata: 'ADL', icao: 'YPAD', name: 'Adelaide', tzOffset: 9.5 },
  { iata: 'AKL', icao: 'NZAA', name: 'Auckland', tzOffset: 12 },

  // Europe & UK
  { iata: 'LHR', icao: 'EGLL', name: 'London Heathrow', tzOffset: 0 },
  { iata: 'CDG', icao: 'LFPG', name: 'Paris Charles de Gaulle', tzOffset: 1 },
  { iata: 'FRA', icao: 'EDDF', name: 'Frankfurt am Main', tzOffset: 1 },
  { iata: 'AMS', icao: 'EHAM', name: 'Amsterdam Schiphol', tzOffset: 1 },
  { iata: 'IST', icao: 'LTFM', name: 'Istanbul Airport', tzOffset: 3 }
];

export function findAirport(query) {
  if (!query) return null;
  const q = query.trim().toUpperCase();
  return MAB_AIRPORTS.find(a => a.iata === q || a.icao === q) || null;
}

export function searchAirports(query, limit = 6) {
  if (!query || query.trim().length === 0) return MAB_AIRPORTS.slice(0, limit);
  const q = query.trim().toLowerCase();
  return MAB_AIRPORTS.filter(a =>
    a.iata.toLowerCase().includes(q) ||
    a.icao.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, limit);
}
