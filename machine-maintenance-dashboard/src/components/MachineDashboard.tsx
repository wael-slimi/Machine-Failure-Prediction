import React, { useEffect, useState } from 'react';

const MachineDashboard: React.FC = () => {
  const [simulationResults, setSimulationResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [machineData, setMachineData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMachineData = async () => {
      try {
        const response = await fetch('/api/machine-data');
        if (!response.ok) {
          throw new Error('Failed to fetch machine data');
        }
        const data = await response.json();
        setMachineData(data);
      } catch (error) {
        console.error('Error fetching machine data:', error);
      }
    };

    fetchMachineData();
  }, []);

  const handleStartSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_machines: 10, hours: 24 }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch simulation results');
      }

      const data = await response.json();
      console.log('Simulation results:', data);
      setSimulationResults(data);
    } catch (error) {
      console.error('Error starting simulation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Machine Dashboard</h2>
      <button onClick={handleStartSimulation} disabled={loading}>
        {loading ? 'Simulating...' : 'Start Simulation'}
      </button>

      {simulationResults.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Machine ID</th>
              <th>Prediction Time</th>
              <th>Urgency</th>
              <th>Expected Issues</th>
            </tr>
          </thead>
          <tbody>
            {simulationResults.map((result, index) => (
              <tr key={index}>
                <td>{result.machine_id}</td>
                <td>{new Date(result.prediction_time).toLocaleString()}</td>
                <td>{result.urgency}</td>
                <td>{result.expected_issues.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {machineData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Machine ID</th>
              <th>Timestamp</th>
              <th>Temperature</th>
              <th>Vibration</th>
              <th>Load</th>
              <th>Cycle Time</th>
              <th>Power Consumption</th>
            </tr>
          </thead>
          <tbody>
            {machineData.map((machine, index) => (
              <tr key={index}>
                <td>{machine.machine_id}</td>
                <td>{new Date(machine.timestamp).toLocaleString()}</td>
                <td>{machine.temperature}</td>
                <td>{machine.vibration}</td>
                <td>{machine.load}</td>
                <td>{machine.cycle_time}</td>
                <td>{machine.power_consumption}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        tr:hover {
          background-color: #ddd;
        }
      `}</style>
    </div>
  );
};

export default MachineDashboard;