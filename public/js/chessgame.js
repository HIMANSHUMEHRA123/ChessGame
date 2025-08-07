const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            // Sets class for light or dark squares based on their position
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark");
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) { // If a square contains a piece
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === 'w' ? "white" : "black"
                );
                // Displays the correct Unicode character for the piece
                pieceElement.innerText = getPieceUnicode(square);
                // Allows the piece to be dragged only if it's the current player's turn
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement; // Stores the piece being dragged
                        sourceSquare = { row: rowIndex, col: squareIndex }; // Stores the starting position
                        e.dataTransfer.setData("text/plain", ""); // Required for drag and drop to work in some browsers
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null; // Resets the dragged piece after the drag ends
                    sourceSquare = null; // Resets the source square
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault(); // Prevents the default browser behavior to allow dropping
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare); // Calls the function to handle the move
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped"); // Flips the board for the black player
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        // Converts row and col index to algebraic notation (e.g., 'a1', 'e4')
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q' // This is a placeholder and should be handled dynamically for pawn promotion
    };
    
    // Sends the move to the server for validation and processing
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", // Black Pawn
        r: "♜", // Black Rook
        n: "♞", // Black Knight
        b: "♝", // Black Bishop
        q: "♛", // Black Queen
        k: "♚", // Black King
        P: "♙", // White Pawn
        R: "♖", // White Rook
        N: "♘", // White Knight
        B: "♗", // White Bishop
        Q: "♕", // White Queen
        K: "♔", // White King
    };
    // Returns the correct Unicode based on the piece type
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", (role) => {
    playerRole = role; // Sets the player's role ('w' or 'b')
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null; // Spectators have no role
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen); // Loads the new board state
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move received from server:", move);
});

renderBoard();