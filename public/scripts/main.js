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
//users collection
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_USERNAME = "Username";
rhit.FB_KEY_PASSWORD = "Password";
rhit.FB_KEY_AVATAR = "Avatar";
rhit.FB_KEY_NUMTIE = "#Tie";
rhit.FB_KEY_NUMTOTALGAME = "#TotalGame";
rhit.FB_KEY_NUMLOSE = "#Lose";
rhit.FB_KEY_NUMWIN = "#Win";
rhit.FB_KEY_EMAIL = "Email";
//lobby collection
rhit.FB_COLLECTION_LOBBY = "Users";
rhit.FB_KEY_NAME = "Name";
rhit.FB_KEY_MAXPLAYERS = "MaxPlayers";
rhit.FB_KEY_NUMROUNDS = "NumRounds";
rhit.FB_KEY_PLAYERS = "Players";
rhit.FB_KEY_TIMEFORROUND = "TimeforRound";
rhit.FB_KEY_LISTS = "Lists";
rhit.fbLobbyManager = null;
rhit.authManager = null;
rhit.fbSingleLobbyManager = null;
rhit.fbUsersManager = null;
rhit.fbListsManager = null;


/** HELPER FUNCTIONS */
function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

/** AUTH CODE */
rhit.AuthPageController = class {
  constructor() {
    const inputEmailEl = document.querySelector("#inputEmail");
    const inputPasswordEl = document.querySelector("#inputPassword");

    if (document.getElementById("signinPage")) {
      document.querySelector("#signinBtn").onclick = (event) => {
        rhit.authManager.signIn(inputEmailEl.value, inputPasswordEl.value);
      }
    } else {
      document.querySelector("#signupBtn").onclick = (event) => {
        const inputAvatatEl = document.querySelector("#inputAvatar");
        const inputUsernameEl = document.querySelector("#inputUsername");
        console.log("are you try to sign up?");

        rhit.authManager.signUp(inputEmailEl.value, inputPasswordEl.value, inputAvatatEl.value, inputUsernameEl.value);
      }
    }
  }
}

rhit.AuthManager = class {
  constructor() {
    this._user = null;
    this._ref = firebase.firestore().collection("Users");
    this._userNeedsAccount = false;
  }

  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      changeListener();
      console.log("who is logg in now: ", this._user);
      if (this._userNeedsAccount) {
        this._ref.doc(user.uid)
          .set({
            [rhit.FB_KEY_USERNAME]: this._userNeedsAccount.username,
            [rhit.FB_KEY_EMAIL]: this._userNeedsAccount.email,
            [rhit.FB_KEY_AVATAR]: this._userNeedsAccount.avatar,
            [rhit.FB_KEY_NUMLOSE]: 0,
            [rhit.FB_KEY_NUMTIE]: 0,
            [rhit.FB_KEY_NUMWIN]: 0,
            [rhit.FB_KEY_NUMTOTALGAME]: 0,
          });
        this._userNeedsAccount = false;
      }

    });
  }

  signIn(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("create account error,", errorCode, errorMessage);
      });

  }

  signUp(email, password, avatar, username) {
    this._userNeedsAccount = {
      email: email,
      avatar: avatar,
      username: username
    };

    console.log("User needs account:", this._userNeedsAccount);

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((create) => {

        console.log("Create User Id: ", this._userNeedsAccount);
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("log in error,", errorCode, errorMessage);
      });
  }

  // signUp(email, password, avatar, username) {
  //   return firebase.auth().createUserWithEmailAndPassword(email, password)
  //     .then((create) => {
  //       console.log("Create User Id: ", create.user.uid);
  //       this._ref.doc(create.user.uid)
  //         .set({
  //           [rhit.FB_KEY_EMAIL]: email,
  //           [rhit.FB_KEY_USERNAME]: username,
  //           [rhit.FB_KEY_PASSWORD]: password,
  //           [rhit.FB_KEY_AVATAR]: avatar,
  //           [rhit.FB_KEY_NUMLOSE]: 0,
  //           [rhit.FB_KEY_NUMTIE]: 0,
  //           [rhit.FB_KEY_NUMWIN]: 0,
  //           [rhit.FB_KEY_NUMTOTALGAME]: 0,
  //         }).then((user) =>{
  //           console.log("Added user the user is:", user);
  //         });
  //     })
  //     .catch((error) => {
  //       var errorCode = error.code;
  //       var errorMessage = error.message;
  //       console.log("log in error,", errorCode, errorMessage);

  //     });
  // }

  signOut() {
    firebase.auth().signOut().catch((error) => {
      console.log("sign out error");
    });
  }

  get uid() {
    return this._user.uid;
  }
  get isSignedIn() {
    return !!this._user;
  }
}

/** USERS CODE. */
rhit.UserModel = class {
  constructor(userId, username) {
    this.userId = userId;
    this.username = username;
  }
}

rhit.FbUsersManager = class {
  constructor() {
    this._ref = firebase.firestore().collection("Users");
  }

  getUserInfo(userId) {
    console.log("Getting:", userId);
    return this._ref.doc(userId).get().then((snapshot) => {
      return new rhit.UserModel(snapshot.id, snapshot.get("Username"));
    });

  }
}





/** LOBBY CODE. */
rhit.LobbyListController = class {
  constructor() {
    document.getElementById("searchInput").addEventListener("keyup", (event) => {
      if(event.code === "Enter"){
        console.log("I pressed enter!")

        const searchString = document.getElementById("searchInput").value;
        rhit.fbLobbyManager.setFilterString(searchString);
        this.updateView();
      }

    });

    rhit.fbListsManager.beginListening(this.updateModal.bind(this));

    document.getElementById("submitNewLobby").onclick = (event) => {
      const name = document.getElementById("inputLobbyName").value;
      const maxPlayers = parseInt(document.getElementById("inputMaxPlayers").options[document.getElementById("inputMaxPlayers").selectedIndex].text);

      const numRounds = parseInt(document.getElementById("numRounds").options[document.getElementById("numRounds").selectedIndex].text);
      const roundTime = parseInt(document.getElementById("roundTime").options[document.getElementById("roundTime").selectedIndex].value);
      const defaultLists = document.querySelector('#defaultLists');
      const myLilsts = document.querySelector('#myLists');
      const selectedValues = [].filter
        .call(defaultLists.options, option => option.selected)
        .map(option => option.value);
      const selectedValues2 = [].filter
        .call(myLilsts.options, option => option.selected)
        .map(option => option.value);

      const lists = Object.values(selectedValues).concat(Object.values(selectedValues2));
      console.log("here is name ", name);
      console.log("here is the max players", maxPlayers);
      console.log("here is the number rounds", numRounds);
      console.log("here is roundTime", roundTime);

      console.log("here is the list", Object.values(selectedValues).concat(Object.values(selectedValues2)));

      rhit.fbLobbyManager.newLobby(name, maxPlayers, numRounds, roundTime, lists).then((lobId) => {
        window.location.href = `/lobby.html?lobby=${lobId}`
      });


    }

    $('#createLobbyModal').on("shown.bs.modal", (event) => {
      const quote = document.querySelector("#inputLobbyName").focus();
    });

    //Listen for updates
    rhit.fbLobbyManager.beginListening(this.updateView.bind(this));

  }

  updateView() {
    console.log("Lobby Lenght:", rhit.fbLobbyManager.length)
    const lobList = htmlToElement('<div id="lobbies" class="overflow-auto"></div>');

    for (let i = 0; i < rhit.fbLobbyManager.length; i++) {
      const lob = rhit.fbLobbyManager.getLobbyAtIndex(i);
      console.log("Got lobby:", lob);
      lobList.appendChild(this.createJoinLobby(lob));


    }

    const oldList = document.getElementById("lobbies");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    oldList.parentElement.appendChild(lobList);

    for (let i = 0; i < rhit.fbLobbyManager.length; i++) {
      const lob = rhit.fbLobbyManager.getLobbyAtIndex(i);
      document.getElementById(`lobButt${lob.lobbyId}`).onclick = (event) => {
        console.log("You joined: ", lob.lobbyId);
        window.location.href = `/lobby.html?lobby=${lob.lobbyId}`
      }
    }
  }

  updateModal(){
    const customLists = rhit.fbListsManager.customLists;
    const defaultLists = rhit.fbListsManager.defaultLists;

    let newMyLists = htmlToElement('<select id="myLists" multiple></select>');
    let newDefaultLists = htmlToElement('<select id="defaultLists" multiple></select>');

    customLists.forEach((list) =>{
      const listHMTL = htmlToElement(`<option value="${list.id}">${list.name}</option>`);
      newMyLists.appendChild(listHMTL);
    });

    defaultLists.forEach((list) =>{
      const listHMTL = htmlToElement(`<option value="${list.id}">${list.name}</option>`);
      newDefaultLists.appendChild(listHMTL);
    });

    const oldMyLists = document.getElementById("myLists");
    const oldDefaultLists = document.getElementById("defaultLists");

    oldMyLists.removeAttribute("id");
    oldDefaultLists.removeAttribute("id");

    oldMyLists.hidden = true;
    oldDefaultLists.hidden = true;

    oldMyLists.parentElement.appendChild(newMyLists);
    oldDefaultLists.parentElement.appendChild(newDefaultLists);
  }

  createJoinLobby(lobby) {
    const lobbyHtml = htmlToElement(
      `<div class ="lobby">
        <h2>${lobby.lobbyName}</h2>
        <h3>${lobby.players.length}/${lobby.maxPlayers}</h3>
        <button id="lobButt${lobby.lobbyId}" type="button" class="btn our-button-secondary">Join</button>
      </div>`);

    return lobbyHtml;


  }

}

rhit.LobbyModel = class {
  constructor(id, maxPlayers, numRounds, timeForRounds, players, lists, currentGame, name) {
    //Set lobby data
    this.lobbyId = id;
    this.lobbyName = name
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
    this._unfilteredDocumentSnapshots = [];
    this._ref = firebase.firestore().collection("Lobbies");
    this._unsub = null;
    this.filterString = null;
  }

  get length() {
    return this._documentSnapshots.length;
  }

  setFilterString(string) {
    this.filterString = string;
    this.search();
  }

  search() {
    console.log("Searching on:", this.filterString);
    if (this.filterString) {
      this._documentSnapshots = this._unfilteredDocumentSnapshots.filter((doc) => {
        let name = doc.get("Name");
        name = name.toLowerCase();
        let filter = this.filterString.toLowerCase();
        return name.includes(filter);
      });
    } else {
      this._documentSnapshots = this._unfilteredDocumentSnapshots;
    }

  }

  newLobby(name, maxPlayers, numRounds, roundTime, lists) {
    console.log("create lobby...");

    return this._ref.add({
      [rhit.FB_KEY_NAME]: name,
      [rhit.FB_KEY_MAXPLAYERS]: maxPlayers,
      [rhit.FB_KEY_NUMROUNDS]: numRounds,
      [rhit.FB_KEY_TIMEFORROUND]: roundTime,
      [rhit.FB_KEY_PLAYERS]: [rhit.authManager.uid],
      [rhit.FB_KEY_LISTS]: lists
    }).then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      return docRef.id;
    })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });
  }

  beginListening(changeListener) {
    // console.log("ref:", this._ref);
    this._unsub = this._ref.onSnapshot((querySnapshot) => {
      this._documentSnapshots = querySnapshot.docs;
      this._unfilteredDocumentSnapshots = querySnapshot.docs;
      this.search();
      changeListener();
    });
  }
  stopListening() {
    this._unsub();
  }
  deleteLobby() { }
  getLobbyAtIndex(index) {
    const docSnap = this._documentSnapshots[index];
    const lob = new rhit.LobbyModel(docSnap.id, docSnap.get("MaxPlayers"), docSnap.get("NumRounds"), docSnap.get("TimeforRound"), docSnap.get("Players"), docSnap.get("Lists"), docSnap.get("CurrentGame"), docSnap.get("Name"));
    return lob;
  }
  searchLobbiesByName() { }

}


rhit.LobbyController = class {
  constructor() {
    rhit.fbSingleLobbyManager.beginListening(this.updateView.bind(this));

    //Listener to kick player from the lobby if they leave the page

    //TODO: Add check if they are leaving the page to go to the game page (if so don't kick)
    window.onbeforeunload = (event) => {
      rhit.fbSingleLobbyManager.removeCurrentPlayer();
    }
  }
  updateView() {
    document.getElementById("lobbyName").innerHTML = `Lobby: ${rhit.fbSingleLobbyManager.name}`
    const playerList = htmlToElement('<div id="lobbyPlayers"></div>');

    const players = rhit.fbSingleLobbyManager.players;
    console.log("Players:", players);
    players.forEach((player) => {
      rhit.fbUsersManager.getUserInfo(player).then((playerModel) => {
        console.log("Player Info:", playerModel);
        playerList.appendChild(htmlToElement(`<h2>${playerModel.username}</h2>`));
      });
    });

    const oldList = document.getElementById("lobbyPlayers");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    oldList.parentElement.appendChild(playerList);

    console.log(players[0] + " == " + rhit.authManager.uid);
    if (players[0] == rhit.authManager.uid) {
      console.log("I'm the lobby owner");

      document.getElementById("startGameButton").style.display = "block";
      document.getElementById("waitingText").style.display = "none";
    }


  }
}

rhit.FbSingleLobbyManager = class {
  constructor(lobbyId) {
    //Set up instance vars
    this.lobbyId = lobbyId;
    this._documentSnapshot = {};
    this._unsub = null;
    this._ref = firebase.firestore().collection("Lobbies").doc(lobbyId);

    //Insert Current User into lobby
    this._ref.update({
      Players: firebase.firestore.FieldValue.arrayUnion(rhit.authManager.uid)
    });
    document.getElementById("startGameButton").addEventListener("click", (event) => {

      this.startGame();
    });
  }

  get players() {
    return this._documentSnapshot.get("Players");
  }

  get name() {
    return this._documentSnapshot.get("Name");
  }

  removeCurrentPlayer() {
    this._ref.update({
      Players: firebase.firestore.FieldValue.arrayRemove(rhit.authManager.uid)
    });

    //Add code to delete lobby if the last player leaves ! ? !? !

  }

  async beginListening(changeListener) {
    this._ref.onSnapshot((doc => {
      if (doc.exists) {
        this._documentSnapshot = doc;
        changeListener();
      } else {
        //No GOOD

      }
    }));
  }

  startGame(){
    console.log("here");
    // create new game manager
  }
}


/** List CODE. */
rhit.ListModel = class{
  constructor(id, name, owner, categories, isPublic){
    this.id = id;
    this.name = name;
    this.owner = owner; 
    this.categories = categories;
    this.isPublic = isPublic;
  }
}


rhit.FbListsManager = class{
  constructor(){
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection("Lists");
    this._unsub = null;
  }

  beginListening(changeListener) {
    this._unsub = this._ref.onSnapshot((qs) =>{
      this._documentSnapshots = qs.docs;
      changeListener();
    });
  }

  get customLists(){
    let lists = [];
    this._documentSnapshots.forEach((snap) =>{
      lists.push(new rhit.ListModel(snap.id, snap.get("Name"), snap.get("Owner"), snap.get("Categories"), snap.get("public")));
    });

    console.log("All lists:", lists);

    lists = lists.filter((list) =>{
      return list.owner == rhit.authManager.uid;
    });

    return lists;
  }

  get defaultLists(){
    let lists = [];
    this._documentSnapshots.forEach((snap) =>{
      lists.push(new rhit.ListModel(snap.id, snap.get("Name"), snap.get("Owner"), snap.get("Categories"), snap.get("public")));
    });

    lists = lists.filter((list) =>{
      return list.owner == "DEFAULT";
    });

    return lists;
  }
}

/** INIT CODE. */

rhit.checkForRedirects = function () {
  if ((document.querySelector("#signinPage") || document.querySelector("#signupPage")) && rhit.authManager.isSignedIn) {

    window.location.href = "/lobbyselect.html";
  }
  if (!(document.querySelector("#mainPage") || document.querySelector("#signinPage") || document.querySelector("#signupPage")) && !rhit.authManager.isSignedIn) {
    console.log("aefkaj;eiofja;eiofjae'iofajefaEGAEOGJZGJAAE:ROGJAEAE:AJE:RKOGARLGKALLRG");
    window.location.href = "/";
  }
};

rhit.initializePage = function () {
  if (document.getElementById("signinPage") || document.getElementById("signupPage")) {
    console.log("you are try to sign in or sign up");
    new rhit.AuthPageController();
  }
  if (document.getElementById("mainPage")) {
    document.querySelector("#signOutBtn").onclick = (event) => {
      rhit.authManager.signOut();
    }
  } if (document.getElementById("lobbySelectPage")) {
    rhit.lobbySelectInit();
  } if (document.getElementById("lobbyPage")) {
    rhit.lobbyInit();
  }



}



/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");
  // rhit.startFirebaseUI();
  rhit.authManager = new rhit.AuthManager();
  rhit.fbUsersManager = new rhit.FbUsersManager();

  rhit.authManager.beginListening(() => {
    console.log("auth change callback");
    // check for regirects
    rhit.checkForRedirects();

    //page initalization
    rhit.initializePage();
  })
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

rhit.lobbySelectInit = function () {
  rhit.fbListsManager = new rhit.FbListsManager();
  rhit.fbLobbyManager = new rhit.FbLobbyManager();
  new rhit.LobbyListController();
}

rhit.lobbyInit = function () {
  const urlParams = new URLSearchParams(window.location.search)
  rhit.fbSingleLobbyManager = new rhit.FbSingleLobbyManager(urlParams.get("lobby"));
  new rhit.LobbyController();
}

rhit.main();