
// Allow assets directory listings
// const serveIndex = require('serve-index'); 
// test = app.use('/images/sprites', serveIndex(path.join(__dirname, '/images')));

let imageContainer = document.getElementById('image-container');


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
        createSpriteElement("images/sprites/"+imageNames[index]);
    }
}


function createSpriteElement(imageName){
    let imageDiv = document.createElement("div");
    imageContainer.appendChild(imageDiv);
    imageDiv.setAttribute("class", "sprite-border");
    let image = document.createElement('img');
    imageDiv.appendChild(image);
    const imageTag = imageName;
    image.src = imageTag;
    image.setAttribute("class", "sprite");
}

getImages().then(result=>{displayImages(result)});

