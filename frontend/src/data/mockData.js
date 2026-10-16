const DAY = 24 * 60 * 60 * 1000;

export const isoDaysFromNow = (offset) => {
  const date = new Date(Date.now() + offset * DAY);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayISO = () => isoDaysFromNow(0);

export const initialDishes = [
  {
    id: 'rice-curry',
    name: 'Rice & curry',
    category: 'Lunch favourite',
    historical: 78,
    predicted: 86,
    basePrep: 93,
    safetyPercent: 8,
    trend: '+10.3%',
    detail: 'A small weekend uplift and recent POS demand support a modest buffer.',
    recipe: [
      { ingredientId: 'rice', amount: 0.18, unit: 'kg' },
      { ingredientId: 'vegetables', amount: 0.15, unit: 'kg' },
      { ingredientId: 'coconut-milk', amount: 0.05, unit: 'L' },
      { ingredientId: 'spices', amount: 0.012, unit: 'kg' },
    ],
  },
  {
    id: 'chicken-fried-rice',
    name: 'Chicken fried rice',
    category: 'High-volume dish',
    historical: 48,
    predicted: 52,
    basePrep: 57,
    safetyPercent: 10,
    trend: '+8.3%',
    detail: 'Historical POS demand is rising; the suggested buffer remains limited.',
    recipe: [
      { ingredientId: 'rice', amount: 0.2, unit: 'kg' },
      { ingredientId: 'chicken', amount: 0.09, unit: 'kg' },
      { ingredientId: 'carrots', amount: 0.035, unit: 'kg' },
      { ingredientId: 'eggs', amount: 0.5, unit: 'units' },
      { ingredientId: 'oil', amount: 0.012, unit: 'L' },
    ],
  },
  {
    id: 'vegetable-kottu',
    name: 'Vegetable kottu',
    category: 'Evening favourite',
    historical: 38,
    predicted: 42,
    basePrep: 46,
    safetyPercent: 10,
    trend: '+10.5%',
    detail: 'The demonstration forecast indicates stronger evening demand.',
    recipe: [
      { ingredientId: 'roti', amount: 0.24, unit: 'kg' },
      { ingredientId: 'vegetables', amount: 0.12, unit: 'kg' },
      { ingredientId: 'eggs', amount: 0.25, unit: 'units' },
      { ingredientId: 'oil', amount: 0.01, unit: 'L' },
    ],
  },
  {
    id: 'chicken-curry',
    name: 'Chicken curry',
    category: 'Main dish',
    historical: 30,
    predicted: 34,
    basePrep: 37,
    safetyPercent: 9,
    trend: '+13.3%',
    detail: 'A controlled preparation buffer covers uncertainty without over-preparing heavily.',
    recipe: [
      { ingredientId: 'chicken', amount: 0.16, unit: 'kg' },
      { ingredientId: 'coconut-milk', amount: 0.08, unit: 'L' },
      { ingredientId: 'spices', amount: 0.018, unit: 'kg' },
      { ingredientId: 'tomatoes', amount: 0.04, unit: 'kg' },
    ],
  },
];

export const ingredientCatalog = [
  { id: 'rice', name: 'Raw rice', unit: 'kg', costPerUnit: 260, stock: 40, expiryInDays: 120, expectedUsage: 32, expectedUsageBeforeExpiry: 32, historicalWaste: 4, riskScore: 18, risk: 'Low', status: 'In range', factors: ['Long shelf life', 'Usage forecast is close to current stock', 'Limited recent waste'], recommendation: 'Maintain current purchasing rhythm and rotate by delivery date.' },
  { id: 'chicken', name: 'Chicken breast', unit: 'kg', costPerUnit: 1200, stock: 18, expiryInDays: 1, expectedUsage: 14, expectedUsageBeforeExpiry: 13, historicalWaste: 6, riskScore: 89, risk: 'High', status: 'Near expiry · overstock', factors: ['Expiry is tomorrow', 'Stock exceeds projected use before expiry', 'Repeated waste records include chicken'], recommendation: 'Use the oldest stock first, review tomorrow’s purchase, and prioritise dishes that safely use this ingredient.' },
  { id: 'tomatoes', name: 'Tomatoes', unit: 'kg', costPerUnit: 450, stock: 12, expiryInDays: 2, expectedUsage: 8, expectedUsageBeforeExpiry: 8, historicalWaste: 3, riskScore: 76, risk: 'High', status: 'Near expiry', factors: ['Expiry is approaching', 'About 4 kg may remain beyond expected use', 'Tomatoes appear in recent spoilage records'], recommendation: 'Prioritise tomatoes in today’s mise en place and avoid an additional order until stock is reviewed.' },
  { id: 'vegetables', name: 'Mixed vegetables', unit: 'kg', costPerUnit: 520, stock: 26, expiryInDays: 5, expectedUsage: 22, expectedUsageBeforeExpiry: 20, historicalWaste: 2.5, riskScore: 62, risk: 'Medium', status: 'Watch usage', factors: ['Moderate remaining shelf life', 'Stock is higher than expected use', 'Historical waste exists but is lower than chicken'], recommendation: 'Use FEFO rotation (first-expiring, first-out) and check prep quantities against the demand plan.' },
  { id: 'coconut-milk', name: 'Coconut milk', unit: 'L', costPerUnit: 500, stock: 10, expiryInDays: 4, expectedUsage: 9, expectedUsageBeforeExpiry: 9, historicalWaste: 6, riskScore: 72, risk: 'High', status: 'Use & monitor', factors: ['Expiry is within four days', 'Projected usage is close to available stock', 'A prior expired-stock record is present'], recommendation: 'Prioritise planned curry production and reduce the next replenishment quantity.' },
  { id: 'carrots', name: 'Carrots', unit: 'kg', costPerUnit: 400, stock: 7, expiryInDays: 9, expectedUsage: 4, expectedUsageBeforeExpiry: 4, historicalWaste: 2, riskScore: 46, risk: 'Medium', status: 'Review stock', factors: ['Stock is above expected near-term use', 'Expiry is not immediate', 'A small amount was wasted previously'], recommendation: 'Monitor daily usage and hold off on increasing the next order.' },
  { id: 'eggs', name: 'Eggs', unit: 'units', costPerUnit: 70, stock: 40, expiryInDays: 3, expectedUsage: 48, expectedUsageBeforeExpiry: 48, historicalWaste: 0, riskScore: 24, risk: 'Low', status: 'Understock', factors: ['Forecast use exceeds current stock', 'Expiry is approaching, but stock is below demand', 'No matching waste record in this demo period'], recommendation: 'Check supplier lead time and replenish only the shortfall needed for forecast demand.' },
  { id: 'roti', name: 'Kottu roti', unit: 'kg', costPerUnit: 650, stock: 10, expiryInDays: 3, expectedUsage: 12, expectedUsageBeforeExpiry: 12, historicalWaste: 0, riskScore: 32, risk: 'Low', status: 'Understock · near expiry', factors: ['Forecast use may exceed current stock', 'Remaining shelf life is short', 'No recorded waste in the selected mock history'], recommendation: 'Check supplier lead time, prioritise the available stock, and avoid excess purchasing despite the short shelf life.' },
  { id: 'spices', name: 'Curry spices', unit: 'kg', costPerUnit: 1850, stock: 3, expiryInDays: 180, expectedUsage: 0.8, expectedUsageBeforeExpiry: 0.8, historicalWaste: 0, riskScore: 12, risk: 'Low', status: 'In range', factors: ['Long shelf life', 'Low usage is expected', 'No relevant historical waste in the mock data'], recommendation: 'Keep dry storage conditions consistent and review stock during routine counts.' },
  { id: 'oil', name: 'Cooking oil', unit: 'L', costPerUnit: 780, stock: 8, expiryInDays: 70, expectedUsage: 5, expectedUsageBeforeExpiry: 5, historicalWaste: 0, riskScore: 20, risk: 'Low', status: 'In range', factors: ['Expiry is distant', 'Projected usage is within stock', 'No recent recorded waste for this ingredient'], recommendation: 'Continue routine monitoring and avoid unnecessary over-ordering.' },
];

const wasteSeed = [
  { id: 'W-1001', itemId: 'chicken', item: 'Chicken breast', quantity: 4, unit: 'kg', unitCost: 1200, category: 'Expired stock', daysAgo: 0 },
  { id: 'W-1002', itemId: 'prepared-rice', item: 'Cooked rice portions', quantity: 8, unit: 'portions', unitCost: 280, category: 'Excess preparation', daysAgo: 0 },
  { id: 'W-1003', itemId: 'tomatoes', item: 'Tomatoes', quantity: 3, unit: 'kg', unitCost: 450, category: 'Spoilage', daysAgo: 2 },
  { id: 'W-1004', itemId: 'carrots', item: 'Carrots', quantity: 5, unit: 'kg', unitCost: 320, category: 'Overstocking', daysAgo: 3 },
  { id: 'W-1005', itemId: 'vegetables', item: 'Leafy greens', quantity: 2.5, unit: 'kg', unitCost: 600, category: 'Spoilage', daysAgo: 5 },
  { id: 'W-1006', itemId: 'chicken', item: 'Chicken breast', quantity: 2, unit: 'kg', unitCost: 1200, category: 'Excess preparation', daysAgo: 8 },
  { id: 'W-1007', itemId: 'coconut-milk', item: 'Coconut milk', quantity: 6, unit: 'L', unitCost: 500, category: 'Expired stock', daysAgo: 12 },
  { id: 'W-1008', itemId: 'carrots', item: 'Carrots', quantity: 2, unit: 'kg', unitCost: 400, category: 'Overstocking', daysAgo: 16 },
  { id: 'W-1009', itemId: 'rice', item: 'Raw rice', quantity: 4, unit: 'kg', unitCost: 260, category: 'Excess preparation', daysAgo: 22 },
  { id: 'W-1010', itemId: 'chicken', item: 'Chicken pieces', quantity: 3, unit: 'kg', unitCost: 1450, category: 'Spoilage', daysAgo: 28 },
];

export const initialWasteRecords = wasteSeed.map((record) => ({
  ...record,
  date: isoDaysFromNow(-record.daysAgo),
}));

export const initialSurplusListings = [
  {
    id: 'S-201',
    name: 'Vegetable curry meal packs',
    quantity: '6 packs',
    referencePrice: 850,
    highestBid: 950,
    remainingSeconds: 165,
    sourceIngredientId: 'vegetables',
    sourceLabel: 'Mixed vegetables · risk score 62',
    status: 'open',
    bids: [
      { id: 'b1', bidder: 'Customer #08', amount: 900, at: '12:01:18' },
      { id: 'b2', bidder: 'Customer #12', amount: 950, at: '12:02:04' },
    ],
  },
  {
    id: 'S-202',
    name: 'Chicken fried rice packs',
    quantity: '4 packs',
    referencePrice: 1100,
    highestBid: 1200,
    remainingSeconds: 255,
    sourceIngredientId: 'chicken',
    sourceLabel: 'Chicken breast · risk score 89',
    status: 'open',
    bids: [
      { id: 'b3', bidder: 'Customer #03', amount: 1150, at: '12:02:29' },
      { id: 'b4', bidder: 'Customer #15', amount: 1200, at: '12:03:10' },
    ],
  },
  {
    id: 'S-203',
    name: 'Seasonal vegetable kottu',
    quantity: '3 portions',
    referencePrice: 700,
    highestBid: 0,
    remainingSeconds: 0,
    sourceIngredientId: 'tomatoes',
    sourceLabel: 'Tomatoes · risk score 76',
    status: 'closed',
    bids: [],
  },
];
