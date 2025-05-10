import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log('Request body:', req.body);

      const response = await fetch('http://127.0.0.1:5000/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch simulation data from the backend');
      }

      const data = await response.json();
      console.log('Response from backend:', data);
      res.status(200).json(data);
    } catch (error) {
      console.error('Error response from backend:', error);
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}