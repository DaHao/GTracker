/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
// import './App.css';

import { css } from '@emotion/react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { getReportData } from './components/TimeTracker';
import ReportChart from './components/ReportChart';

function App() {
  // const [currentDate, setCurrentDate] = useState(new Date('2022-08-14T00:00:00Z'));
  const [report, setReport] = useState([]);

  const [startDate, setStartDate] = useState(Date.now());
  const [endDate, setEndDate] = useState(Date.now());

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
  console.log('---------report');
  console.table(report);

  return (
    <Box>
      <Paper css={css`margin: 16px; padding: 4px`}>
        <LocalizationProvider
          dateAdapter={AdapterMoment}>
          <DatePicker
            css={css`margin: 5px;`}
            label="Start Date"
            value={startDate}
            onChange={(newValue) => {
              console.log('-------- startDate', newValue.toDate()); 
              setStartDate(newValue);
            }}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        <LocalizationProvider
          dateAdapter={AdapterMoment}>
          <DatePicker
            css={css`margin: 5px;`}
            label="End Date"
            value={endDate}
            onChange={(newValue) => {
              console.log('-------- endDate', newValue.toDate()); 
              setEndDate(newValue);
            }}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        <Button
          css={css`margin: 5px; height: 54px`}
          variant="contained"
          onClick={onClick}
        >
          Get Report
        </Button>
      </Paper>
      <Paper css={css`margin: 16px; padding: 4px`}>
        <ReportChart chartData={chartData} bars={[...totalBar]}/>
        <pre>
          {JSON.stringify(report, null, 2)}
        </pre>
      </Paper>

    </Box>
  );
}

export default App;
