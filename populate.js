const _ = require('lodash');
const esClient = require('./es');
const config = require('./config');

const recordsToCreate = _.times(config.numRecordsToPopulate, (i) => ({
    taskId: i,
    createdOn: new Date(),
    runAt: new Date(),
    status: 'idle',
    owner: null,
}));

const batches = _.chunk(recordsToCreate, 500);

(async () => {
    console.log(`Creating ${config.numRecordsToPopulate} tasks...`);
    for (const batch of batches) {
        const params = [];
        for (const row of batch) {
            params.push({ index: {} }),
            params.push(row);
        }
        const result = await esClient.bulk({
            index: config.esIndex,
            body: params,
        });
    }
    console.log(`Finished creating ${config.numRecordsToPopulate} tasks`);
})();
