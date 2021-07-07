// Micro:bit control for LEGO set nr: 8094 Control Center
// Modifications:
// Motors control by Power Function IR.
// Additional motor to move pen up and down.

// Todo:
// Funkcja do rysowania skośnej lini metodą schodkową
// Funkcja do rysowania skośnej lini za pomocą zmiany prędkości silników.

// 5 s distance in mm
// Minimal run time: 500 ms
const speed2distanceTime = 5000;
const speed2distance: { [key: number]: number[] } = {
    7: [26,29], // pomiar
}

// Distance in mm
function getTimeForDistance(distance: number, speed = 7, direction = 1){
    return Math.floor((distance * speed2distanceTime)/speed2distance[speed][direction]);
}

// Pen on/off
let penStatus = false;

function setPen(status: boolean){
    if (penStatus == status){
        return;
    }

    if (status){
        pf.red(7, 2)
        pf.pause(1000)

        penStatus = true
        basic.showIcon(IconNames.SmallDiamond)
    } else {
        pf.red(0, 2)
        pf.pause(1000)

        penStatus = false
        basic.showIcon(IconNames.Diamond)
    }
}


function displayDirection(x: number, y: number){
    if (x == 0 && y == 1){
        basic.showArrow(ArrowNames.North)
    } else if (x == 0 && y == -1){
        basic.showArrow(ArrowNames.South)
    } else if (x == 1 && y == 0){
        basic.showArrow(ArrowNames.East)
    } else if (x == -1 && y == 0){
        basic.showArrow(ArrowNames.West)
    } else if (x == 1 && y == 1){
        basic.showArrow(ArrowNames.NorthEast)
    } else if (x == -1 && y == 1){
        basic.showArrow(ArrowNames.NorthWest)
    } else if (x == 1 && y == -1){
        basic.showArrow(ArrowNames.SouthEast)
    } else if (x == -1 && y == -1){
        basic.showArrow(ArrowNames.SouthWest)
    }
}


let lastPosition = [0,0];
let lastVerticalDirection = 1;
let lastHorizontalDirection = 1;

function draw(drawQueue: number[][][]){
    let debug = false;
    let speed = 7;
    let fixedHorizontalDistance = 1.5;
    let fixedVerticalDistance = 1.0;

    while (drawQueue.length){
        let item = drawQueue.shift();

        // serial.writeLine(JSON.stringify(item));

        for (let i = 0; i <= 1; i++){
            // pf.pause(1000);         
            let point = item[i];

            let horizontalDistance = Math.abs(lastPosition[0] - point[0]);
            let horizontalDirection = point[0] > lastPosition[0] ? 1 : point[0] < lastPosition[0] ? -1 : 0;
            let horizontalTime = getTimeForDistance(horizontalDistance, speed);
            let horizontalFixTime = 0;

            if (horizontalDistance && horizontalDirection != lastHorizontalDirection){
                horizontalFixTime = getTimeForDistance(fixedHorizontalDistance, speed);
                lastHorizontalDirection = horizontalDirection
            }

            let horizontalPauseTime = Math.floor(horizontalTime + horizontalFixTime);

            let verticalDistance = Math.abs(lastPosition[1] - point[1]);
            let verticalDirection = point[1] > lastPosition[1] ? 1 : point[1] < lastPosition[1] ? -1 : 0;
            let verticalTime = getTimeForDistance(verticalDistance, speed, 0);
            let verticalFixTime = 0;

            if (verticalDistance && verticalDirection != lastVerticalDirection){
                verticalFixTime = getTimeForDistance(fixedVerticalDistance, speed, 0);
                lastVerticalDirection = verticalDirection
            }

            let verticalPauseTime = Math.floor(verticalTime + verticalFixTime);

            if (verticalDistance || horizontalDistance){
                setPen(!!i);
                displayDirection(horizontalDirection, verticalDirection)
            }

            // Single point
            if (!!i && !verticalDistance && !horizontalDistance){
                setPen(true);
            }

            if (penStatus == true && verticalDistance && horizontalDistance && Math.abs(verticalDistance) == Math.abs(horizontalDistance)){               
                // pf.control(speed * horizontalDirection, speed * verticalDirection, 1);
                // pf.pause(horizontalPauseTime)
                // pf.control(0, 0, 1);
                
                if (verticalFixTime && horizontalFixTime){
                    if (verticalFixTime > horizontalFixTime){
                        pf.blue(speed * verticalDirection, 1);
                        pf.pause(verticalFixTime - horizontalFixTime)
                        pf.red(speed * horizontalDirection, 1);
                        pf.pause(horizontalPauseTime)
                    } else {
                        pf.red(speed * horizontalDirection, 1);
                        pf.pause(horizontalFixTime - verticalFixTime)
                        pf.blue(speed * verticalDirection, 1);
                        pf.pause(verticalPauseTime)
                    }
                } else if (verticalFixTime){
                    pf.blue(speed * verticalDirection, 1);
                    pf.pause(verticalFixTime)
                    pf.red(speed * horizontalDirection, 1);
                    pf.pause(verticalTime)
                } else if (horizontalFixTime){
                    pf.red(speed * horizontalDirection, 1);
                    pf.pause(horizontalFixTime)
                    pf.blue(speed * verticalDirection, 1);
                    pf.pause(horizontalTime)
                } else {
                    pf.control(speed * horizontalDirection, speed * verticalDirection, 1);
                    pf.pause(horizontalPauseTime)
                }

                pf.control(0, 0, 1);
            } else {
                if (horizontalDistance){
                    let timeStart = input.runningTime();
                    pf.red(speed * horizontalDirection, 1);
                    pf.pause(horizontalPauseTime)
                    let timeStop = input.runningTime();
                    let runTime = timeStop - timeStart;
                    serial.writeLine(JSON.stringify({c: 'red', dt: runTime - horizontalPauseTime, pauseTime: horizontalPauseTime, timeStart: timeStart}))
                    pf.red(0, 1);
                }

                if (verticalDistance){
                    let timeStart = input.runningTime();
                    pf.blue(speed * verticalDirection, 1);
                    pf.pause(verticalPauseTime)
                    let timeStop = input.runningTime();
                    let runTime = timeStop - timeStart;
                    serial.writeLine(JSON.stringify({c: 'blue', dt: runTime - verticalPauseTime, pauseTime: verticalPauseTime, timeStart: timeStart}))
                    pf.blue(0, 1);
                }
            }

            lastPosition = point
        }
    }

    setPen(false)
    basic.clearScreen()
}


function initialized(){
    basic.showString("I");
    lastVerticalDirection = 1;
    lastHorizontalDirection = 1;
    
    pf.direction('right', 'left', 1)
    pf.pause(1000);

    pf.control(7, 7, 1);
    pf.pause(500);
    pf.control(0, 0, 1);

    basic.clearScreen();
}

// ----------------

// Init
initialized();
// pf.debug = true;

function alphabet(letter: string){
    let alphabet: { [key: string]: number[][][] } = {
        // A: [
        //     [[0,0],[0,2]],
        //     [[0,2],[1,2]],
        //     [[1,2],[1,0]],
        //     [[0,1],[1,1]],
        // ],
        // B: [
        //     [[0,0],[0,2]],
        //     [[0,2],[1,2]],
        //     [[1,2],[1,0]],
        //     [[1,0],[0,0]],
        //     [[0,1],[1,1]],
        // ],
        // S: [
        //     [[0,0],[1,0]],
        //     [[1,0],[1,1]],
        //     [[1,1],[0,1]],
        //     [[0,1],[0,2]],
        //     [[0,2],[1,2]],
        // ],
        // I: [
        //     [[0,0],[0,2]],
        // ],
        // N: [
        //     [[0,0],[0,2]],
        //     // [[0,2],[0.5,2]],
        //     // [[0.5,2],[0.5,1]],
        //     // [[0.5,1],[1,1]],
        //     [[0,2],[2,0]],
        //     [[2,0],[2,2]],
        // ],
        // T: [
        //     [[0.5,0],[0.5,2]],
        //     [[0,2],[1,2]],
        // ],
        O: [
            [[1,0],[0,0]],
            [[0,0],[0,2]],
            [[0,2],[1,2]],
            [[1,2],[1,0]],
        ],
        G: [
            [[0,1],[1,1]],
            [[1,1],[1,0]],
            [[1,0],[0,0]],
            [[0,0],[0,2]],
            [[0,2],[1,2]],
        ],
        E: [
            [[1,0],[0,0]],
            [[0,0],[0,2]],
            [[0,2],[1,2]],
            [[0,1],[1,1]],
        ],
        L: [
            [[0,2],[0,0]],
            [[0,0],[1,0]],
        ],
    }

    return alphabet[letter] || []
}


function print(text: string){
    let scale = 5;
    let letters = text.split('');

    for (let n = 0; n < letters.length; n++){
        basic.showString(letters[n])
        let letter = alphabet(letters[n]);
        let letterSpacing = n > 0 ? 1 * scale : 0;
        
        if (letter) {
            // Calibrate
            for (let r = 0; r < letter.length; r++){
                letter[r][0][0] *= scale;
                letter[r][0][1] *= scale;

                letter[r][1][0] *= scale;
                letter[r][1][1] *= scale;

                letter[r][0][0] += lastPosition[0] + letterSpacing;
                letter[r][1][0] += lastPosition[0] + letterSpacing;
            }
        }

        draw(letter)
    }
}

input.onButtonPressed(Button.A, function () {
    // Test - horizontal lines, up and down

    // draw([
    //     [[0,0],[10,0]],
    //     [[10,0],[10,10]],
    //     [[10,10],[0,10]],
    //     [[0,10],[0,20]],
    //     [[0,20],[10,20]],
    //     [[10,20],[10,30]],
    //     [[10,30],[0,30]],

    //     [[5,30],[15,30]],
    //     [[15,30],[15,20]],
    //     [[15,20],[5,20]],
    //     [[5,20],[5,10]],
    //     [[5,10],[15,10]],
    //     [[15,10],[15,0]],
    //     [[15,0],[5,0]],
    // ])

    // ---

    // let drawPoints = [];

    // for (let i = 0; i < 3; i++){
    //     drawPoints.push([[10 * i,0],[10 * i,5]])
    //     drawPoints.push([[10 * i,5],[5 + 10 * i,5]])
    //     drawPoints.push([[5 + 10 * i,5],[5 + 10 * i,0]])
    //     drawPoints.push([[5 + 10 * i,0],[10 + 10 * i,0]])
    // }

    // drawPoints.push([[0,0],[0,0]])

    // draw(drawPoints)

    print("BASIA")
})

input.onButtonPressed(Button.B, function () {
    // Test - vertical lines, right and left

    // draw([
    //     [[0, 0],[0,10]],
    //     [[10, 10],[10,0]],
    //     [[20, 0],[20,10]],
    //     [[30, 10],[30,0]],

    //     [[30, 5],[30,15]],
    //     [[20, 15],[20,5]],
    //     [[10, 5],[10,15]],
    //     [[0, 15],[0,5]],
    // ])

    // --

    // let drawPoints = [];

    // for (let i = 0; i < 3; i++){
    //     drawPoints.push([[0,10 * i],[5,10 * i]])
    //     drawPoints.push([[5,10 * i],[5,5 + 10 * i]])
    //     drawPoints.push([[5,5 + 10 * i],[0,5 + 10 * i]])
    //     drawPoints.push([[0,5 + 10 * i],[0,10 + 10 * i]])
    // }

    // drawPoints.push([[0,0],[0,0]])

    // draw(drawPoints)

    // print("ANTOS")
    // print("OS")

    // for (let i = 0; i < 10; i++){
    //     let timeStart = input.runningTime();
    //     basic.pause(1000)
    //     let timeStop = input.runningTime();
    //     let runTime = timeStop - timeStart;
    //     serial.writeLine(JSON.stringify({dt: runTime - 1000}))
    // }

    print("LEGO")
})

input.onButtonPressed(Button.AB, function () {
    // draw([
    //     [[0,0],[10,10]],
    //     [[10,10],[20,0]],
    //     [[20,0],[30,10]],
    //     [[30,10],[40,0]],


    //     [[40,0],[30,-10]],
    //     [[30,-10],[20,0]],
    //     [[20,0],[10,-10]],
    //     [[10,-10],[0,0]],
    // ])
})