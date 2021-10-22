/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Shannon Jin, Trey Kline
 */

/** namespace. */
var rhit = rhit || {};

/** LOBBY CODE. */
rhit.LobbyController = class{
  constructor(){
    //Initialize listeners

    //Listen for updates
  }

  updateView(){

  }

}

rhit.LobbyModel = class{
  constructor(){
    //Set lobby data
    
  }

  getLobbySettings(){

  }
}

rhit.FbLobbyManager = class{
  constructor(){
    //Init firesture ref
  }
  newLobby(){}
  beginListening(){}
  stopListening(){}
  addPlayerToLobby(){}
  deleteLobby(){}
  getLobbyById(){}
  searchLobbiesByName(){}

}



/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.startFirebaseUI();
};

rhit.startFirebaseUI= function() {
	var uiConfig = {
        signInSuccessUrl: '/',
        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
        ],
       
      };

      var ui = new firebaseui.auth.AuthUI(firebase.auth());
     
      ui.start('#firebaseui-auth-container', uiConfig);
}
rhit.main();
