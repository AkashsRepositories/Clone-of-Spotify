import './style.css'

let ACCESS_TOKEN = null;

const LOGIN_PAGE = "login/login.html";
const DASHBOARD_PAGE = "dashboard/dashboard.html";

window.addEventListener("load", () => {
    if(ACCESS_TOKEN){
        window.location.href = DASHBOARD_PAGE;
    } else {
        window.location.href = LOGIN_PAGE;
    }
})
