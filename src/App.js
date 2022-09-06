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

import { getIssueData, getMRData, removeEmptyReport } from './components/TimeTracker';
import ReportChart from './components/ReportChart';

function renderTable(data, type) {
  if (!data) return null;
  return Object.entries(data).map(([name, issues], index) => {
    return (
      <div key={index}>
        <h2>{name}</h2>
        <ul>
          {Object.entries(issues).map(([iid, issue]) => {
            const { title, plan, coding, fix, review } = issue;
            let url = "";
            if (type === 'mr') url = `https://gitlab.com/geminiopencloud/engineering/portal/xportal/-/merge_requests/${iid}`;
            if (type === 'issue') url = `https://gitlab.com/geminiopencloud/engineering/portal/xportal/-/issues/${iid}`;
            return (
              <div>
                <li><a href={url} target="_blank">{iid} {title}</a></li>
                <div>{plan && `plan: ${plan}`}</div>
                <div>{coding && `coding: ${coding}`}</div>
                <div>{fix && `fix: ${fix}`}</div>
                <div>{review && `review: ${review}`}</div>
              </div>
            );
          })}
        </ul>
      </div>
    );
  })
}

function App() {
  // const [currentDate, setCurrentDate] = useState(new Date('2022-08-14T00:00:00Z'));
  const [issues, setIssues] = useState(undefined);
  const [mrs, setMRs] = useState(undefined)
  const [ready, setReady] = useState(false);

  const [startDate, setStartDate] = useState(Date.now());
  const [endDate, setEndDate] = useState(Date.now());

  function onClick(event) {
    getIssueData(startDate, endDate)
      .then(data => { setIssues(removeEmptyReport(data)); });

    getMRData(startDate, endDate)
      .then(data => { setMRs(removeEmptyReport(data)); });
  }

  const totalBar = new Set();
  const chartData = (issues ?? []).map(issue => {
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
  console.log(issues);
  console.log(mrs);

  function getPersonData(data) {
    if (!data) return undefined;
    // if (issues === undefined || mrs === undefined) return undefined;

    /*
     * issueReport
     * { Hao: { iid: { title: xxx, plan: x, coding: x } } }
     */
    const report = data.reduce((accu, row) => {
      const { iid, title, report } = row;

      report.forEach(r => {
        const { authorName: name, summary, time } = r;

        if (!accu[name]) accu[name] = { };
        if (!accu[name][iid]) accu[name][iid] = { title };
        if (!accu[name][iid][summary]) accu[name][iid][summary] = 0;

        accu[name][iid][summary] += time;
      });

      return accu;
    }, {});

    return report;
  }

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
        <h1>Issue</h1>
          {renderTable(getPersonData(issues), 'issue')}
        <h1>Merge Request</h1>
          {renderTable(getPersonData(mrs), 'mr')}
      </Paper>

    </Box>
  );
}

export default App;
