import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { getReportData } from './components/TimeTracker';
import ReportChart from './components/Chart';

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

  const totalBar = new Set();
  const chartData = report.map(issue => {
    const barData = issue.report.reduce((accu, row) => (
      { ...accu, [`${row.authorName}-${row.summary}`]: row.time }
    ), {});
    totalBar.add(...Object.keys(barData));

    return {
      iid: issue.iid,
      // estimate: issue.time_estimate,
      // title: issue.title,
      ...barData,
    };
  }).filter(row => Object.keys(row).length > 1);

  totalBar.delete(undefined);

  return (
    <div className="App">
      <ReportChart chartData={chartData} bars={[...totalBar]}/>
      <div>{JSON.stringify(report)}</div>
    </div>
  );
}

export default App;
