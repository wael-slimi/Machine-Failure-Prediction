import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json([
    {
      machine_id: 'M001',
      maintenance_status: 'Completed',
      last_maintenance_date: '2025-05-01',
      maintenance_type: 'Routine',
    },
    {
      machine_id: 'M002',
      maintenance_status: 'Pending',
      last_maintenance_date: '2025-04-15',
      maintenance_type: 'Repair',
    },
  ]);
}