import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { getReportData } from './components/TimeTracker';
import Chart from './components/Chart';

      // <header className="App-header">
      // </header>
      // <TimeTracker />

function App() {
  const [currentDate, setCurrentDate] = useState(new Date('2022-08-14T00:00:00Z'));
  const [report, setReport] = useState([]);

  useEffect(() => {
    const getReport = async() => {
      const data = await getReportData(currentDate);
      console.log('data', data);
      setReport(data);
    };

    getReport();
  }, [currentDate]);

  return (
    <div className="App">
      <Chart/>
      <div>{JSON.stringify(report)}</div>
    </div>
  );
}

export default App;
