const axios = require('axios');

async function callApi(options) {
  const result = await axios.request(options)
    .then(res => res)
    .catch(err => err);

  return result;
}

const options = {
  method: 'GET',
  baseURL: 'https://gitlab.com/api/v4',
  url: '/issues',
  params: {
    private_token: 'glpat-MnTX6mgpLwypnVd3jbsx',
    milestone: 'GMN v1.8.2',
  },
};

const noteOptions = {
  method: 'GET',
  baseURL: 'https://gitlab.com/api/v4',
  url: '/projects/14003804/issues/642/notes',
  params: {
    private_token: 'glpat-MnTX6mgpLwypnVd3jbsx',
    milestone: 'GMN v1.8.2',
  },
};

const options2 = {
  method: 'GET',
  baseURL: 'https://gitlab.com/api/v4',
  url: '/projects/14003804/issues/651/time_stats',
  params: {
    private_token: 'glpat-MnTX6mgpLwypnVd3jbsx',
    milestone: 'GMN v1.8.2',
  },
}

function getIssueContent(entry) {
  const {
    id, title,
    milestone: { id: mid, title: mTitle },
    web_url, time_stats, _links, references,
  } = entry;

  return { id, title, time_stats, _links, references, milestone: { id: mid, title: mTitle }, web_url };
}

function getNoteContent(entry) {
  const { id, body, author, created_at, updated_at } = entry;
  return { id, body, author, created_at, updated_at };
}

async function main() {
  const resp = await callApi(noteOptions);
  const result = resp?.data?.map(getNoteContent);
  console.log(result);
}
// https://gitlab.com/geminiopencloud/engineering/portal/xportal/-/issues/659#

main();
