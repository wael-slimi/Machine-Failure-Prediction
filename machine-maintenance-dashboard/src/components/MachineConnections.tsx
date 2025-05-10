import React, { useState, useEffect } from 'react';

const MachineConnections: React.FC = () => {
  interface Connection {
    boxId: string;
    machines: string[];
  }

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch('/api/machine-connections');
        if (!response.ok) {
          throw new Error('Failed to fetch machine connections');
        }
        const data = await response.json();
        setConnections(data);
      } catch (error) {
        console.error('Error fetching machine connections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Machine Connections</h2>
      <table>
        <thead>
          <tr>
            <th>Box ID</th>
            <th>Connected Machines</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((connection) => (
            <tr key={connection.boxId}>
              <td>{connection.boxId}</td>
              <td>{connection.machines.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MachineConnections;