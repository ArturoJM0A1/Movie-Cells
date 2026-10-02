# Movie Cells

Browser de películas construido con [Open Cells](https://github.com/open-cells-project/open-cells),
[Lit](https://lit.dev) y los [Material Web Components](https://github.com/material-components/material-web).

Los datos provienen de la API pública de [TVMaze](https://www.tvmaze.com/api) (sin clave y con
CORS abierto), consumida con `fetch` desde una capa de servicios propia.

## Puesta en marcha

```sh
npm install
npm run start
```

## Scripts

| Script | Descripción |
|---|---|
| `npm run start` | Levanta el servidor de desarrollo (alias de `npm run dev`) |
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm run build` | Comprueba los tipos (`tsc`) y genera la build de producción |
| `npm run preview` | Compila y sirve la build de producción |

## Rutas

| Ruta | Página | Descripción |
|---|---|---|
| `#!/` | `home-page` | Buscador y rejilla de populares con paginación |
| `#!/search?term=…&page=…` | `search-page` | Resultados de la búsqueda con paginación local |
| `#!/movie/:movieId` | `movie-page` | Detalle de la película, resumen y reparto |
| `#!/not-found` | `not-found-page` | Fallback del router (`notFound: true`) |

Los términos y la página viva en la URL, así que cualquier vista se puede compartir o recargar.

## Estructura

```
src/
  components/     Shell, layout y Web Components reutilizables
    app-index.*       shell: cabecera, tema y arranque de startApp()
    page-layout.*     layout compartido + canal `scroll`
    theme-toggle.*    control de tema claro/oscuro
    movie-search-bar  buscador (propiedad in / evento out)
    movie-card        tarjeta de película
    movie-pagination  paginador genérico
    status-view       estados de carga / error / vacío
  config/         app.config.js (configuración leída con getConfig())
  css/            Tokens de diseño, tema oscuro y estilos de página
  pages/          home, search, movie, not-found
  router/         Tabla de rutas con import diferido por página
  services/       Capa HTTP (fetch + AbortController) y normalización de la API
  state/          Canales de Open Cells y acciones que los mutan
  utils/          Formato, paginación local y gestión del tema
```

## Arquitectura

- **Canales de Open Cells** como estado compartido (`src/state/app-state.ts`). Cada canal es un
  `ReplaySubject(1)`, por lo que un componente que se suscribe tarde recibe el último valor; por eso
  los datos sobreviven a la caché de vistas del router.
- **Acciones** en `src/state/movie-store.ts`: son las únicas que llaman a los servicios, publican en
  los canales y cancelan la petición anterior con un `AbortController` por dominio.
- **Páginas** (`PageTransitionsMixin(PageMixin(LitElement))`) que renderizan en el *light DOM*
  (`createRenderRoot()`), se suscriben a los canales y traducen la interacción en `navigate()`.
- **Componentes de presentación** dumb: reciben datos por propiedades y emiten
  `CustomEvent`s; nunca navegan ni llaman a la API.
- **Tema** sin librería: `src/css/colors.css` declara tokens CSS y el atributo
  `color-scheme-dark` en `<html>` conmuta todo el esquema, incluidos los Material Web
  (`--md-sys-color-*` se mapean desde nuestros tokens).

## API

| Uso | Endpoint |
|---|---|
| Búsqueda por título | `GET /search/shows?q=…` |
| Catálogo paginado (populares) | `GET /shows?page=…` |
| Detalle con reparto | `GET /shows/{id}?embed=cast` |

El servicio normaliza la respuesta a los tipos `Movie` / `CastMember` de `src/shared.d.ts`; ninguna
página conoce la forma remota.

## Funcionalidades

- Búsqueda por título con estados de carga, error y vacío
- Paginación local en resultados y paginación real del catálogo en el inicio
- Detalle con póster, metadatos, resumen y reparto
- Tema claro/oscuro persistente en `localStorage`
- Transiciones de página, cabecera que se colapsa al hacer scroll y diseño responsive