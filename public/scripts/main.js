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
rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_KEY_USERNAME = "Username";
rhit.FB_KEY_PASSWORD = "Password";
rhit.FB_KEY_AVATAR = "Avatar";
rhit.FB_KEY_NUMTIE = "#Tie";
rhit.FB_KEY_NUMTOTALGAME = "#TotalGame";
rhit.FB_KEY_NUMLOSE = "#Lose";
rhit.FB_KEY_NUMWIN = "#Win";
rhit.fbLobbyManager = null;
rhit.authManager = null;


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
    if(document.getElementById("signinPage")){
      document.querySelector("#signinBtn").onclick = (event) => {
        rhit.authManager.signIn(inputEmailEl.value, inputPasswordEl.value);
      }
    }else{
      document.querySelector("#signupBtn").onclick = (event) => {
        const inputAvatatEl = document.querySelector("#inputAvatar");
        console.log("are you try to sign up?");
  
        rhit.authManager.signUp(inputEmailEl.value, inputPasswordEl.value, inputAvatatEl.value);
      }
    }
  }
}

rhit.AuthManager = class {
  constructor() {
    this._user = null;
    this._ref = firebase.firestore().collection("Users");
  }

  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      changeListener();
      console.log("who is logg in now: ", this._user);
      // console.log("This user signed in", user.uid);
			// console.log('displayName :>> ', displayName);
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

  signUp(email, password, avatar) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(create => {
        this._ref.doc(create.user.uid)
          .set({
            [rhit.FB_KEY_USERNAME]: email,
            [rhit.FB_KEY_PASSWORD]: password,
            [rhit.FB_KEY_AVATAR]: avatar,
            [rhit.FB_KEY_NUMLOSE]: 0,
            [rhit.FB_KEY_NUMTIE]: 0,
            [rhit.FB_KEY_NUMWIN]: 0,
            [rhit.FB_KEY_NUMTOTALGAME]: 0,
          });
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("log in error,", errorCode, errorMessage);

      });


  }

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



/** LOBBY CODE. */
rhit.LobbyController = class {
  constructor() {
    //Initialize listeners
    document.getElementById("searchForm").addEventListener("submit", (event) => {
      const searchString = document.getElementById("searchInput").value;
      rhit.fbLobbyManager.setFilterString(searchString);
      this.updateView();
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
        //TODO: Code for joining lobby

      }
    }


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

  newLobby() {}
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
  addPlayerToLobby() {}
  deleteLobby() {}
  getLobbyAtIndex(index) {
    const docSnap = this._documentSnapshots[index];
    const lob = new rhit.LobbyModel(docSnap.id, docSnap.get("MaxPlayers"), docSnap.get("NumRounds"), docSnap.get("TimeforRound"), docSnap.get("Players"), docSnap.get("Lists"), docSnap.get("CurrentGame"), docSnap.get("Name"));
    return lob;
  }
  searchLobbiesByName() {}

}

rhit.checkForRedirects = function () {
	if (document.querySelector("#signinPage") && rhit.authManager.isSignedIn) {
		window.location.href = "/lobbyselect.html";
	}
	if (!document.querySelector("#signinPage")&&!document.querySelector("#signupPage") && !rhit.authManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.initializePage = function () {
  if (document.getElementById("signinPage") || document.getElementById("signupPage")) {
    console.log("you are try to sign in or sign up");
    new rhit.AuthPageController();
  }
  if(document.getElementById("mainPage")){
    document.querySelector("#signOutBtn").onclick = (event) => {
      rhit.authManager.signOut();
    }
  }  if (document.getElementById("lobbySelectPage")) {
    rhit.lobbyPageInit();
  }
 
  
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
  console.log("Ready");
  // rhit.startFirebaseUI();
  rhit.authManager = new rhit.AuthManager();

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

rhit.lobbyPageInit = function () {
  rhit.fbLobbyManager = new rhit.FbLobbyManager();
  new rhit.LobbyController();
}

rhit.main();