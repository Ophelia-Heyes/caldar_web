let droneVid;
let showDrone = false;

function createFriend() {
    let body = document.body;
    let droneContainer = document.createElement("div");
    body.prepend(droneContainer);
    droneContainer.setAttribute("class", "animated-drone-container");
    let droneParent = document.createElement("div");
    droneParent.setAttribute("class", "animated-drone-parent");
    droneContainer.appendChild(droneParent);
    droneVid = document.createElement("video");
    droneVid.setAttribute("class", "animated-drone");
    droneParent.appendChild(droneVid);
    droneVid.style.display="none";
    droneVid.preload = true;
    droneVid.muted = true;
    droneVid.loop = true;
    droneVid.playsInline = true;
    droneVid.autoplay = true;
    droneVid.src = (navigator.saysWho[0] == "Safari") ? "images/sprites/safari/drone_token.mov" : "images/sprites/player/drone_token.webm";

}


function unhideFriend(){
    showDrone = !showDrone;
    droneVid.style.display= (showDrone) ? "block" : "none";
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

createFriend();