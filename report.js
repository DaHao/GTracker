require('dotenv').config();

const axios = require('axios');
const asyncjs = require('async');

const PORTAL_ID = 14003804;
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
      private_token: process.env.TOKEN,
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
      private_token: process.env.TOKEN,
      sort: 'asc',
    },
  };
}

function convertTime(token) {
  const pattern = /(\d+)([dhm]+)/;
  let [,time, unit] = token.match(pattern);

  if (unit === 'd') time = Number(time) * 8;
  if (unit === 'm') time = Number(time) / 60;

  return Number(time);
}

function getSpentTime(content) {
  const pattern = /added (.*) of time spent/;

  let [, spentTime] = content?.match(pattern);

  return spentTime.split(' ')?.reduce((accu, token) => {
    const time = convertTime(token);
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

    const spentTime = getSpentTime(spentNote.body);

    report.push({
      authorName: note.author?.name,
      summary: note.body,
      time: spentTime,
    });
  }

  return report;
}

async function getIssueReport(issue) {
  const { id, iid, title, _links, time_stats } = issue;
  const noteUrl = _links?.notes;

  if (!noteUrl) return [];

  const notes = await callApi(getNoteApiOptions(noteUrl))
    .then(resp => resp?.data)
    .catch(error => console.log(error));

  const report = getNotesReport(notes);

  return {
    iid,
    title,
    report,
    time_estimate: time_stats?.human_time_estimate,
  };
}

async function main() {
  const page = 1;
  const issueOpts = getIssueApiOptions(PORTAL_ID, {
    updated_after: new Date('2022-08-14T00:00:00Z'),
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
  console.log(report);

  // report.forEach(row => console.log(row));
  // console.log(resp?.headers);
  // console.log(`Total: ${result?.length}`);
}

main();
