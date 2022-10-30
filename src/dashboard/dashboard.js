import { fetchRequest } from "../api";
import { ENDPOINT, logout } from "../common";

const onProfileClick = (event) => {
    //to stop this click to be registered for document as well
    event.stopPropagation();

    const profileMenu = document.querySelector("#profile-menu");
    profileMenu.classList.toggle('hidden');
    if(!profileMenu.classList.contains("hidden")){
        profileMenu.querySelector("li#logout").addEventListener('click', logout);
    }
}

const loadUserProfile = async () => {
    const defaultImage = document.querySelector("#default-image");
    const profileButton = document.querySelector("#user-profile-btn");
    const displayNameElement = document.querySelector("#display-name");

    const {display_name: displayName, images} = await fetchRequest(ENDPOINT.userInfo);
    if(displayName)
        displayNameElement.textContent = displayName;
    
    if(images?.length){
        defaultImage.classList.add("hidden");
    } else {
        defaultImage.classList.remove("hidden");
    }

    profileButton.addEventListener('click', onProfileClick);
}

const onPlaylistClick = (event) => {
    console.log(event.target)
}

const loadFeaturedPlaylist  = async () => {
    const {playlists: {items}} = await fetchRequest(ENDPOINT.featuredPlaylist);
    console.log(items)
    const playlistContainer = document.querySelector('#featured-playlist-items');

    for(let {name, id, description, images:[{url}]} of items){
        const currentSection = document.createElement("section");
        currentSection.className= "rounded border-2 p-4 hover:cursor-pointer";
        currentSection.id = id;
        //adding click event on playlist card
        currentSection.addEventListener('click', onPlaylistClick);
        currentSection.innerHTML = `
                        <img class="rounded object-contain mb-2 shadow" src="${url}" alt="${name} cover image">
                        <h2 class="text-sm">${name}</h2>
                        <h3 class="text-xs">${description}</h3>
                        `
        playlistContainer.appendChild(currentSection);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();    
    loadFeaturedPlaylist();
    document.addEventListener('click',  () => {
        const profileMenu = document.querySelector("#profile-menu");
        if(!profileMenu.classList.contains("hidden")) {
            profileMenu.classList.add("hidden");
        }
    })
})