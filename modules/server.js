module.exports = {
    init: function(app, tools, losDB) {
        app.get('/resetServer', async function(req, res) {
            await tools.deleteDb(res, 'Reset server', req, losDB);
        });
    }
};