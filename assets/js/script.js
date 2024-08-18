const designElementsCanvasWidth = 1500;
const matterContainer = document.querySelector('#matter-container');
const allSVGElementsPath = ".matter-path";
const boundariesThiccness = 60;

function isMobileDevice(){
    return (/Mobi|Android|iPhone/i.test(navigator.userAgent))
}

function getResponsivePixelRatio(){
    return isMobileDevice() ? 2 : 1
}

// module aliases
let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Events = Matter.Events,
    Body = Matter.Body
    Svg = Matter.Svg,
    Vector = Matter.Vector,
    Vertices = Matter.Vertices;

// create an engine
let engine = Engine.create();

// create a renderer
let render = Render.create({
    element: matterContainer,
    engine: engine,
    options: {
        width: matterContainer.clientWidth,
        height: matterContainer.clientHeight,
        background: 'transparent',
        pixelRatio: getResponsivePixelRatio(),
        wireframes: false,
        showAngleIndicator: false,
    },
});

document.querySelector('h1').innerText = getResponsivePixelRatio();

// create Matter boundaries like: ground, ceil, left, right
function createBoundaries(){
    let ceiling = Bodies.rectangle(
        (matterContainer.clientWidth / 2),
        (0 - (boundariesThiccness / 2)),
        (matterContainer.clientWidth * 100),
        boundariesThiccness,
        {
            isStatic: true,
            render: {opacity: 0}
        }
    );
    let ground = Bodies.rectangle(
        (matterContainer.clientWidth / 2),
        (matterContainer.clientHeight + (boundariesThiccness / 2)),
        (matterContainer.clientWidth * 100),
        boundariesThiccness,
        {
            isStatic: true,
            render: {opacity: 0}
        }
    );
    let leftWall = Bodies.rectangle(
        (0 - (boundariesThiccness / 2)),
        (matterContainer.clientHeight / 2),
        boundariesThiccness,
        (matterContainer.clientHeight * 5),
        {
            isStatic: true,
            render: {opacity: 0}
        }
    );
    let rightWall = Bodies.rectangle(
        (matterContainer.clientWidth + (boundariesThiccness / 2)),
        (matterContainer.clientHeight / 2),
        boundariesThiccness,
        (matterContainer.clientHeight * 5),
        {
            isStatic: true,
            render: {opacity: 0}
        }
    );
    // add all of the boundaries to the world
    Composite.add(engine.world, [ceiling, ground, leftWall, rightWall]);
};
createBoundaries();

// create runner
let runner = Runner.create();

// add mouse control
let mouse = Mouse.create(render.canvas);
let mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false,
        }
    },
});
Composite.add(engine.world, mouseConstraint);

// Allow scrolling when mouse or touch is on matter container
function allowScrollRemoveEventListenerHelper(eventName, eventObject){
    mouseConstraint.mouse.element.removeEventListener(
        eventName,
        eventObject
    );
}

// Allow scrolling when mouse or touch is on matter container
function fixAllowScrollingIssue(){
    // Allow scrolling when mouse is on matter container
    allowScrollRemoveEventListenerHelper('mousewheel', mouseConstraint.mouse.mousewheel);
    allowScrollRemoveEventListenerHelper('DOMMouseScroll', mouseConstraint.mouse.mousewheel);
    // Allow swiping on touch-screen when in touch with the matter container
    allowScrollRemoveEventListenerHelper('touchstart', mouseConstraint.mouse.mousedown);
    allowScrollRemoveEventListenerHelper('touchmove', mouseConstraint.mouse.mousemove);
    allowScrollRemoveEventListenerHelper('touchend', mouseConstraint.mouse.mouseup);
    //
    mouseConstraint.mouse.element.addEventListener('touchstart', mouseConstraint.mouse.mousedown, { passive: true });
    mouseConstraint.mouse.element.addEventListener('touchmove', (e) => {
        if (mouseConstraint.body) {
            mouseConstraint.mouse.mousemove(e);
        }
    });
    mouseConstraint.mouse.element.addEventListener('touchend', (e) => {
        if (mouseConstraint.body) {
            mouseConstraint.mouse.mouseup(e);
        }
    });
};
fixAllowScrollingIssue();


// Create and add all svg elements in Matter canvas
function createSvgBodies() {
    const paths = document.querySelectorAll(allSVGElementsPath);
    const numRows = 2; // Number of rows
    const numCols = 3; // Number of columns
    
    paths.forEach((path, index) => {
        
        let spacingX = path.closest('.matter-svg').clientWidth * 0.5; // Horizontal spacing between SVG bodies
        let spacingY = path.closest('.matter-svg').clientWidth * 0.2; // Vertical spacing between rows
        let imageUrl = path.dataset.sprite;
        let vertices = Svg.pathToVertices(path);

        let row = Math.floor(index / numRows);
        let col = index % numCols;

        let x = col * spacingX + 100;
        let y = row * spacingY + 100;


        const regularScaleFactor = (path.closest('.matter-svg').clientWidth / designElementsCanvasWidth);
        let scaleFactor = (matterContainer.clientWidth * regularScaleFactor) / path.closest('.matter-svg').clientWidth;

        if(scaleFactor > 1){
            scaleFactor = 1;
        }
        else if(scaleFactor < 0.5){
            scaleFactor = 0.5;
        }
        else{
            scaleFactor = scaleFactor;
        }
        
        
        vertices = Vertices.scale(vertices, scaleFactor, scaleFactor);
        let svgBody = Bodies.fromVertices(
        x,
        y,
        [vertices],
        {
            friction: 0.1,
            frictionAir: 0.00001,
            restitution: 0.8,
            render: {
                index: index,
                sprite: {
                    texture: imageUrl,
                    xScale: scaleFactor,
                    yScale: scaleFactor,
                },
                // fillStyle: "#464655",
                // strokeStyle: "#464655",
                lineWidth: 1,
            }
        }
        );

        Composite.add(engine.world, svgBody);
    });
};
createSvgBodies();

function handleResize(){
    // Clear the existing bodies
    Composite.clear(engine.world, false);
    
    // // Recreate boundaries and bodies
    createBoundaries();
    createSvgBodies();
    Composite.add(engine.world, mouseConstraint);

    render.bounds.max.x = matterContainer.clientWidth;
    render.bounds.max.y = matterContainer.clientHeight;
    render.options.width = matterContainer.clientWidth;
    render.options.height = matterContainer.clientHeight;
    render.canvas.width = matterContainer.clientWidth;
    render.canvas.height = matterContainer.clientHeight;
    Render.setPixelRatio(render, getResponsivePixelRatio());
    
    // Update mouse constraint
    fixAllowScrollingIssue();
}

// run handleResize on page resize
window.addEventListener('resize', function(){
    if(!isMobileDevice()){
        handleResize();
    }
});


// // Flag to check if the engine has started
let engineStarted = false;
// Intersection Observer to start the engine only once
let observer = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting && !engineStarted) {
            // Element is in viewport and engine has not started yet
            engineStarted = true;
            // run the renderer
            Render.run(render);
            // run the engine
            Runner.run(runner, engine);
            
            observer.disconnect();
        }
    });
}, {
    threshold: 0.1 // Adjust the threshold as needed
});
// Start observing the matterContainer
observer.observe(matterContainer);