let socket;
let myPseudo;
let timeLeft;

function connectWebSocket(pseudo) {
    const url = `ws://${window.location.host}/socket`;
    socket = new WebSocket(url);
    myPseudo = pseudo;

    socket.onopen = () => {
        console.log("Socket connected.");
        
        let json = {action: "connection", pseudo: myPseudo};
        socket.send(JSON.stringify(json));
    }

    socket.onmessage = (message) => {
        let json = JSON.parse(message.data);

        if (json.action == "draw") {
            drawLine(json);
        }

        if (json.action == "play") {
            isPLaying = true;
            document.getElementById('div_cog').style.display = "none";
            document.getElementById('div_game').style.display = "flex";
            document.getElementById('div_toolbar').style.display = "block";
            document.getElementById('div_word').innerHTML = json.word;
            isMyTurn = json.drawer == myPseudo;
            updateScore(json.scores);
        }

        if (json.action == "newPlayer") {
            updateScore(json.scores);
        }

        if (json.action == "chat") {
            addInChat(json.message);
        }

        if (json.action == "find") {
            addInChat(json.message);
            updateScore(json.scores);
            document.getElementById('div_word').innerHTML = json.word;
            isMyTurn = json.drawer == myPseudo;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (json.action == "timeout") {
            addInChat(json.message);
            document.getElementById('div_word').innerHTML = json.word;
            isMyTurn = json.drawer == myPseudo;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            timeLeft = Math.ceil((json.endOfTimer - json.startOfTimer)/1000);
            showTimer();
        }

        if (json.action == "timer") {
            timeLeft = Math.ceil((json.endOfTimer - json.startOfTimer)/1000);
            showTimer();
        }

        console.log(JSON.stringify(json));
    }

    socket.onclose = () => {
        console.log("Socket close.");
    }

    socket.onerror = (error) => {
        console.error("Socket error.", error);
    }

    return socket;
}

//===========================================================================
//===========================================================================

function sendInputPseudo() {
    if (event.keyCode == 13) {
        const inputPseudo = document.getElementById('input_pseudo');
        let pseudo = inputPseudo.value;
        
        if (pseudo != "") {
            inputPseudo.value = "";

            socket = connectWebSocket(pseudo);
            document.getElementById('div_pseudo').style.display = "none";
            document.getElementById('div_cog').style.display =  "flex";
        }
    }
}

//===========================================================================
//===========================================================================

const canvas = document.getElementsByTagName("canvas")[0];
const ctx = canvas.getContext("2d");

let isPLaying = false;
let isDrawing = false;
let isMyTurn = false;

let x = 0, y = 0;

ctx.fillStyle = "#FFFFFF";

ctx.fillRect(0, 0, canvas.width, canvas.height);

canvas.addEventListener('mousedown', e => {
    x = e.clientX - canvas.getBoundingClientRect().x;
    y = e.clientY - canvas.getBoundingClientRect().y;

    isDrawing = true;
});

canvas.addEventListener('mousemove', e => {
    if (isDrawing) {
        sendDrawLine(x, y, e.clientX - canvas.getBoundingClientRect().x, e.clientY - canvas.getBoundingClientRect().y);
        x = e.clientX - canvas.getBoundingClientRect().x;
        y = e.clientY - canvas.getBoundingClientRect().y;
    }
});

window.addEventListener('mouseup', e => {
    if (isDrawing) {
        sendDrawLine(x, y, e.clientX - canvas.getBoundingClientRect().x, e.clientY - canvas.getBoundingClientRect().y);
        x = 0;
        y = 0;
        isDrawing = false;
    }
});

function sendDrawLine(x1, y1, x2, y2) {
    if (isPLaying && isMyTurn) {
        let action = "draw";
        let color = document.getElementById('input_ecrase').checked ? "white" : document.getElementById('input_color').value;
        let json = {action: action, lineWidth: document.getElementById('range').value, color: color, x1: x1, y1: y1, x2: x2, y2: y2};
        socket.send(JSON.stringify(json));
    }
}

function drawLine(json) {
    if (isPLaying) {
        ctx.beginPath();
        ctx.strokeStyle = json.color;
        ctx.lineWidth = json.lineWidth;
        ctx.lineCap = "round";
        ctx.moveTo(json.x1, json.y1);
        ctx.lineTo(json.x2, json.y2);
        ctx.stroke();
        ctx.closePath();
    }
}

//===========================================================================
//===========================================================================

function sendInputchat() {
    if (event.keyCode == 13) {
        let elem = document.getElementById('input_chat');
        let value = elem.value;
        elem.value = "";

        let message = myPseudo +": " +value +"<br>";
        let json = {action: "chat", message: message, word: value, pseudo: myPseudo};

        socket.send(JSON.stringify(json));
    }
}

function addInChat(message) {
    document.getElementById('div_chat').innerHTML += message;
}

//===========================================================================
//===========================================================================

function updateScore(scores) {
    let str = "";

    console.log(scores);
    
    for (let i = 0; i < scores.length; i++) {
        str += scores[i].pseudo +": " +scores[i].score +"pts" +"<br>";
    }
    
    document.getElementById('div_left').innerHTML = str;
}

//===========================================================================
//===========================================================================

let alreadyStart = false;

function showTimer() {
    if (!alreadyStart) {
        alreadyStart = true;
        setInterval(function () {
            timeLeft--;
            document.getElementById('div_timer').innerHTML = timeLeft;    
        }, 1000);
    }
}