import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

let scene, renderer, camera;
let camcontrols1;
let mapsx, mapsy;

const minlon = -180;
const maxlon = 180;
const minlat = -90;
const maxlat = 90;

let countryMeshes = {};
let currentYear = 1970;
let temperatureData = {}
let slider;
let yearLabel;

let accglobal = 1000;
let lastUpdate = 0;
let manual = false;

const gui = new GUI();
const Functions = {
	automatic: true,
	seconds: 1
};

const ranges = [
  { min: -20, max: -15, color: "#313695" },
  { min: -15, max: -10, color: "#4575b4" },
  { min: -10, max: -5,  color: "#74add1" },
  { min: -5,  max: 0,   color: "#abd9e9" },
  { min: 0,   max: 5,   color: "#e0f3f8" },
  { min: 5,   max: 10,  color: "#ffffbf" },
  { min: 10,  max: 15,  color: "#fee090" },
  { min: 15,  max: 20,  color: "#fdae61" },
  { min: 20,  max: 25,  color: "#f46d43" },
  { min: 25,  max: 30,  color: "#d73027" },
  { min: 30,  max: 35,  color: "#a50026" }
];

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols1 = new OrbitControls(camera, renderer.domElement);
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  // Textura y mapa de elevación
  const tx1 = new THREE.TextureLoader().load("src/earthmap1k.jpg");
  const dm2 = new THREE.TextureLoader().load("src/gebco_bathy.5400x2700_8bit.jpg");

  // Escala del mapa en escena
  mapsx = 21.6 / 2.5;
  mapsy = 10.8 / 2.5;

  gui.add( Functions, 'automatic' )
  .name("Automatic")
  .onChange(value => {
    manual = !value;
  });
  
  gui.add( Functions, 'seconds' ,  0, 2000, 1)
  .name("Miliseconds")
  .onChange(value => {
    accglobal = value;
  });

  // Crear plano del mapa
  Plano(0, 0, -0.25, mapsx, mapsy, tx1, dm2);

  const tempLoader = new THREE.FileLoader();
  tempLoader.load("src/temepratura.csv", function(text) {
    temperatureData = parseTemperatureCSV(text);
    console.log(temperatureData);

    // Cargar GeoJSON
    loadGeoJSON();
  });


  slider = document.createElement("input");
  slider.type = "range";
  slider.min = 1970;
  slider.max = 2025;
  slider.step = 1;
  slider.value = 1970;
  slider.style.position = "absolute";
  slider.style.bottom = "20px";
  slider.style.left = "50%";
  slider.style.transform = "translateX(-50%)";
  slider.style.width = "50%";
  document.body.appendChild(slider);

  yearLabel = document.createElement("div");
  yearLabel.style.position = "absolute";
  yearLabel.style.bottom = "60px";
  yearLabel.style.left = "50%";
  yearLabel.style.transform = "translateX(-50%)";
  yearLabel.style.color = "white";
  yearLabel.style.fontSize = "20px";
  document.body.appendChild(yearLabel);
  yearLabel.innerText = `Año: ${slider.value}`;

  const TitleLabel = document.createElement("div");
  TitleLabel.style.position = "absolute";
  TitleLabel.style.top = "60px";
  TitleLabel.style.left = "50%";
  TitleLabel.style.textAlign = "center";
  TitleLabel.style.transform = "translateX(-50%)";
  TitleLabel.style.color = "white";
  TitleLabel.style.fontSize = "20px";
  document.body.appendChild(TitleLabel);
  TitleLabel.innerText = "Efecto del calentamiento global desde 1970 hasta la actualidad en base al valor de temperatura media por año";
  
  const legend = document.createElement("div");
  legend.style.position = "absolute";
  legend.style.bottom = "100px";
  legend.style.left = "50%";
  legend.style.transform = "translateX(-50%)";
  legend.style.display = "flex";
  legend.style.padding = "5px";
  legend.style.background = "rgba(0,0,0,0.5)";
  legend.style.borderRadius = "5px";
  legend.style.color = "white";
  legend.style.fontSize = "12px";
  document.body.appendChild(legend);

  ranges.forEach(r => {
    const container = document.createElement("div");
    const container2 = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.marginRight = "2px";
    container2.style.display = "flex";
    
    container2.style.flexDirection = "column";
    container2.style.alignItems = "center";
    container2.style.marginRight = "2px";


    const label = document.createElement("span");
    if (r.min === -20) {
      label.innerText = `<${r.min}°C`;
    } else if (r.min === 30) {
      label.innerText = `${r.min}°C>`;
    } else {
      label.innerText = `${r.min}°C`;
    }
    label.style.fontSize = "10px";
    container.appendChild(label);

    const box = document.createElement("div");
    box.style.width = "30px";
    box.style.height = "20px";
    box.style.background = r.color;
    container.appendChild(box);

    legend.appendChild(container);
  });

  slider.oninput = () => {
    currentYear = parseInt(slider.value);
    yearLabel.innerText = `Año: ${currentYear}`;
    updateCountryColors(currentYear);
  };
}

function loadGeoJSON() {
  const loader = new THREE.FileLoader();
  const tempLoader = new THREE.FileLoader();
    tempLoader.load("src/temepratura.csv", function(text) {
    });

  loader.load("src/custom.geo.json", function (data) {
    const geoData = JSON.parse(data);

    geoData.features.forEach((data) => {
      const { type, coordinates } = data.geometry;
      const iso = data.properties.iso_a3;
      const isoAdmin = data.properties.adm0_a3;
      const isoAdm_iso = data.properties.adm0_iso;

      if (type === "Polygon") {
        drawPolygon(coordinates, iso, isoAdmin, isoAdm_iso);
      } else if (type === "MultiPolygon") {
        coordinates.forEach((polygon) => drawPolygon(polygon, iso, isoAdmin, isoAdm_iso));
      }
    });
  });
}

function drawPolygon(coords, iso, isoAdmin, isoAdm_iso) {
  const points = [];
  
  coords.forEach((ring) => {
    const cord = ring.map((coord) => {
      const [lon, lat] = coord;

      // Convertir coordenadas geográficas a coordenadas del plano
      const x = Map2Range(lon, minlon, maxlon, -mapsx / 2, mapsx / 2);
      const y = Map2Range(lat, minlat, maxlat, -mapsy / 2, mapsy / 2);

      points.push(new THREE.Vector3(x, y, 0));
    });

    const geometry2 = new THREE.BufferGeometry().setFromPoints(points);
    const hmaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(geometry2, hmaterial);
    line.position.z = 0.025;
    scene.add(line);

    const shape = new THREE.Shape();
    shape.autoClose = true;
    //Objeto por extrusión
    for (let np = 0; np < points.length; np++) {
      if (np > 0) shape.lineTo(points[np].x, points[np].y);
      else shape.moveTo(points[np].x, points[np].y);
    }

    const extrudeSettings = {
      steps: 1,
      depth: 0.02 + THREE.MathUtils.randFloat(-0.005, 0.005),
      bevelThickness: 0,
      bevelSize: 0,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    //Agregar el color
    const temp = getTemperatureForCountry([iso, isoAdmin, isoAdm_iso]);

    const color = temperatureToColor(temp);

    const material = new THREE.MeshPhongMaterial({
      color: color
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    countryMeshes[iso] = countryMeshes[iso] || [];
    countryMeshes[iso].push({
      mesh: mesh,
      isoCodes: [iso, isoAdmin, isoAdm_iso]
    });
  });
}

function getTemperatureForCountry(codes) {
  for (let code of codes) {
    if (temperatureData[code] && temperatureData[code][currentYear] !== undefined) {
      return temperatureData[code][currentYear];
    }
  }
  return 0;
}

function parseTemperatureCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const tempData = {};

  for (let i = 1; i < lines.length; i++) {
    const [entity, code, year, temp] = lines[i].split(",");
    const key = code.trim() !== "" ? code.trim() : entity.trim();

    if (!tempData[key]) tempData[key] = {};
    tempData[key][year.trim()] = parseFloat(temp);
  }

  return tempData;
}

function updateCountryColors() {
  for (let iso in countryMeshes) {
    countryMeshes[iso].forEach(obj => {
      const temp = getTemperatureForCountry(obj.isoCodes);
      const color = temperatureToColor(temp);
      obj.mesh.material.color.set(color);
    });
  }
}

function temperatureToColor(temp) {
  for (let r of ranges) {
    if (temp >= r.min && temp < r.max) {
      return new THREE.Color(r.color);
    }
  }

  if (temp < -20) return new THREE.Color("#313695");
  if (temp >= 35) return new THREE.Color("#a50026");
}


function Map2Range(val, vmin, vmax, dmin, dmax) {
  const t = (val - vmin) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}


function Plano(px, py, pz, sx, sy, txt, dismap) {
  let geometry = new THREE.PlaneBufferGeometry(sx, sy, 200, 200);
  let material = new THREE.MeshPhongMaterial({
    map: txt,
    displacementMap: dismap,
    displacementScale: 0.3,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
}

function animate() {
  requestAnimationFrame(animate);

  if (!manual){
    const t0 = Date.now();
    const elapsed = t0 - lastUpdate;
  
    if (elapsed >= accglobal) {
      let nextYear;
      if (parseInt(slider.value) != 2025) {
        nextYear = parseInt(slider.value) + 1;
      } else {
        nextYear = slider.min;
      }
  
      if (nextYear <= slider.max) {
        slider.value = nextYear;
        currentYear = nextYear;
        yearLabel.innerText = `Año: ${currentYear}`;
        updateCountryColors();
      }
  
      lastUpdate = t0;
    }
  }

  renderer.render(scene, camera);
}
