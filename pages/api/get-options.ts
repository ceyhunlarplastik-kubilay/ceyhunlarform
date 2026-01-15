import type { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleSheets } from '../../lib/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sheets, spreadsheetId } = await getGoogleSheets();
    const range = 'Data!A2:C'; // Changed from 'Products' to 'Data'

    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];

    const combos: Record<string, string[]> = {};
    for (const row of rows) {
      const sector = row[0] || ''; // SECTOR column
      const productionGroup = row[1] || ''; // PRODUCTION_GROUP column
      const product = row[2] || ''; // PRODUCTS column (can be empty)

      // Skip rows without sector or production group
      if (!sector || !productionGroup) continue;

      const key = `${sector}__${productionGroup}`;
      if (!combos[key]) combos[key] = [];

      // Only add product if it exists (not empty)
      if (product) {
        combos[key].push(product);
      }
    }

    res.status(200).json(combos);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}