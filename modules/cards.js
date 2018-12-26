module.exports = {
  init: function(app, tools, losDB) {
    app.get('/cards/getAll', function(req, res) {
      losDB
        .collection('Cards')
        .find({})
        .toArray(function(err, result) {
          if (err != null) {
            tools.sendError(res, 'Error reaching mongo');
          } else {
            tools.sendData(res, result, req, losDB, false);
          }
        });
    });
  }
};
