
// Allow assets directory listings
// const serveIndex = require('serve-index'); 
// test = app.use('/images/sprites', serveIndex(path.join(__dirname, '/images')));

let imageContainer = document.getElementById('image-container');
let buttons = {};


async function getImages(){
    let files;

    try{
        const response = fetch("/images");
        files = await response;
        // files is now an array of file names, do what you want with that (create <img> tags, etc.)
        return files.json();
    } catch(err){
        console.error(err)
    }
}

function displayImages(imageNames){
    for (let index = 0; index < imageNames.length; index++) {
        createSpriteElement("images/sprites/player/"+imageNames[index]);
    }
}

function createSpriteElement(imageName){
    buttons[imageName]= false;
    let imageButtonParent = document.createElement("th");
    imageButtonParent.setAttribute("class", "image-button-parent");
    imageContainer.appendChild(imageButtonParent);
    let imageButton = document.createElement("input");
    let imageButtonLabel = document.createElement("label");
    imageButton.setAttribute("type", "checkbox");
    imageButton.setAttribute("onclick", "checkMark(this)");
    //imageButton.setAttribute("checked", false);
    imageButton.setAttribute("id", imageName);
    imageButtonLabel.setAttribute("for", imageName);
    imageButtonParent.appendChild(imageButton);
    imageButtonParent.appendChild(imageButtonLabel);
    imageButtonLabel.setAttribute("class", "sprite-border");
    let image = document.createElement('img');
    imageButtonLabel.appendChild(image);
    const imageTag = imageName;
    image.src = imageTag;
    image.setAttribute("class", "sprite");
}

function checkMark(button){
    buttons[button.id] = button.checked;
    console.log(button.id);
}

function submitChoices(){
    // submit which sprites the player has selected to control
    console.log('test!!!!!');
    console.log(buttons);
}

getImages().then(result=>{displayImages(result)});

