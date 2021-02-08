const { sendResponse } = require('../routes/utils');
const { getCardsService } = require('../services/cardsService');

async function getCards(req, res) {
    const lResponse= await getCardsService();

    sendResponse(lResponse,res);
}

module.exports = { getCards }