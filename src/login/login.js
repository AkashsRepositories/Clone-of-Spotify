import { ACCESS_TOKEN, EXPIRES_IN, TOKEN_TYPE} from "../common";

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const APP_URL = import.meta.env.VITE_APP_URL;                  
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

const SCOPES = 'user-read-private user-read-email';

let state = generateRandomString(16);

window.addEventListener("load", () => {
    //check if access token is available or not
    let access_token = localStorage.getItem(ACCESS_TOKEN);
    if(!access_token || access_token === 'null'){
        const current_url = window.location.hash;
        let params =  new URLSearchParams(current_url);
        localStorage.setItem(ACCESS_TOKEN, params.get("#access_token"));
        localStorage.setItem(TOKEN_TYPE, params.get("token_type"));
        localStorage.setItem(EXPIRES_IN, Date.now() + parseInt(params.get("expires_in")*1000));  
    }

    access_token = localStorage.getItem(ACCESS_TOKEN);
    if(access_token && access_token !== 'null'){
        window.location.href = `${APP_URL}dashboard/dashboard.html`;
    }   

})

const authorizeUser = () => {
    const url = `https://accounts.spotify.com/authorize?response_type=token&client_id=${CLIENT_ID}&SCOPES=${SCOPES}&redirect_uri=${REDIRECT_URI}&state=${state}`;
    
    window.location.href = url;
}

const loginButton = document.querySelector('#login');
loginButton.addEventListener('click', authorizeUser);

//random string generator of the given length
function generateRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

