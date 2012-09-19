(function (global) {

    var overlay,
        // `ctx` will be the drawing context for `overlay`
        ctx;

    var reqAnimFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (action) { window.setTimeout(action, 1000 / 60); };

    function loadImage () {
        var // `buffer` is a canvas element that displays the actual image to crop
            buffer = document.querySelector('#buffer'),
            // `img` is an img element we use to load the img, though we never add it to the DOM
            img = document.createElement('img');

        img.src = 'images/leaf twirl.jpg';

        return Rx.Observable.fromEvent(img, 'load').select(function () {
            overlay.width = img.width;
            overlay.height = img.height;

            buffer.width = img.width;
            buffer.height = img.height;
            buffer.getContext('2d').drawImage(img, 0, 0);

            return {
                width: img.width,
                height: img.height
            };
        });
    } 

    function initBoundingBox(size) {
        var boundingBox = {
            x: 0,
            y: 0,
            x2: size.width,
            y2: size.height
        };
        return boundingBox;
    }

    function createHandles (boundingBox) {
        var container = document.getElementById('container'),
            handles = [];

        function createHandle (id, render, updateModel) {
            var handle = document.createElement('div');
            handle.className += ' handle';
            handle.setAttribute('id', id);
            container.appendChild(handle);

            // `render` allows us to visually update the handle after it has been dragged
            handle['render'] = render;
            // `updateModel` allows us to modify the correct part of the crop region model
            handle['updateModel'] = updateModel;

            handles.push(handle);            
        }

        // top left
        createHandle('tl', function () {
            this.style.top = boundingBox.y + 'px';
            this.style.left = boundingBox.x + 'px';
        }, function (x, y) {
            boundingBox.x = x;
            boundingBox.y = y;
        });

        //top right
        createHandle('tr', function () {
            this.style.top = boundingBox.y + 'px';
            this.style.left = boundingBox.x2 + 'px';
        }, function (x, y) {
            boundingBox.y = y;
            boundingBox.x2 = x;
        });

        // bottom left
        createHandle('bl', function (s) {
            this.style.top = boundingBox.y2 + 'px';
            this.style.left = boundingBox.x + 'px';
        }, function (x, y) {
            boundingBox.x = x;
            boundingBox.y2 = y;
        });

        // bottom right
        createHandle('br', function (s) {
            this.style.top = boundingBox.y2 + 'px';
            this.style.left = boundingBox.x2 + 'px';
        }, function (x, y) {
            boundingBox.y2 = y;
            boundingBox.x2 = x;
        });

        // render the handles in their initial positiions
        handles.forEach(function (element) { element['render'](); });        
        return handles;
    }

    function respondToGestures(handles) {
        var fromEvent = Rx.Observable.fromEvent;

        var moves = fromEvent(overlay, 'mousemove'),
            up = fromEvent(document, 'mouseup');

        // When the mouse is down on a handle, return the handle element
        var events = fromEvent(handles, 'mousedown')
            .selectMany(function (handle) {
                return moves
                    // We combine the handle element with the position data from the move event
                    .select(function (pos) {
                        return {
                            element: handle.target,
                            offsetX: pos.offsetX,
                            offsetY: pos.offsetY
                        };
                    })
                    // However, when the mouse is up (anywhere on the document) then stop the stream
                    .takeUntil(up);
            });

        return events.doAction(function (data) {
            data.element.updateModel(data.offsetX, data.offsetY);
        });
    }

    function drawOverlay(boundingBox, handles, ctx) {
        var x = boundingBox.x,
            y = boundingBox.y,
            w = boundingBox.x2 - boundingBox.x,
            h = boundingBox.y2 - boundingBox.y;

        ctx.globalCompositeOperation = 'source-over';

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, overlay.width, overlay.height);

        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.fillRect(x, y, w, h);
        ctx.fill();

        handles.forEach(function (tool) { tool['render'](); });
    }    

    function main () {
        overlay = document.getElementById('overlay');
        ctx = overlay.getContext('2d');

        var subscription = loadImage()
            .selectMany(function (size) {
                var boundingBox = initBoundingBox(size),
                    handles = createHandles(boundingBox);

                return respondToGestures(handles).select(function (offset) {
                    return { boundingBox: boundingBox, handles: handles };
                });
            })
            .subscribe(function (data) {
                var boundDrawOverlay = drawOverlay.bind(null, data.boundingBox, data.handles, ctx);
                reqAnimFrame(boundDrawOverlay);
            });
    }

    main();

}(window));