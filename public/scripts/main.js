/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Shannon Jin, Trey Kline
 */

/** namespace. */
var rhit = rhit || {};

/** SIGNLETON OBJECTS */
rhit.fbLobbyManager = null;

/** LOBBY CODE. */
rhit.LobbyController = class {
  constructor() {
    //Initialize listeners

    //Listen for updates
    rhit.fbLobbyManager.beginListening(this.updateView.bind(this));

  }

  updateView() {
    console.log("Lobby Lenght:", rhit.fbLobbyManager.length)

    for(let i = 0; i < rhit.fbLobbyManager.length; i++){
      const lob = rhit.fbLobbyManager.getLobbyAtIndex(i);
      console.log("Got lobby:", lob);
    }
  }

}

rhit.LobbyModel = class {
  constructor(id, maxPlayers, numRounds, timeForRounds, players, lists, currentGame) {
    //Set lobby data
    this.lobbyId = id;
    this.maxPlayers = maxPlayers;
    this.numRounds = numRounds;
    this.timeForRounds = timeForRounds;
    this.players = players;
    this.lists = lists;
    this.currentGame = currentGame;
  }

  getLobbySettings() {
    let lobbySettings = {
      maxPlayers: this.maxPlayers,
      numRounds: this.numRounds,
      timeForRounds: this.numRounds
    }
    return lobbySettings;
  }
}

rhit.FbLobbyManager = class {
  constructor() {
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection("Lobbies");
    this._unsub = null;
  }

  get length(){
    return this._documentSnapshots.length;
  }

  newLobby() { }
  beginListening(changeListener) {
    // console.log("ref:", this._ref);
    this._unsub = this._ref.onSnapshot((querySnapshot) => {
      this._documentSnapshots = querySnapshot.docs;
      changeListener();
    });
  }
  stopListening() { }
  addPlayerToLobby() { }
  deleteLobby() { }
  getLobbyAtIndex(index) {
    console.log(this._documentSnapshots)
    const docSnap = this._documentSnapshots[index];
    console.log(docSnap)
    const lob = new rhit.LobbyModel(docSnap.id, docSnap.get("MaxPlayers"), docSnap.get("NumRounds"), docSnap.get("TimeforRound"), docSnap.get("Players"), docSnap.get("Lists"), docSnap.get("CurrentGame"));
    return lob;
  }
  searchLobbiesByName() { }

}



/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");

  if(document.getElementById("mainPage") || document.getElementById("signinPage") || document.getElementById("signupPage"))
  rhit.startFirebaseUI();

  if (document.getElementById("lobbySelectPage")) {
    rhit.lobbyPageInit();
  }

};

rhit.startFirebaseUI = function () {
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

rhit.lobbyPageInit = function () {
  rhit.fbLobbyManager = new rhit.FbLobbyManager();
  new rhit.LobbyController();
}

rhit.main();
