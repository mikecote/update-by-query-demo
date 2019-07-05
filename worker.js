const uuid = require('uuid');
const esClient = require('./es');
const config = require('./config');

let counter = 0;

setInterval(() => {
    console.log(`I have processed ${counter} tasks in the past 10s`);
    counter = 0;
}, 10000);

(async () => {
    while (true) {
        const uniqueId = uuid.v4();

        // Claim tasks
        const updateByQueryResult = await esClient.updateByQuery({
            index: 'test',
            refresh: true,
            max_docs: config.workerConcurrency,
            conflicts: 'proceed',
            body: {
                query: {
                    bool: {
                        filter: {
                            bool: {
                                must: [
                                    {
                                        term: {
                                            status: 'idle',
                                        }
                                    },
                                    {
                                        range: {
                                            runAt: { lte: 'now' }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                script: {
                    source: `ctx._source.owner=params.uniqueId; ctx._source.status=params.status;`,
                    lang: 'painless',
                    params: {
                        uniqueId,
                        status: 'running',
                    }
                },
                sort: [
                    { runAt: { order: 'asc' } }
                ]
            }
        });
        if (updateByQueryResult.total < config.workerConcurrency) {
            console.log(`Did not claim full amount of tasks, only ${updateByQueryResult.total} but should of claimed ${config.workerConcurrency}`);
        }

        // Get claimed tasks
        const result = await esClient.search({
            index: 'test',
            size: config.workerConcurrency,
            body: {
                query: {
                    bool: {
                        filter: {
                            term: {
                                owner: uniqueId,
                            }
                        }
                    }
                }
            }
        });

        if (result.hits.total.value < updateByQueryResult.total) {
            console.log(`Did not fetch all claimed tasks, only ${result.hits.total.value}`);
        }

        // Finished tasks
        const params = [];
        for (const hit of result.hits.hits) {
            params.push({ update: { _id: hit._id } });
            params.push({
                doc: {
                    ...hit._source,
                    status: 'idle',
                    runAt: new Date(),
                    owner: null
                }
            })
        }
        const bulkResult = await esClient.bulk({
            refresh: false,
            index: 'test',
            body: params,
        });

        if (bulkResult.errors === true) {
            console.log('Encountered errors in bulk request');
        }

        counter += result.hits.total.value;
    }
})();
