/** @jsxImportSource @emotion/react */
import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import moment from 'moment';
// import './App.css';

import { css } from '@emotion/react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress'

import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { getIssueData, getMRData, removeEmptyReport } from './components/TimeTracker';
import ReportChart from './components/ReportChart';

function LinearProgressWithLabel(props) {
  const { value } = props;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '320px' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 32 }}>
        <Typography variant="body2" color="text.secondary">{`${value}%`}</Typography>
      </Box>
    </Box>
  );
}
function renderEntry(iid, entry, type) {
  const { title, plan, coding, fix, review } = entry;
  let url = "";
  if (type === 'mr') url = `https://gitlab.com/geminiopencloud/engineering/portal/xportal/-/merge_requests/${iid}`;
  if (type === 'issue') url = `https://gitlab.com/geminiopencloud/engineering/portal/xportal/-/issues/${iid}`;

  return (
    <div style={{ marginBottom: '8px' }}>
      <li><a href={url} target="_blank">{iid} {title}</a></li>
      <div>{plan && `plan: ${plan}`}</div>
      <div>{coding && `coding: ${coding}`}</div>
      <div>{fix && `fix: ${fix}`}</div>
      <div>{review && `review: ${review}`}</div>
    </div>
  );
}

function getTotal(entries) {
  if (!entries) return [0, 0, 0, 0];

  return Object.entries(entries).reduce((accu, [name, person]) => {
    let [p = 0, c = 0, f = 0, r = 0] = accu[name] || [];
    Object.entries(person).forEach(([iid, issue]) => {
      if (issue.plan)   p += Number(issue.plan);
      if (issue.coding) c += Number(issue.coding);
      if (issue.fix)    f += Number(issue.fix);
      if (issue.review) r += Number(issue.review);
    });
    accu[name] = [p, c, f, r];
    return accu;
  }, {});
}

function renderTotal(total) {
  const [p, c, f, r] = total;
  return (
    <span>
      <b>Plan:</b>&nbsp;&nbsp;{p} &nbsp;&nbsp;&nbsp;&nbsp;
      <b>Coding:</b>&nbsp;&nbsp;{c} &nbsp;&nbsp;&nbsp;&nbsp;
      <b>Fix:</b>&nbsp;&nbsp;{f} &nbsp;&nbsp;&nbsp;&nbsp;
      <b>Review:</b>&nbsp;&nbsp;{r}
    </span>
  );
}

function renderTable(issues, mrs, diffDay) {
  const authorNames = [...new Set(
    [...Object.keys(issues || {}), ...Object.keys(mrs || {})],
  )];

  const issuesTotal = getTotal(issues);
  const mrsTotal = getTotal(mrs);

  // {`${p+c+f+r} Hours`}
  return authorNames.map((name, index) => {
    const issuesObj = issues?.[name] || {};
    const mrsObj = mrs?.[name] || {};
    const issueTotal = issuesTotal?.[name] || [];
    const mrTotal = mrsTotal?.[name] || [];

    const total = [...issueTotal, ...mrTotal].reduce((sum, i) => sum + i, 0);
    const progress = diffDay ? total / (diffDay * 8) * 100 : 0;

    return (
      <div key={index} style={{ marginBottom: '48px' }}>
        <h1 style={{ marginBottom: 0 }}>
          <span style={{ color: 'blue' }}>{`${name}`}</span>
          &nbsp;&nbsp;&nbsp;&nbsp;{`${total} / ${diffDay * 8} Hours `}
        </h1>
        <div style={{ display: 'flex' }}>
          <LinearProgressWithLabel value={progress} />
        </div>
        <h2>Issues</h2>
        {renderTotal(issueTotal)}
        <ul>
          {Object.entries(issuesObj).map(([iid, issue]) => {
            return renderEntry(iid, issue, 'issue');
          })}
        </ul>
        <h2>Merge request</h2>
        {renderTotal(mrTotal)}
        <ul>
          {Object.entries(mrsObj).map(([iid, mr]) => {
            return renderEntry(iid, mr, 'mr');
          })}
        </ul>
      </div>
    );
  });
}

function App() {
  // const [currentDate, setCurrentDate] = useState(new Date('2022-08-14T00:00:00Z'));
  const [issues, setIssues] = useState(undefined);
  const [mrs, setMRs] = useState(undefined)
  const [iReady, setIReady] = useState(false);
  const [mReady, setMReady] = useState(false);
  const [click, setClick] = useState(false);

  const [startDate, setStartDate] = useState(Date.now());
  const [endDate, setEndDate] = useState(Date.now());

  function onClick(event) {
    setClick(true);
    getIssueData(startDate, endDate)
      .then(data => {
        setIssues(removeEmptyReport(data));
        setIReady(true);
      });

    getMRData(startDate, endDate)
      .then(data => {
        setMRs(removeEmptyReport(data));
        setMReady(true);
      });
  }

  function getPersonData(source) {
    if (!source) return undefined;

    /*
     * issueReport
     * { Hao: { iid: { title: xxx, plan: x, coding: x } } }
     */
    const report = source.reduce((accu, issue) => {
      const { iid, title, report } = issue;

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
    backgroundColor: `rgba(255, 255, 255, 0.8)`,
    margin: '16px',
    padding: '8px',
  });
  const issuePerson = getPersonData(issues);
  const mrPerson = getPersonData(mrs);
  const diffDay = endDate ? moment(endDate).diff(moment(startDate), 'days') + 1 : undefined;

  return (
    <Box>
      <Paper sx={{ ...paperStyle, display: 'flex' }}>
        <ReactDatePicker
          selected={startDate}
          onChange={(dates) => {
            const [start, end] = dates;
            const sDate = moment(start).startOf('day').toDate();
            const eDate = end ? moment(end).endOf('day').toDate() : null;
            setStartDate(sDate);
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
        {click && (!iReady || !mReady) && <CircularProgress />}
        {(iReady && mReady)
          && renderTable(getPersonData(issues), getPersonData(mrs), diffDay)}
      </Paper>
    </Box>
  );
}

export default App;
