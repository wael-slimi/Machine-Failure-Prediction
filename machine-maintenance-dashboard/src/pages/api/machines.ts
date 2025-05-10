import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'secret',
  database: 'machine_monitoring',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      await client.connect();
      const result = await client.query('SELECT * FROM machines');
      await client.end();

      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching machine data:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch machine data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
