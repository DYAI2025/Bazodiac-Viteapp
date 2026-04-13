// Western Zodiac calculations
export const zodiacSigns = [
  { name: 'Aries', symbol: '♈', element: 'Fire', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { name: 'Taurus', symbol: '♉', element: 'Earth', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { name: 'Gemini', symbol: '♊', element: 'Air', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { name: 'Cancer', symbol: '♋', element: 'Water', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { name: 'Leo', symbol: '♌', element: 'Fire', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { name: 'Virgo', symbol: '♍', element: 'Earth', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { name: 'Libra', symbol: '♎', element: 'Air', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { name: 'Scorpio', symbol: '♏', element: 'Water', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { name: 'Capricorn', symbol: '♑', element: 'Earth', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { name: 'Aquarius', symbol: '♒', element: 'Air', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { name: 'Pisces', symbol: '♓', element: 'Water', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
];

// BaZi Heavenly Stems
export const heavenlyStems = [
  { name: 'Jia', element: 'Wood', yinYang: 'Yang' },
  { name: 'Yi', element: 'Wood', yinYang: 'Yin' },
  { name: 'Bing', element: 'Fire', yinYang: 'Yang' },
  { name: 'Ding', element: 'Fire', yinYang: 'Yin' },
  { name: 'Wu', element: 'Earth', yinYang: 'Yang' },
  { name: 'Ji', element: 'Earth', yinYang: 'Yin' },
  { name: 'Geng', element: 'Metal', yinYang: 'Yang' },
  { name: 'Xin', element: 'Metal', yinYang: 'Yin' },
  { name: 'Ren', element: 'Water', yinYang: 'Yang' },
  { name: 'Gui', element: 'Water', yinYang: 'Yin' },
];

// BaZi Earthly Branches (Animals)
export const earthlyBranches = [
  { name: 'Zi', animal: 'Rat', element: 'Water', yinYang: 'Yin' },
  { name: 'Chou', animal: 'Ox', element: 'Earth', yinYang: 'Yin' },
  { name: 'Yin', animal: 'Tiger', element: 'Wood', yinYang: 'Yang' },
  { name: 'Mao', animal: 'Rabbit', element: 'Wood', yinYang: 'Yin' },
  { name: 'Chen', animal: 'Dragon', element: 'Earth', yinYang: 'Yang' },
  { name: 'Si', animal: 'Snake', element: 'Fire', yinYang: 'Yin' },
  { name: 'Wu', animal: 'Horse', element: 'Fire', yinYang: 'Yang' },
  { name: 'Wei', animal: 'Goat', element: 'Earth', yinYang: 'Yin' },
  { name: 'Shen', animal: 'Monkey', element: 'Metal', yinYang: 'Yang' },
  { name: 'You', animal: 'Rooster', element: 'Metal', yinYang: 'Yin' },
  { name: 'Xu', animal: 'Dog', element: 'Earth', yinYang: 'Yang' },
  { name: 'Hai', animal: 'Pig', element: 'Water', yinYang: 'Yin' },
];

// Wu Xing Elements
export const wuXingElements = [
  { name: 'Wood', color: '#4A7C59', nature: 'Growth, expansion, creativity' },
  { name: 'Fire', color: '#C75B39', nature: 'Transformation, passion, energy' },
  { name: 'Earth', color: '#8B7355', nature: 'Stability, nourishment, balance' },
  { name: 'Metal', color: '#7A8B99', nature: 'Precision, structure, clarity' },
  { name: 'Water', color: '#4A6FA5', nature: 'Wisdom, flow, adaptability' },
];

export interface AstrologyResult {
  westernSign: typeof zodiacSigns[0];
  baziDayMaster: typeof heavenlyStems[0];
  baziAnimal: typeof earthlyBranches[0];
  dominantElement: typeof wuXingElements[0];
  harmonyIndex: number;
  interpretation: string;
}

export function getWesternSign(date: Date): typeof zodiacSigns[0] {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  for (const sign of zodiacSigns) {
    if (sign.startMonth === month && day >= sign.startDay) {
      return sign;
    }
    if (sign.endMonth === month && day <= sign.endDay) {
      return sign;
    }
    // Capricorn special case (spans year end)
    if (sign.name === 'Capricorn' && (month === 12 || month === 1)) {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return sign;
      }
    }
  }
  
  return zodiacSigns[0];
}

export function calculateBaZi(date: Date): { dayMaster: typeof heavenlyStems[0]; animal: typeof earthlyBranches[0] } {
  // Simplified BaZi calculation based on day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  const stemIndex = dayOfYear % 10;
  const branchIndex = dayOfYear % 12;
  
  return {
    dayMaster: heavenlyStems[stemIndex],
    animal: earthlyBranches[branchIndex],
  };
}

export function getDominantElement(westernSign: typeof zodiacSigns[0], baziMaster: typeof heavenlyStems[0]): typeof wuXingElements[0] {
  // Map western elements to Wu Xing
  const elementMapping: Record<string, string> = {
    'Fire': 'Fire',
    'Earth': 'Earth',
    'Air': 'Metal',
    'Water': 'Water',
  };
  
  const westernWuXing = elementMapping[westernSign.element] || 'Earth';
  const baziElement = baziMaster.element;
  
  // If they match, that's the dominant element
  if (westernWuXing === baziElement) {
    return wuXingElements.find(e => e.name === westernWuXing) || wuXingElements[2];
  }
  
  // Otherwise, use a weighted combination
  const elementScores: Record<string, number> = {};
  elementScores[westernWuXing] = (elementScores[westernWuXing] || 0) + 1;
  elementScores[baziElement] = (elementScores[baziElement] || 0) + 1.5;
  
  const dominantName = Object.entries(elementScores).sort((a, b) => b[1] - a[1])[0][0];
  return wuXingElements.find(e => e.name === dominantName) || wuXingElements[2];
}

export function calculateHarmonyIndex(
  westernSign: typeof zodiacSigns[0],
  baziMaster: typeof heavenlyStems[0],
  dominantElement: typeof wuXingElements[0]
): number {
  // Calculate harmony based on element alignment
  const elementMapping: Record<string, string> = {
    'Fire': 'Fire',
    'Earth': 'Earth',
    'Air': 'Metal',
    'Water': 'Water',
  };
  
  const westernWuXing = elementMapping[westernSign.element] || 'Earth';
  const baziElement = baziMaster.element;
  
  let harmony = 50; // Base score
  
  // Alignment bonus
  if (westernWuXing === baziElement) {
    harmony += 25;
  } else if (
    (westernWuXing === 'Fire' && baziElement === 'Earth') ||
    (westernWuXing === 'Earth' && baziElement === 'Metal') ||
    (westernWuXing === 'Metal' && baziElement === 'Water') ||
    (westernWuXing === 'Water' && baziElement === 'Wood') ||
    (westernWuXing === 'Wood' && baziElement === 'Fire')
  ) {
    harmony += 15; // Generating cycle
  }
  
  // Dominant element alignment
  if (dominantElement.name === westernWuXing || dominantElement.name === baziElement) {
    harmony += 15;
  }
  
  // Yin-Yang balance
  if (baziMaster.yinYang === 'Yang') {
    harmony += 5;
  }
  
  return Math.min(99, Math.max(30, harmony));
}

export function generateInterpretation(result: AstrologyResult): string {
  const interpretations: Record<string, string[]> = {
    'Fire': [
      'Your sun, moon, and day master align in a warm, passionate pattern—creative energy meets decisive action.',
      'Fire illuminates your path with enthusiasm and courage. Your confidence is earned through experience.',
      'You lead with warmth and inspiration. Your inner fire drives transformation in yourself and others.',
    ],
    'Earth': [
      'Your sun, moon, and day master align in a calm, grounded pattern—practical insight meets steady patience.',
      'Earth anchors your spirit with stability and wisdom. You build lasting foundations in all you do.',
      'You move with deliberate grace, nurturing growth around you. Your presence brings calm assurance.',
    ],
    'Metal': [
      'Your sun, moon, and day master align in a clear, focused pattern—precise insight meets determined will.',
      'Metal sharpens your mind with clarity and structure. You cut through confusion to find truth.',
      'You approach life with refined discernment. Your words carry weight, your actions carry purpose.',
    ],
    'Water': [
      'Your sun, moon, and day master align in a fluid, intuitive pattern—deep wisdom meets adaptable flow.',
      'Water guides your intuition with depth and flexibility. You navigate change with quiet strength.',
      'You feel before you think, understanding what others miss. Your empathy is your greatest gift.',
    ],
    'Wood': [
      'Your sun, moon, and day master align in a growing, creative pattern—visionary insight meets steady expansion.',
      'Wood fuels your creativity with growth and vision. You see potential where others see obstacles.',
      'You bend without breaking, adapting while remaining true to your roots. Your growth inspires others.',
    ],
  };
  
  const options = interpretations[result.dominantElement.name] || interpretations['Earth'];
  const index = result.harmonyIndex % options.length;
  return options[index];
}

export function calculateFullAstrology(birthDate: Date): AstrologyResult {
  const westernSign = getWesternSign(birthDate);
  const bazi = calculateBaZi(birthDate);
  const dominantElement = getDominantElement(westernSign, bazi.dayMaster);
  const harmonyIndex = calculateHarmonyIndex(westernSign, bazi.dayMaster, dominantElement);
  
  const result: AstrologyResult = {
    westernSign,
    baziDayMaster: bazi.dayMaster,
    baziAnimal: bazi.animal,
    dominantElement,
    harmonyIndex,
    interpretation: '',
  };
  
  result.interpretation = generateInterpretation(result);
  return result;
}
