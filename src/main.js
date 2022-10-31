import './style.css'
const APP_URL = import.meta.env.VITE_APP_URL;

let ACCESS_TOKEN = null;

window.addEventListener("load", () => {
    if(ACCESS_TOKEN){
        window.location.href = `${APP_URL}dashboard/dashboard.html`;
    } else {
        window.location.href = `${APP_URL}login/login.html`;
    }
})
