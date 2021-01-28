const { getCardsService } = require('../services/cardsService');

async function getCards(req, res) {
    return getCardsService();
}

module.exports = { getCards }