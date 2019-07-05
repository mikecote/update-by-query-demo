const config = require('./config');
const elasticsearch = require('elasticsearch');

module.exports = new elasticsearch.Client({
    host: config.esUrl,
});
