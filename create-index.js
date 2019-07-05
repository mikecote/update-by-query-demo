const config = require('./config');
const esClient = require('./es');

(async () => {
    await esClient.indices.create({
        index: config.esIndex,
        body: {
            settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
            },
            mappings: {
                properties: {
                    taskId: { type: 'integer' },
                    createdOn: { type: 'date' },
                    runAt: { type: 'date' },
                    status: { type: 'keyword' },
                    owner: { type: 'keyword' },
                }
            }
        }
    });
    console.log(`Created "${config.esIndex}" index`);
})();
