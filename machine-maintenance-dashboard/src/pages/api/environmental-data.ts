import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json([
    {
      machine_id: 'M001',
      timestamp: '2025-05-09T10:00:00Z',
      temperature_external: 25.5,
      humidity: 60,
      power_fluctuation: 0.2,
    },
    {
      machine_id: 'M002',
      timestamp: '2025-05-09T10:05:00Z',
      temperature_external: 26.0,
      humidity: 58,
      power_fluctuation: 0.3,
    },
  ]);
}