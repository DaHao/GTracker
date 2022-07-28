// require modules
const Config = require('gitlab-time-tracker/src/include/config');
const Report = require('gitlab-time-tracker/src/models/report');

// create a default config
let config = new Config();

// set required parameters
config.set('token', 'glpat-MnTX6mgpLwypnVd3jbsx');
config.set('project', 'geminiopencloud/engineering/portal/xportal');

// create report
let report = new Report(config);

async function main() {
    // query and process data
    try {
        await report.getProject()
        await report.getIssues()
        await report.getMergeRequests()
        await report.processIssues()
        await report.processMergeRequests()
    } catch (error) {
        console.log(error)
    }
          
    // access data on report
    report.issues.forEach(issue => {
        // time records on issue
        console.log(issue.times);
        // time spent of single time record
        console.log(issue.times[0].time);
    });
    /*
    report.mergeRequests.forEach(mergeRequest => {
        // time records on merge requests
        console.log(mergeRequest.times);
        // user of single time record
        console.log(mergeRequest.times[0].user);
    });
    */
}

main();
