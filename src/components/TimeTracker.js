import axios from 'axios';
import asyncjs from 'async';

const PROJECT_ID = 14003804;
const TRACKING_TYPE = ['plan', 'coding', 'fix', 'review'];

function isTrackingNote(content) {
  return TRACKING_TYPE.includes(content?.trim());
}

function callApi(options) {
  return axios.request(options);
}

function getIssueApiOptions(projectId, query) {
  return {
    baseURL: 'https://gitlab.com/api/v4/',
    url: `projects/${projectId}/issues`,
    method: 'GET',
    params: {
      private_token: process.env.REACT_APP_TOKEN,
      scope: 'all',
      order_by: 'updated_at',
      ...query,
    },
  };
}

function getIssueContent(issue) {
  const { title, _links, updated_at } = issue;
  // return { title, links: _links, updated_at };
  return issue;
}

function getNoteApiOptions(url) {
  return {
    url,
    method: 'GET',
    params: {
      private_token: process.env.REACT_APP_TOKEN,
      sort: 'asc',
      per_page: 100,
    },
  };
}

function convertTime(spentTime) {
  if (!spentTime) return NaN;

  return spentTime.split(' ')?.reduce((accu, token) => {
    const pattern = /(\d+)([dhm]+)/;
    let [,time, unit] = token.match(pattern);

    if (unit === 'd') time = Number(time) * 8;
    if (unit === 'm') time = Number(time) / 60;

    return accu + Number(time);
  }, 0);

}

function getNotesReport(notes) {
  const report = [];
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!isTrackingNote(note?.body)) continue;

    const spentNote = notes[i + 1];
    if (!spentNote || spentNote.author?.name !== note.author?.name) continue;

    const pattern = /added (.*) of time spent/;
    let [, spentTime] = spentNote.body?.match(pattern);

    report.push({
      authorName: note.author?.name,
      summary: note.body,
      time: convertTime(spentTime),
    });
  }

  return report;
}

async function getIssueReport(issue) {
  const { id, iid, title, _links, time_stats, updated_at } = issue;
  const noteUrl = _links?.notes;

  if (!noteUrl) return [];

  const notes = await callApi(getNoteApiOptions(noteUrl))
    .then(resp => resp?.data)
    .catch(error => console.log(error));

  const report = getNotesReport(notes);
  const estimate = convertTime(time_stats?.human_time_estimate);

  return {
    iid,
    title,
    report,
    time_estimate: convertTime(
      time_stats?.human_time_estimate,
    ),
    updated_at,
  };
}

async function getMRReport(mr) {
  const { id, iid, title, time_stats, updated_at } = mr;
  const noteUrl = `https://gitlab.com/api/v4/projects/${PROJECT_ID}/merge_requests/${iid}/notes`;

  const notes = await callApi(getNoteApiOptions(noteUrl))
    .then(resp => resp?.data)
    .catch(error => console.log(error));

  console.log(`MR ${iid} notes`, notes);
  const report = getNotesReport(notes);
  const estimate = convertTime(time_stats?.human_time_estimate);
  console.log(`MR ${iid} report`, report);

  return {
    iid,
    title,
    report,
    time_estimate: convertTime(
      time_stats?.human_time_estimate,
    ),
    updated_at,
  };
}

async function getReportData(updated_after, updated_before) {
  const page = 1;
  const issueOpts = getIssueApiOptions(PROJECT_ID, {
    updated_after,
    updated_before,
    page,
    per_page: 100,
  });

  const issues = await callApi(issueOpts)
    .then(resp => resp.data)
    .catch(error => console.log(error));

  const report = await asyncjs.mapSeries(issues, getIssueReport)
    .catch(error => console.log(error));

  // const testIssue = issues[1];
  // const result = await getIssueReport(testIssue);

  // report.forEach(row => console.log(row));
  // console.log(resp?.headers);
  // console.log(`Total: ${result?.length}`);
  return report;
}

function getMRApiOptions(projectId, query) {
  return {
    baseURL: 'https://gitlab.com/api/v4/',
    url: `projects/${projectId}/merge_requests`,
    method: 'GET',
    params: {
      private_token: process.env.REACT_APP_TOKEN,
      scope: 'all',
      order_by: 'updated_at',
      ...query,
    },
  };
}

async function getMRData(updated_after, updated_before) {
  const page = 1;
  const mrOptions = getMRApiOptions(PROJECT_ID, {
    updated_after,
    updated_before,
    page,
    per_page: 100,
  });

  const mrs = await callApi(mrOptions)
    .then(resp => resp.data)
    .catch(error => console.log(error));


  console.log('---------- mrs', mrs);
  getMRReport(mrs[0]);

  /*
  const report = await asyncjs.mapSeries(issues, getIssueReport)
    .catch(error => console.log(error));
    */

  // const testIssue = issues[1];
  // const result = await getIssueReport(testIssue);

  // report.forEach(row => console.log(row));
  // console.log(resp?.headers);
  // console.log(`Total: ${result?.length}`);
  return mrs;
}

export { getReportData, getMRData };

