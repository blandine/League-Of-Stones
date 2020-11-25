var champions = require('../championsLight.json');
/* Reinit champions from LOL file
var champions = require('./champion.json');
const fs = require('fs')

const championsLight = []
champions.forEach((champion)=> {
  const {id, key, name, title, image, info} = champion;
  championsLight.push({id,key, name, title, image, info});
})

fs.writeFile('./championsLight.json', JSON.stringify(championsLight), ()=>{});*/

module.exports = {
  init: function(app, tools, losDB) {
    app.get('/cards', function(req, res) {
      losDB
        .collection('Cards')
        .find({})
        .toArray(async function(err, result) {
          let cards = result;
          if(!cards || !cards.length ) {
            const inserted = await losDB.collection('Cards').insertMany(champions);
            cards = inserted.ops;
          }
          if (err != null) {
            tools.sendError(res, 'Error reaching mongo');
          }
          tools.sendData(res, cards, req, losDB, false);
        });
    });
  }
};
