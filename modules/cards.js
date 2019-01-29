var champions = require('./champion.json');
module.exports = {
  init: function(app, tools, losDB) {
    app.get('/cards/getAll', function(req, res) {
      losDB
        .collection('Cards')
        .find({})
        .toArray(function(err, result) {
          if(!result || !result.length ) {
            losDB.collection('Cards').insert(champions).then((inserted)=>{
              tools.sendData(res, inserted, req, losDB, false);
            })
          }
          if (err != null) {
            tools.sendError(res, 'Error reaching mongo');
          } else {
            tools.sendData(res, result, req, losDB, false);
          }
        });
    });
  }
};
