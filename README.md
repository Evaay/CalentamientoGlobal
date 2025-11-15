# Calentamiento Global
# Visualización del calentamiento global en WebGL (Three.js)

Para esta práctica de visualización de datos se ha decidido representar la evolución del calentamiento global desde el año 1970 hasta la actualidad mediante un mapa mundial en 3D cuyos colores cambian según la temperatura de cada país.

Enlace al vídeo: https://youtu.be/dHcIeQllVro

---

## Fuentes de datos utilizadas

### **1. Temperaturas medias anuales por país**
Los datos originales eran diarios, pero debido al gran tamaño del archivo y limitaciones de rendimiento, se filtraron previamente para obtener la **temperatura media anual** por país.
Fuente de recursos: https://ourworldindata.org/grapher/average-monthly-surface-temperature

### **2. Coordenadas geográficas en GeoJSON**
El archivo GeoJSON contiene las fronteras de todos los países en forma de polígonos definidos por latitudes y longitudes.
Fuente de recursos: https://geojson-maps.kyd.au/?utm_source=self&utm_medium=redirect

---

## Características principales

### Mapa mundial 3D generado a partir de GeoJSON
Cada país se crea extruyendo el polígono de sus fronteras, produciendo una forma tridimensional que mejora la percepción espacial.

### Coloreado dinámico basado en la temperatura
Los colores se asignan por rangos térmicos predefinidos, desde tonos fríos (azules) hasta tonos cálidos (rojos).

### Selector de año interactivo
- Un slider permite seleccionar manualmente el año.
- Una etiqueta muestra el año actual visible.

### Modo automático
El usuario puede activar un modo en el que los años avanzan automáticamente.  
El intervalo entre años se configura mediante la interfaz GUI.

### Leyenda visual de temperaturas
Incluye una barra de colores con sus respectivos rangos térmicos.

---

## Controles e interacción

### **1. Controles de cámara**

- **Rotación:** clic izquierdo + mover ratón  
- **Zoom:** rueda del ratón  
- **Desplazamiento:** clic derecho o clic central + arrastrar  

### **2. Interfaz GUI (lil-gui)**

Incluye:

#### *Automatic*
Activa o desactiva el avance automático de años.  
Si está desactivado, el usuario solo usa el slider.

#### *Miliseconds*
Controla el tiempo entre cada avance en modo automático.  
Mayor valor → animación más lenta.

### **3. Selector de año (slider inferior)**
Permite elegir cualquier año entre **1970 y 2025**.  
Los colores de los países se actualizan en tiempo real.

---

## Estructura del código

### **1. Inicialización (`init()`)**

Configura:

- Escena, cámara y renderizador
- OrbitControls
- Luces
- Texturas del mapa base
- GUI y sus controles
- Slider de año y etiquetas
- Leyenda de colores
- Carga del CSV de temperaturas
- Carga del GeoJSON de países

---

### **2. Carga y procesamiento de datos**

#### `parseTemperatureCSV()`
Convierte el CSV de temperaturas en un objeto estructurado por país y año.

#### `loadGeoJSON()`
Carga las geometrías y llama a `drawPolygon()` para dibujar cada país.

---

### **3. Generación de países (`drawPolygon()`)**

Para cada país:

1. Convierte coordenadas geográficas a coordenadas del mapa.
2. Dibuja las fronteras.
3. Crea el `Shape`.
4. Lo extruye para formar el Mesh 3D.
5. Obtiene la temperatura del país según el año actual.
6. Asigna un color basándose en los rangos térmicos.

Los Meshes se guardan en `countryMeshes` para recolorearlos fácilmente.

---

### **4. Actualización dinámica del color**
`updateCountryColors()` recorre todos los países y actualiza su material para reflejar el año seleccionado.

---

### **5. Animación (`animate()`)**
- Si el modo automático está activo:
  - Comprueba si debe avanzar al siguiente año.
  - Actualiza slider, etiqueta y colores.

---

### **6. Utilidades**

Funciones auxiliares como:

- **temperatureToColor()** — asigna color a partir de rangos térmicos  
- **map2Range()** — convierte lat/long a coordenadas  
- **Plano()** — dibuja el plano base del mapa mundial  
