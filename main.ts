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
const speed2distance: { [key: number]: number } = {
    1: 4.14,
    2: 8.29,
    3: 12.43, // pomiar 19
    4: 16.57,
    5: 20.71,
    6: 24.86,
    7: 29, // pomiar
}

// Distance in mm
function getTimeForDistance(distance: number, speed = 7, direction = 1){
    if (direction){
        // return (distance * speed2distanceTime)/speed2distance[speed];
        return (distance * speed2distanceTime)/29;
    } else {
        // 1,724137931034483 s - 10mm lub 8.5mm w osi y
        // Korekta: 5*8.5/1,724137931034483 = 24,65
        return (distance * speed2distanceTime)/24.65;
    }
}

// Pen on/off
let penStatus = false;

function setPen(status: boolean){
    if (penStatus == status){
        return;
    }

    if (status){
        pf.control(7, 0, 2)
        pf.pause(800)
        pf.control(0, 0, 2)
        penStatus = true
        basic.showIcon(IconNames.SmallDiamond)
    } else {
        pf.control(-7, 0, 2)
        pf.pause(1000)
        pf.control(0, 0, 2)
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
    let fixedHorizontalDistance = 2.0;
    let fixedVerticalDistance = 0.2;

    while (drawQueue.length){
        let item = drawQueue.shift();

        for (let i = 0; i <= 1; i++){
            let point = item[i];

            let horizontalDistance = Math.abs(lastPosition[0] - point[0]);
            let horizontalDirection = point[0] > lastPosition[0] ? 1 : point[0] < lastPosition[0] ? -1 : 0;
            let horizontalTime = getTimeForDistance(horizontalDistance, speed);
            let horizontalFixTime = 0;

            if (horizontalDistance && horizontalDirection != lastHorizontalDirection){
                horizontalFixTime = getTimeForDistance(fixedHorizontalDistance, speed);
                basic.showString("-");
                lastHorizontalDirection = horizontalDirection
            }

            let verticalDistance = Math.abs(lastPosition[1] - point[1]);
            let verticalDirection = point[1] > lastPosition[1] ? 1 : point[1] < lastPosition[1] ? -1 : 0;
            let verticalTime = getTimeForDistance(verticalDistance, speed, 0);
            let verticalFixTime = 0;

            if (verticalDistance && verticalDirection != lastVerticalDirection){
                verticalFixTime = getTimeForDistance(fixedVerticalDistance, speed, 0);
                basic.showString("|");
                lastVerticalDirection = verticalDirection
            }

            if (verticalDistance || horizontalDistance){
                setPen(!!i);
                displayDirection(horizontalDirection, verticalDirection)
            }

            // Single point
            if (!!i && !verticalDistance && !horizontalDistance){
                setPen(true);
            }

            if (debug){
                // serial.writeLine(JSON.stringify({
                //     horizontalDirection: horizontalDirection, 
                //     horizontalDistance: horizontalDistance,
                //     horizontalTime: horizontalTime,
                //     horizontalFixTime: horizontalFixTime,
                //     verticalDirection: verticalDirection,
                //     verticalDistance: verticalDistance,
                //     verticalTime: verticalTime,
                //     verticalFixTime: verticalFixTime,
                // }))

                serial.writeLine(JSON.stringify({
                    time: input.runningTime(),
                    xT: horizontalTime,
                    dxT: horizontalFixTime,
                    yT: verticalTime,
                    dyT: verticalFixTime,
                }))
            }

            if (penStatus == true && horizontalDirection && verticalDirection && Math.abs(verticalDistance) == Math.abs(horizontalDistance)){               
                pf.control(speed * horizontalDirection, speed * verticalDirection, 1);
                pf.pause(horizontalTime + horizontalFixTime);
                pf.control(0, 0, 1);
            } else {
                if (verticalDistance){
                    pf.control(0, speed * verticalDirection, 1);
                    pf.pause(verticalTime + verticalFixTime);
                    pf.control(0, 0, 1);
                }

                if (horizontalDistance){
                    pf.control(speed * horizontalDirection, 0, 1);
                    pf.pause(horizontalTime + horizontalFixTime);
                    pf.control(0, 0, 1);
                }
            }

            if (debug){
                serial.writeLine(JSON.stringify({
                    time: input.runningTime(),
                }))
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
    pf.control(7, 7, 1);
    pf.pause(1000);
    pf.control(0, 0, 1);

    basic.clearScreen();
}

// Ror each speed draws section in 3s.
function calibrate(){
    setPen(false)
    // Init - nieweluje początkowe przesunięcie trybów
    pf.control(0, 7, 1);
    pf.pause(500);
    pf.control(7, 0, 1);
    pf.pause(1000);
    pf.control(0, 0, 1);

    setPen(true)

    for (let i = 1; i <= 7; i++){
        basic.showNumber(i);
        pf.control(0, i, 1);
        pf.pause(3000);
        pf.control(7, 0, 1);
        pf.pause(1000);
        pf.control(0, 0, 1);
    }

    basic.clearScreen();
}

// ----------------

input.onButtonPressed(Button.A, function () {
    // Two lines
    // draw([
    //     [[5,5],[10,5]],
    //     [[10,10],[5,10]],
    // ])

    // Checking changing direction fix
    // draw([
    //     [[0,10],[0,0]],
    //     [[10,0],[0,0]],
    // ])

    // Test
    // draw([
    //     [[0,0],[5,-5]],
    //     [[5,-5],[0,0]],
    // ])

    // Point
    // draw([
    //     [[0,5],[0,5]],
    //     [[0,10],[0,10]],
    // ])

    // Rect
    // draw([
    //     [[0,0],[10,0]],
    //     [[10,0],[10,10]],
    //     [[10,10],[0,10]],
    //     [[0,10],[0,0]],
    // ])

    // Rect in rect
    // draw([
    //     [[0,0],[20,0]],
    //     [[20,0],[20,20]],
    //     [[20,20],[0,20]],
    //     [[0,20],[0,0]],
    
    //     [[5,5],[15,5]],
    //     [[15,5],[15,15]],
    //     [[15,15],[5,15]],
    //     [[5,15],[5,5]],
    // ])

    // House
    // draw([
    //     [[0,0],[20,0]],
    //     [[20,0],[20,20]],

    //     [[20,20],[10,30]],
    //     [[20,20],[0,20]],
    //     [[0,20],[10,30]],

    //     // Dach
    //     // [[10,30],[0,20]],
    //     // // [[0,20],[20,20]],

    //     // [[0,20],[0,0]],

    //     // Okno
    //     [[5,5],[15,5]],
    //     [[15,5],[15,15]],
    //     [[15,15],[5,15]],
    //     [[5,15],[5,5]],
    // ])

    // Diagonal lines
    // draw([
    //     [[0,0],[20,20]],
    //     [[20,0],[0,20]]
    // ])

    // Triangular
    // draw([
    //     [[0,0],[10,10]],
    //     [[10,10],[20,0]],
    //     [[20,0],[0,0]],
    // ])

    // Rect corners (points)
    // draw([
    //     [[0,0],[0,0]],
    //     [[20,0],[20,0]],
    //     [[20,20],[20,20]],
    //     [[0,20],[0,20]],
    // ])

    // Test
    draw([
        [[0,0],[20,20]],
        [[20,20],[0,0]]
    ])

    basic.clearScreen()
})

input.onButtonPressed(Button.B, function () {
    // pf.stop()
    // calibrate()

    // Test
    // draw([
    //     [[5,5],[15,5]],
    //     [[15,5],[15,15]],
    //     [[15,15],[5,15]],
    //     [[5,15],[5,5]],
    // ])

    // Test
    // draw([
    //     [[0,0],[20,0]],
    //     [[20,5],[0,5]],
    //     [[0,10],[20,10]],
    //     [[20,15],[0,15]],
    //     [[0,20],[20,20]],
    // ])

    // draw([
    //     [[20,20],[20,0]],
    //     [[15,0],[15,20]],
    //     [[10,20],[10,0]],
    //     [[5,0],[5,20]],
    //     [[0,20],[0,0]],
    // ])

    draw([
        [[0,0],[10,0]],
        [[10,5],[0,5]],
        [[0,10],[10,10]],

        [[10,10],[10,0]],
        [[5,0],[5,10]],
        [[0,10],[0,0]],
    ])
})

// Emergency stop
input.onLogoEvent(TouchButtonEvent.Pressed, function () {
    pf.control(0, 0, 1)
    pf.control(0, 0, 2)
    pf.control(0, 0, 3)
    pf.control(0, 0, 4)
})

// Init
initialized();
// pf.debug = true;