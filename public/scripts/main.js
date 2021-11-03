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
//gameinput collection
rhit.FB_KEY_PLAYER = "Player";
rhit.FB_KEY_CATEGORY = "Category";
rhit.FB_KEY_ANSWER = "Answer";
rhit.fbLobbyManager = null;
rhit.authManager = null;
rhit.fbSingleLobbyManager = null;
rhit.fbUsersManager = null;
rhit.fbListsManager = null;
rhit.fbGamesManager = null;
rhit.fbSingleGameManager = null;
rhit.gameTimer = null;
/** HELPER FUNCTIONS */
function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i
  };
  return i;
}

function showTimer() {
  let time = rhit.fbSingleGameManager.roundOverTime.toDate();
  let currentTime = new Date();
  var distance = time - currentTime;
  if (distance <= 0) {
    clearInterval(rhit.gameTimer);
    rhit.gameTimer = null;
    const timeBar = document.getElementById("timerText");
    timeBar.textContent = `Time Out `;
    rhit.fbSingleGameManager.timeOver();
  } else {
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / 60000);
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    const timeBar = document.getElementById("timerText");
    timeBar.textContent = `Timer: ${minutes}:${seconds} `
  }

  return distance;
}

/** AUTH CODE */
rhit.AuthPageController = class {
  constructor() {
    const inputEmailEl = document.querySelector("#inputEmail");
    const inputPasswordEl = document.querySelector("#inputPassword");

    if (document.getElementById("signinPage")) {
      document.querySelector("#signinBtn").onclick = (event) => {
        rhit.authManager.signIn(inputEmailEl.value, inputPasswordEl.value, this.signInErrorHandler);
      }
    } else {
      document.querySelector("#signupBtn").onclick = (event) => {
        const inputAvatatEl = document.querySelector("#inputAvatar");
        const inputUsernameEl = document.querySelector("#inputUsername");
        console.log("are you try to sign up?");

        rhit.authManager.signUp(inputEmailEl.value, inputPasswordEl.value, inputAvatatEl.value, inputUsernameEl.value, this.signUpErrorHandler);
      }
    }
  }

  signInErrorHandler(error) {
    const errText = document.getElementById("signInError");
    if (error == "auth/wrong-password") {
      errText.innerHTML = "The email or password provided was incorrect";
    } else {
      errText.innerHTML = "There was an error logging in. Please check your log in information and try again.";
    }

    errText.style.display = "block";

  }

  signUpErrorHandler(error) {
    const errText = document.getElementById("signUpError");

    if (error == "auth/email-already-in-use") {
      errText.innerHTML = "The email provided is already in use";
    } else if (error == "auth/weak-password") {
      errText.innerHTML = "Password should be at least 6 characters.";
    } else {
      errText.innerHTML = "There was an error logging in. Please check your log in information and try again.";
    }

    errText.style.display = "block";

  }

}

rhit.AuthManager = class {
  constructor() {
    this._user = null;
    this._ref = firebase.firestore().collection("Users");
    this._username = null;
    this._avatar = null;
  }

  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      if (user) {
        var docRef = this._ref.doc(user.uid);

        docRef.get().then((doc) => {
          if (doc.exists) {
            changeListener();
            console.log("who is logg in now: ", this._user);
          } else {
            // for add a user in the users collection after sign up
            this._ref.doc(user.uid)
              .set({
                [rhit.FB_KEY_EMAIL]: user.email,
                [rhit.FB_KEY_USERNAME]: this._username,
                [rhit.FB_KEY_AVATAR]: this._avatar,
                [rhit.FB_KEY_NUMLOSE]: 0,
                [rhit.FB_KEY_NUMTIE]: 0,
                [rhit.FB_KEY_NUMWIN]: 0,
                [rhit.FB_KEY_NUMTOTALGAME]: 0,
              }).then((user) => {

                changeListener();
              });
          }
        }).catch((error) => {
          console.log("Error getting document:", error);
        });
      } else {
        changeListener();
      }


    });
  }

  signIn(email, password, errorHandler) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("log in error,", errorCode, errorMessage);
        errorHandler(errorCode);
      });

  }


  signUp(email, password, avatar, username, errorHandler) {
    this._avatar = avatar;
    this._username = username;
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(create => { })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log("sign up error,", errorCode, errorMessage);
        errorHandler(errorCode);
      });
  };


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
      if (event.code === "Enter") {
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
      if (lob.players.length > 0) {
        lobList.appendChild(this.createJoinLobby(lob));
      } else {
        rhit.fbLobbyManager.deleteLobby(lob.lobbyId);
      }


    }

    const oldList = document.getElementById("lobbies");
    oldList.removeAttribute("id");
    oldList.hidden = true;
    oldList.parentElement.appendChild(lobList);

    for (let i = 0; i < rhit.fbLobbyManager.length; i++) {
      const lob = rhit.fbLobbyManager.getLobbyAtIndex(i);

      const lobEl = document.getElementById(`lobButt${lob.lobbyId}`);

      console.log("Max: ")

      if (lob.players.length < lob.maxPlayers) {
        lobEl.onclick = (event) => {
          console.log("You joined: ", lob.lobbyId);
          window.location.href = `/lobby.html?lobby=${lob.lobbyId}`
        }
      } else {
        lobEl.classList.remove("our-button-secondary");
        lobEl.classList.add("our-button-inactive");
        lobEl.innerHTML = "FULL";
      }
    }
  }

  updateModal() {
    const customLists = rhit.fbListsManager.customLists;
    const defaultLists = rhit.fbListsManager.defaultLists;

    let newMyLists = htmlToElement('<select id="myLists" multiple></select>');
    let newDefaultLists = htmlToElement('<select id="defaultLists" multiple></select>');

    customLists.forEach((list) => {
      const listHMTL = htmlToElement(`<option value="${list.id}">${list.name}</option>`);
      newMyLists.appendChild(listHMTL);
    });

    defaultLists.forEach((list) => {
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
  deleteLobby(lobbyId) {
    this._ref.doc(lobbyId).delete();
  }
  getLobbyAtIndex(index) {
    const docSnap = this._documentSnapshots[index];
    const lob = new rhit.LobbyModel(docSnap.id, docSnap.get("MaxPlayers"), docSnap.get("NumRounds"), docSnap.get("TimeforRound"), docSnap.get("Players"), docSnap.get("Lists"), docSnap.get("CurrentGame"), docSnap.get("Name"));
    return lob;
  }

}


rhit.LobbyController = class {
  constructor() {
    rhit.fbSingleLobbyManager.beginListening(this.updateView.bind(this));

    window.onbeforeunload = (event) => {
      rhit.fbSingleLobbyManager.removeCurrentPlayer();
      console.log("Players after remove: ", rhit.fbSingleLobbyManager.players);
    }

    document.getElementById("startGameButton").onclick = () => {
      let newGame = new rhit.GameModel(null, rhit.fbSingleLobbyManager.players);

      let currentTime = firebase.firestore.Timestamp.now().toDate();
      currentTime.setMinutes(currentTime.getMinutes() + rhit.fbSingleLobbyManager.timeforRound);
      newGame.lists = rhit.fbSingleLobbyManager.lists;
      newGame.roundOverTime = currentTime;
      rhit.fbSingleLobbyManager.addGame(newGame).then((game) => {

        console.log("Starting game:", game)
        rhit.fbSingleLobbyManager.startGame(game);

      });

    }

  }
  updateView() {
    if (!rhit.fbSingleLobbyManager.game) {
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
    } else {
      window.onbeforeunload = () => {
        /*do nothing */
      }
      window.location.href = `/gameMain.html?gameId=${rhit.fbSingleLobbyManager.game}`
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
  }

  get players() {
    return this._documentSnapshot.get("Players");
  }

  get name() {
    return this._documentSnapshot.get("Name");
  }

  get game() {
    return this._documentSnapshot.get("Game");
  }
  get lists() {
    return this._documentSnapshot.get("Lists");
  }
  get timeforRound() {
    return this._documentSnapshot.get("TimeforRound");

  }

  deleteLobby() {
    this._ref.delete();
  }

  removeCurrentPlayer() {
    this._ref.update({
      Players: firebase.firestore.FieldValue.arrayRemove(rhit.authManager.uid)
    });

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
  addGame(game) {
    let assignScores = game.players.reduce(function (allPlayers, player) {

      allPlayers[player] = 0

      return allPlayers;
    }, {});
    console.log(assignScores, "here is the socre")
    return firebase.firestore().collection("Games").add({
      Players: game.players,
      DoneVoting: game.doneVoting,
      GameOver: game.gameOver,
      RoundOverTime: game.roundOverTime,
      Scores: assignScores,
      Lists: game.lists,
      Letter: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    }).then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
      game.scores = assignScores;
      return docRef.id;
    }).catch((error) => {
      console.error("Error adding document: ", error);
    });
  };


  startGame(gameId) {
    console.log("Starting Game");
    this._ref.update({
      Game: gameId
    })

  }
}


/** Game CODE. */
rhit.GameModel = class {
  constructor(id, players) {
    this.id = id;
    this.players = players;
    this.gameOver = false;
    this.doneVoting = [];
    this.roundOverTime = null;
    this.scores = {};
    this.playerInputs = [];
    this.lists = [];

  }
}

rhit.FbSingleGameManager = class {
  constructor(gameId) {
    this.gameId = gameId;
    this._documentSnapshot = {};
    this._unsub = null;
    this._ref = firebase.firestore().collection("Games").doc(gameId);
    rhit.gameTimer = setInterval(showTimer, 1000);
    this._categories = null;
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

  setCurrentList(listId) {
    this._ref.update({
      CurrentList: listId
    });
  }

  timeOver() {
    const cates = document.getElementById("categories").children;

    for (var i = 0; i < cates.length; i++) {
      // console.log(cates[i].children[1].value);
      // console.log(this._categories[i]);
      this._ref.collection("PlayerInputs").add({
        [rhit.FB_KEY_PLAYER]: rhit.authManager.uid,
        [rhit.FB_KEY_ANSWER]: cates[i].children[1].value,
        [rhit.FB_KEY_CATEGORY]: this._categories[i]
      }).then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
        // return docRef.id;
      })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });

    }

    console.log("time over called");
  }

  submitAnswers(answers) {
    for (i = 0; i < answers.length; i++) {

      // Update text input
      console.log("input ", answers[i].value);

    }
  }
  get scores() {
    return this._documentSnapshot.get("Scores");
  }
  get lists() {
    return this._documentSnapshot.get("Lists");
  }
  get roundOverTime() {
    return this._documentSnapshot.get("RoundOverTime");
  }

  get currentList() {
    return this._documentSnapshot.get("CurrentList");
  }

  get randomList() {
    var length = this._documentSnapshot.get("Lists").length;
    var listID = this._documentSnapshot.get("Lists")[getRandomInt(length)]
    return listID;
  }

  get randomLetter() {
    return this._documentSnapshot.get("Letter");
  }

  get isTimeOver() {
    return !!rhit.gameTimer;
  }
}

rhit.GameController = class {
  constructor() {
    rhit.fbSingleGameManager.beginListening(this.updateView.bind(this));

    window.onbeforeunload = () => {
      //code to make sure players answers are saved on refresh/exit the page. 
      const myStorage = window.sessionStorage;
      const cates = document.getElementById("categories").children;
      for (let i = 0; i < cates.length; i++) {
        myStorage.setItem(rhit.fbSingleGameManager._categories[i], cates[i].children[1].value);
      }
    }
  }

  restoreAnswers() {
    console.log("restoring answers");

    const myStorage = window.sessionStorage;
    const cates = document.getElementById("categories").children;
    console.log("Got ans:", myStorage.get(rhit.fbSingleGameManager._categories[0]));
    for (let i = 0; i < cates.length; i++) {
      console.log("Got ans:", myStorage.get(rhit.fbSingleGameManager._categories[i]));
      cates[i].children[1].value = myStorage.get(rhit.fbSingleGameManager._categories[i]);
      myStorage.removeItem(rhit.fbSingleGameManager._categories[i]);
    }
  }

  updateView() {
    console.log("Update view")

    let listForThisRound = rhit.fbSingleGameManager.currentList;

    if (!rhit.fbSingleGameManager.currentList) {
      const randomList = rhit.fbSingleGameManager.randomList;
      console.log("Random list", randomList);

      rhit.fbSingleGameManager.setCurrentList(randomList);
      listForThisRound = randomList;
    }

    console.log("List for the round: ", listForThisRound);

    rhit.fbListsManager.getListById(listForThisRound).then((list) => {
      const categories = list.categories;
      rhit.fbSingleGameManager._categories = categories;

      const categoriesHTML = htmlToElement('<form id="categories"></form>');

      categories.forEach((catetory, index) => {
        let categoryHTML = htmlToElement(
          `<div class="form-group">
        <label for="inputAnswer${index}">${catetory}</label>
        <input type="text" class="form-control" id="inputAnswer${index}" />
        </div>`);

        categoriesHTML.appendChild(categoryHTML);
      });

      const oldCategories = document.getElementById("categories");
      oldCategories.hidden = true;
      oldCategories.removeAttribute("id");

      oldCategories.parentElement.appendChild(categoriesHTML);

    });





    console.log("Scores ", rhit.fbSingleGameManager.scores);
    const playersInfo = document.getElementsByClassName("dropdown-content");
    for (const [player, score] of Object.entries(rhit.fbSingleGameManager.scores)) {
      rhit.fbUsersManager.getUserInfo(player).then((player) => {
        playersInfo[0].appendChild(htmlToElement(`<p>${player.username} ${score}</p>`));
      })

    }

    const letterBar = document.getElementById("letterText");
    letterBar.textContent = `Letter: ${rhit.fbSingleGameManager.randomLetter} `
    console.log("lists", rhit.fbSingleGameManager.randomList);

    this.restoreAnswers();

  }


}



/** List CODE. */
rhit.ListModel = class {
  constructor(id, name, owner, categories, isPublic) {
    this.id = id;
    this.name = name;
    this.owner = owner;
    this.categories = categories;
    this.isPublic = isPublic;
  }
}


rhit.FbListsManager = class {
  constructor() {
    this._documentSnapshots = [];
    this._ref = firebase.firestore().collection("Lists");
    this._unsub = null;
  }

  beginListening(changeListener) {
    this._unsub = this._ref.onSnapshot((qs) => {
      this._documentSnapshots = qs.docs;
      changeListener();
    });
  }

  getListById(id) {
    return this._ref.doc(id).get().then((list) => {
      return new rhit.ListModel(list.id, list.get("Name"), list.get("Owner"), list.get("Categories"), list.get("public"));
    });

  }

  get customLists() {
    let lists = [];
    this._documentSnapshots.forEach((snap) => {
      lists.push(new rhit.ListModel(snap.id, snap.get("Name"), snap.get("Owner"), snap.get("Categories"), snap.get("public")));
    });

    console.log("All lists:", lists);

    lists = lists.filter((list) => {
      return list.owner == rhit.authManager.uid;
    });

    return lists;
  }

  get defaultLists() {
    let lists = [];
    this._documentSnapshots.forEach((snap) => {
      lists.push(new rhit.ListModel(snap.id, snap.get("Name"), snap.get("Owner"), snap.get("Categories"), snap.get("public")));
    });

    lists = lists.filter((list) => {
      return list.owner == "DEFAULT";
    });

    return lists;
  }

}

/** INIT CODE. */

rhit.checkForRedirects = function () {
  if (document.querySelector("#signinPage") && rhit.authManager.isSignedIn) {

    window.location.href = "/lobbyselect.html";
  } else if (document.querySelector("#signupPage") && rhit.authManager.isSignedIn) {

    rhit.authManager.signOut();
    window.location.href = "/";
  } else if (!(document.querySelector("#mainPage") || document.querySelector("#signinPage") || document.querySelector("#signupPage")) && !rhit.authManager.isSignedIn) {
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
  }
  if (document.getElementById("lobbySelectPage")) {
    rhit.lobbySelectInit();
    rhit.drawerMenuInit();
  }
  if (document.getElementById("lobbyPage")) {
    rhit.lobbyInit();
    rhit.drawerMenuInit();
  }
  if (document.getElementById("gamePage")) {
    const urlParams = new URLSearchParams(window.location.search)
    rhit.fbListsManager = new rhit.FbListsManager;
    rhit.fbSingleGameManager = new rhit.FbSingleGameManager(urlParams.get("gameId"));
    new rhit.GameController();
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

rhit.drawerMenuInit = function () {
  document.getElementById("menuSignOut").onclick = (event) => {
    rhit.authManager.signOut();
  }
}

rhit.main();