import { restaurantMenu } from './restaurantMenu.js';

const DAY = 24 * 60 * 60 * 1000;

export const isoDaysFromNow = (offset) => {
  const date = new Date(Date.now() + offset * DAY);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const todayISO = () => isoDaysFromNow(0);

export const initialDishes = restaurantMenu.map((dish) => ({
  ...dish,
  safetyPercent: 8,
  basePrep: Math.ceil(dish.predicted * 1.08),
  trend: `+${((dish.predicted - dish.historical) / dish.historical * 100).toFixed(1)}%`,
  detail: 'Illustrative demand with a small preparation buffer; adjust using actual sales.',
}));

// Additional menu ingredients use sample stock, costs and risk values for this demo.
const menuIngredientSeeds = [
  { id: 'beef', name: 'Beef', unit: 'kg', costPerUnit: 2200, stock: 12, expiryInDays: 2, expectedUsage: 11, riskScore: 74 },
  { id: 'mutton', name: 'Mutton', unit: 'kg', costPerUnit: 3400, stock: 6, expiryInDays: 2, expectedUsage: 5, riskScore: 66 },
  { id: 'seafood', name: 'Mixed seafood', unit: 'kg', costPerUnit: 2600, stock: 8, expiryInDays: 1, expectedUsage: 7, riskScore: 86 },
  { id: 'cheese', name: 'Cheese', unit: 'kg', costPerUnit: 2400, stock: 5, expiryInDays: 5, expectedUsage: 4, riskScore: 44 },
  { id: 'basmati-rice', name: 'Basmati rice', unit: 'kg', costPerUnit: 620, stock: 40, expiryInDays: 120, expectedUsage: 28, riskScore: 18 },
  { id: 'onions', name: 'Onions', unit: 'kg', costPerUnit: 280, stock: 14, expiryInDays: 10, expectedUsage: 10, riskScore: 25 },
  { id: 'soy-sauce', name: 'Soy sauce', unit: 'L', costPerUnit: 850, stock: 8, expiryInDays: 90, expectedUsage: 3, riskScore: 15 },
  { id: 'sausages', name: 'Sausages', unit: 'units', costPerUnit: 120, stock: 40, expiryInDays: 4, expectedUsage: 27, riskScore: 55 },
  { id: 'hot-dog-buns', name: 'Hot dog buns', unit: 'units', costPerUnit: 80, stock: 30, expiryInDays: 2, expectedUsage: 27, riskScore: 60 },
  { id: 'burger-buns', name: 'Burger buns', unit: 'units', costPerUnit: 95, stock: 80, expiryInDays: 2, expectedUsage: 72, riskScore: 58 },
  { id: 'sub-rolls', name: 'Sub rolls', unit: 'units', costPerUnit: 110, stock: 60, expiryInDays: 2, expectedUsage: 55, riskScore: 58 },
  { id: 'pickles', name: 'Pickles', unit: 'kg', costPerUnit: 900, stock: 4, expiryInDays: 30, expectedUsage: 2, riskScore: 20 },
  { id: 'condiments', name: 'Mustard, ketchup & chilli', unit: 'kg', costPerUnit: 800, stock: 6, expiryInDays: 60, expectedUsage: 3, riskScore: 18 },
];

const menuIngredients = menuIngredientSeeds.map((ingredient) => ({
  ...ingredient,
  expectedUsageBeforeExpiry: ingredient.expectedUsage,
  historicalWaste: 0,
  risk: ingredient.riskScore >= 70 ? 'High' : ingredient.riskScore >= 40 ? 'Medium' : 'Low',
  status: ingredient.expiryInDays <= 2 ? 'Near expiry' : 'In range',
  factors: ['Illustrative restaurant stock', 'Compared with the sample menu preparation plan', 'Rotate stock by expiry date'],
  recommendation: 'Use the oldest safe stock first and match replenishment to the preparation plan.',
}));

export const ingredientCatalog = [
  { id: 'rice', name: 'Raw rice', unit: 'kg', costPerUnit: 260, stock: 40, expiryInDays: 120, expectedUsage: 32, expectedUsageBeforeExpiry: 32, historicalWaste: 4, riskScore: 18, risk: 'Low', status: 'In range', factors: ['Long shelf life', 'Usage forecast is close to current stock', 'Limited recent waste'], recommendation: 'Maintain current purchasing rhythm and rotate by delivery date.' },
  { id: 'chicken', name: 'Chicken breast', unit: 'kg', costPerUnit: 1200, stock: 18, expiryInDays: 1, expectedUsage: 14, expectedUsageBeforeExpiry: 13, historicalWaste: 6, riskScore: 89, risk: 'High', status: 'Near expiry · overstock', factors: ['Expiry is tomorrow', 'Stock exceeds projected use before expiry', 'Repeated waste records include chicken'], recommendation: 'Use the oldest stock first, review tomorrow’s purchase, and prioritise dishes that safely use this ingredient.' },
  { id: 'tomatoes', name: 'Tomatoes', unit: 'kg', costPerUnit: 450, stock: 12, expiryInDays: 2, expectedUsage: 8, expectedUsageBeforeExpiry: 8, historicalWaste: 3, riskScore: 76, risk: 'High', status: 'Near expiry', factors: ['Expiry is approaching', 'About 4 kg may remain beyond expected use', 'Tomatoes appear in recent spoilage records'], recommendation: 'Prioritise tomatoes in today’s mise en place and avoid an additional order until stock is reviewed.' },
  { id: 'vegetables', name: 'Mixed vegetables', unit: 'kg', costPerUnit: 520, stock: 26, expiryInDays: 5, expectedUsage: 22, expectedUsageBeforeExpiry: 20, historicalWaste: 2.5, riskScore: 62, risk: 'Medium', status: 'Watch usage', factors: ['Moderate remaining shelf life', 'Stock is higher than expected use', 'Historical waste exists but is lower than chicken'], recommendation: 'Use FEFO rotation (first-expiring, first-out) and check prep quantities against the demand plan.' },
  { id: 'coconut-milk', name: 'Coconut milk', unit: 'L', costPerUnit: 500, stock: 10, expiryInDays: 4, expectedUsage: 9, expectedUsageBeforeExpiry: 9, historicalWaste: 6, riskScore: 72, risk: 'High', status: 'Use & monitor', factors: ['Expiry is within four days', 'Projected usage is close to available stock', 'A prior expired-stock record is present'], recommendation: 'Match purchasing to the preparation plan and reduce the next replenishment quantity.' },
  { id: 'carrots', name: 'Carrots', unit: 'kg', costPerUnit: 400, stock: 7, expiryInDays: 9, expectedUsage: 4, expectedUsageBeforeExpiry: 4, historicalWaste: 2, riskScore: 46, risk: 'Medium', status: 'Review stock', factors: ['Stock is above expected near-term use', 'Expiry is not immediate', 'A small amount was wasted previously'], recommendation: 'Monitor daily usage and hold off on increasing the next order.' },
  { id: 'eggs', name: 'Eggs', unit: 'units', costPerUnit: 70, stock: 40, expiryInDays: 3, expectedUsage: 48, expectedUsageBeforeExpiry: 48, historicalWaste: 0, riskScore: 24, risk: 'Low', status: 'Understock', factors: ['Forecast use exceeds current stock', 'Expiry is approaching, but stock is below demand', 'No matching waste record in this demo period'], recommendation: 'Check supplier lead time and replenish only the shortfall needed for forecast demand.' },
  { id: 'roti', name: 'Kottu roti', unit: 'kg', costPerUnit: 650, stock: 10, expiryInDays: 3, expectedUsage: 12, expectedUsageBeforeExpiry: 12, historicalWaste: 0, riskScore: 32, risk: 'Low', status: 'Understock · near expiry', factors: ['Forecast use may exceed current stock', 'Remaining shelf life is short', 'No recorded waste in the selected mock history'], recommendation: 'Check supplier lead time, prioritise the available stock, and avoid excess purchasing despite the short shelf life.' },
  { id: 'spices', name: 'Curry spices', unit: 'kg', costPerUnit: 1850, stock: 3, expiryInDays: 180, expectedUsage: 0.8, expectedUsageBeforeExpiry: 0.8, historicalWaste: 0, riskScore: 12, risk: 'Low', status: 'In range', factors: ['Long shelf life', 'Low usage is expected', 'No relevant historical waste in the mock data'], recommendation: 'Keep dry storage conditions consistent and review stock during routine counts.' },
  { id: 'oil', name: 'Cooking oil', unit: 'L', costPerUnit: 780, stock: 8, expiryInDays: 70, expectedUsage: 5, expectedUsageBeforeExpiry: 5, historicalWaste: 0, riskScore: 20, risk: 'Low', status: 'In range', factors: ['Expiry is distant', 'Projected usage is within stock', 'No recent recorded waste for this ingredient'], recommendation: 'Continue routine monitoring and avoid unnecessary over-ordering.' },
  ...menuIngredients,
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

export const initialSurplusListings = restaurantMenu.map((dish, index) => {
  const source = ingredientCatalog.find((ingredient) => ingredient.id === dish.sourceIngredientId);
  const open = index % 6 !== 4;
  const quantity = 3 + index % 4;
  const highestBid = open && index % 3 === 0 ? dish.samplePrice + 100 : 0;
  return {
    ...dish,
    id: `S-${201 + index}`,
    dishId: dish.id,
    quantity: `${quantity} ${['Hot dogs', 'Burgers', 'Submarines'].includes(dish.category) ? 'items' : 'portions'}`,
    referencePrice: dish.samplePrice,
    highestBid,
    remainingSeconds: open ? 165 + index * 25 : 0,
    sourceLabel: `${source.name} - sample risk score ${source.riskScore}`,
    status: open ? 'open' : 'closed',
    bids: highestBid ? [{ id: `seed-${dish.id}`, bidder: 'Customer #08', amount: highestBid, at: '12:02:04' }] : [],
  };
});
