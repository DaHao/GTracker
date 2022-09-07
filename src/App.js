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

import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { getIssueData, getMRData, removeEmptyReport } from './components/TimeTracker';
import ReportChart from './components/ReportChart';

function renderTable(source, type) {
  if (!source) return null;
  console.log('-----', type, source);

  const total = Object.entries(source).reduce((accu, [name, issues]) => {
    let [p = 0, c = 0, f = 0, r = 0] = accu[name] || [];
    console.log('--------', name, [p, c, f, r]);
    Object.entries(issues).forEach(([iid, issue]) => {
      if (issue.plan)   p += Number(issue.plan);
      if (issue.coding) c += Number(issue.coding);
      if (issue.fix)    f += Number(issue.fix);
      if (issue.review) r += Number(issue.review);
      console.log('-------------', iid, [p, c, f, r]);
    });
    accu[name] = [p, c, f, r];
    return accu;
  }, {});
  console.log('total', total);

  return Object.entries(source).map(([name, issues], index) => {
    const [p, c, f, r] = total[name] || [];
    return (
      <div key={index} style={{ marginBottom: '48px' }}>
        <h2><span style={{ color: 'blue' }}>{`${name}`}</span>&nbsp;{`${p+c+f+r} Hours`}</h2>
        <span>
          <b>Plan:</b>&nbsp;&nbsp;{p} &nbsp;&nbsp;&nbsp;&nbsp;
          <b>Coding:</b>&nbsp;&nbsp;{c} &nbsp;&nbsp;&nbsp;&nbsp;
          <b>Fix:</b>&nbsp;&nbsp;{f} &nbsp;&nbsp;&nbsp;&nbsp;
          <b>Review:</b>&nbsp;&nbsp;{r}
        </span>
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

  /*
  const cssPaper = {
    root: css`margin: 8px; padding: 4px; display: flex;`,
  };
  */
  const paperStyle = ({
    backgroundColor: `rgba(255, 255, 255, 0.5)`,
    margin: '16px',
    padding: '8px',
  });

  return (
    <Box>
      <Paper sx={{ ...paperStyle, display: 'flex' }}>
        <ReactDatePicker
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates;
            console.log('---- change ');
            console.log(start, ', ', end);
            setStartDate(start);
            setEndDate(end);
          }}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          inline
        />
        <Button
          css={css`margin: 5px; height: 40px;`}
          variant="contained"
          onClick={onClick}
        >
          Get Report
        </Button>
      </Paper>
      <Paper sx={{ ...paperStyle, paddingLeft: '32px' }}>
        <h1>Issue</h1>
          {renderTable(getPersonData(issues), 'issue')}
        <h1>Merge Request</h1>
          {renderTable(getPersonData(mrs), 'mr')}
      </Paper>

    </Box>
  );
}

export default App;
