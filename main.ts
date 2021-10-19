// Micro:bit control for LEGO set nr: 8094 Control Center
// Modifications:
// Motors control by Power Function IR.
// Additional motor to move pen up and down.

// Todo:
// Funkcja do rysowania skośnej lini metodą schodkową
// Funkcja do rysowania skośnej lini za pomocą zmiany prędkości silników.

let pf = new LegoPFcontrol();

// Distance in mm
function getTimeForDistance(distance: number, speed = 7, direction = 1){
    // Minimal run time: 500 ms
    // 5 s distance in mm
    let speed2distance: { [key: number]: number[] } = {
        7: [26, 29], // pomiar
    }
    return Math.floor((distance * 5000)/speed2distance[speed][direction]);
}

// Pen on/off
let penStatus = false;

function setPen(status: boolean){
    if (penStatus != status){
        pf.speed(2, 'red', status ? -7 : 0)
        basic.pause(1000)
        penStatus = status
        basic.showIcon(status ? IconNames.SmallDiamond : IconNames.Diamond)
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
    let speed = 7;
    let fixedHorizontalDistance = 1.5;
    let fixedVerticalDistance = 1.0;

    while (drawQueue.length){
        let item = drawQueue.shift();

        for (let i = 0; i <= 1; i++){
            let point = item[i];

            // Horizontal

            let horizontalDistance = Math.abs(lastPosition[0] - point[0]);
            let horizontalDirection = point[0] > lastPosition[0] ? 1 : point[0] < lastPosition[0] ? -1 : 0;
            let horizontalTime = getTimeForDistance(horizontalDistance, speed);
            let horizontalFixTime = 0;

            if (horizontalDistance && horizontalDirection != lastHorizontalDirection){
                horizontalFixTime = getTimeForDistance(fixedHorizontalDistance, speed);
                lastHorizontalDirection = horizontalDirection
            }

            let horizontalPauseTime = Math.floor(horizontalTime + horizontalFixTime);

            // Vertical

            let verticalDistance = Math.abs(lastPosition[1] - point[1]);
            let verticalDirection = point[1] > lastPosition[1] ? 1 : point[1] < lastPosition[1] ? -1 : 0;
            let verticalTime = getTimeForDistance(verticalDistance, speed, 0);
            let verticalFixTime = 0;

            if (verticalDistance && verticalDirection != lastVerticalDirection){
                verticalFixTime = getTimeForDistance(fixedVerticalDistance, speed, 0);
                lastVerticalDirection = verticalDirection
            }

            let verticalPauseTime = Math.floor(verticalTime + verticalFixTime);

            // Set pen and display direction

            if (verticalDistance || horizontalDistance){
                setPen(!!i);
                displayDirection(horizontalDirection, verticalDirection)
            }

            // Single point
            if (!!i && !verticalDistance && !horizontalDistance){
                setPen(true);
            }

            if (penStatus == true && verticalDistance && horizontalDistance && Math.abs(verticalDistance) == Math.abs(horizontalDistance)){                              
                if (verticalFixTime && horizontalFixTime){
                    if (verticalFixTime > horizontalFixTime){
                        pf.speed(1, 'blue', speed * verticalDirection)
                        basic.pause(verticalFixTime - horizontalFixTime)
                        pf.speed(1, 'red', speed * horizontalDirection)
                        basic.pause(horizontalPauseTime)
                    } else {
                        pf.speed(1, 'red', speed * horizontalDirection)
                        basic.pause(horizontalFixTime - verticalFixTime)
                        pf.speed(1, 'blue', speed * verticalDirection)
                        basic.pause(verticalPauseTime)
                    }
                } else if (verticalFixTime){
                    pf.speed(1, 'blue', speed * verticalDirection)
                    basic.pause(verticalFixTime)
                    pf.speed(1, 'red', speed * horizontalDirection)
                    basic.pause(verticalTime)
                } else if (horizontalFixTime){
                    pf.speed(1, 'red', speed * horizontalDirection)
                    basic.pause(horizontalFixTime)
                    pf.speed(1, 'blue', speed * verticalDirection)
                    basic.pause(horizontalTime)
                } else {
                    pf.speed(1, 'red', speed * horizontalDirection)
                    pf.speed(1, 'blue', speed * verticalDirection)
                    basic.pause(horizontalPauseTime)
                }

                pf.speed(1, 'red', 0)
                pf.speed(1, 'blue', 0)
            } else {
                if (horizontalDistance){
                    let timeStart = input.runningTime();

                    pf.speed(1, 'red', speed * horizontalDirection)
                    basic.pause(horizontalPauseTime)

                    let runTime = input.runningTime() - timeStart;

                    pf.speed(1, 'red', 0)

                    serial.writeLine(JSON.stringify({c: 'red', dt: runTime - horizontalPauseTime, pauseTime: horizontalPauseTime, runTime: runTime, fixTime: horizontalFixTime}))
                }

                if (verticalDistance){
                    let timeStart = input.runningTime();

                    pf.speed(1, 'blue', speed * verticalDirection)
                    basic.pause(verticalPauseTime)
                    
                    let runTime = input.runningTime() - timeStart;

                    pf.speed(1, 'blue', 0)

                    serial.writeLine(JSON.stringify({c: 'blue', dt: runTime - verticalPauseTime, pauseTime: verticalPauseTime, runTime: runTime, fixTime: verticalFixTime}))
                }
            }

            lastPosition = point
        }
    }

    setPen(false)
    basic.clearScreen()
}


function initialized(){
    // pf.debug = true;
    
    powerfunctions.setMotorDirection(PowerFunctionsMotor.Red1, PowerFunctionsDirection.Right)
    basic.pause(100);
    powerfunctions.setMotorDirection(PowerFunctionsMotor.Blue1, PowerFunctionsDirection.Left)
    basic.pause(100);
    powerfunctions.setMotorDirection(PowerFunctionsMotor.Red2, PowerFunctionsDirection.Right)
    basic.pause(100);

    pf.speed(2, 'red', 0);

    pf.speed(1, 'red', -7);
    pf.speed(1, 'blue', -7);
    basic.pause(1000);
    pf.speed(1, 'red', 7);
    pf.speed(1, 'blue', 7);
    basic.pause(1000);
    pf.speed(1, 'red', 0);
    pf.speed(1, 'blue', 0);
    basic.pause(500);

    basic.showIcon(IconNames.Yes)
}

// ----------------

// Init
initialized();


function alphabet(letter: string){
    let alphabet: { [key: string]: number[][][] } = {
        A: [[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]],[[0,1],[1,1]]],
        B: [[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]],[[1,0],[0,0]],[[0,1],[1,1]]],
        S: [[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[0,1]],[[0,1],[0,2]],[[0,2],[1,2]]],
        I: [[[0,0],[0,2]]],
        // N: [[[0,0],[0,2]],[[1,2],[1,0]],[[1,0.5],[0,1.5]]],
        // T: [[[0.5,0],[0.5,2]],[[0,2],[1,2]]],
        O: [[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]]],
        G: [[[0.5,1],[1,1]],[[1,1],[1,0]],[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]]],
        E: [[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]],[[0,1],[1,1]]],
        L: [[[0,2],[0,0]],[[0,0],[1,0]]],
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
                for (let i = 0; i < 2; i++){
                    letter[r][i][0] *= scale;
                    letter[r][i][1] *= scale;
                    letter[r][i][0] += lastPosition[0] + letterSpacing;
                }
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

    // Test - horizontal battlements

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

    // Test - vertical battlements

    // let drawPoints = [];
    // for (let i = 0; i < 3; i++){
    //     drawPoints.push([[0,10 * i],[5,10 * i]])
    //     drawPoints.push([[5,10 * i],[5,5 + 10 * i]])
    //     drawPoints.push([[5,5 + 10 * i],[0,5 + 10 * i]])
    //     drawPoints.push([[0,5 + 10 * i],[0,10 + 10 * i]])
    // }
    // drawPoints.push([[0,0],[0,0]])
    // draw(drawPoints)

    // print("LEGO")
    print("L")
})

input.onButtonPressed(Button.AB, function () {

    // Slanting lines up and down ^^

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