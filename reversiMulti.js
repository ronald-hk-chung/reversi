// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  onDisconnect,
  push,
  update,
  remove,
  off,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";
import { reversiReset, reversiOnlineStart } from "./reversiScript.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUHT0KxoCzut9cL6Fn3TLxp4Vtir58guU",
  authDomain: "reversimulti.firebaseapp.com",
  databaseURL:
    "https://reversimulti-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reversimulti",
  storageBucket: "reversimulti.appspot.com",
  messagingSenderId: "634743158727",
  appId: "1:634743158727:web:04017c511c055eee954be2",
};

const app = initializeApp(firebaseConfig);
let uid;
let hostUid;
let db = getDatabase();
let adminRef;
let adminPW;
let gameRef;
let userRef;
let playerRef;
let playerData;
let gameRoomRef;
let postRef;
let postData;
let userName;
let userAvatar;
let userSet = false;
let data;
let roomData;
let loginPurpose;
let refPost;
let expandState = [];

function logIn() {
  const auth = getAuth();
  signInAnonymously(auth)
    .then(() => {
      console.log("Logged In");
    })
    .catch((error) => {
      console.log("errorCode: " + error.code);
      console.log("errorMessage: " + error.message);
    });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      uid = user.uid;
      console.log("UID: " + uid);
      writeUserData();
      getAdmin();
      listenPlayer();
      listenGameRoom();
      listenPost();
    } else {
      console.log("User signed out");
    }
  });
}

function postComment() {
  let newPostRef = push(postRef);
  set(newPostRef, {
    author: userName,
    uid: uid,
    timestamp: Date().slice(0, Date().indexOf("(") - 1),
    comment: $("#commentInput")
      .data("emojioneArea")
      .getText()
      .replace("\n", "<div></div>"),
    authorAvatar: userAvatar,
    ref: refPost,
  });
  $("#commentInput").data("emojioneArea").setText("");
  $("#gameRoom").hide();
}

function writeUserData() {
  set(ref(db, "players/" + uid), {
    uid: uid,
  })
    .then(() => {
      userRef = ref(db, "players/" + uid);
      onDisconnect(userRef).remove();
      console.log("User created");
    })
    .catch((error) => {
      console.log("error: " + error);
    });
}

function listenPlayer() {
  playerRef = ref(db, "players/");
  onValue(playerRef, (snapshot) => {
    playerData = snapshot.val();
    $("#playerCount").text(Object.keys(playerData).length);
  });
}

function getAdmin() {
  adminRef = ref(db, "admin");
  onValue(adminRef, (snapshot) => {
    adminPW = snapshot.val();
  });
}

function createGame() {
  set(ref(db, "games/" + uid), {
    hostUid: uid,
    hostName: userName,
    hostAvatar: userAvatar,
    opponentUid: "",
    opponentName: "",
    opponentAvatar: "",
    moveSeq: "",
  })
    .then(() => {
      gameRef = ref(db, "games/" + uid);
      hostUid = uid;
      onDisconnect(gameRef).remove();
      listenGame();
    })
    .catch((error) => {
      console.log("error: " + error);
    });
}

function joinGame(id) {
  off(gameRef);
  remove(gameRef);
  const updates = {};
  hostUid = id;
  gameRef = ref(db, "games/" + id);
  updates["games/" + id + "/opponentUid"] = uid;
  updates["games/" + id + "/opponentName"] = userName;
  updates["games/" + id + "/opponentAvatar"] = userAvatar;
  update(ref(db), updates);
  onDisconnect(gameRef).remove();
  listenGame();
}

function quitGame() {
  if (gameRef != undefined) {
    off(gameRef);
    remove(gameRef);
  }
  reversiReset();
}

function deletePost(postKey) {
  const updates = {};
  if (postData[postKey].uid == uid) {
    for (let i = 0; i < Object.keys(postData).length; i++) {
      if (postData[Object.keys(postData)[i]].ref == postKey) {
        updates["posts/" + Object.keys(postData)[i]] = null;
      }
    }
    updates["posts/" + postKey] = null;
    update(ref(db), updates);
  } else {
    let password = prompt("Admin for this Post Required");
    if (password == adminPW) {
      for (let i = 0; i < Object.keys(postData).length; i++) {
        if (postData[Object.keys(postData)[i]].ref == postKey) {
          updates["posts/" + Object.keys(postData)[i]] = null;
        }
      }
      updates["posts/" + postKey] = null;
      update(ref(db), updates);
    }
  }
}

function updateMoveSeq(moveSeq) {
  const updates = {};
  updates["games/" + hostUid + "/moveSeq"] = moveSeq;
  update(ref(db), updates);
}

function listenPost() {
  postRef = ref(db, "posts/");
  onValue(postRef, (snapshot) => {
    postData = snapshot.val();
    updatePost(postData);
  });
}

function listenGameRoom() {
  gameRoomRef = ref(db, "games/");
  onValue(gameRoomRef, (snapshot) => {
    roomData = snapshot.val();
    updateGameRoom(roomData);
  });
}

function listenGame() {
  onValue(gameRef, (snapshot) => {
    data = snapshot.val();
    if (data == null) {
      alert("Game Room is closed");
      reversiReset();
      off(gameRef);
    } else if (data.moveSeq == "" && data.opponentUid != "") {
      reversiOnlineStart(
        data.hostName,
        data.hostAvatar,
        data.opponentName,
        data.opponentAvatar,
        data.hostUid == uid ? 0 : 2,
        data.hostUid == uid ? 2 : 0
      );
    } else {
      if (data.moveSeq != "" && data.moveSeq != undefined) {
        if (
          JSON.stringify(data.moveSeq) != JSON.stringify(currentGame.moveSeq)
        ) {
          for (
            let i = currentGame.moveSeq.length;
            i < data.moveSeq.length;
            i++
          ) {
            currentGame.clickedSquare(
              data.moveSeq[i].row,
              data.moveSeq[i].column
            );
          }
        }
      }
    }
  });
}

function updateGameRoom(data) {
  $("#waitingRoomList").empty();
  $("#playingRoomList").empty();
  if (data != null) {
    let waitingRoomString = "";
    let playingRoomString = "";
    let dataString = "";
    for (let i = 0; i < Object.keys(data).length; i++) {
      if (data[Object.keys(data)[i]].opponentUid == "") {
        if (data[Object.keys(data)[i]].hostUid != uid) {
          dataString =
            "<li class='w3-hover-green w3-display-container w3-center' data-host=" +
            data[Object.keys(data)[i]].hostUid +
            ">" +
            "<img src='img/" +
            data[Object.keys(data)[i]].hostAvatar +
            ".png' style='width: 36px; height: 36px;'>" +
            "&nbsp;&nbsp;&nbsp" +
            data[Object.keys(data)[i]].hostName +
            "</li>";
          waitingRoomString = waitingRoomString + dataString;
        }
      } else {
        dataString =
          "<li class='w3-display-container w3-center'>" +
          "<img src='img/" +
          data[Object.keys(data)[i]].hostAvatar +
          ".png' style='width: 36px; height: 36px;'>" +
          "&nbsp;&nbsp;&nbsp" +
          data[Object.keys(data)[i]].hostName +
          "&nbsp;&nbsp;&nbsp" +
          "VS" +
          "&nbsp;&nbsp;&nbsp" +
          "<img src='img/" +
          data[Object.keys(data)[i]].opponentAvatar +
          ".png' style='width: 36px; height: 36px;'>" +
          "&nbsp;&nbsp;&nbsp" +
          data[Object.keys(data)[i]].opponentName;
        ("</li>");
        playingRoomString = playingRoomString + dataString;
      }
    }
    $("#waitingRoomList").append(waitingRoomString);
    $("#playingRoomList").append(playingRoomString);
    $("#waitingRoomList li").click(function () {
      joinGame($(this).attr("data-host"));
    });
  }
}

function updatePost(data) {
  $("#comment").empty();
  if (data == null) return;
  let dataString;
  let isNew;
  for (let i = 0; i < Object.keys(data).length; i++) {
    isNew = data[Object.keys(data)[i]].ref == "";
    dataString =
      '<div id="' +
      Object.keys(data)[i] +
      (isNew
        ? '" class="w3-leftbar w3-display-container w3-border-green w3-card-4">'
        : '" class="w3-leftbar w3-display-container w3-border-green w3-card-4" style="width:80%;left:20%;">') +
      '<div class="w3-left w3-padding-small">' +
      '<img src="img/' +
      data[Object.keys(data)[i]].authorAvatar +
      '.png" class="w3-left" style="width:50px;height:50px">' +
      "</div>" +
      "<h4>" +
      data[Object.keys(data)[i]].author +
      ":</h4>" +
      '<p class="w3-tiny w3-text-grey">Updated on ' +
      data[Object.keys(data)[i]].timestamp +
      "</p>" +
      '<p id="text-' +
      Object.keys(data)[i] +
      '" class="w3-margin w3-section w3-cursive"></p>' +
      (isNew
        ? '<div class="w3-border-grey w3-display-topright">' +
          '<button refPost="' +
          Object.keys(data)[i] +
          '" class="w3-button w3-tiny replyBtn">Reply</button>' +
          '<button id="showComment-' +
          Object.keys(data)[i] +
          '" refPost="' +
          Object.keys(data)[i] +
          '" class="w3-button w3-tiny expandBtn">Show Comment</button>' +
          '<span id="replyCount-' +
          Object.keys(data)[i] +
          '" class="w3-badge">0</span>' +
          "</div>"
        : "") +
      '<div class="w3-border-grey w3-display-bottomright">' +
      '<button refPost="' +
      Object.keys(data)[i] +
      '" class="delete"><i class="fa fa-trash w3-large"></i></button>' +
      "</div>" +
      "</div>" +
      '<div id="reply-' +
      Object.keys(data)[i] +
      '" class="postReply"></div>' +
      (isNew ? "<hr />" : "");

    if (isNew) {
      $("#comment").prepend(dataString);
    } else {
      $("#reply-" + data[Object.keys(data)[i]].ref).prepend(dataString);
      $("#replyCount-" + data[Object.keys(data)[i]].ref).text(
        Number($("#replyCount-" + data[Object.keys(data)[i]].ref).text()) + 1
      );
    }
    $("#text-" + Object.keys(data)[i]).html(data[Object.keys(data)[i]].comment);
  }

  $(".replyBtn").click(function () {
    showPost($(this).attr("refPost"));
  });
  $(".expandBtn").click(function () {
    expandReply($(this).attr("refPost"));
  });
  $(".delete").click(function () {
    deletePost($(this).attr("refPost"));
  });
  $(".postReply").hide();
  showExpandState();

  $("#commentCount").text(Object.keys(data).length);
}

function expandReply(id) {
  if ($("#replyCount-" + id).text() != "0") {
    if (expandState.findIndex((e) => e == id) == -1) {
      expandState.push(id);
      $("#reply-" + id).slideDown();
      $("#showComment-" + id).text("Hide Comment");
    } else {
      expandState.splice(
        expandState.findIndex((e) => e == id),
        1
      );
      $("#reply-" + id).slideUp();
      $("#showComment-" + id).text("Show Comment");
    }
  }
}

function showExpandState() {
  for (let i = 0; i < expandState.length; i++) {
    $("#reply-" + expandState[i]).show();
  }
}

function updateLogin() {
  let loginString =
    "<li class='w3-display-container w3-center'> <img src='img/" +
    userAvatar +
    ".png' style='width: 36px; height: 36px;'>" +
    "&nbsp;&nbsp;&nbsp" +
    userName +
    "</li>";
  $("#loginlist").append(loginString);
  $("#loginlist2").append(loginString);
}

function selectAvatar(avatarID) {
  $(".avatar").addClass("w3-greyscale-max");
  $(".avatar").removeClass(
    "w3-border-green w3-topbar w3-topbar w3-leftbar w3-rightbar w3-bottombar"
  );
  $("#" + avatarID).removeClass("w3-greyscale-max");
  $("#" + avatarID).addClass(
    "w3-border-green w3-topbar w3-topbar w3-leftbar w3-rightbar w3-bottombar"
  );
  userAvatar = avatarID;
}

function setAvatar() {
  let avatarArray = [
    "bear",
    "deer",
    "dog",
    "elephant",
    "fox",
    "monkey",
    "ox",
    "pig",
    "zebra",
  ];
  selectAvatar(avatarArray[Math.floor(Math.random() * 9)]);
}

function userSubmit() {
  if ($("#userNameInput").val() == "") {
    alert("Please Enter Your Name");
  } else {
    userName = $("#userNameInput").val();
    userSet = true;
    if (loginPurpose == "game") {
      createGame();
      updateLogin();
      $("#login").hide();
      $("#room").show();
      loginPurpose = undefined;
    } else {
      updateLogin();
      $("#login").hide();
      $("#addPost").show();
      loginPurpose = undefined;
    }
  }
}

function showGameRoom() {
  $("#roomHeader").text("Game Room");
  if (userSet) {
    $("#gameRoom").show();
    $("#login").hide();
    $("#room").show();
    $("#addPost").hide();
    createGame();
  } else {
    $("#gameRoom").show();
    $("#login").show();
    $("#room").hide();
    $("#addPost").hide();
    loginPurpose = "game";
  }
}

function showPost(ref = "") {
  refPost = ref;
  $("#roomHeader").text("Comment");
  if (userSet) {
    $("#gameRoom").show();
    $("#login").hide();
    $("#room").hide();
    $("#addPost").show();
  } else {
    $("#gameRoom").show();
    $("#login").show();
    $("#room").hide();
    $("#addPost").hide();
    loginPurpose = "post";
  }
}

export {
  logIn,
  listenGame,
  updateMoveSeq,
  quitGame,
  selectAvatar,
  setAvatar,
  userSubmit,
  showGameRoom,
  showPost,
  postComment,
};
