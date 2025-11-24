const bgImage = document.querySelector(".bgImage");

let words;
let word;
let hint = '';
let wordsHints;
let wordCount = 0;

const guessedLetters = new Set();
let guessedLetter;
let incorrectGuesses = 0;
let correctGuesses = 0;
let gamesPlayed = 0;
let gamesWon = 0;
let gamesLost = 0;
let totalIncorrectGuesses = 0;
let incorrectGuessesPerGame = 0;
let isGameOver = false;

let rope = document.querySelector('.rope');
let ropeHolder = document.querySelector('.ropeHolder');
let ropeAnimation = null;

const again = document.querySelector(".again");
const reset = document.querySelector(".reset");
const hintBox = document.querySelector(".hint");
const wordBox = document.querySelector(".word");
const youLose = document.querySelector('.youLose');
const youWin = document.querySelector('.youWin');
const results = document.querySelector('.results');
const cookieWarning = document.querySelector('.cookieWarning');



async function manageStart(skipCookieLoad = false){
    setStartUI();
    initRope();

    let hasExistingData = false;
    if (!skipCookieLoad) {
        hasExistingData = await loadFromCookie();
    }
    if (!hasExistingData){
        await getRandomWordList();
        displayResults();
    }

    const cookieData = {
        wordList: words,
        gamesPlayed: gamesPlayed,
        totalIncorrectGuesses: totalIncorrectGuesses,
        gamesWon: gamesWon,
        wordCount: wordCount
    };
    document.cookie = `gameData=${encodeURIComponent(JSON.stringify(cookieData))}; max-age=7889400; path=/`; //3months

    bgImage.addEventListener('click', startNewGame);

    let html = '';    
    html += /*html*/`<p>This game uses cookies to store your results so they persist if you want to play over multiple sessions.
                        </p>`;
    cookieWarning.innerHTML = html;
};


function setStartUI(){
    bgImage.src = `images/08.jpg`;
    bgImage.style.cursor = 'pointer';
    cookieWarning.style.display = 'block';
    again.style.display = 'none';
    reset.style.display = 'none';
    hintBox.style.display = 'none';
    wordBox.style.display = 'none';
    youWin.style.display = 'none';
    youLose.style.display = 'none';
    results.style.display = 'none';
    document.querySelector('.keyboardR1').style.display = 'none';
    document.querySelector('.keyboardR2').style.display = 'none';
    document.querySelector('.keyboardR3').style.display = 'none';
};

function resetScores(){
    document.cookie = "gameData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    wordCount = 0;
    gamesPlayed = 0;
    totalIncorrectGuesses = 0;
    incorrectGuesses = 0;
    gamesLost = 0;
    gamesWon = 0;
    incorrectGuessesPerGame = 0;
    words = null;
    wordsHints = null;
    ropeHolder.style.display = 'flex';
    manageStart(true);
};

async function loadFromCookie(){
    const cookieString = document.cookie;
    const cookies = cookieString.split(';').map(cookie => cookie.trim());
    const gameDataCookie = cookies.find(cookie => cookie.startsWith('gameData='));
    
    if (gameDataCookie){
        const jsonString = decodeURIComponent(gameDataCookie.substring('gameData='.length));
        const data = JSON.parse(jsonString);
        const response = await fetch('data/wordsHints.json');
        wordsHints = await response.json();
            
        words = data.wordList;
        gamesPlayed = data.gamesPlayed;
        totalIncorrectGuesses = data.totalIncorrectGuesses;
        gamesWon = data.gamesWon;
        wordCount = data.wordCount;
        displayResults();
        return true;
    }
    return false;
};

function setGameUI(){
    ropeHolder.style.display = 'none';
    again.style.display = 'none'; 
    youWin.style.display = 'none'; 
    youLose.style.display = 'none';
    bgImage.removeEventListener('click', startNewGame);
    again.removeEventListener('click', startNewGame);
    cookieWarning.style.display = 'none';
    guessedLetters.forEach(function(letter){
        const cross = document.querySelector(`#${letter} .cross`);
        cross.remove();
        });
    guessedLetters.clear();

    document.querySelector('.keyboardR1').style.display = 'flex';
    document.querySelector('.keyboardR2').style.display = 'flex';
    document.querySelector('.keyboardR3').style.display = 'flex'; 
    document.querySelector('.playAgain').style.display = 'block';
    document.querySelector('.youWinLose').style.display = 'block';   
    bgImage.src = `images/00.jpg`;
    bgImage.style.cursor = 'auto';
    hintBox.style.display = 'flex';
    wordBox.style.display = 'flex';
    reset.style.display = 'block';
    results.style.display = 'block';
    reset.addEventListener('click', resetScores);
    document.removeEventListener('keydown', handleEnter);   
};

function startNewGame(){
    isGameOver = false;
    incorrectGuesses = 0;
    correctGuesses = 0;
    word = words[wordCount];
    hint = wordsHints[word];
    wordCount++

    setGameUI()
    displayHint();
    displayWord();
    listenForInput();  
};

function initRope(){
    let movingUp = true;
    let position = 0;
    let counter = 0;
    
    function moveRope() {
        counter++;
        if (movingUp) {    
            position++; 
            if (position === 100) {
                movingUp = false;
            }
        } else {
            position--;
            if (position === 0) {
                movingUp = true;
            }
        }
        rope.style.top = (-25 + (-40/100 * position)) + '%';
        rope.style.left = (2 + (-5/100 * position)) + '%';
        
        if (counter < 350) {
            ropeAnimation = requestAnimationFrame(moveRope);
        }
    }
    ropeAnimation = requestAnimationFrame(moveRope);
};

async function getRandomWordList(){
    const response = await fetch('data/wordsHints.json');
    wordsHints = await response.json();
    words = Object.keys(wordsHints);

    let j, x, i;                                //copied from course notes
    //loop through the entire array
    for (i = words.length - 1; i > 0; i--) {
        //randomly select a word
        j = Math.floor(Math.random() * (i + 1));
        x = words[i];
        //resort words
        words[i] = words[j];
        words[j] = x;
    }  
};

function displayHint(){
    const hintContainer = document.querySelector(".hint");
    let html = "";
    let letterImg;
    hint.split('').forEach(function(char) {
        if(char === ' '){
            letterImg = '_';
            html += /*html*/ `<div>
                                <img src="images/${letterImg}.png" alt="hint" class="hintLetter">
                            </div>`;
        }else if(char === 'i'){
            letterImg = char;
            html += /*html*/ `<div>
                                <img src="images/${letterImg}.png" alt="hint" class="hintLetterI">
                            </div>`;
        }else{
            letterImg = char;
            html += /*html*/ `<div>
                                <img src="images/${letterImg}.png" alt="hint" class="hintLetter">
                            </div>`
        };
    });
    hintContainer.innerHTML = html;
};

function displayWord(){
    let html = "";
    word.split('').forEach(function(char){
        if(char === 'i'){
        html += /*html*/`<div class="letterSpace">
                            <img src="images/${char}.png" alt="letter" class="letterI ltr${char}" style="display: none;">
                            <img src="images/${Math.floor(Math.random() * 8) + 15}.png" alt="letter space" class="space"> 
                        </div>`                                                     //Plus 15 to align with img file names
        }else{
        html += /*html*/`<div class="letterSpace">
                            <img src="images/${char}.png" alt="letter" class="letter ltr${char}" style="display: none;">
                            <img src="images/${Math.floor(Math.random() * 8) + 15}.png" alt="letter space" class="space">
                        </div>`                                                     //Plus 15 to align with img file names
        }
    });
    wordBox.innerHTML = html;
};

function listenForInput(){
    document.addEventListener('keydown', function(e){
        guessedLetter = e.key.toLowerCase();
        processGuess();        
    });
    const keyRows = ['.keyboardR1', '.keyboardR2', '.keyboardR3'];
    keyRows.forEach(function(keyRow){
        document.querySelector(keyRow).addEventListener('click', function(e){
            if(e.target.id){
            guessedLetter = e.target.id;
            processGuess();
        }});
    });
};

function processGuess(){
    if(/^[a-z]$/.test(guessedLetter) && !guessedLetters.has(guessedLetter) && !isGameOver){

        document.querySelectorAll(`.ltr${guessedLetter}`).forEach(function(e)       //show correctly guessed letter
            {e.style.display = 'block';
            correctGuesses++;                                                       //increment Correct guesses
            initHandCorrect();                                                      //hand ani
            });
        document.querySelector(`#${guessedLetter}`).innerHTML =                     //place cross on keyboard... plus 11 to align with image file names
            `<img src="images/${Math.floor(Math.random() * 3) + 11}.png" alt="cross out guessed letter" class="cross">`;
        guessedLetters.add(guessedLetter);                                          //add guessed letter to guessedLetter Set.
        if(word.length === correctGuesses){                                         //check for win
            isGameOver = true;
            gamesWon++;
            updateTotals();
            youWin.style.display = 'block';                                         //you win screen
            reset.style.display = 'none'; 
            again.style.display = 'block';
            again.addEventListener('click', startNewGame);
            document.addEventListener('keydown', handleEnter);
        }
        if(word.indexOf(guessedLetter) < 0){                                        //if incorrect guess
            incorrectGuesses++;
            initHandIncorrect();                                                     //increment guess count
            if(incorrectGuesses === 7){                                             //if max guesses end game
                isGameOver = true;
                updateTotals();
                youLose.style.display = 'block';                                    //you lose screen
                reset.style.display = 'none'; 
                again.style.display = 'block';
                again.addEventListener('click', startNewGame);
                document.addEventListener('keydown', handleEnter);                
            };
            bgImage.src = `images/0${incorrectGuesses}.jpg`;                     //change hangman image
        };
}};

function updateTotals(){
    gamesPlayed++;
    totalIncorrectGuesses += incorrectGuesses;
    incorrectGuessesPerGame = totalIncorrectGuesses / gamesPlayed;
    gamesLost = gamesPlayed - gamesWon;

    displayResults();

    const cookieData = {
        wordList: words, 
        gamesPlayed: gamesPlayed, 
        totalIncorrectGuesses: totalIncorrectGuesses, 
        gamesWon: gamesWon,
        wordCount: wordCount
    };
    document.cookie = `gameData=${encodeURIComponent(JSON.stringify(cookieData))}; max-age=7889400; path=/`;
};

function displayResults(){
    let html = '';    
    html += /*html*/`<p><strong>Games played:</strong> ${gamesPlayed} out of ${words.length}. <strong>Games won/lost:</strong> ${gamesWon}/${gamesLost} <br><strong>Incorrect guesses per game:</strong> ${incorrectGuessesPerGame.toFixed(2)};
                        </p>`;
    results.innerHTML = html;
};

function handleEnter(e) {
    if (e.key === 'Enter') {
        startNewGame();
    }
};

manageStart();

class HandAnimation {
    constructor(config) {
        this.lr = 0;
        this.ud = config.startUd;
        this.handUp = true;
        this.lrSpeed = config.lrSpeed;
        this.maxLr = config.maxLr;
        this.offsetX = config.offsetX;
        this.offsetY = config.offsetY;
        this.maxUd = config.maxUd;
        this.udSpeed = config.udSpeed;
        this.handElement = document.querySelector('.handHolder');
        this.animationId;
    }

    start() {
        return new Promise((resolve) => {
            this.handElement.style.display = 'block';
            const animation = () => {
                this.lr += this.lrSpeed;
                this.handElement.style.transform = 
                    `translate(${this.lr + this.offsetX}px, ${this.ud + this.offsetY}px)`;
                if (this.lr === this.maxLr) {
                    cancelAnimationFrame(this.animationId);
                    this.handElement.style.display = 'none';
                    resolve();
                    return;
                }
                this.updateVerticalPosition();
                this.animationId = requestAnimationFrame(animation);
            };
            
            animation();
        });
    }

    updateVerticalPosition() {
        if (this.handUp && this.ud < this.maxUd) {
            this.ud += this.udSpeed;
        }
        if (this.ud === this.maxUd) {
            this.handUp = false;
        }
        if (!this.handUp && this.ud > 0) {
            this.ud -= this.udSpeed;
        }
        if (this.ud === 0) {
            this.handUp = true;
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.handElement.style.display = 'none';
        }
    }
};

function initHandCorrect(){
    const letterAnim = new HandAnimation({
        startUd: 16,        //must be multiple of udSpeed
        lrSpeed: 10,        //must be multiple of lr
        maxLr: 100,         //must be multiple of lrSpeed
        offsetX: -150,
        offsetY: 350,
        maxUd: 40,          //must be multiple of udSpeed
        udSpeed: 8          //must be multiple of ud
    });
    const wordAnim = new HandAnimation({
        startUd: 16,        //see note above about multiples
        lrSpeed: 20,
        maxLr: 320,
        offsetX: -175,
        offsetY: 200,
        maxUd: 40,
        udSpeed: 8
    });
    letterAnim.start().then(function(){
        wordAnim.start();
    });
};

function initHandIncorrect(){
    const letterAnim = new HandAnimation({
        startUd: 16,        //see note above about multiples
        lrSpeed: 10,
        maxLr: 100,
        offsetX: -150,
        offsetY: 350,
        maxUd: 40,
        udSpeed: 8
    });
    const pictureAnim = new HandAnimation({
        startUd: 18,        //see note above about multiples
        lrSpeed: 10,
        maxLr: 100,
        offsetX: -50,
        offsetY: 0,
        maxUd: 30,
        udSpeed: 6
    });
    letterAnim.start().then(function(){
        pictureAnim.start()
    });
};
