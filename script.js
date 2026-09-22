/* =========================================================
   CONFIGURACIÓN — EDITA SOLO ESTA PARTE
   =========================================================
   Para que la canción suene DE VERDAD dentro de la página,
   pega aquí el ID de la canción en Spotify:

   1. Abre Spotify (app o web) y busca "Do Better - Cuco".
   2. Click derecho en la canción → Compartir → Copiar enlace
      de la canción. Te dará algo como:
      https://open.spotify.com/track/3f6qC2v6Yb7QqXxXXXXXXX
   3. Copia SOLO la parte después de /track/ y antes del "?"
      y pégala abajo en spotifyTrackId.

   Si lo dejas vacío, el botón "Play" abrirá Spotify
   directamente (app si está instalada, o el navegador/web
   player si no) en vez de sonar dentro de la página.
========================================================= */

const CONFIG = {
    spotifyTrackId: "",               // <-- pega aquí el ID (ver instrucciones arriba)
    searchFallbackUrl: "https://open.spotify.com/search/Do%20Better%20Cuco",
    songTitle: "Do Better",
    songArtist: "Cuco"
};


/* =========================================================
   APERTURA DE LA TARJETA
========================================================= */

function abrirFlores(){
    const portada = document.getElementById("portada");
    const escena = document.getElementById("escena");

    portada.classList.add("oculta");

    setTimeout(function(){
        escena.classList.add("visible");
        iniciarFrasesDeEtapa();
    }, 700);
}

document.getElementById("btnAbrir").addEventListener("click", abrirFlores);


/* =========================================================
   ESTRELLAS DE FONDO
========================================= */

(function crearEstrellas(){
    const app = document.getElementById("app");
    for(let i = 0; i < 15; i++){
        const estrella = document.createElement("div");
        estrella.className = "spark";
        estrella.style.left = Math.random() * 100 + "%";
        estrella.style.top = Math.random() * 100 + "%";
        estrella.style.animationDelay = Math.random() * 3 + "s";
        app.appendChild(estrella);
    }
})();


/* =========================================================
   FRASES QUE NARRAN EL CRECIMIENTO
========================================================= */

function iniciarFrasesDeEtapa(){
    const caption = document.getElementById("stageCaption");

    const etapas = [
        { time: 300,  text: "Un pequeño comienzo..." },
        { time: 3300, text: "El tallo se fortalece..." },
        { time: 4600, text: "Las hojas y los primeros brotes..." },
        { time: 6000, text: "Las flores comienzan a abrirse..." },
        { time: 7800, text: "Un ramo de sueños..." }
    ];

    etapas.forEach(function(etapa, index){
        setTimeout(function(){
            caption.textContent = etapa.text;
            caption.classList.add("show");
        }, etapa.time);
    });

    // Se desvanece la frase justo antes de que llegue el mensaje final
    setTimeout(function(){
        caption.classList.remove("show");
    }, 8600);
}


/* =========================================================
   REPRODUCTOR DE SPOTIFY
   Usa la API oficial de iFrame de Spotify para controlar
   la reproducción real desde nuestros propios botones.
   Si no hay ID configurado (o la API no carga), el botón
   "Play" simplemente abre Spotify (app o web).
========================================================= */

let spotifyController = null;
let spotifyReady = false;

const btnPlay = document.getElementById("btnPlay");
const iconPlay = document.getElementById("iconPlay");
const iconPause = document.getElementById("iconPause");
const btnPrev = document.getElementById("btnPrev");
const btnHeart = document.getElementById("btnHeart");
const progressFill = document.getElementById("progressFill");
const progressTrack = document.getElementById("progressTrack");
const timeCurrent = document.getElementById("timeCurrent");
const timeTotal = document.getElementById("timeTotal");
const playerHint = document.getElementById("playerHint");

// La API de Spotify llama esta función global cuando está lista
window.onSpotifyIframeApiReady = function(IFrameAPI){

    if(!CONFIG.spotifyTrackId){
        return; // sin ID configurado: nos quedamos en modo "abrir en Spotify"
    }

    const element = document.getElementById("spotify-embed");

    const options = {
        uri: "spotify:track:" + CONFIG.spotifyTrackId,
        width: "100%",
        height: "80"
    };

    IFrameAPI.createController(element, options, function(controller){
        spotifyController = controller;

        controller.addListener("ready", function(){
            spotifyReady = true;
            playerHint.textContent = "Toca para escuchar aquí mismo";
        });

        controller.addListener("playback_update", function(e){
            actualizarBarraDeProgreso(e.data);
        });
    });
};

function formatearTiempo(ms){
    const totalSeg = Math.floor(ms / 1000);
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return min + ":" + (seg < 10 ? "0" : "") + seg;
}

function actualizarBarraDeProgreso(data){
    if(!data) return;

    const porcentaje = data.duration ? (data.position / data.duration) * 100 : 0;
    progressFill.style.width = porcentaje + "%";
    timeCurrent.textContent = formatearTiempo(data.position || 0);
    timeTotal.textContent = formatearTiempo(data.duration || 0);
    window.__ultimaDuracion = data.duration || 0;

    mostrarEstadoReproduccion(!data.isPaused);
}

function mostrarEstadoReproduccion(estaSonando){
    iconPlay.style.display = estaSonando ? "none" : "block";
    iconPause.style.display = estaSonando ? "block" : "none";
    btnPlay.title = estaSonando ? "Pausar" : "Reproducir";
}

btnPlay.addEventListener("click", function(){
    if(spotifyController && spotifyReady){
        spotifyController.togglePlay();
    } else {
        abrirEnSpotify();
    }
});

btnPrev.addEventListener("click", function(){
    if(spotifyController && spotifyReady){
        spotifyController.seek(0);
    }
});

btnHeart.addEventListener("click", function(){
    btnHeart.classList.toggle("active");
});

progressTrack.addEventListener("click", function(e){
    if(!spotifyController || !spotifyReady) return;

    const rect = progressTrack.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;

    // Buscamos usando el último dato de duración conocido
    if(window.__ultimaDuracion){
        spotifyController.seek(Math.floor(ratio * window.__ultimaDuracion));
    }
});


/* =========================================================
   ABRIR EN SPOTIFY (app si existe, si no la web/escritorio)
   Se usa cuando no hay reproducción real disponible en la
   página, o como respaldo si algo falla.
========================================================= */

function abrirEnSpotify(){
    const trackId = CONFIG.spotifyTrackId.trim();
    const webUrl = trackId
        ? "https://open.spotify.com/track/" + trackId
        : CONFIG.searchFallbackUrl;

    if(!trackId){
        window.open(webUrl, "_blank", "noopener");
        return;
    }

    const appUrl = "spotify:track:" + trackId;
    let seFueLaPagina = false;

    function alCambiarVisibilidad(){
        if(document.hidden) seFueLaPagina = true;
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    // Intentamos abrir la app de Spotify (funciona en móvil y en
    // escritorio si el navegador tiene el protocolo registrado)
    window.location.href = appUrl;

    setTimeout(function(){
        document.removeEventListener("visibilitychange", alCambiarVisibilidad);

        // Si la pestaña nunca perdió el foco, es que no había
        // app instalada: abrimos el reproductor web como respaldo
        if(!seFueLaPagina){
            window.open(webUrl, "_blank", "noopener");
        }
    }, 1200);
}
