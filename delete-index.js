const esClient = require('./es');
const config = require('./config');

(async () => {
    await esClient.indices.delete({ index: config.esIndex, ignore: [404] });
    console.log(`Deleted "${config.esIndex}" index`);
})();
