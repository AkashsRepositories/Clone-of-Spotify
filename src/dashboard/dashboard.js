import { list } from "postcss";
import { fetchRequest } from "../api";
import { ENDPOINT, getItemFromLocalStorage, LOADED_TRACKS, logout, SECTIONTYPE, setItemInLocalStorage } from "../common";

const audio = new Audio();
let displayName;

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
    return new Promise(async (resolve, reject) => {
        const defaultImage = document.querySelector("#default-image");
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement = document.querySelector("#display-name");
    
        const {display_name: displayName, images} = await fetchRequest(ENDPOINT.userInfo);
        if(displayName)
            displayNameElement.textContent = displayName;
        
        if(images?.length){
            defaultImage?.classList.add("hidden");
        } else {
            defaultImage?.classList.remove("hidden");
        }
    
        profileButton.addEventListener('click', onProfileClick);
        resolve({displayName});
    })
    
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
        currentSection.className= "rounded bg-black-secondary p-4 hover:cursor-pointer hover:bg-light-black";
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

const onUserPlaylistClick = (id) => {
    const section = {type: SECTIONTYPE.PLAYLIST, playlist:id};
    history.pushState(section, "", `playlist/${id}`);
    loadSection(section);
}

const loadUserPlaylists = async () => {
    const playlists = await fetchRequest(ENDPOINT.userPlaylist);
    console.log(playlists);
    const userPlaylistsSection = document.querySelector("#user-playlists > ul");
    userPlaylistsSection.innerHTML = '';
    for(let {name, id} of playlists.items){
        const li = document.createElement('li');
        li.textContent = name;
        li.className = "cursor-pointer hover:text-primary";
        li.addEventListener("click", () => onUserPlaylistClick(id));
        userPlaylistsSection.appendChild(li);
    }
}

//for generating playlists' structure
const fillContentForDashboard = () => {
    const coverContent = document.querySelector("#cover-content");
    coverContent.innerHTML = 
    `
            <h1 class="text-6xl">Hello ${displayName}</h1>
    `;
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

const onTrackSelection = (id, event) => {
    document.querySelectorAll("#tracks .track").forEach(trackItem => {
        if(trackItem.id === id){
            trackItem.classList.add("bg-gray", "selected");
        } else {
            trackItem.classList.remove("bg-gray", "selected");
        }
    });
}

const updateIconsForPlayMode =  (id) => {
    const playButton = document.querySelector("#play>span");
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);
    console.log(playButtonFromTracks, id)
    if(playButtonFromTracks)
        playButtonFromTracks.textContent = "pause";
    playButton.textContent = "pause_circle";
}

const updateIconsForPauseMode = (id) => {
    const playButton = document.querySelector("#play>span");
    const playButtonFromTracks = document.querySelector(`#play-track-${id}`);

    if(playButtonFromTracks)
        playButtonFromTracks.textContent = "play_arrow";
    playButton.textContent = "play_circle";
}

const onAudioMetaDataLoaded = (id) => {
    const playButton = document.querySelector("#play>span");
    const totalSongDuration = document.querySelector('#total-song-duration');
    totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
    playButton.textContent = "pause_circle";
}

const findCurrentTrack = () => {
    const audioControl = document.querySelector("#audio-control");
    const trackId = audioControl.getAttribute("data-track-id");
    if(trackId){
        const loadedTracks = getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex = loadedTracks?.findIndex(trk => trk.id === trackId);
        return {currentTrackIndex, tracks: loadedTracks};
    }

    return null;
}

const playPrevTrack = () => {
     const { currentTrackIndex = -1, tracks = null} = findCurrentTrack()?? {};
     if(currentTrackIndex > 0){
         playTrack(null, tracks[currentTrackIndex - 1]);
     }
}

const playNextTrack = () => {
    const { currentTrackIndex = -1, tracks = null} = findCurrentTrack()?? {};
    if(currentTrackIndex > -1 && currentTrackIndex < tracks?.length - 1){
        playTrack(null, tracks[currentTrackIndex + 1]);
    }
}

const togglePlay = () => {
    if(audio.src){
        if(audio.paused){
            audio.play();
        } else {
            audio.pause();
        }
    }
}

const playTrack = (event, { image, artistNames, name, duration, previewUrl, id }) => {
    // if(event?.stopPropagation){
    //     event.stopPropagation();
    // }
    console.log(audio.src +" space " + previewUrl)
    if(audio?.src === previewUrl){
    console.log(audio.src +"   space " + previewUrl)

        togglePlay();
    } 
    else {

        const nowPlayingSongImage = document.querySelector("#now-playing-image");
        const songTitle = document.querySelector("#now-playing-song");
        const artists = document.querySelector("#now-playing-artist");
        const audioControl = document.querySelector("#audio-control");
        const songInfo = document.querySelector("#song-info");
        songInfo.classList.remove('invisible');
        songTitle.textContent = name;
        artists.textContent = artistNames;
        nowPlayingSongImage.src = image.url;
        audioControl.setAttribute("data-track-id", id);
        audio.src = previewUrl;

        audio.play();
    }
}

const loadPlaylistTracks = ({ tracks }) => {
    const trackSections = document.querySelector("#tracks");
    let trackNumber = 1;
    const loadedTracks = [];
    for(let trackItem of tracks.items.filter(item => item.track.preview_url)) {
        let {id, artists, name, album, duration_ms: duration, preview_url: previewUrl} = trackItem.track;
        let track = document.createElement('section');
        track.id = id;
        let artistNames = Array.from(artists, artist=> artist.name).join(", ");
        track.className = "track p-1 grid grid-cols-[50px_1fr_1fr_50px] items-center justify-items-start rounded-md gap-4 text-secondary hover:bg-light-black cursor-pointer";
        let image = album.images.find(img=> img.height === 64);
        track.innerHTML = `
                <p class="relative w-full flex items-center justify-center justify-self-center"><span class="track-no">${trackNumber++}<span></p>
                <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
                    <img class="h-10 w-10" src="${image.url}" alt="${name}">
                    <article class="flex flex-col gap-1 justify-center">
                        <h2 class="song-title text-base text-primary line-clamp-1">${name}</h2>
                        <p class="text-xs line-clamp-1">${artistNames}</p>
                    </article>
                </section>
                <p class="text-sm line-clamp-1">${album.name}</p>
                <p class="text-sm">${formatTime(duration)}</p>
        `;

        track.addEventListener("click", (event) => onTrackSelection(id, event));

        const playButton = document.createElement("button");
        playButton.id = `play-track-${id}`;
        console.log(playButton.id)
        playButton.className = "play w-full absolute left-0 text-lg invisible material-symbols-outlined";
        playButton.textContent = "play_arrow";

        //play song when clicked on this
        playButton.addEventListener("click", (event) => playTrack(event, { image, artistNames, name, duration, previewUrl, id }));
        track.querySelector("p").appendChild(playButton);

        trackSections.append(track);
        loadedTracks.push({id, artistNames, name, album, duration, previewUrl, image});
    }

    setItemInLocalStorage(LOADED_TRACKS, loadedTracks);
}

const fillContentForPlaylist = async (playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
    const {name, description, images, tracks} = await playlist;
    const coverElement = document.querySelector("#cover-content");
    coverElement.innerHTML = `
        <img class="object-contain h-52 w-52" src="${images[0].url}" alt="">
        <section class="grid">
            <h2 id="playlist-name" class="text-4xl">${name}</h2> 
            <p id="playlist-description">${description}</p> 
            <p id="playlist-details">${tracks.items.length} songs</p>
        </section>
    `;
    const pageContent = document.querySelector('#page-content');
    pageContent.innerHTML = `
        <header id="playlist-header" class="mx-8  border-secondary border-b-[0.5px] z-10">
            <nav py-2>
                <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary ">
                    <li class="justify-self-center">#</li>
                    <li>Title</li>                                                                                  
                    <li>Album</li>
                    <li>&#128337;</li>
                </ul>
            </nav>
        </header>
        <section class="px-8 text-secondary mt-4" id="tracks">
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

const onContentScroll = (event) => {

    const { scrollTop } = event.target;
    const header = document.querySelector(".header");
    const coverElement = document.querySelector("#cover-content");          
    const totalHeight = coverElement.offsetHeight;
    const coverOpacity = 100 - (scrollTop >= totalHeight? 100: (scrollTop/totalHeight)*100);
    const headerOpacity = 100 - (scrollTop >= header.offsetHeight)? 100: (scrollTop/header.offsetHeight)*100;
    coverElement.style.opacity = coverOpacity+"%";
    header.style.background = `rgba(0 0 0 / ${headerOpacity}%)`

    if(history.state.type === SECTIONTYPE.PLAYLIST){
        //if current section is playlist - only then
        const playlistHeader = document.querySelector("#playlist-header");
        if(coverOpacity <= 35){
            // playlistHeader.classList.add("sticky", "bg-black-secondary",  "px-8");
            playlistHeader.classList.remove("mx-8");
            playlistHeader.style.top = `${header.offsetHeight}px`;
        } else {
            // playlistHeader.classList.remove("sticky", "bg-black-secondary",  "px-8");
            playlistHeader.classList.add("mx-8");
            playlistHeader.style.top = "revert";
        }
    }

}

//on loading on document - automatically exected when respective html file loads up in browser
document.addEventListener('DOMContentLoaded', async () => {
    
    const volume = document.querySelector('#volume');
    const prev = document.querySelector('#prev');
    const playButton = document.querySelector('#play');
    const next = document.querySelector('#next');
    const totalSongDuration = document.querySelector('#total-song-duration');
    const songDurationCompleted = document.querySelector("#song-duration-completed");
    const songProgress = document.querySelector('#progress');
    const timeline = document.querySelector('#timeline');
    const audioControl = document.querySelector("#audio-control");
    let progressInterval;
    
    //user's profile name and image 
    ({ displayName } = await loadUserProfile()); 
    loadUserPlaylists();

    //load section
    const section = {type: SECTIONTYPE.DASHBOARD}; //temporarily commented out 
    // const playlistId = '37i9dQZF1DWZdcdjsv83gQ';
    // const section = {type: SECTIONTYPE.PLAYLIST, playlist: playlistId};
    history.pushState(section, "", "");
    loadSection(section);  

    document.addEventListener('click',  () => {
        const profileMenu = document.querySelector("#profile-menu");
        if(!profileMenu.classList.contains("hidden")) {
            profileMenu.classList.add("hidden");
        }
    });

    document.querySelector(".content").addEventListener("scroll", onContentScroll);

    //when audio is played
    audio.addEventListener("play", () => {

        const selectedTrackId = audioControl.getAttribute("data-track-id");
        const tracks = document.querySelector("#tracks");
        const playingTrack =tracks?.querySelector("section.playing"); 
        const selectedTrack = tracks?.querySelector(`[id="${selectedTrackId}"]`);
        if(playingTrack?.id !== selectedTrack?.id){
            playingTrack?.classList.remove('playing');
        }
        selectedTrack?.classList.add("playing");
        progressInterval = setInterval(() => {
            if(audio.paused) return;
            //time needs to be formatted for minutes. works for seconds currently
            songDurationCompleted.textContent =  `0:${audio.currentTime.toFixed(0) < 10? "0"+audio.currentTime.toFixed(0): audio.currentTime.toFixed(0)}`;
            songProgress.style.width = `${(audio.currentTime.toFixed(0) / audio.duration) * 100}%`  ;
        }, 100);

        updateIconsForPlayMode(selectedTrackId);
    });

    //when audio  is paused
    audio.addEventListener("pause", () => {
        const selectedTrackId = audioControl.getAttribute("data-track-id");
        if(progressInterval) clearInterval(progressInterval);
        updateIconsForPauseMode(selectedTrackId);
    })

    const selectedTrackId = audioControl.getAttribute("data-track-id");
    audio.addEventListener("loadedmetadata", () => onAudioMetaDataLoaded(selectedTrackId));
    playButton.addEventListener("click",  togglePlay); 

    //for prev and next - changing songs via buttons
    prev.addEventListener("click", playPrevTrack);
    next.addEventListener("click", playNextTrack)

    //for volume control
    volume.addEventListener("change", () => {
        audio.volume = volume.value / 100; // from 0 to 1
    })

    //for seeking while playing song
    timeline.addEventListener("click", (e)=> {
        const timelineWidth = window.getComputedStyle(timeline).width;
        const timeToSeek = (e.offsetX / parseInt(timelineWidth)) * audio.duration;
        audio.currentTime = timeToSeek;
        songProgress.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }, false)

    //when user clicks on back button of browser - popstate event is triggered
    window.addEventListener('popstate', (event)=>{
        loadSection(event.state);
    });
})