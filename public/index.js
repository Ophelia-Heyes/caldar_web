
// Allow assets directory listings
// const serveIndex = require('serve-index'); 
// test = app.use('/images/sprites', serveIndex(path.join(__dirname, '/images')));

let imageContainer = document.getElementById('image-container');
let spriteButtons = {};


async function getImages() {
    let files;
    if (navigator.saysWho[0] == "Safari") {
        try {
            const response = fetch("/safariImages");
            files = await response;
            // files is now an array of file names, do what you want with that (create <img> tags, etc.)
            return files.json();
        } catch (err) {
            console.error(err)
        }        
    }
    else {
        try {
            const response = fetch("/images");
            files = await response;
            // files is now an array of file names, do what you want with that (create <img> tags, etc.)
            return files.json();
        } catch (err) {
            console.error(err)
        }
    }
}

function displayImages(imageNames) {
    imageNames = imageNames.filter(file => file.endsWith('.png')||file.endsWith('.webm')||file.endsWith('.mov'));
    let dir = (navigator.saysWho[0]=="Safari") ? "images/sprites/safari/":"images/sprites/player/";
    for (let index = 0; index < imageNames.length; index++) {
        createSpriteElement(dir + imageNames[index]);
    }
}

function createSpriteElement(imageName) {
    // get the name of the image, without file type
    let spriteName=imageName.split("/").slice(-1)[0].split(".")[0];
    spriteButtons[spriteName] = false;
    let imageButtonParent = document.createElement("th");
    imageButtonParent.setAttribute("class", "image-button-parent");
    imageContainer.appendChild(imageButtonParent);
    let imageButton = document.createElement("input");
    let imageButtonLabel = document.createElement("label");
    imageButton.setAttribute("type", "checkbox");
    imageButton.setAttribute("onclick", "checkMark(this)");
    //imageButton.setAttribute("checked", false);
    imageButton.setAttribute("id", spriteName);
    imageButtonLabel.setAttribute("for", spriteName);
    imageButtonParent.appendChild(imageButton);
    imageButtonParent.appendChild(imageButtonLabel);
    imageButtonLabel.setAttribute("class", "sprite-border");
    let image;
    if(imageName.endsWith('.webm')||imageName.endsWith('.mov')){
        image = document.createElement('video');
        image.preload = true;
        image.muted = true;
        image.loop = true;
        image.playsInline = true;
        image.autoplay = true;
    }
    else{
        image = document.createElement('img');
    }
    //let image = document.createElement('img');
    imageButtonLabel.appendChild(image);
    //const imageTag = imageName;
    image.src = imageName;
    image.setAttribute("class", "sprite");
}

function checkMark(button) {
    spriteButtons[button.id] = button.checked;
    console.log(button.id);
}

function submitChoices() {
    // submit which sprites the player has selected to control
    console.log(spriteButtons);
}

navigator.saysWho = (() => {
    const { userAgent } = navigator
    let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
    let temp

    if (/trident/i.test(match[1])) {
        temp = /\brv[ :]+(\d+)/g.exec(userAgent) || []

        return `IE ${temp[1] || ''}`
    }

    if (match[1] === 'Chrome') {
        temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/)

        if (temp !== null) {
            return temp.slice(1).join(' ').replace('OPR', 'Opera')
        }

        temp = userAgent.match(/\b(Edg)\/(\d+)/)

        if (temp !== null) {
            return temp.slice(1).join(' ').replace('Edg', 'Edge (Chromium)')
        }
    }

    match = match[2] ? [match[1], match[2]] : [navigator.appName, navigator.appVersion, '-?']
    temp = userAgent.match(/version\/(\d+)/i)

    if (temp !== null) {
        match.splice(1, 1, temp[1])
    }

    return match
})();

getImages().then(result => { displayImages(result) });

