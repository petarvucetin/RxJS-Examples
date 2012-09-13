require(['rx', 'rx.html', 'rx.binding', 'rx.time'], function (Rx) {

    var coords = document.querySelector('#coordinates');
    var delta = document.querySelector('#delta');
    var buffer = document.querySelector('#buffer');

    // One and only one subscription
    var mousemove = Rx.Observable.fromEvent(document, 'mousemove').publish().refCount();

    // Simple coordinates
    var d1 = mousemove.subscribe(function (e) {
        coords.innerHTML = e.clientX + ',' + e.clientY;
    });

    var d2 = mousemove.zip(mousemove.skip(1), function (l, r) {
        return { clientX: r.clientX - l.clientX, clientY: r.clientY - l.clientY };
    }).subscribe(function (e) {
        delta.innerHTML = e.clientX + ',' + e.clientY;
    });

    var d3 = mousemove.bufferWithTimeOrCount(500, 10).subscribe(function (e) {
        while(buffer.firstChild) {
            buffer.removeChild(buffer.firstChild);
        }

        var node, elem, i, len;
        for(i = 0, len = e.length; i < len; i++) {
            elem = e[i];
            node = document.createElement('li');
            node.innerHTML = elem.clientX + ',' + elem.clientY;
            buffer.appendChild(node);
        }

    });
});