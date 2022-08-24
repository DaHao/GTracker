import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { getReportData } from './components/TimeTracker';
import ReportChart from './components/Chart';

      // <header className="App-header">
      // </header>
      // <TimeTracker />

function App() {
  // const [currentDate, setCurrentDate] = useState(new Date('2022-08-14T00:00:00Z'));
  const [report, setReport] = useState([]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);

  const onChange = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  function onClick(event) {
    console.log('--------------');
    console.log(startDate);
    console.log(endDate);
    getReportData(startDate, endDate)
      .then(data => { setReport(data); });
  }

  /*
  useEffect(() => {
    const getReport = async() => {
      const data = await getReportData(currentDate);
      // console.log('data', data);
      setReport(data);
    };

    getReport();
  }, [currentDate]);
  */

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
      <DatePicker
        selected={startDate}
        onChange={onChange}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        inline
      />
      <button onClick={onClick}>Get Report</button>
      <ReportChart chartData={chartData} bars={[...totalBar]}/>
      <div>{JSON.stringify(report)}</div>
    </div>
  );
}

export default App;
