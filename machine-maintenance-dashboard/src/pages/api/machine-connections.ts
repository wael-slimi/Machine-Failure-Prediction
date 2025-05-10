import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const connections = Array.from({ length: 120 }, (_, i) => {
      const machineId = `M${100 + i}`;
      const boxId = `Box-${Math.floor(i / 10) + 1}`; // Group machines into boxes (10 machines per box)
      return {
        machineId,
        boxId,
        label: `Machine ${i + 1}`,
        location: `Factory ${String.fromCharCode(65 + (i % 3))}, Floor ${1 + (i % 5)}`,
        temperature: `${70 + (i % 20)}°C`,
        vibration: `${30 + (i % 15)} Hz`,
        lastMaintenance: `2025-04-${String(10 + (i % 20)).padStart(2, '0')}`,
        load: `${10 + (i % 90)}%`,
        status: i % 3 === 0 ? 'Operational' : i % 3 === 1 ? 'Warning' : 'Maintenance',
      };
    });

    res.status(200).json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}