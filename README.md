# Atlas // Hitos

Juego tipo GeoGuessr con monumentos y lugares famosos de todo el mundo, usando imágenes a pie de calle de [Mapillary](https://www.mapillary.com/). Es el mismo motor que `guesstadium`, adaptado a monumentos en vez de estadios.

## 1. Token de Mapillary

Puedes reutilizar el mismo token que ya tienes en `guesstadium/config.js` — es un token de cliente (no un secreto de servidor), así que no pasa nada por reutilizarlo entre proyectos. Pégalo en `config.js`, sustituyendo `PEGA_AQUI_TU_TOKEN_MLY`.

## 2. Pruébalo en local

No necesita build ni servidor: abre `index.html` directamente en el navegador, o sirve la carpeta:

```
npx serve .
```

## 3. Desplegar

Mismo flujo que `guesstadium`: sitio estático, sin build step. Sube el repo a GitHub e impórtalo en Vercel — cada `git push` a `main` desplegará automáticamente.

## Notas sobre cobertura de Mapillary

La app busca la imagen más cercana a cada monumento con un único radio (~2.2 km) y, si no encuentra ninguna, salta ese monumento y prueba otro de la lista. Con 22 lugares en `landmarks.js` normalmente hay suficientes con cobertura para completar las 6 rondas.

Los sitios muy remotos (Petra, Machu Picchu) fallan más a menudo que los urbanos (Torre Eiffel, Coliseo). Si notas que siempre se saltan los mismos, tienes dos opciones:
- Quitarlos de `landmarks.js` y quedarte solo con ubicaciones urbanas.
- Reintroducir en `script.js` el barrido de radio progresivo (1 km → 22 km) que usa la versión original de `guesstadium`, en vez del radio único actual.

Para añadir o quitar monumentos, edita el array `LANDMARKS` en `landmarks.js`.
