const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

// Establishes a connection with a new client
io.on("connection", function (uniquesocket) {
    console.log("A user connected:", uniquesocket.id);

    // Assigns a role to the player (white, black, or spectator)
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    // Handles a client disconnecting from the server
    uniquesocket.on("disconnect", function () {
        console.log("A user disconnected:", uniquesocket.id);
        if (uniquesocket.id === players.white) {
            delete players.white; // Removes the white player
            console.log("White player disconnected.");
        } else if (uniquesocket.id === players.black) {
            delete players.black; // Removes the black player
            console.log("Black player disconnected.");
        }
    });

    // Handles a move sent from a client
    uniquesocket.on("move", (move) => {
        try {
            // Validates that it is the correct player's turn
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) {
                console.log("Move blocked: Not white player's turn.");
                return;
            }
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) {
                console.log("Move blocked: Not black player's turn.");
                return;
            }

            // Validates the move using the chess.js library
            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move); // Emits the move to all clients
                io.emit("boardState", chess.fen()); // Emits the new board state
                console.log(`Move successful: ${JSON.stringify(move)}`);
            } else {
                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", move); // Sends an error message to the client
            }
        } catch (err) {
            console.error("Error processing move:", err);
            uniquesocket.emit("invalidMove", move);
        }
    });

    // Emits the initial board state to a newly connected client
    io.emit("boardState", chess.fen());
});

// Starts the server on port 3000
server.listen(3000, () => {
    console.log("Listening on port 3000");
});