function checkAuthentication(req,res){
    if(req){
        const token = req.header('WWW-Authenticate');
        if(!token){
            res.status(500);
            res.json({
            error: 'Missing token.',
            });
            return [null,'Missing token.'];
        }
        if(!req.session.connectedUser){
            res.status(500);
            res.json({
            error: 'User is not connected.',
            });
            return [null,'User is not connected.'];;
        }
        
    }
}

async function processServiceResponse(pService, res, req) {
    
  try {
    let [lResult, error,code] = await pService;
    if (error) {
      res.status(code==undefined?400:code);
      if (typeof error == 'object') {
        res.json(error);
      } else {
        res.json({ error });
      }
      console.error('Caught error : ' + error);
      return;
    }
    res.json(lResult);
  } catch (error) {
    res.status(500);
    res.end();
    console.error('Caught error : ' + error);
  }
}
module.exports = { processServiceResponse,checkAuthentication };
