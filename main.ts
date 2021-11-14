// Micro:bit control for LEGO set nr: 8094 Control Center
// Modifications:
// Motors control by Power Function IR.
// Additional motor to move pen up and down.

// Todo:
// Funkcja do rysowania skośnej lini metodą schodkową
// Funkcja do rysowania skośnej lini za pomocą zmiany prędkości silników.

pfTransmitter.connectIrSenderLed(AnalogPin.P0)

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
        pfspeed(1, 'red', status ? 7 : 0)
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

function pfspeed(channel: number, output: string, speed: number){
    let s = PfSingleOutput.BrakeThenFloat;

    if (speed < 0){
        s = output == 'red' ? PfSingleOutput.Backward7 : PfSingleOutput.Forward7;
    } else if (speed > 0) {
        s = output == 'red' ? PfSingleOutput.Forward7 : PfSingleOutput.Backward7;
    } else {
        s = PfSingleOutput.BrakeThenFloat;
    }

    pfTransmitter.singleOutputMode(channel, output == 'red' ? PfOutput.Red : PfOutput.Blue, s)
}

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
                        pfspeed(0, 'blue', speed * verticalDirection)
                        basic.pause(verticalFixTime - horizontalFixTime)
                        pfspeed(0, 'red', speed * horizontalDirection)
                        basic.pause(horizontalPauseTime)
                    } else {
                        pfspeed(0, 'red', speed * horizontalDirection)
                        basic.pause(horizontalFixTime - verticalFixTime)
                        pfspeed(0, 'blue', speed * verticalDirection)
                        basic.pause(verticalPauseTime)
                    }
                } else if (verticalFixTime){
                    pfspeed(0, 'blue', speed * verticalDirection)
                    basic.pause(verticalFixTime)
                    pfspeed(0, 'red', speed * horizontalDirection)
                    basic.pause(verticalTime)
                } else if (horizontalFixTime){
                    pfspeed(0, 'red', speed * horizontalDirection)
                    basic.pause(horizontalFixTime)
                    pfspeed(0, 'blue', speed * verticalDirection)
                    basic.pause(horizontalTime)
                } else {
                    pfspeed(0, 'red', speed * horizontalDirection)
                    pfspeed(0, 'blue', speed * verticalDirection)
                    // pfTransmitter.comboPWMMode(
                    //     PfChannel.Channel1, 
                    //     horizontalDirection > 0 ? PfComboPWM.Forward7 : PfComboPWM.Backward7,
                    //     verticalDirection > 0 ? PfComboPWM.Forward7 : PfComboPWM.Backward7,
                    // )
                    basic.pause(horizontalPauseTime)
                }

                pfspeed(0, 'red', 0)
                pfspeed(0, 'blue', 0)
                // pfTransmitter.comboPWMMode(
                //     PfChannel.Channel1,
                //     PfComboPWM.BrakeThenFloat,
                //     PfComboPWM.BrakeThenFloat
                // )
            } else {
                if (horizontalDistance){
                    let timeStart = input.runningTime();

                    pfspeed(0, 'red', speed * horizontalDirection)
                    basic.pause(horizontalPauseTime)

                    let runTime = input.runningTime() - timeStart;

                    pfspeed(0, 'red', 0)

                    serial.writeLine(JSON.stringify({c: 'red', dt: runTime - horizontalPauseTime, pauseTime: horizontalPauseTime, runTime: runTime, fixTime: horizontalFixTime}))
                }

                if (verticalDistance){
                    let timeStart = input.runningTime();

                    pfspeed(0, 'blue', speed * verticalDirection)
                    basic.pause(verticalPauseTime)
                    
                    let runTime = input.runningTime() - timeStart;

                    pfspeed(0, 'blue', 0)

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
    pfspeed(2, 'red', 0);

    led.plot(0, 2)

    pfTransmitter.comboPWMMode(
        PfChannel.Channel1,
        PfComboPWM.Backward7,
        PfComboPWM.Backward7
    )

    basic.pause(1000);

    led.plot(1, 2)

    pfTransmitter.comboPWMMode(
        PfChannel.Channel1,
        PfComboPWM.Forward7,
        PfComboPWM.Forward7
    )

    basic.pause(1000);

    led.plot(2, 2)

    pfTransmitter.comboPWMMode(
        PfChannel.Channel1,
        PfComboPWM.BrakeThenFloat,
        PfComboPWM.BrakeThenFloat
    )

    basic.pause(500);

    led.plot(3, 2)

    basic.showIcon(IconNames.Yes)
}

// ----------------

// Init
initialized();


function alphabet(letter: string){
    let alphabet: { [key: string]: number[][][] } = {
        // A: [[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]],[[0,1],[1,1]]],
        B: [[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]],[[1,0],[0,0]],[[0,1],[1,1]]],
        // S: [[[0,0],[1,0]],[[1,0],[1,1]],[[1,1],[0,1]],[[0,1],[0,2]],[[0,2],[1,2]]],
        I: [[[0,0],[0,2]]],
        // N: [[[0,0],[0,2]],[[1,2],[1,0]],[[1,0.5],[0,1.5]]],
        T: [[[0.5,0],[0.5,2]],[[0,2],[1,2]]],
        O: [[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]],[[1,2],[1,0]]],
        // G: [[[0.5,1],[1,1]],[[1,1],[1,0]],[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]]],
        // E: [[[1,0],[0,0]],[[0,0],[0,2]],[[0,2],[1,2]],[[0,1],[1,1]]],
        // L: [[[0,2],[0,0]],[[0,0],[1,0]]],
        M: [[[0, 0], [0, 2]], [[0, 2], [1, 1]], [[1, 1], [2, 2]], [[2, 2], [2, 0]]],
        C: [[[1, 0], [0, 0]], [[0, 0], [0, 2]], [[0, 2], [1, 2]]],
        R: [[[0, 0], [0, 2]], [[0, 2], [1, 2]], [[1, 2], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [1, 0]]],
        ':': [[[0, 0.5], [0, 0.5]], [[0, 1.5], [0, 1.5]]],
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

    // print("BASIA")
    print("MICRO:BIT")
    // print(":BIT")
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
    print("M")
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

    // Rect

    draw([
        [[0, 0],[0,10]],
        [[0,10],[10,10]],
        [[10,10],[10,0]],
        [[10,0],[0,0]],
    ])
})