let P5loaded = false;

function loadP5() {
    if (!P5loaded) {
        var script = document.createElement('script');
        script.setAttribute('src', 'sketch.js');
        document.head.appendChild(script);
        console.log("got script!");
    }
} 