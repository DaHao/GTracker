import axios from 'axios';
import asyncjs from 'async';
import moment from 'moment'

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

function isBetweenNote(updated_at, startDate, endDate) {
  const compareDate = moment(updated_at);
  const start = moment(startDate);
  const end = moment(endDate);
  return compareDate.isBetween(start, end);
}

function getNotesReport(notes, startDate, endDate) {
  const report = [];
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!isTrackingNote(note?.body)) continue;
    if (!isBetweenNote(note.updated_at, startDate, endDate)) continue;

    // notes 用 asc 排序，預設欄位是 created_at
    // 順序會是先 comment (plan, coding, fix, review)
    // 再操作 /spend (body = 'added xxx of time spent')
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

function getIssueReport(startDate, endDate) {
  return async function (issue) {
    const { id, iid, title, _links, time_stats, updated_at } = issue;
    const noteUrl = _links?.notes;

    if (!noteUrl) return [];

    const notes = await callApi(getNoteApiOptions(noteUrl))
      .then(resp => resp?.data)
      .catch(error => console.log(error));

    const report = getNotesReport(notes, startDate, endDate);
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
  };
}

function getMRReport(startDate, endDate) {
  return async function (mr) {
    const { id, iid, title, time_stats, updated_at } = mr;
    const noteUrl = `https://gitlab.com/api/v4/projects/${PROJECT_ID}/merge_requests/${iid}/notes`;

    const notes = await callApi(getNoteApiOptions(noteUrl))
      .then(resp => resp?.data)
      .catch(error => console.log(error));

    const report = getNotesReport(notes, startDate, endDate);
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
  };
}

async function getIssueData(updated_after, updated_before) {
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

  const report = await asyncjs.mapSeries(issues, getIssueReport(updated_after, updated_before))
    .catch(error => console.log(error));

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

  const report = await asyncjs.mapSeries(mrs, getMRReport(updated_after, updated_before))
    .catch(error => console.log(error));

  return report;
}

function removeEmptyReport(report) {
  if (!Array.isArray(report)) return report;

  return report.reduce((accu, r) => {
    if (r.report.length > 0) accu.push(r);
    return accu;
  }, []);
}

export { getIssueData, getMRData, removeEmptyReport };
