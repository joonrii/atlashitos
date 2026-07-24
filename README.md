# Atlas // Hitos

Juego tipo GeoGuessr con monumentos y lugares famosos de todo el mundo. Muestra una foto real del lugar (vía la API pública de Wikipedia) y el jugador marca en el mapa (Leaflet + OpenStreetMap) dónde cree que está.

## Sin tokens ni configuración

A diferencia de `guesstadium` (que depende de Mapillary y de un token de cliente), esta versión **no necesita ningún token ni archivo `config.js`**: la API REST de Wikipedia (`en.wikipedia.org/api/rest_v1/page/summary/...`) es pública, no requiere autenticación y no tiene los límites de bbox que dan problemas en Mapillary.

## Pruébalo en local

No necesita build ni servidor: abre `index.html` directamente en el navegador, o sirve la carpeta:

```
npx serve .
```

## Desplegar

Sitio estático, sin build step. Sube el repo a GitHub e impórtalo en Vercel — cada `git push` a `main` desplegará automáticamente.

## Cómo funciona la búsqueda de foto

Por cada ronda se recorre la lista `LANDMARKS` (barajada) hasta encontrar uno cuyo artículo de Wikipedia tenga imagen. Con los 22 monumentos incluidos, casi todos tienen foto principal en su artículo, así que rara vez se salta alguno.

Para añadir un monumento nuevo, solo hace falta el título exacto de su artículo en la Wikipedia en inglés (el que aparece en la URL, con guiones bajos en vez de espacios). Puedes comprobarlo abriendo:

```
https://en.wikipedia.org/api/rest_v1/page/summary/TITULO_DEL_ARTICULO
```

y viendo si el JSON trae `thumbnail` u `originalimage`.

## Nota de atribución

Las fotos vienen de Wikipedia/Wikimedia Commons, normalmente bajo licencias abiertas (CC BY-SA o dominio público) que requieren atribución en usos serios. Para un prototipo personal no hay problema, pero si publicas la app de cara al público conviene añadir el autor/licencia de cada imagen (el mismo endpoint de Wikipedia no lo incluye; para eso hace falta consultar la página del fichero en Wikimedia Commons).
