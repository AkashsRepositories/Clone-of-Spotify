import { fetchRequest } from "../api";
import { ENDPOINT, logout, SECTIONTYPE } from "../common";

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

const onPlaylistClick = (event, id) => {
    console.log(event.target);
    const section = {type: SECTIONTYPE.PLAYLIST, playlist: id};
    history.pushState(section, "", `playlists/${id}`);
    loadSection(section);
}

const loadPlaylist  = async (endpoint, elementId) => {
    const {playlists: {items}} = await fetchRequest(endpoint);
    const playlistContainer = document.querySelector(`#${elementId}`);

    for(let {name, id, description, images:[{url}]} of items){
        const currentSection = document.createElement("section");
        currentSection.className= "rounded bg-secondary-black p-4 hover:cursor-pointer hover:bg-light-black";
        currentSection.id = id;
        currentSection.setAttribute("data-type", "playlist");
        //adding click event on playlist card
        currentSection.addEventListener('click', (event) => onPlaylistClick(event, id));
        currentSection.innerHTML = `
                        <img class="rounded object-contain mb-2 shadow" src="${url}" alt="${name} cover image">
                        <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
                        <h3 class="text-xs text-secondary line-clamp-2">${description}</h3>
                        `
        playlistContainer.appendChild(currentSection);
    }

}

function loadPlaylists(){
    //featured playlist   
    loadPlaylist(ENDPOINT.featuredPlaylist, 'featured-playlist-items');
    //top playlists
    loadPlaylist(ENDPOINT.toplists, 'top-playlist-items');
}

//for generating playlists' structure
const fillContentForDashboard = () => {
    const playlistArr = [["featured", "featured-playlist-items"], ["top playlists", "top-playlist-items"]];
    const pageContent = document.querySelector('#page-content');
    let innerHTML = '';
    for(let [type, id] of playlistArr){
        innerHTML += `
            <article class="p-4">
                <h1 class="text-2xl mb-4">${type}</h1>
                <section id="${id}" class="${type}-songs grid grid-cols-auto-fill-cards gap-4">
                    <!-- ${type} playlist here - generated via js -->
                </section>
            </article>
        `;
    }

    pageContent.innerHTML = innerHTML;
}

const formatTime = (duration) => {
    const min = Math.floor(duration/60_000);
    const sec = ((duration % 6000) / 1000).toFixed(0);
    const formattedTime = 
    sec == 60
    ? min+1 + ":00"
    :  min + ":" + ((sec < 10)? "0": "") + sec;

    return  formattedTime;
}

const loadPlaylistTracks = ({ tracks }) => {
    const trackSections = document.querySelector("#tracks");

    let trackNumber = 1;
    for(let trackItem of tracks.items) {
        let {id, artists, name, album, duration_ms: duration} = trackItem.track;
        let track = document.createElement('section');
        track.id = id;
        track.className = "track p-1 grid grid-cols-[50px_2fr_1fr_50px] items-center justify-items-start rounded-md gap-4 text-secondary hover:bg-light-black cursor-pointer";
        let image = album.images.find(img=> img.height === 64);
        track.innerHTML = `
                <p class="justify-self-center">${trackNumber++}</p>
                <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
                    <img class="h-8 w-8" src="${image.url}" alt="${name}">
                    <article class="flex flex-col">
                        <h2 class="text-primary text-xl">${name}</h2>
                        <p class="text-sm">${Array.from(artists, artist=> artist.name).join(", ")}</p>
                    </article>
                </section>
                <p>${album.name}</p>
                <p>${formatTime(duration)}</p>
        `

        trackSections.append(track);
    }
}

const fillContentForPlaylist = async (playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
    const pageContent = document.querySelector('#page-content');
    pageContent.innerHTML = `
        <header id="playlist-header" class="px-8 py-4">
            <nav>
                <ul class="grid grid-cols-[50px_2fr_1fr_50px] gap-4 text-secondary ">
                    <li class="justify-self-center">#</li>
                    <li>Title</li>                                                                                  
                    <li>Album</li>
                    <li>&#128337;</li>
                </ul>
            </nav>
        </header>
        <section class="px-8 text-secondary" id="tracks">
        </section>
    `;

    loadPlaylistTracks(playlist);
}

const loadSection = (section) => {
    if(section.type === SECTIONTYPE.DASHBOARD){
        //load dashboard
        //structuring the dashboard
        fillContentForDashboard();
        //loading playlists
        loadPlaylists();
    } else if(section.type === SECTIONTYPE.PLAYLIST){
        //load playlist
        fillContentForPlaylist(section.playlist);
    }
}

//on loading on document - automatically exected when respective html file loads up in browser
document.addEventListener('DOMContentLoaded', () => {
    //user's profile name and image
    loadUserProfile(); 

    //load section
    const section = {type: SECTIONTYPE.DASHBOARD};
    history.pushState(section, "", "");
    loadSection(section);  //temporarily commented out 

    document.addEventListener('click',  () => {
        const profileMenu = document.querySelector("#profile-menu");
        if(!profileMenu.classList.contains("hidden")) {
            profileMenu.classList.add("hidden");
        }
    });

    document.querySelector(".content").addEventListener("scroll", (event) => {
        const { scrollTop } = event.target;
        const header = document.querySelector(".header");
        if(scrollTop >= header.offsetHeight){
            header.classList.add("sticky", "top-0", "bg-secondary-black");
            header.classList.remove("bg-transparent");
        } else {
            header.classList.add("bg-transparent");
            header.classList.remove("sticky", "top-0", "bg-secondary-black");
        }

        if(history.state.type === SECTIONTYPE.PLAYLIST){
            //if current section is playlist - only then
            const playlistHeader = document.querySelector("#playlist-header");
            if(scrollTop >= playlistHeader.offsetHeight){
                playlistHeader.classList.add("sticky",  `top-[${header.offsetHeight}px]`, "bg-black-base");
            }
        }
    });

    //when user clicks on back button of browser - popstate event is triggered
    window.addEventListener('popstate', (event)=>{
        loadSection(event.state);
    });
})