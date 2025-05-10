import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json([
    {
      machine_id: 'M001',
      machine_label: 'Machine 1',
      model: 'Model A',
      type: 'Type X',
      installation_date: '2023-01-01',
      working: true,
    },
    {
      machine_id: 'M002',
      machine_label: 'Machine 2',
      model: 'Model B',
      type: 'Type Y',
      installation_date: '2023-02-01',
      working: false,
    },
  ]);
}