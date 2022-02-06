const { MongoDBConnection } = require('../utils/database.js');
var champions = require('../../data/championsLight.json');
const { $t } = require('../utils/misc.js');

async function getCardsService() {
    try {
        const lCollection = await MongoDBConnection.getCardsCollection();
        let lCards = await lCollection.find({}).toArray();
        if (!lCards || !lCards.length) {
            const inserted = await lCollection.insertMany(champions);
            lCards = inserted.ops;
        }
        return [lCards, null];

    } catch (error) {
        return [null, $t('cards.getCards', {error})];
    }
}
module.exports = {
    getCardsService
};