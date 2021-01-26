const expressSession = require('express-session');

 class SingleStore {
	static sessionStore;

	static connect() {
		SingleStore.sessionStore = new expressSession.MemoryStore();
	}
    
}

module.exports = {SingleStore};